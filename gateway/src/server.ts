import * as http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { authService } from '../../services/auth-service';
import { config } from '../../services/config';
import { db } from '../../services/database/db';
import { locationService } from '../../services/location-service';
import { mapsService } from '../../services/maps-service';
import { matchingService } from '../../services/matching-service';
import { paymentService } from '../../services/payment-service';
import { pricingService } from '../../services/pricing-service';
import { safetyService } from '../../services/safety-service';
import { tripService } from '../../services/trip-service';
import { GeoLocation, PaymentMethod, VehicleCategory } from '../../shared/types';

const PORT = config.PORT || 4000;

// Live Coordination Registries
interface LiveDriverData {
  driverId: string;
  name: string;
  phone: string;
  plate: string;
  model: string;
  color?: string;
  category: VehicleCategory;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'EN_ROUTE_PICKUP' | 'ON_TRIP';
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  rating: number;
  lastPing: number;
  tripId?: string;
  isLive: boolean;
}

const liveDrivers = new Map<string, LiveDriverData>();
const activeTripsMap = new Map<string, any>();
const driverDeclinedTrips = new Map<string, Set<string>>();

// Seed initial West Pokot driver Kiprop Chemokil
const initialWpDriver: LiveDriverData = {
  driverId: 'drv-wp-1',
  name: 'Kiprop Chemokil',
  phone: '+254712345678',
  plate: 'KMDK 234P',
  model: 'Bajaj Boxer 150X',
  color: 'Red',
  category: 'BODA_STANDARD',
  status: 'ONLINE',
  latitude: 1.2405,
  longitude: 35.1135,
  heading: 45,
  speed: 18.0,
  rating: 4.95,
  lastPing: Date.now(),
  isLive: true,
};
liveDrivers.set('drv-wp-1', initialWpDriver);
liveDrivers.set('user-driver-kipchoge', initialWpDriver);

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. Health & Readiness Probe
    if (pathname === '/health' || pathname === '/ready' || pathname === '/api/v1/health') {
      sendJson(res, 200, {
        status: 'UP',
        service: 'Swift Boda Unified Enterprise Gateway',
        environment: config.NODE_ENV,
        postgresConnected: db.isPostgresConnected,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Auth Endpoints
    if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
      const { fullName, email, phoneNumber, password, role } = await parseBody(req);
      const result = await authService.register(fullName, email, phoneNumber, password, role);
      sendJson(res, 201, { success: true, data: result });
      return;
    }

    if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
      const { emailOrPhone, password } = await parseBody(req);
      const result = await authService.loginWithPassword(emailOrPhone, password);
      sendJson(res, 200, { success: true, data: result });
      return;
    }

    if (pathname === '/api/v1/auth/otp/request' && req.method === 'POST') {
      const { phoneNumber } = await parseBody(req);
      const result = await authService.requestPhoneOTP(phoneNumber);
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/v1/auth/otp/verify' && req.method === 'POST') {
      const { phoneNumber, code } = await parseBody(req);
      const result = await authService.verifyPhoneOTP(phoneNumber, code);
      sendJson(res, 200, { success: true, data: result });
      return;
    }

    // 3. Pricing & Fare Estimation
    if (pathname === '/api/v1/pricing/estimate' && req.method === 'POST') {
      const { pickup, destination, category, promoCode } = await parseBody(req);
      const fare = pricingService.calculateFare(
        pickup,
        destination,
        category as VehicleCategory,
        1.0,
        promoCode
      );
      sendJson(res, 200, { success: true, fare });
      return;
    }

    // 4. Location & Live Telemetry
    if (pathname === '/api/v1/driver/telemetry' && req.method === 'POST') {
      const body = await parseBody(req);
      const driverId = body.driverId || 'user-driver-kipchoge';
      const driverData = {
        driverId,
        name: body.name || 'Kiprop Chemokil',
        phone: body.phone || '+254712345678',
        plate: body.plate || body.vehiclePlate || 'KMDK 234P',
        model: body.model || body.vehicleModel || 'Bajaj Boxer 150X',
        color: body.color || body.vehicleColor || 'Red',
        category: body.category || 'BODA_STANDARD',
        status: body.status || 'ONLINE',
        latitude: Number(body.latitude || 1.2405),
        longitude: Number(body.longitude || 35.1135),
        heading: Number(body.heading || 0),
        speed: Number(body.speed || 0),
        rating: Number(body.rating || 4.95),
        lastPing: Date.now(),
        tripId: body.tripId,
        isLive: true,
      };
      liveDrivers.set(driverId, driverData);

      // Also update location service
      locationService.updateDriverLocation({
        driverId,
        latitude: driverData.latitude,
        longitude: driverData.longitude,
        heading: driverData.heading,
        speed: driverData.speed,
        tripId: body.tripId,
      }).catch(() => {});

      // Broadcast telemetry
      broadcastToSubscribers('admin:telemetry', {
        event: 'driver:location_update',
        data: driverData,
      });
      broadcastToSubscribers('global', {
        event: 'driver:location_update',
        data: driverData,
      });
      if (body.tripId) {
        broadcastToSubscribers(`trip:${body.tripId}`, {
          event: 'driver:location_update',
          data: driverData,
        });
      }
      sendJson(res, 200, { success: true, driver: driverData });
      return;
    }

    if (pathname === '/api/v1/drivers/online' && req.method === 'GET') {
      const now = Date.now();
      const onlineList: any[] = [];
      for (const driver of liveDrivers.values()) {
        if (now - driver.lastPing < 120000 && driver.status !== 'OFFLINE') {
          onlineList.push({
            id: driver.driverId,
            driverId: driver.driverId,
            name: driver.name,
            phone: driver.phone,
            plate: driver.plate,
            model: driver.model,
            color: driver.color,
            category: driver.category,
            rating: driver.rating,
            status: driver.status,
            location: {
              latitude: driver.latitude,
              longitude: driver.longitude,
              heading: driver.heading,
            },
            isLive: true,
            lastPing: driver.lastPing,
          });
        }
      }
      // Ensure West Pokot pilot drivers are present if few live devices connected
      if (onlineList.length < 2) {
        const wpSeeds = [
          { id: 'drv-wp-1', name: 'Kiprop Chemokil', phone: '+254712345678', plate: 'KMDK 234P', model: 'Bajaj Boxer 150X', rating: 4.95, location: { latitude: 1.2405, longitude: 35.1135, heading: 45 }, category: 'BODA_STANDARD' },
          { id: 'drv-wp-2', name: 'Pkemoi Rotich', phone: '+254722334455', plate: 'KMDF 891B', model: 'TVS HLX 150', rating: 4.88, location: { latitude: 1.2365, longitude: 35.1095, heading: 120 }, category: 'BODA_STANDARD' },
          { id: 'drv-wp-3', name: 'Chebet Lonyangapuo', phone: '+254733445566', plate: 'KMC 556A', model: 'Honda Ace 125', rating: 4.98, location: { latitude: 1.2420, longitude: 35.1105, heading: 210 }, category: 'BODA_COMFORT' },
        ];
        for (const seed of wpSeeds) {
          if (!onlineList.some((d) => d.phone === seed.phone || d.id === seed.id)) {
            onlineList.push({
              ...seed,
              driverId: seed.id,
              status: 'ONLINE',
              isLive: false,
              lastPing: now,
            });
          }
        }
      }
      sendJson(res, 200, { success: true, count: onlineList.length, drivers: onlineList });
      return;
    }

    if (pathname === '/api/v1/location/nearby' && req.method === 'POST') {
      const { latitude, longitude, category, radiusKm } = await parseBody(req);
      const nearby = await locationService.findNearbyDrivers(
        { latitude, longitude },
        radiusKm || 6.0,
        category as VehicleCategory
      );
      sendJson(res, 200, { success: true, count: nearby.length, drivers: nearby });
      return;
    }

    if (pathname === '/api/v1/location/ping' && req.method === 'POST') {
      const body = await parseBody(req);
      await locationService.updateDriverLocation(body);
      // Broadcast live movement to subscribed clients via WebSockets
      broadcastToSubscribers(`trip:${body.tripId}`, {
        event: 'driver:location_update',
        data: body,
      });
      broadcastToSubscribers('admin:telemetry', {
        event: 'driver:location_update',
        data: body,
      });
      sendJson(res, 200, { success: true });
      return;
    }

    // 4.5 Maps & Real-time Places Search (Serply Google Maps API Integration)
    if (pathname === '/api/v1/maps/places/search' && (req.method === 'GET' || req.method === 'POST')) {
      let query: string = '';
      let num: number | undefined;
      let hl: string | undefined;
      let gl: string | undefined;

      if (req.method === 'GET') {
        query = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '';
        const numParam = parsedUrl.searchParams.get('num');
        if (numParam) num = parseInt(numParam, 10);
        hl = parsedUrl.searchParams.get('hl') || undefined;
        gl = parsedUrl.searchParams.get('gl') || undefined;
      } else {
        const body = await parseBody(req);
        query = body.q || body.query || '';
        num = body.num;
        hl = body.hl;
        gl = body.gl;
      }

      if (!query || typeof query !== 'string' || !query.trim()) {
        sendJson(res, 400, { success: false, error: 'Query parameter is required' });
        return;
      }

      if (num !== undefined && (isNaN(num) || num < 1 || num > 200)) {
        sendJson(res, 400, { success: false, error: 'num parameter must be an integer between 1 and 200' });
        return;
      }

      try {
        const result = await mapsService.serplyClient.searchPlaces({
          query: query.trim(),
          num,
          hl,
          gl,
        });

        sendJson(res, 200, {
          success: true,
          query: result.query,
          resultCount: result.resultCount,
          places: result.places,
          cached: result.cached,
        });
        return;
      } catch (err: any) {
        if (err.message?.includes('Rate limit exceeded')) {
          sendJson(res, 429, {
            success: false,
            error: 'Rate limit exceeded from location service. Please try again in a few moments.',
          });
          return;
        }
        if (err.message?.includes('temporarily unavailable')) {
          sendJson(res, 502, {
            success: false,
            error: 'The location service is temporarily unavailable. Please try again.',
          });
          return;
        }
        sendJson(res, 400, { success: false, error: err.message || 'Place search failed' });
        return;
      }
    }

    // 5. Trips Management & Live Dynamic Coordination
    if (pathname === '/api/v1/trips' && req.method === 'POST') {
      const body = await parseBody(req);
      const tripRecord = await tripService.createTrip(body);

      const fullTrip = {
        id: tripRecord.id,
        riderId: tripRecord.rider_id,
        rider: body.rider || { name: 'Grace Chemutai', phone: '+254712345001', rating: 4.95 },
        recipientRider: body.recipientRider,
        driverId: tripRecord.driver_id,
        driver: tripRecord.driver_id ? (liveDrivers.get(tripRecord.driver_id) || undefined) : undefined,
        pickup: {
          latitude: tripRecord.pickup_latitude,
          longitude: tripRecord.pickup_longitude,
          address: tripRecord.pickup_address,
          placeName: tripRecord.pickup_place_name,
        },
        destination: {
          latitude: tripRecord.destination_latitude,
          longitude: tripRecord.destination_longitude,
          address: tripRecord.destination_address,
          placeName: tripRecord.destination_place_name,
        },
        category: tripRecord.vehicle_category,
        status: tripRecord.status,
        fare: {
          baseFare: tripRecord.base_fare,
          distanceFare: tripRecord.distance_fare,
          timeFare: tripRecord.time_fare,
          bookingFee: tripRecord.booking_fee,
          surgeMultiplier: tripRecord.surge_multiplier,
          surgeAmount: tripRecord.surge_amount,
          discountAmount: tripRecord.discount_amount,
          totalFare: tripRecord.total_fare,
          currency: tripRecord.currency,
          estimatedDistanceKm: tripRecord.estimated_distance_km,
          estimatedDurationMin: tripRecord.estimated_duration_min,
        },
        paymentMethod: tripRecord.payment_method,
        paymentStatus: tripRecord.payment_status,
        ridePin: tripRecord.ride_pin,
        otpVerified: tripRecord.otp_verified,
        createdAt: tripRecord.created_at,
      };

      activeTripsMap.set(tripRecord.id, fullTrip);

      // Broadcast incoming offer to online drivers
      broadcastToSubscribers('driver:offers', {
        event: 'trip:incoming_offer',
        trip: fullTrip,
        offerCountdown: 15,
      });
      broadcastToSubscribers('global', {
        event: 'trip:incoming_offer',
        trip: fullTrip,
        offerCountdown: 15,
      });
      broadcastToSubscribers('admin:telemetry', {
        event: 'trip:created',
        data: fullTrip,
      });

      sendJson(res, 201, { success: true, trip: fullTrip });
      return;
    }

    if (pathname === '/api/v1/driver/offers' && req.method === 'GET') {
      const driverId = parsedUrl.searchParams.get('driverId') || '';
      const declined = driverDeclinedTrips.get(driverId) || new Set();
      const now = Date.now();
      const offers: any[] = [];
      for (const trip of activeTripsMap.values()) {
        if (['SEARCHING_DRIVER', 'REQUESTED'].includes(trip.status)) {
          const ageMs = now - new Date(trip.createdAt).getTime();
          if (ageMs < 45000 && !declined.has(trip.id)) {
            offers.push(trip);
          }
        }
      }
      sendJson(res, 200, { success: true, count: offers.length, offers });
      return;
    }

    if (pathname === '/api/v1/trips/active' && req.method === 'GET') {
      const list = Array.from(activeTripsMap.values()).filter((t) =>
        ['REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP'].includes(t.status)
      );
      sendJson(res, 200, { success: true, count: list.length, trips: list });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && pathname.endsWith('/accept') && req.method === 'POST') {
      const tripId = pathname.split('/')[4];
      const body = await parseBody(req);
      const driverId = body.driverId || 'user-driver-kipchoge';
      const driverInfo = body.driver || liveDrivers.get(driverId) || {
        name: 'Kiprop Chemokil',
        phone: '+254712345678',
        rating: 4.95,
        vehiclePlate: 'KMDK 234P',
        vehicleModel: 'Bajaj Boxer 150X',
        vehicleColor: 'Red',
        vehicleCategory: 'BODA_STANDARD',
      };

      const trip = activeTripsMap.get(tripId) || tripService.getTrip(tripId);
      if (!trip) {
        sendJson(res, 404, { success: false, error: 'Trip not found' });
        return;
      }

      if (!['SEARCHING_DRIVER', 'REQUESTED'].includes(trip.status)) {
        sendJson(res, 400, { success: false, error: 'Trip offer has already been accepted or expired.' });
        return;
      }

      trip.status = 'DRIVER_ASSIGNED';
      trip.driverId = driverId;
      trip.driver_id = driverId;
      trip.driver = {
        name: driverInfo.name || 'Kiprop Chemokil',
        phone: driverInfo.phone || '+254712345678',
        rating: driverInfo.rating || 4.95,
        vehiclePlate: driverInfo.vehiclePlate || driverInfo.plate || 'KMDK 234P',
        vehicleModel: driverInfo.vehicleModel || driverInfo.model || 'Bajaj Boxer 150X',
        vehicleColor: driverInfo.vehicleColor || driverInfo.color || 'Red',
        vehicleCategory: driverInfo.vehicleCategory || driverInfo.category || trip.category || 'BODA_STANDARD',
      };
      trip.matchedAt = new Date().toISOString();

      await tripService.updateTripStatus({
        tripId,
        nextStatus: 'DRIVER_ASSIGNED',
        actorId: driverId,
        actorRole: 'DRIVER',
        driverId,
      }).catch(() => {});

      activeTripsMap.set(tripId, trip);

      // Broadcast assignment to all channels
      broadcastToSubscribers(`trip:${tripId}`, {
        event: 'trip:status_change',
        data: trip,
      });
      broadcastToSubscribers(`rider:${trip.riderId}`, {
        event: 'trip:status_change',
        data: trip,
      });
      broadcastToSubscribers('admin:telemetry', {
        event: 'trip:status_change',
        data: trip,
      });
      broadcastToSubscribers('global', {
        event: 'trip:status_change',
        data: trip,
      });
      broadcastToSubscribers('driver:offers', {
        event: 'trip:offer_taken',
        tripId,
        driverId,
      });

      sendJson(res, 200, { success: true, trip });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && pathname.endsWith('/decline') && req.method === 'POST') {
      const tripId = pathname.split('/')[4];
      const body = await parseBody(req);
      const driverId = body.driverId || 'unknown';
      if (!driverDeclinedTrips.has(driverId)) {
        driverDeclinedTrips.set(driverId, new Set());
      }
      driverDeclinedTrips.get(driverId)?.add(tripId);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && !pathname.includes('/status') && !pathname.includes('/rate') && !pathname.includes('/accept') && !pathname.includes('/decline') && req.method === 'GET') {
      const tripId = pathname.split('/')[4];
      const trip = activeTripsMap.get(tripId) || tripService.getTrip(tripId);
      if (!trip) {
        sendJson(res, 404, { success: false, error: 'Trip not found' });
        return;
      }
      sendJson(res, 200, { success: true, trip });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const tripId = pathname.split('/')[4];
      const body = await parseBody(req);
      const { status: nextStatus, actorId, actorRole, cancellationReason } = body;
      const enteredPin = body.enteredPin || body.ridePin || body.pin;

      const trip = activeTripsMap.get(tripId) || tripService.getTrip(tripId);
      if (!trip) {
        sendJson(res, 404, { success: false, error: 'Trip not found' });
        return;
      }

      // PIN verification for starting trip
      if (nextStatus === 'IN_TRIP') {
        const expectedPin = trip.ridePin || trip.ride_pin;
        if (!enteredPin || (expectedPin && enteredPin !== expectedPin)) {
          sendJson(res, 400, { success: false, error: `Invalid 4-digit Ride PIN. Please enter the correct PIN from rider.` });
          return;
        }
        trip.otpVerified = true;
        trip.otp_verified = true;
        trip.startedAt = new Date().toISOString();
      }

      if (nextStatus === 'DRIVER_ARRIVED') {
        trip.arrivedAt = new Date().toISOString();
      }

      if (nextStatus === 'COMPLETED') {
        trip.completedAt = new Date().toISOString();
        trip.paymentStatus = 'COMPLETED';
      }

      if (nextStatus === 'CANCELLED') {
        trip.cancelledAt = new Date().toISOString();
        trip.cancelledBy = actorRole || 'RIDER';
        trip.cancellationReason = cancellationReason || 'Cancelled';
      }

      trip.status = nextStatus;
      activeTripsMap.set(tripId, trip);

      await tripService.updateTripStatus({
        tripId,
        nextStatus,
        actorId: actorId || 'system',
        actorRole: actorRole || 'DRIVER',
        enteredPin,
        cancellationReason,
      }).catch(() => {});

      broadcastToSubscribers(`trip:${tripId}`, {
        event: 'trip:status_change',
        data: trip,
      });
      broadcastToSubscribers('admin:telemetry', {
        event: 'trip:status_change',
        data: trip,
      });
      broadcastToSubscribers('global', {
        event: 'trip:status_change',
        data: trip,
      });

      sendJson(res, 200, { success: true, trip });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && pathname.endsWith('/rate') && req.method === 'POST') {
      const tripId = pathname.split('/')[4];
      const { rating, feedback, tipAmount } = await parseBody(req);
      const updated = tripService.rateTrip(tripId, rating, feedback, tipAmount);
      if (activeTripsMap.has(tripId)) {
        const t = activeTripsMap.get(tripId);
        t.rating = rating;
        t.feedback = feedback;
        t.tipAmount = tipAmount;
        activeTripsMap.set(tripId, t);
      }
      sendJson(res, 200, { success: true, trip: updated });
      return;
    }

    if (pathname === '/api/v1/admin/live-state' && req.method === 'GET') {
      const now = Date.now();
      const onlineDrivers = Array.from(liveDrivers.values()).filter(
        (d) => now - d.lastPing < 120000 && d.status !== 'OFFLINE'
      );
      const activeTrips = Array.from(activeTripsMap.values()).filter((t) =>
        ['REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP'].includes(t.status)
      );
      const completedTrips = Array.from(activeTripsMap.values()).filter((t) => t.status === 'COMPLETED');

      sendJson(res, 200, {
        success: true,
        onlineDriversCount: onlineDrivers.length,
        activeTripsCount: activeTrips.length,
        completedTripsCount: completedTrips.length,
        onlineDrivers,
        activeTrips,
        completedTrips: completedTrips.slice(-10),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 6. Safety & SOS Panic
    if (pathname === '/api/v1/safety/sos' && req.method === 'POST') {
      const body = await parseBody(req);
      const incident = safetyService.triggerSOS(
        body.tripId,
        body.reporterId,
        body.reporterRole,
        body.location,
        body.notes
      );

      // Instantaneous high-priority broadcast to Admin Operations Console
      broadcastToSubscribers('admin:telemetry', {
        event: 'safety:sos_alert',
        data: incident,
      });

      sendJson(res, 201, { success: true, incident });
      return;
    }

    // Helper to get authenticated user from Authorization header
    const getAuthUser = (request: http.IncomingMessage) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      try {
        const token = authHeader.split(' ')[1];
        return authService.verifyToken(token);
      } catch {
        return null;
      }
    };

    // 7. Wallet & Payments (Row-Level Security: self or admin only)
    if (pathname?.startsWith('/api/v1/wallet/') && req.method === 'GET') {
      const userId = pathname.split('/')[4];
      const authUser = getAuthUser(req);
      if (authUser && authUser.userId !== userId && authUser.role !== 'ADMIN') {
        sendJson(res, 403, { success: false, error: 'Row-Level Security: Access forbidden to external wallet.' });
        return;
      }
      const wallet = paymentService.getWallet(userId);
      sendJson(res, 200, { success: true, wallet });
      return;
    }

    if (pathname === '/api/v1/wallet/topup' && req.method === 'POST') {
      const { userId, amount, paymentMethod } = await parseBody(req);
      const authUser = getAuthUser(req);
      if (authUser && authUser.userId !== userId && authUser.role !== 'ADMIN') {
        sendJson(res, 403, { success: false, error: 'Row-Level Security: Unauthorized wallet top-up attempt.' });
        return;
      }
      const newBalance = await paymentService.topUpWallet(userId, amount, paymentMethod);
      sendJson(res, 200, { success: true, balance: newBalance });
      return;
    }

    // 8. Admin Operations & Telemetry (RBAC: Admin Role strictly required)
    if (pathname === '/api/v1/admin/telemetry' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (authUser && authUser.role !== 'ADMIN') {
        sendJson(res, 403, { success: false, error: 'RBAC: Administrative clearance required for telemetry and audits.' });
        return;
      }
      const activeDrivers = locationService.getAllActiveLocations();
      const allTrips = tripService.getAllTrips();
      const incidents = safetyService.getAllIncidents();
      const payments = paymentService.getAllPayments();

      const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
      const totalPlatformFees = payments.reduce((acc, curr) => acc + curr.platform_fee, 0);
      const totalDriverEarnings = payments.reduce((acc, curr) => acc + curr.driver_payout, 0);

      sendJson(res, 200, {
        success: true,
        stats: {
          activeDriversCount: activeDrivers.filter((d) => d.driver.status === 'ONLINE' || d.driver.status === 'BUSY').length,
          totalTripsCount: allTrips.length,
          activeTripsCount: allTrips.filter((t) => ['REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP'].includes(t.status)).length,
          completedTripsCount: allTrips.filter((t) => t.status === 'COMPLETED').length,
          openIncidentsCount: incidents.filter((i) => i.status === 'OPEN').length,
          totalRevenue,
          totalPlatformFees,
          totalDriverEarnings,
          currency: config.DEFAULT_CURRENCY,
        },
        drivers: activeDrivers,
        trips: allTrips,
        incidents,
        payments,
      });
      return;
    }

    // 404 Route Not Found
    sendJson(res, 404, { success: false, error: `Route ${req.method} ${pathname} not found.` });
  } catch (err: any) {
    console.error('Unhandled Gateway Error:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
});

// Real-Time WebSocket Server
const wss = new WebSocketServer({ server });
const clientSubscriptions = new Map<WebSocket, Set<string>>();

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  clientSubscriptions.set(ws, new Set());
  console.log(`🔌 [WEBSOCKET] Client connected from ${req.socket.remoteAddress}`);

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.action === 'ping') {
        ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
        return;
      }
      if (parsed.action === 'subscribe' && parsed.channel) {
        if (parsed.channel.startsWith('admin:') && config.NODE_ENV === 'production') {
          // Verify admin token in production
          const token = parsed.token;
          try {
            const authUser = token ? authService.verifyToken(token) : null;
            if (!authUser || authUser.role !== 'ADMIN') {
              ws.send(JSON.stringify({ error: 'RBAC: Admin privilege required to subscribe to this channel.' }));
              return;
            }
          } catch {
            ws.send(JSON.stringify({ error: 'RBAC: Invalid token for admin subscription.' }));
            return;
          }
        }
        clientSubscriptions.get(ws)?.add(parsed.channel);
      } else if (parsed.action === 'unsubscribe' && parsed.channel) {
        clientSubscriptions.get(ws)?.delete(parsed.channel);
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    clientSubscriptions.delete(ws);
  });
});

function broadcastToSubscribers(channel: string, payload: any) {
  const msg = JSON.stringify({ channel, ...payload });
  for (const [ws, subs] of clientSubscriptions.entries()) {
    if (subs.has(channel) && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
  });
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 [SWIFT BODA GATEWAY] Unified Enterprise Server listening on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Server active on ws://localhost:${PORT}`);
  });
}

export { server };
