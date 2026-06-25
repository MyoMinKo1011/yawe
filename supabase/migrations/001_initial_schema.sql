-- haversine
CREATE OR REPLACE FUNCTION haversine(
    lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
    SELECT 6371 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) *
        cos(radians(lng2) - radians(lng1)) +
        sin(radians(lat1)) * sin(radians(lat2))
    );
$$ LANGUAGE SQL IMMUTABLE;

-- category tables
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), cuisine_type TEXT,
    price_range TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    opening_hours TEXT, has_delivery BOOLEAN DEFAULT false, has_vegetarian BOOLEAN DEFAULT false,
    has_alcohol BOOLEAN DEFAULT false, seating_capacity INTEGER, specialities JSONB DEFAULT '[]',
    menu JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), star_rating SMALLINT CHECK (star_rating BETWEEN 1 AND 5),
    price_range TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')), room_types JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]', check_in_time TEXT, check_out_time TEXT, total_rooms INTEGER,
    booking_url TEXT, packages JSONB DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pagodas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, history TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), built_century INTEGER, architecture_style TEXT,
    relics TEXT, festival_dates TEXT, dress_code TEXT, entry_fee TEXT, opening_hours TEXT,
    monks_residing INTEGER, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE archaeological_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, history TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), unesco_status BOOLEAN DEFAULT false,
    historical_period TEXT, excavation_status TEXT, guided_tours BOOLEAN DEFAULT false,
    entry_fee TEXT, opening_hours TEXT, site_area_hectares REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE monuments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), built_year INTEGER, dedicated_to TEXT,
    material TEXT, height_meters REAL, is_accessible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, history TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), sub_category TEXT NOT NULL,
    entry_fee TEXT, opening_hours TEXT, best_visit_time TEXT, family_friendly BOOLEAN DEFAULT true,
    parking_available BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ktvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), room_count INTEGER, price_per_hour TEXT,
    opening_hours TEXT, has_food_menu BOOLEAN DEFAULT false, has_alcohol BOOLEAN DEFAULT false,
    private_rooms BOOLEAN DEFAULT true, sound_quality TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transportation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5),
    transport_type TEXT NOT NULL CHECK (transport_type IN ('bus_station','train_station','motorcycle_taxi_stand','tuk_tuk')),
    routes JSONB DEFAULT '[]', schedule TEXT, fare_range TEXT, operator TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE convenience_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), chain TEXT, is_24hr BOOLEAN DEFAULT false,
    opening_hours TEXT, services JSONB DEFAULT '[]', has_parking BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), is_24hr BOOLEAN DEFAULT false,
    opening_hours TEXT, has_prescription BOOLEAN DEFAULT true, has_delivery BOOLEAN DEFAULT false,
    accepts_insurance BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5),
    market_type TEXT NOT NULL CHECK (market_type IN ('night_market','supermarket','shopping_mall','street_market','central_market')),
    operating_days TEXT, opening_hours TEXT, stall_count INTEGER, has_parking BOOLEAN DEFAULT false,
    popular_for TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5),
    institution_type TEXT NOT NULL CHECK (institution_type IN ('university','college','high_school','primary_school','language_center','monastery_school','vocational_school')),
    programs JSONB DEFAULT '[]', student_count INTEGER, established_year INTEGER, is_private BOOLEAN DEFAULT false,
    website TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5),
    hospital_type TEXT NOT NULL CHECK (hospital_type IN ('general_hospital','clinic','traditional_medicine')),
    has_emergency BOOLEAN DEFAULT false, is_24hr BOOLEAN DEFAULT false, bed_count INTEGER,
    departments JSONB DEFAULT '[]', opening_hours TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE banks_atms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), bank_name TEXT, has_atm BOOLEAN DEFAULT false,
    has_currency_exchange BOOLEAN DEFAULT false, is_24hr_atm BOOLEAN DEFAULT false, opening_hours TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE police_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), station_type TEXT CHECK (station_type IN ('township','district')),
    is_24hr BOOLEAN DEFAULT false, emergency_phone TEXT, jurisdiction TEXT, services JSONB DEFAULT '[]',
    opening_hours TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gas_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), chain TEXT, fuel_types JSONB DEFAULT '[]',
    is_24hr BOOLEAN DEFAULT false, opening_hours TEXT, has_shop BOOLEAN DEFAULT false,
    has_restroom BOOLEAN DEFAULT false, has_air_pump BOOLEAN DEFAULT false, payment_methods JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE post_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), postal_code TEXT, services JSONB DEFAULT '[]',
    opening_hours TEXT, has_po_box BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), park_type TEXT CHECK (park_type IN ('public_garden')),
    area_hectares REAL, amenities JSONB DEFAULT '[]', opening_hours TEXT, entry_fee TEXT,
    pet_allowed BOOLEAN DEFAULT true, is_gated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gyms_fitness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), equipment JSONB DEFAULT '[]',
    has_trainer BOOLEAN DEFAULT false, has_shower BOOLEAN DEFAULT false, has_lockers BOOLEAN DEFAULT false,
    has_air_con BOOLEAN DEFAULT false, monthly_fee TEXT, day_pass_fee TEXT, opening_hours TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coffee_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), has_wifi BOOLEAN DEFAULT false, has_ac BOOLEAN DEFAULT false,
    has_outdoor BOOLEAN DEFAULT false, has_food BOOLEAN DEFAULT false, seating_capacity INTEGER,
    opening_hours TEXT, price_range TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    popular_drinks JSONB DEFAULT '[]', menu JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bakeries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5), specialities JSONB DEFAULT '[]',
    has_seating BOOLEAN DEFAULT false, has_delivery BOOLEAN DEFAULT false, accepts_orders BOOLEAN DEFAULT false,
    opening_hours TEXT, price_range TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    menu JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    address TEXT, contact TEXT, description TEXT, images JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
    rating REAL CHECK (rating BETWEEN 1 AND 5),
    salon_type TEXT CHECK (salon_type IN ('hair_salon','barber_shop','nail_spa','massage','facial_skincare','traditional_massage','unisex')),
    services JSONB DEFAULT '[]', has_appointment BOOLEAN DEFAULT false,
    price_range TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')), opening_hours TEXT, staff_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT, avatar_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', 'Explorer'), COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    place_type TEXT NOT NULL, place_id UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, place_type, place_id)
);

CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    query TEXT, lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, description TEXT, start_lat DOUBLE PRECISION NOT NULL, start_lng DOUBLE PRECISION NOT NULL,
    route_geometry JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tour_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    place_type TEXT NOT NULL, place_id UUID NOT NULL, stop_order SMALLINT NOT NULL,
    estimated_duration_min INTEGER, tips TEXT, travel_distance_m REAL, travel_duration_sec INTEGER,
    travel_summary TEXT, travel_steps JSONB DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content TEXT NOT NULL, metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
