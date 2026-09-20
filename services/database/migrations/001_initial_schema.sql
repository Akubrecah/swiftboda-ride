-- Swift Boda Enterprise Ride-Hailing Platform
-- PostgreSQL 15 + PostGIS 3.3 Initial Migration
-- Migration 001: Core Domain Entities, Constraints, and Spatial Indexes

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(30) NOT NULL CHECK (role IN ('RIDER', 'DRIVER', 'ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT')),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'BLOCKED')),
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12,2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(10) DEFAULT 'KES',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
    trip_id UUID,
    amount NUMERIC(12,2) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('TRIP_PAYMENT', 'DRIVER_PAYOUT', 'TOPUP', 'REFUND', 'COMMISSION_DEDUCTION', 'TIP')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DRIVERS & VEHICLES
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'OFFLINE' CHECK (status IN ('OFFLINE', 'ONLINE', 'BUSY', 'EN_ROUTE_PICKUP', 'ON_TRIP')),
    acceptance_rate NUMERIC(5,2) DEFAULT 100.00,
    cancellation_rate NUMERIC(5,2) DEFAULT 0.00,
    total_earnings NUMERIC(12,2) DEFAULT 0.00,
    driver_level VARCHAR(20) DEFAULT 'BRONZE' CHECK (driver_level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
    current_latitude NUMERIC(10,7),
    current_longitude NUMERIC(10,7),
    current_heading NUMERIC(5,2),
    current_speed NUMERIC(5,2),
    current_location GEOGRAPHY(Point, 4326),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    license_plate VARCHAR(30) UNIQUE NOT NULL,
    color VARCHAR(30) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('BODA_STANDARD', 'BODA_COMFORT', 'BODA_XL', 'EXPRESS_DELIVERY')),
    capacity INT DEFAULT 1,
    insurance_valid_until DATE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('DRIVING_LICENSE', 'NATIONAL_ID', 'POLICE_CLEARANCE', 'VEHICLE_INSURANCE', 'LOGBOOK')),
    document_url TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
    rejection_reason TEXT,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRIPS & DISPATCH
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    vehicle_category VARCHAR(30) NOT NULL CHECK (vehicle_category IN ('BODA_STANDARD', 'BODA_COMFORT', 'BODA_XL', 'EXPRESS_DELIVERY')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
    
    pickup_latitude NUMERIC(10,7) NOT NULL,
    pickup_longitude NUMERIC(10,7) NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_place_name VARCHAR(150),
    pickup_location GEOGRAPHY(Point, 4326),

    destination_latitude NUMERIC(10,7) NOT NULL,
    destination_longitude NUMERIC(10,7) NOT NULL,
    destination_address TEXT NOT NULL,
    destination_place_name VARCHAR(150),
    destination_location GEOGRAPHY(Point, 4326),

    base_fare NUMERIC(10,2) NOT NULL,
    distance_fare NUMERIC(10,2) NOT NULL,
    time_fare NUMERIC(10,2) NOT NULL,
    booking_fee NUMERIC(10,2) NOT NULL,
    surge_multiplier NUMERIC(3,2) DEFAULT 1.00,
    surge_amount NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    total_fare NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    
    estimated_distance_km NUMERIC(8,2) NOT NULL,
    estimated_duration_min NUMERIC(8,2) NOT NULL,
    actual_distance_km NUMERIC(8,2),
    actual_duration_min NUMERIC(8,2),

    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('WALLET', 'MPESA', 'CARD', 'CASH', 'CORPORATE')),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'REFUNDED')),
    
    ride_pin VARCHAR(4) NOT NULL,
    otp_verified BOOLEAN DEFAULT FALSE,
    
    cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('RIDER', 'DRIVER', 'SYSTEM', 'ADMIN')),
    cancellation_reason TEXT,
    
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    tip_amount NUMERIC(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    matched_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS trip_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    actor_id UUID,
    actor_role VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    speed NUMERIC(5,2),
    heading NUMERIC(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id),
    rider_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    amount NUMERIC(10,2) NOT NULL,
    platform_fee NUMERIC(10,2) NOT NULL,
    driver_payout NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'REFUNDED')),
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    provider_reference VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SAFETY & AUDIT
CREATE TABLE IF NOT EXISTS safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reporter_role VARCHAR(30) NOT NULL,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('SOS_BUTTON', 'ROUTE_DEVIATION', 'SPEED_VIOLATION', 'ACCIDENT', 'HARASSMENT', 'OTHER')),
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    actor_role VARCHAR(30),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SPATIAL INDEXES (GIST)
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX IF NOT EXISTS idx_trips_pickup ON trips USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips USING GIST (destination_location);

-- B-TREE INDEXES FOR FREQUENT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers (status);
CREATE INDEX IF NOT EXISTS idx_trips_rider ON trips (rider_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips (driver_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_trip ON payments (trip_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions (wallet_id);
