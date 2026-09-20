import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import { Buffer } from 'buffer';

if (typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

import { darajaService, DarajaSTKResponse } from '../services/daraja/darajaService';
import { DriverProfile, FareBreakdown, GeoLocation, PaymentMethod, SafetyIncident, Trip, TripState, VehicleCategory } from '../shared/types';
import { calculateHaversineDistance, generateRouteWaypoints, interpolateCoordinate } from '../shared/utils/geo';
import { getActiveRegion } from '../shared/constants/regions';

export type { DarajaSTKResponse };

export interface ChatMessage {
  id: string;
  sender: 'RIDER' | 'DRIVER';
  text: string;
  time: string;
}

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  icon: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  rating: number;
  walletBalance: number;
  avatarUrl?: string;
  driverDetails?: {
    vehiclePlate: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleCategory: VehicleCategory;
    todayEarnings: number;
    weeklyEarnings: number;
    tripsCompleted: number;
  };
  savedPlaces: SavedPlace[];
}

export type DriverVerificationStatus = 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminDriverVerification {
  id: string;
  name: string;
  phone: string;
  email?: string;
  plate: string;
  vehicleModel: string;
  vehicleYear?: string;
  vehicleColor?: string;
  category: VehicleCategory;
  chassisNumber?: string;
  nationalId: string;
  dlNumber: string;
  dlExpiry?: string;
  dlClassA2Confirmed?: boolean;
  driverSelfieUrl?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  dlPhotoUrl?: string;
  logbookPhotoUrl?: string;
  insurancePolicy?: string;
  insuranceUnderwriter?: string;
  insuranceExpiry: string;
  insurancePhotoUrl?: string;
  goodConductNumber?: string;
  goodConductPhotoUrl?: string;
  baseStage?: string;
  saccoName?: string;
  saccoNumber?: string;
  logbookVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt?: string;
}

export interface AdminRiderVerification {
  id: string;
  name: string;
  phone: string;
  email: string;
  tripsCount: number;
  mpesaKycVerified: boolean;
  nationalIdVerified: boolean;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'VERIFIED' | 'PENDING_KYC' | 'FLAGGED';
}

export interface AdminTransactionAudit {
  id: string;
  mpesaReceiptNo: string;
  tripId: string;
  riderName: string;
  driverName: string;
  grossAmount: number;
  platformFee: number;
  driverPayout: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  status: 'SETTLED' | 'PENDING' | 'FLAGGED';
}

interface SwiftBodaContextType {
  // Authentication & RBAC
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  pendingOtpPhone: string | null;
  sendOtp: (phone: string) => boolean;
  verifyOtpAndLogin: (code: string) => { success: boolean; role?: 'RIDER' | 'DRIVER' | 'ADMIN' };
  quickLoginAs: (role: 'RIDER' | 'DRIVER' | 'DRIVER_PENDING' | 'DRIVER_REJECTED' | 'ADMIN') => void;
  registerUser: (data: {
    fullName: string;
    phoneNumber: string;
    email: string;
    role: 'RIDER' | 'DRIVER' | 'ADMIN';
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleColor?: string;
  }) => boolean;
  logout: () => void;

  // Driver Verification Status & Application
  driverVerificationStatus: DriverVerificationStatus;
  applyForDriver: (data: {
    vehiclePlate: string;
    vehicleModel: string;
    vehicleCategory?: VehicleCategory;
    nationalId: string;
    dlNumber: string;
    fullName?: string;
    phone?: string;
    email?: string;
    driverSelfieUrl?: string;
    nationalIdFrontUrl?: string;
    nationalIdBackUrl?: string;
    dlExpiry?: string;
    dlClassA2Confirmed?: boolean;
    dlPhotoUrl?: string;
    vehicleYear?: string;
    vehicleColor?: string;
    chassisNumber?: string;
    logbookPhotoUrl?: string;
    insurancePolicy?: string;
    insuranceUnderwriter?: string;
    insuranceExpiry?: string;
    insurancePhotoUrl?: string;
    goodConductNumber?: string;
    goodConductPhotoUrl?: string;
    baseStage?: string;
    saccoName?: string;
    saccoNumber?: string;
  }) => void;

  // Admin Verification & Audit Portal
  adminDrivers: AdminDriverVerification[];
  approveDriver: (id: string) => void;
  rejectDriver: (id: string) => void;
  adminRiders: AdminRiderVerification[];
  verifyRiderKyc: (id: string) => void;
  flagRiderRisk: (id: string) => void;
  adminTransactions: AdminTransactionAudit[];
  auditTransaction: (id: string) => void;

  // Onboarding Persistence
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;

  // Booking for Someone Else
  bookingForOther: { enabled: boolean; name: string; phone: string };
  setBookingForOther: (data: { enabled: boolean; name: string; phone: string }) => void;

  // Live Trip Sharing
  shareLiveTrip: () => Promise<void>;

  // Saved Places CRUD
  savedPlaces: SavedPlace[];
  addSavedPlace: (place: Omit<SavedPlace, 'id'>) => void;
  deleteSavedPlace: (id: string) => void;

  // App Mode (locked to detected role)
  appMode: 'RIDER' | 'DRIVER' | 'ADMIN';
  setAppMode: (mode: 'RIDER' | 'DRIVER' | 'ADMIN') => void;

  // Rider State
  userLocation: GeoLocation;
  destinationLocation: GeoLocation | null;
  setDestinationLocation: (loc: GeoLocation | null) => void;
  rebookDestination: (dest: GeoLocation) => void;
  selectedCategory: VehicleCategory;
  setSelectedCategory: (cat: VehicleCategory) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  walletBalance: number;
  topUpWallet: (amount: number) => void;
  initiateMpesaSTKPush: (phoneNumber: string, amount: number, accountReference?: string) => Promise<DarajaSTKResponse>;

  // Active Trip State
  activeTrip: Trip | null;
  fareEstimate: FareBreakdown | null;
  requestRide: () => void;
  cancelRide: () => void;
  rateTrip: (rating: number, feedback?: string, tip?: number) => void;
  triggerSOS: () => void;
  incidents: SafetyIncident[];

  // In-Trip Chat
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;

  // Nearby & Simulated Drivers
  nearbyDrivers: { id: string; name: string; location: GeoLocation; category: VehicleCategory }[];
  simulatedDriverPos: GeoLocation | null;

  // Driver Mode State
  isDriverOnline: boolean;
  setIsDriverOnline: (online: boolean) => void;
  driverEarnings: { today: number; weekly: number; tripsCompleted: number };
  incomingOffer: Trip | null;
  offerCountdown: number;
  acceptIncomingOffer: () => void;
  declineIncomingOffer: () => void;
  driverArrived: () => void;
  driverStartTrip: (pin: string) => boolean;
  driverCompleteTrip: () => void;

  // History (Scoped strictly to current user)
  pastTrips: Trip[];
}

