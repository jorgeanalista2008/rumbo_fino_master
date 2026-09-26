-- =============================================================================
-- RUMBO FINO - DATABASE SCHEMA INITIALIZATION (PostgreSQL 15+)
-- Compatible with standard PostgreSQL & PostGIS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Try creating postgis if installed on local PostgreSQL
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not installed on local PostgreSQL server; using standard lat/lng numeric columns.';
END $$;

-- -----------------------------------------------------------------------------
-- ENUMS DEFINITION
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'DISPATCHER', 'DRIVER', 'PASSENGER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_category_enum AS ENUM ('EXECUTIVE_SEDAN', 'VIP_SUV', 'PREMIUM_VAN', 'LUXURY_ARMORED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status_enum AS ENUM ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'DECOMMISSIONED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE document_type_enum AS ENUM ('DRIVER_LICENSE', 'CRIMINAL_RECORD', 'IDENTITY_CARD', 'VEHICLE_TITLE', 'SOAT_INSURANCE', 'TECHNICAL_INSPECTION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE document_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE shift_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'FORCED_CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ride_status_enum AS ENUM ('SOLICITADO', 'ASIGNADO', 'EN_CAMINO', 'ABORDAJE', 'EN_CURSO', 'FINALIZADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('CREDIT_CARD', 'CORPORATE_VOUCHER', 'CASH', 'WALLET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM ('RIDE_FARE', 'PLATFORM_COMMISSION', 'DRIVER_PAYOUT', 'CANCELLATION_FEE', 'BONUS_ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'PASSENGER',
    status user_status_enum NOT NULL DEFAULT 'ACTIVE',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 2. VEHICLES TABLE (Con Ficha Técnica Completa y Amenities Executivos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(30) NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(50) UNIQUE NOT NULL,
    seats INT NOT NULL DEFAULT 4,
    category vehicle_category_enum NOT NULL DEFAULT 'EXECUTIVE_SEDAN',
    status vehicle_status_enum NOT NULL DEFAULT 'AVAILABLE',
    transmission VARCHAR(50) DEFAULT 'Automática 9G-Tronic',
    fuel_type VARCHAR(50) DEFAULT 'Gasolina Premium / Híbrido',
    luggage_capacity VARCHAR(100) DEFAULT '3 Maletas Grandes + 2 de Mano',
    amenities JSONB DEFAULT '["Wi-Fi 5G", "Asientos Cuero Nappa", "Climatizador Tri-Zona", "Cargadores USB-C / 110V", "Agua Evian Incluida"]'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_category ON vehicles(status, category);

-- -----------------------------------------------------------------------------
-- 3. VEHICLE DOCUMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    issue_date DATE,
    expiration_date DATE NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle ON vehicle_documents(vehicle_id);

-- -----------------------------------------------------------------------------
-- 4. DRIVERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(20) NOT NULL,
    license_expiration DATE NOT NULL,
    rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_rides INT NOT NULL DEFAULT 0,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    current_latitude NUMERIC(10, 7),
    current_longitude NUMERIC(10, 7),
    current_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON drivers(is_online) WHERE is_online IS TRUE;
CREATE INDEX IF NOT EXISTS idx_drivers_lat_lng ON drivers(current_latitude, current_longitude);

-- -----------------------------------------------------------------------------
-- 5. DRIVER DOCUMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    issue_date DATE,
    expiration_date DATE NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_docs_driver ON driver_documents(driver_id);

-- -----------------------------------------------------------------------------
-- 6. DRIVER VEHICLE ASSIGNMENTS (SHIFTS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    initial_odometer INT NOT NULL,
    final_odometer INT,
    shift_status shift_status_enum NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_driver ON driver_vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ON driver_vehicle_assignments(vehicle_id);

-- -----------------------------------------------------------------------------
-- 7. RIDES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    status ride_status_enum NOT NULL DEFAULT 'SOLICITADO',
    category_requested vehicle_category_enum NOT NULL,
    origin_address TEXT NOT NULL,
    origin_latitude NUMERIC(10, 7) NOT NULL,
    origin_longitude NUMERIC(10, 7) NOT NULL,
    destination_address TEXT NOT NULL,
    destination_latitude NUMERIC(10, 7) NOT NULL,
    destination_longitude NUMERIC(10, 7) NOT NULL,
    distance_km NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    estimated_duration_min INT NOT NULL DEFAULT 0,
    base_fare NUMERIC(10, 2) NOT NULL,
    distance_fare NUMERIC(10, 2) NOT NULL,
    time_fare NUMERIC(10, 2) NOT NULL,
    surge_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    total_fare NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    driver_net_earnings NUMERIC(10, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. RIDE LOCATIONS (TELEMETRY LOGS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ride_locations (
    id BIGSERIAL PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0.00,
    heading NUMERIC(5, 2) DEFAULT 0.00,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ride_loc_ride_time ON ride_locations(ride_id, timestamp DESC);

-- -----------------------------------------------------------------------------
-- 9. TRANSACTIONS & BALANCES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    pending_payout NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_commission_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_settlement_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
    driver_id UUID REFERENCES drivers(id),
    passenger_id UUID REFERENCES users(id),
    type transaction_type_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status transaction_status_enum NOT NULL DEFAULT 'COMPLETED',
    reference_code VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tx_driver ON transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_tx_ride ON transactions(ride_id);

-- -----------------------------------------------------------------------------
-- 10. REVIEWS & RATINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID UNIQUE NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    target_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    comfort_rating INT CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_id);
