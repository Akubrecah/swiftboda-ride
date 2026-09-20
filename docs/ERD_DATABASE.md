# Database Schema & Entity Relationship Diagram (ERD)
## Swift Boda - PostgreSQL + PostGIS Schema

```sql
-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('RIDER', 'DRIVER', 'ADMIN', 'DISPATCHER', 'FLEET_OWNER')),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    rating NUMERIC(3,2) DEFAULT 5.00,
    wallet_balance NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DRIVER PROFILES & VEHICLES TABLE
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_make VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    vehicle_year INT NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_color VARCHAR(30) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('BODA_STANDARD', 'BODA_COMFORT', 'BODA_XL', 'EXPRESS_DELIVERY')),
    is_verified BOOLEAN DEFAULT FALSE,
    acceptance_rate NUMERIC(5,2) DEFAULT 100.00,
    current_location GEOGRAPHY(Point, 4326),
    status VARCHAR(20) DEFAULT 'OFFLINE'
);

-- 3. TRIPS TABLE
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_location GEOGRAPHY(Point, 4326) NOT NULL,
    destination_address TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP', 'COMPLETED', 'CANCELLED')),
    base_fare NUMERIC(10,2) NOT NULL,
    distance_fare NUMERIC(10,2) NOT NULL,
    time_fare NUMERIC(10,2) NOT NULL,
    surge_multiplier NUMERIC(3,2) DEFAULT 1.00,
    total_fare NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    ride_pin VARCHAR(4) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Spatial Indexes for ultra-fast PostGIS distance calculations
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX idx_trips_pickup ON trips USING GIST (pickup_location);
```