const activeRegion = getActiveRegion();

const DEFAULT_LOCATION: GeoLocation = {
  latitude: activeRegion.center.latitude, // West Pokot Pilot (Makutano / Kapenguria)
  longitude: activeRegion.center.longitude,
  address: 'Makutano Junction, Kitale-Lodwar Rd',
  placeName: 'Makutano Central Stage',
};

// Registered Accounts Directory (Simulating Secure Database with RBAC)
const INITIAL_USERS: Record<string, AuthUser> = {
  '+254712345001': {
    id: 'user-rider-grace',
    fullName: 'Grace Chemutai',
    phoneNumber: '+254712345001',
    email: 'grace.chemutai@swiftboda.co.ke',
    role: 'RIDER',
    rating: 4.95,
    walletBalance: 1500.0,
    savedPlaces: [
      { id: 'sp-1', name: 'Home', address: 'Kapenguria Residential, Hospital Rd', lat: 1.2440, lon: 35.1180, icon: 'home' },
      { id: 'sp-2', name: 'Work', address: 'Makutano Market Stage', lat: 1.2389, lon: 35.1119, icon: 'briefcase' },
      { id: 'sp-3', name: 'Stage', address: 'Chepareria Stage', lat: 1.3060, lon: 35.2040, icon: 'bicycle' },
    ],
  },
  '+254712345678': {
    id: 'user-driver-kipchoge',
    fullName: 'Kiprop Chemokil',
    phoneNumber: '+254712345678',
    email: 'kiprop.chemokil@swiftboda.co.ke',
    role: 'DRIVER',
    rating: 4.95,
    walletBalance: 3450.0,
    driverDetails: {
      vehiclePlate: 'KMDK 234P',
      vehicleModel: 'Bajaj Boxer 150X',
      vehicleColor: 'Red',
      vehicleCategory: 'BODA_STANDARD',
      todayEarnings: 3450.0,
      weeklyEarnings: 18200.0,
      tripsCompleted: 8,
    },
    savedPlaces: [],
  },
  '+254700000001': {
    id: 'user-admin-sarah',
    fullName: 'Sarah Kemunto',
    phoneNumber: '+254700000001',
    email: 'ops.westpokot@swiftboda.co.ke',
    role: 'ADMIN',
    rating: 5.0,
    walletBalance: 250000.0,
    savedPlaces: [],
  },
  '+254722889900': {
    id: 'user-driver-peter',
    fullName: 'Peter Pkemoi',
    phoneNumber: '+254722889900',
    email: 'peter.pkemoi@swiftboda.co.ke',
    role: 'RIDER', // Pending driver, logged in as passenger
    rating: 4.85,
    walletBalance: 850.0,
    driverDetails: {
      vehiclePlate: 'KMDF 891B',
      vehicleModel: 'TVS HLX 150',
      vehicleColor: 'Black',
      vehicleCategory: 'BODA_STANDARD',
      todayEarnings: 0.0,
      weeklyEarnings: 0.0,
      tripsCompleted: 0,
    },
    savedPlaces: [],
  },
  '+254733556677': {
    id: 'user-driver-hassan',
    fullName: 'Hassan Lokira',
    phoneNumber: '+254733556677',
    email: 'hassan.lokira@swiftboda.co.ke',
    role: 'RIDER', // Rejected driver applicant, logged in as passenger
    rating: 4.70,
    walletBalance: 420.0,
    driverDetails: {
      vehiclePlate: 'KMDE 412X',
      vehicleModel: 'Hero Hunter 150',
      vehicleColor: 'Blue',
      vehicleCategory: 'EXPRESS_DELIVERY',
      todayEarnings: 0.0,
      weeklyEarnings: 0.0,
      tripsCompleted: 0,
    },
    savedPlaces: [],
  },
};

const INITIAL_ADMIN_DRIVERS: AdminDriverVerification[] = [
  {
    id: 'drv-ver-101',
    name: 'Peter Pkemoi',
    phone: '+254722889900',
    email: 'peter.pkemoi@swiftboda.co.ke',
    plate: 'KMDF 891B',
    vehicleModel: 'TVS HLX 150',
    vehicleYear: '2023',
    vehicleColor: 'Black & Red',
    category: 'BODA_STANDARD',
    chassisNumber: 'MD625BF12N882910',
    nationalId: '32984102',
    dlNumber: 'DL-KAP-8821',
    dlExpiry: '12/2027',
    dlClassA2Confirmed: true,
    driverSelfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    nationalIdFrontUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    nationalIdBackUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    dlPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    logbookPhotoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    insurancePolicy: 'POL-WP-882910',
    insuranceUnderwriter: 'APA Insurance Kenya',
    insuranceExpiry: '12/2026',
    insurancePhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    goodConductNumber: 'CID-POK-2025-991',
    goodConductPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    baseStage: 'Makutano Junction Stage',
    saccoName: 'Makutano Boda Operators SACCO',
    saccoNumber: 'MB-204',
    logbookVerified: true,
    status: 'PENDING',
    submittedAt: '17/09/2026',
  },
  {
    id: 'drv-ver-102',
    name: 'Chebet Lonyangapuo',
    phone: '+254733445566',
    email: 'chebet.lonyangapuo@swiftboda.co.ke',
    plate: 'KMC 556A',
    vehicleModel: 'Honda Ace 125',
    vehicleYear: '2022',
    vehicleColor: 'Emerald Green',
    category: 'BODA_COMFORT',
    chassisNumber: 'HA125KMC556A99',
    nationalId: '29841029',
    dlNumber: 'DL-KAP-4109',
    dlExpiry: '08/2026',
    dlClassA2Confirmed: true,
    driverSelfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    nationalIdFrontUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    nationalIdBackUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    dlPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    logbookPhotoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    insurancePolicy: 'POL-WP-410988',
    insuranceUnderwriter: 'Britam Kenya',
    insuranceExpiry: '08/2026',
    insurancePhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    goodConductNumber: 'CID-POK-2025-410',
    goodConductPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    baseStage: 'Chepareria Boda Stage',
    saccoName: 'Chepareria Riders Cooperative',
    saccoNumber: 'CP-118',
    logbookVerified: true,
    status: 'PENDING',
    submittedAt: '16/09/2026',
  },
  {
    id: 'drv-ver-103',
    name: 'Hassan Lokira',
    phone: '+254733556677',
    email: 'hassan.lokira@swiftboda.co.ke',
    plate: 'KMDE 412X',
    vehicleModel: 'Hero Hunter 150',
    vehicleYear: '2021',
    vehicleColor: 'Blue',
    category: 'EXPRESS_DELIVERY',
    chassisNumber: 'HH150KMDE412X',
    nationalId: '38210944',
    dlNumber: 'DL-KAC-9920',
    dlExpiry: '01/2026',
    dlClassA2Confirmed: true,
    driverSelfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    nationalIdFrontUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    nationalIdBackUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    dlPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    logbookPhotoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    insurancePolicy: 'POL-WP-992011',
    insuranceUnderwriter: 'Jubilee Insurance',
    insuranceExpiry: 'EXPIRED (01/2026)',
    insurancePhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    goodConductNumber: 'CID-POK-2024-881',
    goodConductPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    baseStage: 'Kacheliba Town Centre',
    saccoName: 'Kacheliba Transporters SACCO',
    saccoNumber: 'KC-092',
    logbookVerified: false,
    status: 'REJECTED',
    rejectionReason: 'Expired commercial PSV insurance sticker and unverified motorcycle logbook transfer.',
    submittedAt: '10/09/2026',
  },
  {
    id: 'drv-ver-104',
    name: 'Kiprop Chemokil',
    phone: '+254712345678',
    email: 'kiprop.chemokil@swiftboda.co.ke',
    plate: 'KMDK 234P',
    vehicleModel: 'Bajaj Boxer 150X',
    vehicleYear: '2023',
    vehicleColor: 'Red',
    category: 'BODA_STANDARD',
    chassisNumber: 'BB150KMDK234P',
    nationalId: '28491022',
    dlNumber: 'DL-ELD-3319',
    dlExpiry: '11/2027',
    dlClassA2Confirmed: true,
    driverSelfieUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    nationalIdFrontUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    nationalIdBackUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
    dlPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    logbookPhotoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
    insurancePolicy: 'POL-WP-234991',
    insuranceUnderwriter: 'APA Insurance Kenya',
    insuranceExpiry: '11/2026',
    insurancePhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    goodConductNumber: 'CID-POK-2025-019',
    goodConductPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    baseStage: 'Makutano Junction Stage',
    saccoName: 'Makutano Boda Operators SACCO',
    saccoNumber: 'MB-001',
    logbookVerified: true,
    status: 'APPROVED',
    submittedAt: '01/09/2026',
  },
];

