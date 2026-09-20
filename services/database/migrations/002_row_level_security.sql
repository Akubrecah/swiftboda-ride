-- Swift Boda Enterprise Ride-Hailing Platform
-- PostgreSQL 15 Row-Level Security (RLS) Policies
-- Migration 002: Row Level Security, Multi-Tenant Role Isolation, and Data Masking

-- Enable Row Level Security on core domain tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract current authenticated user ID from session/JWT claims
CREATE OR REPLACE FUNCTION current_auth_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to extract current authenticated role
CREATE OR REPLACE FUNCTION current_auth_role() RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(current_setting('app.current_user_role', TRUE), 'ANONYMOUS');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ANONYMOUS';
END;
$$ LANGUAGE plpgsql STABLE;

--------------------------------------------------------------------------------
-- 1. USERS TABLE POLICIES
--------------------------------------------------------------------------------
-- Admins can view all users
CREATE POLICY users_admin_all_access ON users
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER'));

-- Users can only read and update their own profile
CREATE POLICY users_self_read ON users
    FOR SELECT
    USING (id = current_auth_user_id());

CREATE POLICY users_self_update ON users
    FOR UPDATE
    USING (id = current_auth_user_id())
    WITH CHECK (id = current_auth_user_id());

--------------------------------------------------------------------------------
-- 2. USER WALLETS & TRANSACTIONS POLICIES
--------------------------------------------------------------------------------
-- Wallet balances are strictly confidential to the owner and financial admins
CREATE POLICY wallets_admin_access ON user_wallets
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER'));

CREATE POLICY wallets_owner_read ON user_wallets
    FOR SELECT
    USING (user_id = current_auth_user_id());

-- Wallet Transactions: Strictly scoped to the user's wallet
CREATE POLICY wallet_tx_admin_access ON wallet_transactions
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER'));

CREATE POLICY wallet_tx_owner_read ON wallet_transactions
    FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM user_wallets WHERE user_id = current_auth_user_id()
        )
    );

--------------------------------------------------------------------------------
-- 3. DRIVER & DOCUMENT POLICIES (KYC / NTSA Isolation)
--------------------------------------------------------------------------------
-- Public can view active driver geographic positions for booking (anonymized)
CREATE POLICY drivers_public_location_read ON drivers
    FOR SELECT
    USING (
        status IN ('ONLINE', 'BUSY')
        OR user_id = current_auth_user_id()
        OR current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER')
    );

-- Drivers can update their own real-time status and telemetry
CREATE POLICY drivers_self_update ON drivers
    FOR UPDATE
    USING (user_id = current_auth_user_id())
    WITH CHECK (user_id = current_auth_user_id());

-- Driver Documents (National IDs, Logbooks, DLs): Strictly private
CREATE POLICY driver_docs_admin_all ON driver_documents
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER'));

CREATE POLICY driver_docs_owner_access ON driver_documents
    FOR ALL
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = current_auth_user_id()
        )
    );

--------------------------------------------------------------------------------
-- 4. TRIPS & TELEMETRY POLICIES (Row Level Security per Trip)
--------------------------------------------------------------------------------
-- Admins can view and manage all trips across regions
CREATE POLICY trips_admin_access ON trips
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'));

-- Riders can only see trips where they are the passenger
CREATE POLICY trips_rider_access ON trips
    FOR SELECT
    USING (rider_id = current_auth_user_id());

-- Drivers can only see trips assigned to their driver profile
CREATE POLICY trips_driver_access ON trips
    FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = current_auth_user_id()
        )
    );

-- Riders can create trips for themselves
CREATE POLICY trips_rider_create ON trips
    FOR INSERT
    WITH CHECK (rider_id = current_auth_user_id());

-- Participants can view trip live coordinates
CREATE POLICY trip_locations_participant_read ON trip_locations
    FOR SELECT
    USING (
        current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER')
        OR trip_id IN (
            SELECT id FROM trips 
            WHERE rider_id = current_auth_user_id()
               OR driver_id IN (SELECT id FROM drivers WHERE user_id = current_auth_user_id())
        )
    );

--------------------------------------------------------------------------------
-- 5. PAYMENTS & FINANCIAL AUDIT POLICIES
--------------------------------------------------------------------------------
-- Platform fee breakdown and gross commission: Admins only
CREATE POLICY payments_admin_access ON payments
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER'));

-- Riders can view their payment receipts
CREATE POLICY payments_rider_read ON payments
    FOR SELECT
    USING (rider_id = current_auth_user_id());

-- Drivers can view their payout entries
CREATE POLICY payments_driver_read ON payments
    FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = current_auth_user_id()
        )
    );

--------------------------------------------------------------------------------
-- 6. SAFETY & AUDIT LOG POLICIES
--------------------------------------------------------------------------------
-- Audit logs can NEVER be viewed or tampered with by regular users
CREATE POLICY audit_logs_admin_only ON audit_logs
    FOR SELECT
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER'));

-- Safety incidents: Reporter can view their filed report; Admins handle all
CREATE POLICY safety_admin_access ON safety_incidents
    FOR ALL
    USING (current_auth_role() IN ('ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'));

CREATE POLICY safety_reporter_access ON safety_incidents
    FOR SELECT
    USING (reporter_id = current_auth_user_id());
