/**
 * Swift Boda Enterprise Ride-Hailing Platform - Core Data Models & Types
 */

export type Role = 'RIDER' | 'DRIVER' | 'ADMIN' | 'DISPATCHER' | 'FLEET_OWNER';

export type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'BLOCKED';

export type DriverStatus = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'EN_ROUTE_PICKUP' | 'ON_TRIP';

export type VehicleCategory = 'BODA_STANDARD' | 'BODA_COMFORT' | 'BODA_XL' | 'EXPRESS_DELIVERY';

export type TripState =
  | 'REQUESTED'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_TRIP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentMethod = 'WALLET' | 'MPESA' | 'CARD' | 'CASH' | 'CORPORATE';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
  placeName?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  rating: number;
  totalTrips: number;
  walletBalance: number;
  currency: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  category: VehicleCategory;
  capacity: number;
  insuranceValidUntil: string;
  isVerified: boolean;
}

export interface DriverProfile {
  id: string;
  userId: string;
  user: User;
  vehicle?: Vehicle;
  status: DriverStatus;
  currentLocation?: GeoLocation;
  acceptanceRate: number;
  cancellationRate: number;
  totalEarnings: number;
  driverLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  licenseNumber: string;
  isVerified: boolean;
  activeTripId?: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  bookingFee: number;
  surgeMultiplier: number;
  surgeAmount: number;
  discountAmount: number;
  totalFare: number;
  currency: string;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
}

export interface Trip {
  id: string;
  riderId: string;
  rider: {
    name: string;
    phone: string;
    rating: number;
    avatarUrl?: string;
  };
  recipientRider?: {
    name: string;
    phone: string;
    isOther: boolean;
  };
  driverId?: string;
  driver?: {
    name: string;
    phone: string;
    rating: number;
    avatarUrl?: string;
    vehiclePlate: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleCategory: VehicleCategory;
  };
  pickup: GeoLocation;
  destination: GeoLocation;
  category: VehicleCategory;
  status: TripState;
  fare: FareBreakdown;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  ridePin: string; // 4-digit verification PIN
  otpVerified: boolean;
  createdAt: string;
  matchedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: 'RIDER' | 'DRIVER' | 'SYSTEM';
  rating?: number;
  feedback?: string;
  tipAmount?: number;
}

export interface SurgeZone {
  id: string;
  name: string;
  center: GeoLocation;
  radiusMeters: number;
  multiplier: number;
  demandScore: number; // 0 - 100
  supplyCount: number;
  isActive: boolean;
}

export interface SafetyIncident {
  id: string;
  tripId: string;
  reporterId: string;
  reporterRole: Role;
  type: 'SOS_BUTTON' | 'SPEED_VIOLATION' | 'DEVIATION_ALERT' | 'HARASSMENT' | 'ACCIDENT';
  location: GeoLocation;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  timestamp: string;
  notes?: string;
}

export interface DriverEarningsSummary {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  completedTripsToday: number;
  onlineHoursToday: number;
  tipsEarned: number;
  bonusesEarned: number;
}