const INITIAL_ADMIN_RIDERS: AdminRiderVerification[] = [
  {
    id: 'rdr-ver-201',
    name: 'Grace Chemutai',
    phone: '+254712345001',
    email: 'grace.chemutai@swiftboda.co.ke',
    tripsCount: 14,
    mpesaKycVerified: true,
    nationalIdVerified: true,
    riskScore: 'LOW',
    status: 'VERIFIED',
  },
  {
    id: 'rdr-ver-202',
    name: 'Brian Krop',
    phone: '+254798654321',
    email: 'brian.krop@gmail.com',
    tripsCount: 1,
    mpesaKycVerified: true,
    nationalIdVerified: false,
    riskScore: 'LOW',
    status: 'PENDING_KYC',
  },
  {
    id: 'rdr-ver-203',
    name: 'Kevin Mwangi',
    phone: '+254722001122',
    email: 'kevin.m@yahoo.com',
    tripsCount: 6,
    mpesaKycVerified: false,
    nationalIdVerified: false,
    riskScore: 'HIGH',
    status: 'FLAGGED',
  },
  {
    id: 'rdr-ver-204',
    name: 'Amina Hassan',
    phone: '+254711998877',
    email: 'amina.h@swiftboda.co.ke',
    tripsCount: 8,
    mpesaKycVerified: true,
    nationalIdVerified: true,
    riskScore: 'LOW',
    status: 'VERIFIED',
  },
];

const INITIAL_ADMIN_TRANSACTIONS: AdminTransactionAudit[] = [
  {
    id: 'tx-aud-301',
    mpesaReceiptNo: 'QK89XP4021',
    tripId: 'trip-901',
    riderName: 'Grace Wanjiku',
    driverName: 'Kipchoge Moto',
    grossAmount: 140.0,
    platformFee: 21.0,
    driverPayout: 119.0,
    paymentMethod: 'MPESA',
    timestamp: 'Today, 10:45 AM',
    status: 'SETTLED',
  },
  {
    id: 'tx-aud-302',
    mpesaReceiptNo: 'MP9912AZ88',
    tripId: 'trip-902',
    riderName: 'Grace Wanjiku',
    driverName: 'Mercy Comfort',
    grossAmount: 450.0,
    platformFee: 67.5,
    driverPayout: 382.5,
    paymentMethod: 'MPESA',
    timestamp: 'Yesterday, 3:15 PM',
    status: 'SETTLED',
  },
  {
    id: 'tx-aud-303',
    mpesaReceiptNo: 'FL48291038',
    tripId: 'trip-781',
    riderName: 'Alex Rider',
    driverName: 'Kipchoge Moto',
    grossAmount: 850.0,
    platformFee: 127.5,
    driverPayout: 722.5,
    paymentMethod: 'MPESA',
    timestamp: '15 mins ago',
    status: 'FLAGGED',
  },
  {
    id: 'tx-aud-304',
    mpesaReceiptNo: 'WL66710922',
    tripId: 'trip-844',
    riderName: 'Amina Wangari',
    driverName: 'Peter Omondi',
    grossAmount: 230.0,
    platformFee: 34.5,
    driverPayout: 195.5,
    paymentMethod: 'WALLET',
    timestamp: 'Today, 11:20 AM',
    status: 'SETTLED',
  },
];

const ALL_INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-901',
    riderId: 'user-rider-grace',
    rider: { name: 'Grace Chemutai', phone: '+254712345001', rating: 4.95 },
    driverId: 'user-driver-kipchoge',
    driver: {
      name: 'Kiprop Chemokil',
      phone: '+254712345678',
      rating: 4.95,
      vehiclePlate: 'KMDK 234P',
      vehicleModel: 'Bajaj Boxer 150X',
      vehicleColor: 'Red',
      vehicleCategory: 'BODA_STANDARD',
    },
    pickup: { latitude: 1.2389, longitude: 35.1119, address: 'Makutano Junction Stage' },
    destination: { latitude: 1.2440, longitude: 35.1180, address: 'Kapenguria County Referral Hospital', placeName: 'Kapenguria Hospital' },
    category: 'BODA_STANDARD',
    status: 'COMPLETED',
    fare: {
      baseFare: 50,
      distanceFare: 30,
      timeFare: 10,
      bookingFee: 0,
      surgeMultiplier: 1.0,
      surgeAmount: 0,
      discountAmount: 0,
      totalFare: 90,
      currency: 'KES',
      estimatedDistanceKm: 1.9,
      estimatedDurationMin: 6,
    },
    paymentMethod: 'MPESA',
    paymentStatus: 'COMPLETED',
    ridePin: '4821',
    otpVerified: true,
    rating: 5,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1.7).toISOString(),
  },
  {
    id: 'trip-902',
    riderId: 'user-rider-grace',
    rider: { name: 'Grace Chemutai', phone: '+254712345001', rating: 4.95 },
    driverId: 'drv-wp-3',
    driver: {
      name: 'Chebet Lonyangapuo',
      phone: '+254733445566',
      rating: 4.98,
      vehiclePlate: 'KMC 556A',
      vehicleModel: 'Honda Ace 125',
      vehicleColor: 'Blue',
      vehicleCategory: 'BODA_COMFORT',
    },
    pickup: { latitude: 1.3060, longitude: 35.2040, address: 'Chepareria Market Stage' },
    destination: { latitude: 1.2389, longitude: 35.1119, address: 'Makutano Town Centre', placeName: 'Makutano Central' },
    category: 'BODA_COMFORT',
    status: 'COMPLETED',
    fare: {
      baseFare: 80,
      distanceFare: 130,
      timeFare: 40,
      bookingFee: 0,
      surgeMultiplier: 1.0,
      surgeAmount: 0,
      discountAmount: 0,
      totalFare: 250,
      currency: 'KES',
      estimatedDistanceKm: 8.4,
      estimatedDurationMin: 18,
    },
    paymentMethod: 'MPESA',
    paymentStatus: 'COMPLETED',
    ridePin: '8910',
    otpVerified: true,
    rating: 5,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
  },
];

