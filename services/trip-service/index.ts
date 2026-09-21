import { v4 as uuidv4 } from 'uuid';
import { GeoLocation, PaymentMethod, TripState, VehicleCategory } from '../../shared/types';
import { config } from '../config';
import { db, TripRecord } from '../database/db';
import { matchingService } from '../matching-service';
import { paymentService } from '../payment-service';
import { pricingService } from '../pricing-service';

export interface CreateTripDTO {
  riderId: string;
  rider?: { name: string; phone: string; rating?: number };
  pickup: GeoLocation;
  destination: GeoLocation;
  category?: VehicleCategory;
  fare?: any;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  ridePin?: string;
  skipAutoAssign?: boolean;
}

export interface UpdateTripStatusDTO {
  tripId: string;
  nextStatus: TripState;
  actorId: string;
  actorRole: 'RIDER' | 'DRIVER' | 'ADMIN' | 'SYSTEM';
  enteredPin?: string;
  cancellationReason?: string;
  driverId?: string;
  driver?: any;
}

// Strict Allowed State Transitions Matrix
const ALLOWED_TRANSITIONS: Record<TripState, TripState[]> = {
  REQUESTED: ['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'CANCELLED'],
  SEARCHING_DRIVER: ['DRIVER_ASSIGNED', 'CANCELLED', 'EXPIRED'],
  DRIVER_ASSIGNED: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['IN_TRIP', 'CANCELLED'],
  IN_TRIP: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export class TripService {
  /**
   * Creates a new ride booking and initiates driver matching.
   */
  public async createTrip(dto: CreateTripDTO): Promise<TripRecord> {
    const {
      riderId,
      rider,
      pickup,
      destination,
      category = 'BODA_STANDARD',
      paymentMethod = 'MPESA',
      promoCode,
      skipAutoAssign = true, // Keep in SEARCHING_DRIVER so connected driver devices receive live incoming offer
    } = dto;

    // Resilient Rider Verification/Upsert
    let riderUser = db.users.get(riderId);
    if (!riderUser) {
      // Check if user exists by phone
      if (rider?.phone) {
        for (const u of db.users.values()) {
          if (u.phone_number === rider.phone) {
            riderUser = u;
            break;
          }
        }
      }
      if (!riderUser) {
        riderUser = {
          id: riderId,
          full_name: rider?.name || 'Grace Chemutai',
          email: `${riderId}@swiftboda.co.ke`,
          phone_number: rider?.phone || '+254712345001',
          password_hash: '$2a$10$wN31rO4Z0t7mY2rQ3l1nwez5gJ5yF7VqL9K0xR2P4s8u1w3x5y7z9',
          role: 'RIDER',
          status: 'ACTIVE',
          rating: rider?.rating || 4.95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.users.set(riderId, riderUser);
      }
    }

    const calculatedFare = dto.fare || pricingService.calculateFare(pickup, destination, category, 1.0, promoCode);
    const ridePin = dto.ridePin || Math.floor(1000 + Math.random() * 9000).toString();
    const tripId = `trip-${uuidv4().substring(0, 8)}`;

    const newTrip: TripRecord = {
      id: tripId,
      rider_id: riderUser.id,
      vehicle_category: category,
      status: 'SEARCHING_DRIVER',
      pickup_latitude: pickup.latitude,
      pickup_longitude: pickup.longitude,
      pickup_address: pickup.address || 'Pickup Point',
      pickup_place_name: pickup.placeName || 'Current Location',
      destination_latitude: destination.latitude,
      destination_longitude: destination.longitude,
      destination_address: destination.address || 'Destination Point',
      destination_place_name: destination.placeName || 'Selected Destination',
      base_fare: calculatedFare.baseFare || 50,
      distance_fare: calculatedFare.distanceFare || 30,
      time_fare: calculatedFare.timeFare || 10,
      booking_fee: calculatedFare.bookingFee || 0,
      surge_multiplier: calculatedFare.surgeMultiplier || 1.0,
      surge_amount: calculatedFare.surgeAmount || 0,
      discount_amount: calculatedFare.discountAmount || 0,
      total_fare: calculatedFare.totalFare || 90,
      currency: calculatedFare.currency || 'KES',
      estimated_distance_km: calculatedFare.estimatedDistanceKm || 1.9,
      estimated_duration_min: calculatedFare.estimatedDurationMin || 6,
      payment_method: paymentMethod,
      payment_status: 'PENDING',
      ride_pin: ridePin,
      otp_verified: false,
      tip_amount: 0.0,
      created_at: new Date().toISOString(),
    };

    db.trips.set(tripId, newTrip);

    // Record audit log
    this.recordStatusHistory(tripId, undefined, 'SEARCHING_DRIVER', riderUser.id, 'RIDER', 'Trip requested');

    if (!skipAutoAssign) {
      // Attempt instant auto-matching if explicitly requested
      const match = await matchingService.matchAndLockDriver(pickup, category);
      if (match) {
        newTrip.driver_id = match.driverId;
        newTrip.status = 'DRIVER_ASSIGNED';
        newTrip.matched_at = new Date().toISOString();

        const driver = db.drivers.get(match.driverId);
        if (driver) {
          driver.status = 'EN_ROUTE_PICKUP';
          db.drivers.set(match.driverId, driver);
        }

        this.recordStatusHistory(tripId, 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', match.driverId, 'DRIVER', 'Driver matched and assigned');
      }
    }

    db.trips.set(tripId, newTrip);
    return newTrip;
  }

  /**
   * Enforces server-side Trip State Machine transitions.
   */
  public async updateTripStatus(dto: UpdateTripStatusDTO): Promise<{ trip: TripRecord; success: boolean; error?: string }> {
    const { tripId, nextStatus, actorId, actorRole, enteredPin, cancellationReason } = dto;
    const trip = db.trips.get(tripId);

    if (!trip) {
      return { trip: null as any, success: false, error: 'Trip not found.' };
    }

    // 1. Verify Allowed State Transition
    const allowed = ALLOWED_TRANSITIONS[trip.status] || [];
    if (!allowed.includes(nextStatus)) {
      return {
        trip,
        success: false,
        error: `Invalid transition from ${trip.status} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`,
      };
    }

    // 2. Precondition: Validating 4-digit Ride PIN for IN_TRIP transition
    if (nextStatus === 'IN_TRIP') {
      if (!enteredPin || enteredPin !== trip.ride_pin) {
        return {
          trip,
          success: false,
          error: 'Invalid 4-digit Ride PIN. Ask the rider for their verification PIN.',
        };
      }
      trip.otp_verified = true;
      trip.started_at = new Date().toISOString();

      if (trip.driver_id) {
        const driver = db.drivers.get(trip.driver_id);
        if (driver) {
          driver.status = 'ON_TRIP';
          db.drivers.set(trip.driver_id, driver);
        }
      }
    }

    // 2.5 Precondition: Driver Assigned
    if (nextStatus === 'DRIVER_ASSIGNED') {
      if (dto.driverId) {
        trip.driver_id = dto.driverId;
      }
      trip.matched_at = new Date().toISOString();
      if (trip.driver_id) {
        const driver = db.drivers.get(trip.driver_id);
        if (driver) {
          driver.status = 'EN_ROUTE_PICKUP';
          db.drivers.set(trip.driver_id, driver);
        }
      }
    }

    // 3. Precondition: Driver Arrived
    if (nextStatus === 'DRIVER_ARRIVED') {
      trip.arrived_at = new Date().toISOString();
    }

    // 4. Precondition: Completion & Payment Settlement
    if (nextStatus === 'COMPLETED') {
      trip.completed_at = new Date().toISOString();
      trip.actual_distance_km = trip.estimated_distance_km;
      trip.actual_duration_min = trip.estimated_duration_min;
      trip.payment_status = 'COMPLETED';

      // Process payment capture & driver wallet credit via PaymentService
      await paymentService.processTripSettlement(
        trip.id,
        trip.rider_id,
        trip.driver_id,
        trip.total_fare,
        trip.payment_method
      );

      // Return driver to online status
      if (trip.driver_id) {
        const driver = db.drivers.get(trip.driver_id);
        if (driver) {
          driver.status = 'ONLINE';
          driver.total_earnings += trip.total_fare * (1 - config.PLATFORM_COMMISSION_RATE);
          db.drivers.set(trip.driver_id, driver);
        }
        await matchingService.releaseDriverDispatchLock(trip.driver_id);
      }
    }

    // 5. Precondition: Cancellation
    if (nextStatus === 'CANCELLED') {
      trip.cancelled_at = new Date().toISOString();
      trip.cancelled_by = actorRole;
      trip.cancellation_reason = cancellationReason || 'Cancelled by user';

      if (trip.driver_id) {
        const driver = db.drivers.get(trip.driver_id);
        if (driver) {
          driver.status = 'ONLINE';
          db.drivers.set(trip.driver_id, driver);
        }
        await matchingService.releaseDriverDispatchLock(trip.driver_id);
      }
    }

    const previousStatus = trip.status;
    trip.status = nextStatus;
    db.trips.set(tripId, trip);

    // Record audit trail
    this.recordStatusHistory(tripId, previousStatus, nextStatus, actorId, actorRole, cancellationReason);

    return { trip, success: true };
  }

  public rateTrip(tripId: string, rating: number, feedback?: string, tipAmount: number = 0): TripRecord {
    const trip = db.trips.get(tripId);
    if (!trip) throw new Error('Trip not found.');

    trip.rating = rating;
    trip.feedback = feedback;
    trip.tip_amount = tipAmount;
    if (tipAmount > 0) {
      trip.total_fare += tipAmount;
    }

    db.trips.set(tripId, trip);
    return trip;
  }

  public getTrip(tripId: string): TripRecord | undefined {
    return db.trips.get(tripId);
  }

  public getAllTrips(): TripRecord[] {
    return Array.from(db.trips.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private recordStatusHistory(
    tripId: string,
    fromStatus: TripState | undefined,
    toStatus: TripState,
    actorId: string,
    actorRole: string,
    notes?: string
  ) {
    const historyId = uuidv4();
    db.query(
      'INSERT INTO trip_status_history (id, trip_id, from_status, to_status, actor_id, actor_role, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [historyId, tripId, fromStatus || null, toStatus, actorId, actorRole, notes || null]
    ).catch(() => {});
  }
}

export const tripService = new TripService();