const SwiftBodaContext = createContext<SwiftBodaContextType | undefined>(undefined);

export const SwiftBodaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current Authenticated User (Defaults to null to trigger Uber Onboarding & Auth on fresh startup)
  const [usersDb, setUsersDb] = useState<Record<string, AuthUser>>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [pendingOtpPhone, setPendingOtpPhone] = useState<string | null>(null);

  // Onboarding Persistence (Only shown on fresh install / first time)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('@swiftboda_has_onboarded'),
      AsyncStorage.getItem('@swiftboda_current_user'),
    ])
      .then(([onboardedVal, userVal]) => {
        if (onboardedVal === 'true') {
          setHasSeenOnboarding(true);
        } else {
          setHasSeenOnboarding(false);
        }
        if (userVal) {
          try {
            const parsed = JSON.parse(userVal);
            if (parsed && parsed.phoneNumber) {
              setCurrentUser(parsed);
            }
          } catch (e) {
            console.error('Failed parsing stored user', e);
          }
        }
      })
      .catch(() => {
        setHasSeenOnboarding(false);
      });
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@swiftboda_has_onboarded', 'true');
      setHasSeenOnboarding(true);
    } catch (e) {
      setHasSeenOnboarding(true);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('@swiftboda_has_onboarded');
      await AsyncStorage.removeItem('@swiftboda_current_user');
      setHasSeenOnboarding(false);
      setCurrentUser(null);
    } catch (e) {}
  };

  // Booking for someone else state
  const [bookingForOther, setBookingForOther] = useState<{
    enabled: boolean;
    name: string;
    phone: string;
  }>({
    enabled: false,
    name: '',
    phone: '',
  });

  // App mode auto-locks to user role
  const [appMode, setAppMode] = useState<'RIDER' | 'DRIVER' | 'ADMIN'>('RIDER');
  const [userLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [destinationLocation, setDestinationLocation] = useState<GeoLocation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('BODA_STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [promoCode, setPromoCode] = useState<string>('');

  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [fareEstimate, setFareEstimate] = useState<FareBreakdown | null>(null);
  const [simulatedDriverPos, setSimulatedDriverPos] = useState<GeoLocation | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>(ALL_INITIAL_TRIPS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Driver state
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(true);
  const [incomingOffer, setIncomingOffer] = useState<Trip | null>(null);
  const [offerCountdown, setOfferCountdown] = useState<number>(15);

  // Nearby simulated drivers in West Pokot (Seeded from Active Region)
  const [nearbyDrivers] = useState(
    activeRegion.driverSeeds.map((d) => ({
      id: d.id,
      name: d.name,
      location: d.location,
      category: d.category,
    }))
  );

  // Admin Operations State
  const [adminDrivers, setAdminDrivers] = useState<AdminDriverVerification[]>(INITIAL_ADMIN_DRIVERS);
  const [adminRiders, setAdminRiders] = useState<AdminRiderVerification[]>(INITIAL_ADMIN_RIDERS);
  const [adminTransactions, setAdminTransactions] = useState<AdminTransactionAudit[]>(INITIAL_ADMIN_TRANSACTIONS);

  // Derive dynamic Driver Verification Status for the current active user
  const driverVerificationStatus: DriverVerificationStatus = React.useMemo(() => {
    if (!currentUser) return 'NOT_APPLIED';
    const match = (adminDrivers || []).find(
      (d) => d.phone === currentUser.phoneNumber || d.name.toLowerCase() === currentUser.fullName.toLowerCase()
    );
    if (match) {
      return match.status; // 'PENDING' | 'APPROVED' | 'REJECTED'
    }
    if (currentUser.driverDetails) {
      return 'PENDING';
    }
    if (currentUser.role === 'DRIVER') {
      return 'APPROVED';
    }
    return 'NOT_APPLIED';
  }, [currentUser, adminDrivers]);

  // Synchronize App Mode with Detected Role whenever Current User or Verification changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        setAppMode('ADMIN');
      } else if (currentUser.role === 'DRIVER' && driverVerificationStatus === 'APPROVED') {
        setAppMode('DRIVER');
      } else {
        // Enforce passenger/rider mode for any non-approved driver or passenger
        setAppMode('RIDER');
      }
    }
  }, [currentUser?.id, currentUser?.role, driverVerificationStatus]);

  // Scoped Trips strictly to Current User (Rider only sees their trips; Driver only sees their trips)
  const pastTrips = allTrips.filter((t) => {
    if (!currentUser) return false;
    if (currentUser.role === 'DRIVER' && driverVerificationStatus === 'APPROVED') {
      return t.driverId === currentUser.id;
    }
    return t.riderId === currentUser.id;
  });

  const walletBalance = currentUser?.walletBalance || 0;

  // Authentication Handlers
  const sendOtp = (phone: string): boolean => {
    const cleaned = phone.trim();
    if (!cleaned) return false;
    setPendingOtpPhone(cleaned);
    return true;
  };

  const verifyOtpAndLogin = (code: string): { success: boolean; role?: 'RIDER' | 'DRIVER' | 'ADMIN' } => {
    if (code !== '123456' && code.length !== 6) return { success: false };

    if (!pendingOtpPhone) return { success: false };

    // Find or Auto-register account
    let user = usersDb[pendingOtpPhone];
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        fullName: 'New Passenger',
        phoneNumber: pendingOtpPhone,
        email: `${pendingOtpPhone}@swiftboda.co.ke`,
        role: 'RIDER',
        rating: 5.0,
        walletBalance: 250.0,
        savedPlaces: [
          { id: 'sp-def-1', name: 'Home', address: 'Makutano Central Stage', lat: activeRegion.center.latitude, lon: activeRegion.center.longitude, icon: 'home' },
        ],
      };
      setUsersDb((prev) => ({ ...prev, [pendingOtpPhone]: user }));
    }

    // Check if user is an unapproved driver: if not approved, enforce RIDER role
    const driverMatch = (adminDrivers || []).find((d) => d.phone === pendingOtpPhone);
    const isApprovedDriver = driverMatch ? driverMatch.status === 'APPROVED' : user.role === 'DRIVER';
    if (!isApprovedDriver && user.role === 'DRIVER') {
      user = { ...user, role: 'RIDER' };
    }

    setCurrentUser(user);
    AsyncStorage.setItem('@swiftboda_current_user', JSON.stringify(user)).catch(() => {});
    setPendingOtpPhone(null);
    return { success: true, role: user.role };
  };

  const quickLoginAs = (role: 'RIDER' | 'DRIVER' | 'DRIVER_PENDING' | 'DRIVER_REJECTED' | 'ADMIN') => {
    let userToSet: AuthUser | null = null;
    if (role === 'RIDER') {
      userToSet = usersDb['+254712345001'] || INITIAL_USERS['+254712345001'];
    } else if (role === 'DRIVER') {
      userToSet = usersDb['+254712345678'] || INITIAL_USERS['+254712345678'];
    } else if (role === 'DRIVER_PENDING') {
      userToSet = usersDb['+254722889900'] || INITIAL_USERS['+254722889900'];
    } else if (role === 'DRIVER_REJECTED') {
      userToSet = usersDb['+254733556677'] || INITIAL_USERS['+254733556677'];
    } else {
      userToSet = usersDb['+254700000001'] || INITIAL_USERS['+254700000001'];
    }
    if (userToSet) {
      setCurrentUser(userToSet);
      AsyncStorage.setItem('@swiftboda_current_user', JSON.stringify(userToSet)).catch(() => {});
    }
  };

  const registerUser = (data: {
    fullName: string;
    phoneNumber: string;
    email: string;
    role: 'RIDER' | 'DRIVER' | 'ADMIN';
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleColor?: string;
  }): boolean => {
    const isDriverApplicant = data.role === 'DRIVER';
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      // IMPORTANT: Driver applicants log in as passenger (RIDER) until approved by Admin!
      role: isDriverApplicant ? 'RIDER' : (data.role as any),
      rating: 5.0,
      walletBalance: 250.0,
      savedPlaces: [
        { id: 'sp-1', name: 'Home', address: 'Kenyatta Ave, CBD', lat: -1.286389, lon: 36.817223, icon: 'home' },
      ],
      ...(isDriverApplicant
        ? {
            driverDetails: {
              vehiclePlate: data.vehiclePlate || 'KMC 999X',
              vehicleModel: data.vehicleModel || 'Boxer 150',
              vehicleColor: data.vehicleColor || 'Black',
              vehicleCategory: 'BODA_STANDARD',
              todayEarnings: 0.0,
              weeklyEarnings: 0.0,
              tripsCompleted: 0,
            },
          }
        : {}),
    };

    if (isDriverApplicant) {
      // Auto-submit driver applicant to Admin review queue as PENDING
      const newAdminApplicant: AdminDriverVerification = {
        id: `drv-ver-${Date.now()}`,
        name: data.fullName,
        phone: data.phoneNumber,
        plate: data.vehiclePlate || 'KMC 999X',
        vehicleModel: data.vehicleModel || 'Boxer 150',
        category: 'BODA_STANDARD',
        nationalId: '33' + Math.floor(100000 + Math.random() * 900000),
        dlNumber: 'DL-NBO-' + Math.floor(1000 + Math.random() * 9000),
        logbookVerified: true,
        insuranceExpiry: '12/2026',
        status: 'PENDING',
      };
      setAdminDrivers((prev) => [newAdminApplicant, ...prev]);
    }

    setUsersDb((prev) => ({ ...prev, [data.phoneNumber]: newUser }));
    setCurrentUser(newUser);
    AsyncStorage.setItem('@swiftboda_current_user', JSON.stringify(newUser)).catch(() => {});
    return true;
  };

  const logout = async () => {
    setCurrentUser(null);
    setActiveTrip(null);
    setDestinationLocation(null);
    setHasSeenOnboarding(false);
    try {
      await AsyncStorage.removeItem('@swiftboda_current_user');
      await AsyncStorage.removeItem('@swiftboda_has_onboarded');
    } catch (e) {}
  };

  // Saved Places CRUD
  const savedPlaces = currentUser?.savedPlaces || [];

  const addSavedPlace = (place: Omit<SavedPlace, 'id'>) => {
    if (!currentUser) return;
    const newPlace: SavedPlace = {
      ...place,
      id: `sp-${Date.now()}`,
    };
    const updatedUser = {
      ...currentUser,
      savedPlaces: [newPlace, ...currentUser.savedPlaces],
    };
    setCurrentUser(updatedUser);
    setUsersDb((prev) => ({ ...prev, [currentUser.phoneNumber]: updatedUser }));
  };

  const deleteSavedPlace = (id: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      savedPlaces: currentUser.savedPlaces.filter((p) => p.id !== id),
    };
    setCurrentUser(updatedUser);
    setUsersDb((prev) => ({ ...prev, [currentUser.phoneNumber]: updatedUser }));
  };

  // Realistic Fare Calculation
  useEffect(() => {
    if (destinationLocation) {
      const dist = calculateHaversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        destinationLocation.latitude,
        destinationLocation.longitude
      );
      const timeMin = Math.max(2, Math.ceil((dist / 26) * 60));

      const categoryRates: Record<VehicleCategory, { base: number; perKm: number; perMin: number; booking: number; min: number }> = {
        BODA_STANDARD: { base: 70, perKm: 35, perMin: 5, booking: 20, min: 100 },
        BODA_COMFORT: { base: 100, perKm: 45, perMin: 7, booking: 30, min: 150 },
        BODA_XL: { base: 130, perKm: 55, perMin: 9, booking: 40, min: 200 },
        EXPRESS_DELIVERY: { base: 80, perKm: 40, perMin: 6, booking: 25, min: 120 },
      };

      const rate = categoryRates[selectedCategory] || categoryRates.BODA_STANDARD;
      const distFare = dist * rate.perKm;
      const timeFare = timeMin * rate.perMin;
      const subtotal = rate.base + distFare + timeFare + rate.booking;
      const discount = promoCode === 'SWIFT50' ? 50.0 : 0;
      const total = Math.max(rate.min, subtotal - discount);

      setFareEstimate({
        baseFare: rate.base,
        distanceFare: parseFloat(distFare.toFixed(2)),
        timeFare: parseFloat(timeFare.toFixed(2)),
        bookingFee: rate.booking,
        surgeMultiplier: 1.0,
        surgeAmount: 0,
        discountAmount: discount,
        totalFare: Math.round(total),
        currency: 'KES',
        estimatedDistanceKm: parseFloat(dist.toFixed(2)),
        estimatedDurationMin: timeMin,
      });
    } else {
      setFareEstimate(null);
    }
  }, [destinationLocation, selectedCategory, promoCode]);

  // Driver movement simulation during trip
  useEffect(() => {
    if (!activeTrip || !['DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP'].includes(activeTrip.status)) {
      return;
    }

    const startPos = activeTrip.status === 'IN_TRIP' ? activeTrip.pickup : nearbyDrivers[0].location;
    const targetPos = activeTrip.status === 'IN_TRIP' ? activeTrip.destination : activeTrip.pickup;

    const waypoints = generateRouteWaypoints(startPos, targetPos, 15);
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < waypoints.length) {
        setSimulatedDriverPos(waypoints[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(interval);
        if (activeTrip.status === 'DRIVER_ASSIGNED') {
          setActiveTrip((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVED' } : null));
        }
      }
    }, 1400);

    return () => clearInterval(interval);
  }, [activeTrip?.status]);

  // 15-second driver incoming offer timer
  useEffect(() => {
    if (!incomingOffer) return;
    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIncomingOffer(null);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingOffer]);

  // Trigger incoming offer when driver is online
  useEffect(() => {
    if (appMode === 'DRIVER' && isDriverOnline && !activeTrip && !incomingOffer) {
      const timeout = setTimeout(() => {
        const dummyOffer: Trip = {
          id: `offer-${Date.now()}`,
          riderId: 'rider-kenya-02',
          rider: { name: 'Chepkemoi Nancy', phone: '+254722334455', rating: 4.96 },
          driverId: currentUser?.id || 'user-driver-kipchoge',
          pickup: { latitude: 1.2389, longitude: 35.1119, address: 'Makutano Junction Stage' },
          destination: { latitude: 1.2440, longitude: 35.1180, address: 'Kapenguria County Referral Hospital', placeName: 'Kapenguria Hospital' },
          category: 'BODA_STANDARD',
          status: 'REQUESTED',
          fare: {
            baseFare: 50,
            distanceFare: 30,
            timeFare: 10,
            bookingFee: 0,
            surgeMultiplier: 1.0,
            surgeAmount: 0,
            discountAmount: 0,
            totalFare: 90,
            currency: 'KES',
            estimatedDistanceKm: 1.9,
            estimatedDurationMin: 6,
          },
          paymentMethod: 'MPESA',
          paymentStatus: 'AUTHORIZED',
          ridePin: '7391',
          otpVerified: false,
          createdAt: new Date().toISOString(),
        };
        setIncomingOffer(dummyOffer);
        setOfferCountdown(15);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [appMode, isDriverOnline, activeTrip, incomingOffer, currentUser?.id]);

  const requestRide = () => {
    if (!destinationLocation || !fareEstimate || !currentUser) return;

    const ridePin = Math.floor(1000 + Math.random() * 9000).toString();
    const tempTrip: Trip = {
      id: `trip-${Date.now()}`,
      riderId: currentUser.id,
      rider: { name: currentUser.fullName, phone: currentUser.phoneNumber, rating: currentUser.rating },
      recipientRider: bookingForOther.enabled && bookingForOther.name.trim()
        ? { name: bookingForOther.name.trim(), phone: bookingForOther.phone.trim() || '+254700000000', isOther: true }
        : undefined,
      driverId: 'user-driver-kipchoge',
      driver: {
        name: 'Kipchoge Moto',
        phone: '+254712345678',
        rating: 4.92,
        vehiclePlate: 'KMC 123A',
        vehicleModel: 'TVS HLX 150',
        vehicleColor: 'Red',
        vehicleCategory: selectedCategory,
      },
      pickup: userLocation,
      destination: destinationLocation,
      category: selectedCategory,
      status: 'SEARCHING_DRIVER',
      fare: fareEstimate,
      paymentMethod,
      paymentStatus: 'PENDING',
      ridePin,
      otpVerified: false,
      createdAt: new Date().toISOString(),
    };

    setActiveTrip(tempTrip);
    const greeting = bookingForOther.enabled && bookingForOther.name
      ? `Jambo! I see you booked for ${bookingForOther.name}. Heading to pickup location now.`
      : 'Jambo! I am heading to your pickup location now.';

    setChatMessages([
      { id: 'msg-1', sender: 'DRIVER', text: greeting, time: 'Just now' },
    ]);

    setTimeout(() => {
      setActiveTrip((prev) => (prev && prev.status === 'SEARCHING_DRIVER' ? { ...prev, status: 'DRIVER_ASSIGNED' } : prev));
    }, 2500);
  };

  const cancelRide = () => {
    if (activeTrip) {
      const cancelled: Trip = {
        ...activeTrip,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'RIDER',
      };
      setAllTrips((prev) => [cancelled, ...prev]);
      setActiveTrip(null);
      setSimulatedDriverPos(null);
    }
  };

  const rateTrip = (rating: number, feedback?: string, tip: number = 0) => {
    if (activeTrip && currentUser) {
      const completed: Trip = {
        ...activeTrip,
        rating,
        feedback,
        tipAmount: tip,
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        completedAt: new Date().toISOString(),
      };
      if (paymentMethod === 'WALLET') {
        const newBal = Math.max(0, currentUser.walletBalance - completed.fare.totalFare - tip);
        setCurrentUser({ ...currentUser, walletBalance: newBal });
      }
      setAllTrips((prev) => [completed, ...prev]);
      setActiveTrip(null);
      setSimulatedDriverPos(null);
      setDestinationLocation(null);
    }
  };

  const triggerSOS = () => {
    if (!activeTrip) {
      alert('🚨 EMERGENCY SOS: Safety team notified of your GPS coordinates.');
      return;
    }
    const newIncident: SafetyIncident = {
      id: `sos-${Date.now()}`,
      tripId: activeTrip.id,
      reporterId: currentUser?.id || 'rider-unknown',
      reporterRole: 'RIDER',
      type: 'SOS_BUTTON',
      location: simulatedDriverPos || userLocation,
      status: 'OPEN',
      timestamp: new Date().toISOString(),
      notes: 'Emergency Panic button pressed by rider in mobile app.',
    };
    setIncidents((prev) => [newIncident, ...prev]);
    alert('🚨 EMERGENCY SOS ACTIVATED! Safety Response Team and Emergency Contacts notified.');
  };

  const topUpWallet = (amount: number) => {
    if (!currentUser) return;
    const newBal = currentUser.walletBalance + amount;
    const updated = { ...currentUser, walletBalance: newBal };
    setCurrentUser(updated);
    setUsersDb((prev) => ({ ...prev, [currentUser.phoneNumber]: updated }));
    AsyncStorage.setItem('@swiftboda_current_user', JSON.stringify(updated)).catch(() => {});
  };

  const initiateMpesaSTKPush = async (
    phoneNumber: string,
    amount: number,
    accountReference: string = 'SwiftBoda'
  ): Promise<DarajaSTKResponse> => {
    try {
      const response = await darajaService.initiateSTKPush(
        phoneNumber,
        amount,
        accountReference
      );
      if (response.success) {
        // Also credit wallet if user is active
        if (currentUser) {
          const newBal = (currentUser.walletBalance || 0) + amount;
          const updated = { ...currentUser, walletBalance: newBal };
          setCurrentUser(updated);
          setUsersDb((prev) => ({ ...prev, [currentUser.phoneNumber]: updated }));
          AsyncStorage.setItem('@swiftboda_current_user', JSON.stringify(updated)).catch(() => {});
        }
      }
      return response;
    } catch (err: any) {
      const msg = err?.message || 'Failed to initiate M-Pesa STK Push';
      return {
        success: false,
        customerMessage: msg,
        errorMessage: msg,
      };
    }
  };

  const rebookDestination = (dest: GeoLocation) => {
    setDestinationLocation(dest);
    setAppMode('RIDER');
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'RIDER',
      text: text.trim(),
      time: 'Just now',
    };
    setChatMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      let replyText = 'Sawa sawa! On my way, 2 mins away.';
      const lower = text.toLowerCase();
      if (lower.includes('gate') || lower.includes('entrance') || lower.includes('barrier')) {
        replyText = 'Niko hapo kwa gate! Waiting right outside the barrier.';
      } else if (lower.includes('jacket') || lower.includes('wearing') || lower.includes('black') || lower.includes('shirt')) {
        replyText = 'Sawa! Nimekuona, pulling up beside you now.';
      } else if (lower.includes('helmet') || lower.includes('clean')) {
        replyText = 'Ndiyo! Clean sanitized helmet and fresh hairnet ready.';
      } else if (lower.includes('hurry') || lower.includes('rush') || lower.includes('late')) {
        replyText = 'Understood! Maneuvering smoothly through traffic.';
      } else if (lower.includes('where') || lower.includes('location')) {
        replyText = 'Just turning past the roundabout on Kimathi Street now.';
      }

      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'DRIVER',
        text: replyText,
        time: 'Just now',
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const shareLiveTrip = async () => {
    try {
      const driver = activeTrip?.driver?.name || 'Kiprop Chemokil';
      const plate = activeTrip?.driver?.vehiclePlate || 'KMDK 234P';
      const model = activeTrip?.driver?.vehicleModel || 'Bajaj Boxer 150X';
      const dest = activeTrip?.destination?.placeName || activeTrip?.destination?.address || destinationLocation?.placeName || 'Kapenguria Referral Hospital';
      const pickup = activeTrip?.pickup?.address || userLocation.address || 'Makutano Junction Stage';
      const currentCoord = simulatedDriverPos || userLocation;
      const lat = currentCoord.latitude.toFixed(6);
      const lon = currentCoord.longitude.toFixed(6);
      const pin = activeTrip?.ridePin || '7391';
      const tripId = activeTrip?.id || `trip-${Date.now()}`;
      const passenger = bookingForOther.enabled && bookingForOther.name
        ? `${bookingForOther.name} (booked by ${currentUser?.fullName || 'Grace Chemutai'})`
        : (currentUser?.fullName || 'Grace Chemutai');

      const message =
`🏍️ SWIFT BODA LIVE TRIP DETAILS
---------------------------------
Passenger: ${passenger}
Driver: ${driver} (${model} • ${plate})
Pickup: ${pickup}
Destination: ${dest}
Status: Live On Trip
Exact GPS Coordinates: ${lat}, ${lon}
Live Tracking Map: https://swiftboda.co.ke/track/${tripId}
4-Digit Safety PIN: ${pin}
Swift Boda 24/7 Safety Dispatch: +254 700 000 999
---------------------------------
Shared safely from Swift Boda Kenya`;

      await Share.share({
        title: 'Swift Boda Live Ride Status',
        message,
      });
    } catch (err) {
      console.error('Failed to share live location', err);
    }
  };

  // Driver Actions
  const acceptIncomingOffer = () => {
    if (incomingOffer) {
      setActiveTrip({ ...incomingOffer, status: 'DRIVER_ASSIGNED' });
      setIncomingOffer(null);
    }
  };

  const declineIncomingOffer = () => {
    setIncomingOffer(null);
    setOfferCountdown(15);
  };

  const driverArrived = () => {
    if (activeTrip) {
      setActiveTrip({ ...activeTrip, status: 'DRIVER_ARRIVED' });
    }
  };

  const driverStartTrip = (pin: string) => {
    if (activeTrip && activeTrip.ridePin === pin) {
      setActiveTrip({ ...activeTrip, status: 'IN_TRIP', otpVerified: true, startedAt: new Date().toISOString() });
      return true;
    }
    return false;
  };

  const driverCompleteTrip = () => {
    if (activeTrip && currentUser) {
      const completedTrip = { ...activeTrip, status: 'COMPLETED' as TripState, completedAt: new Date().toISOString() };
      const driverCut = activeTrip.fare.totalFare * 0.85;
      const updatedDriver = {
        ...currentUser,
        walletBalance: currentUser.walletBalance + driverCut,
        driverDetails: currentUser.driverDetails
          ? {
              ...currentUser.driverDetails,
              todayEarnings: currentUser.driverDetails.todayEarnings + driverCut,
              weeklyEarnings: currentUser.driverDetails.weeklyEarnings + driverCut,
              tripsCompleted: currentUser.driverDetails.tripsCompleted + 1,
            }
          : undefined,
      };
      setCurrentUser(updatedDriver);
      setAllTrips((prev) => [completedTrip, ...prev]);
      setActiveTrip(null);
    }
  };

  const driverEarnings = currentUser?.driverDetails
    ? {
        today: currentUser.driverDetails.todayEarnings,
        weekly: currentUser.driverDetails.weeklyEarnings,
        tripsCompleted: currentUser.driverDetails.tripsCompleted,
      }
    : { today: 3450.0, weekly: 18200.0, tripsCompleted: 8 };


  const approveDriver = (id: string) => {
    if (currentUser?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Row Level Security: Admin privileges required to approve drivers.');
      return;
    }
    setAdminDrivers((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, status: 'APPROVED' as const } : d));
      const targetDriver = updated.find((d) => d.id === id);
      if (targetDriver) {
        // If current user is this driver, upgrade role to DRIVER immediately
        if (currentUser && (targetDriver.phone === currentUser.phoneNumber || targetDriver.name.toLowerCase() === currentUser.fullName.toLowerCase())) {
          setCurrentUser((curr) => curr ? { ...curr, role: 'DRIVER' } : null);
        }
        setUsersDb((db) => {
          const userKey = Object.keys(db).find((k) => db[k].phoneNumber === targetDriver.phone || db[k].fullName.toLowerCase() === targetDriver.name.toLowerCase());
          if (userKey) {
            return {
              ...db,
              [userKey]: { ...db[userKey], role: 'DRIVER' },
            };
          }
          return db;
        });
      }
      return updated;
    });
  };

  const rejectDriver = (id: string) => {
    if (currentUser?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Row Level Security: Admin privileges required to reject drivers.');
      return;
    }
    setAdminDrivers((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, status: 'REJECTED' as const } : d));
      const targetDriver = updated.find((d) => d.id === id);
      if (targetDriver) {
        if (currentUser && (targetDriver.phone === currentUser.phoneNumber || targetDriver.name.toLowerCase() === currentUser.fullName.toLowerCase())) {
          setCurrentUser((curr) => curr ? { ...curr, role: 'RIDER' } : null);
          setAppMode('RIDER');
        }
        setUsersDb((db) => {
          const userKey = Object.keys(db).find((k) => db[k].phoneNumber === targetDriver.phone || db[k].fullName.toLowerCase() === targetDriver.name.toLowerCase());
          if (userKey) {
            return {
              ...db,
              [userKey]: { ...db[userKey], role: 'RIDER' },
            };
          }
          return db;
        });
      }
      return updated;
    });
  };

  const applyForDriver = (data: {
    vehiclePlate: string;
    vehicleModel: string;
    vehicleCategory?: VehicleCategory;
    nationalId: string;
    dlNumber: string;
    fullName?: string;
    phone?: string;
    email?: string;
    driverSelfieUrl?: string;
    nationalIdFrontUrl?: string;
    nationalIdBackUrl?: string;
    dlExpiry?: string;
    dlClassA2Confirmed?: boolean;
    dlPhotoUrl?: string;
    vehicleYear?: string;
    vehicleColor?: string;
    chassisNumber?: string;
    logbookPhotoUrl?: string;
    insurancePolicy?: string;
    insuranceUnderwriter?: string;
    insuranceExpiry?: string;
    insurancePhotoUrl?: string;
    goodConductNumber?: string;
    goodConductPhotoUrl?: string;
    baseStage?: string;
    saccoName?: string;
    saccoNumber?: string;
  }) => {
    if (!currentUser) return;
    const newApplicant: AdminDriverVerification = {
      id: `drv-ver-${Date.now()}`,
      name: data.fullName || currentUser.fullName,
      phone: data.phone || currentUser.phoneNumber,
      email: data.email || currentUser.email,
      plate: data.vehiclePlate,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear || '2023',
      vehicleColor: data.vehicleColor || 'Red / Black',
      category: data.vehicleCategory || 'BODA_STANDARD',
      chassisNumber: data.chassisNumber || 'MD625BF12N882910',
      nationalId: data.nationalId,
      dlNumber: data.dlNumber,
      dlExpiry: data.dlExpiry || '12/2027',
      dlClassA2Confirmed: data.dlClassA2Confirmed ?? true,
      driverSelfieUrl: data.driverSelfieUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      nationalIdFrontUrl: data.nationalIdFrontUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
      nationalIdBackUrl: data.nationalIdBackUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600',
      dlPhotoUrl: data.dlPhotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
      logbookPhotoUrl: data.logbookPhotoUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600',
      insurancePolicy: data.insurancePolicy || 'POL-WP-882910',
      insuranceUnderwriter: data.insuranceUnderwriter || 'APA Insurance Kenya',
      insuranceExpiry: data.insuranceExpiry || '12/2026',
      insurancePhotoUrl: data.insurancePhotoUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      goodConductNumber: data.goodConductNumber || 'CID-POK-2025-991',
      goodConductPhotoUrl: data.goodConductPhotoUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
      baseStage: data.baseStage || 'Makutano Junction Stage',
      saccoName: data.saccoName || 'Makutano Boda Operators SACCO',
      saccoNumber: data.saccoNumber || 'MB-204',
      logbookVerified: true,
      status: 'PENDING',
      submittedAt: new Date().toLocaleDateString('en-GB'),
    };
    setAdminDrivers((prev) => [newApplicant, ...prev.filter((d) => d.phone !== (data.phone || currentUser.phoneNumber))]);
    setCurrentUser((curr) =>
      curr
        ? {
            ...curr,
            driverDetails: {
              vehiclePlate: data.vehiclePlate,
              vehicleModel: data.vehicleModel,
              vehicleColor: data.vehicleColor || 'Red / Black',
              vehicleCategory: data.vehicleCategory || 'BODA_STANDARD',
              todayEarnings: 0,
              weeklyEarnings: 0,
              tripsCompleted: 0,
            },
          }
        : null
    );
  };

  const verifyRiderKyc = (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    setAdminRiders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'VERIFIED', nationalIdVerified: true, mpesaKycVerified: true } : r))
    );
  };

  const flagRiderRisk = (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    setAdminRiders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'FLAGGED', riskScore: 'HIGH' } : r))
    );
  };

  const auditTransaction = (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    setAdminTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'SETTLED' } : t))
    );
  };

  return (
    <SwiftBodaContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        pendingOtpPhone,
        sendOtp,
        verifyOtpAndLogin,
        quickLoginAs,
        registerUser,
        logout,
        savedPlaces,
        addSavedPlace,
        deleteSavedPlace,
        appMode,
        setAppMode,
        userLocation,
        destinationLocation,
        setDestinationLocation,
        rebookDestination,
        selectedCategory,
        setSelectedCategory,
        paymentMethod,
        setPaymentMethod,
        promoCode,
        setPromoCode,
        walletBalance,
        topUpWallet,
        initiateMpesaSTKPush,
        activeTrip,
        fareEstimate,
        requestRide,
        cancelRide,
        rateTrip,
        triggerSOS,
        incidents,
        chatMessages,
        sendChatMessage,
        shareLiveTrip,
        hasSeenOnboarding,
        completeOnboarding,
        resetOnboarding,
        bookingForOther,
        setBookingForOther,
        nearbyDrivers,
        simulatedDriverPos,
        isDriverOnline,
        setIsDriverOnline,
        driverEarnings,
        incomingOffer,
        offerCountdown,
        acceptIncomingOffer,
        declineIncomingOffer,
        driverArrived,
        driverStartTrip,
        driverCompleteTrip,
        pastTrips,
        driverVerificationStatus,
        applyForDriver,
        // Row Level Security (RLS) - Isolation of Administrative and Driver registries
        adminDrivers: currentUser?.role === 'ADMIN' ? adminDrivers : [],
        approveDriver,
        rejectDriver,
        adminRiders: currentUser?.role === 'ADMIN' ? adminRiders : [],
        verifyRiderKyc,
        flagRiderRisk,
        adminTransactions: currentUser?.role === 'ADMIN' ? adminTransactions : [],
        auditTransaction,
      }}
    >
      {children}
    </SwiftBodaContext.Provider>
  );
};

export const useSwiftBoda = () => {
  const context = useContext(SwiftBodaContext);
  if (!context) throw new Error('useSwiftBoda must be used within SwiftBodaProvider');
  return context;
};
