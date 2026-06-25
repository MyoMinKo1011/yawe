# localtour — Detailed Project Plan

---

## 1. Project Overview

**What**: A **chat-first** Next.js web app for Pyay tourism. The landing page is a chat interface. Users ask natural-language questions (e.g. "Find me Burmese curry under $$"). DeepSeek AI interprets intent, queries the verified Supabase database, and returns a response that includes **dynamic UI components** — maps, place cards, tours, comparisons — rendered inline in the conversation.

**UX Model**: **AI is the UX designer**. Every AI response includes a `ui_components[]` array specifying what to render and how. The client is a runtime (`DynamicRenderer`) that maps component types to React components. There is no fixed page layout — the UI morphs per AI response.

**Architecture Principle**: **Database-First, AI-Enhancer**. 22 category-specific tables (restaurants, hotels, pagodas, parks, etc.) are the single source of truth. DeepSeek NEVER invents places — it only interprets, filters, ranks, describes, and selects `ui_components` using exclusively the places from the database.

**Auth Model**: Full auth wall — every page and API route requires a Supabase session. Users can sign in via **Google OAuth** (primary) or email/password (fallback). Unauthenticated users are redirected to `/auth/login`.

---

## 2. Tech Stack (All Confirmed)

| Layer         | Technology               | Package                                              |
| ------------- | ------------------------ | ---------------------------------------------------- |
| Framework     | Next.js 14+ (App Router) | `next`                                               |
| Language      | TypeScript               | —                                                    |
| Styling       | Tailwind CSS             | `tailwindcss`                                        |
| UI Primitives | shadcn/ui                | `lucide-react`, `class-variance-authority`           |
| Map           | Leaflet                  | `react-leaflet`, `leaflet`                           |
| Routing       | Mapbox Directions        | HTTP fetch to `api.mapbox.com` (100k free req/month) |
| AI            | DeepSeek API             | `openai` SDK (compatible)                            |
| Database      | Supabase (PostgreSQL)    | `@supabase/supabase-js`, `@supabase/ssr`             |
| Auth          | Supabase Auth (Google OAuth) | `@supabase/ssr` |
| Validation    | Zod                      | `zod`                                                |
| Toasts        | Sonner                   | `sonner`                                             |
| Deployment    | Vercel                   | —                                                    |

---

## 3. Project File Tree

```
localtour/
├── .env.local                          # NEXT_PUBLIC_SUPABASE_URL, SUPABASE_* keys, DEEPSEEK_API_KEY
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client (public env vars)
│   │   ├── server.ts                   # Server client (service role, cookies)
│   │   └── middleware.ts               # Session refresh helper
│   ├── deepseek.ts                     # DeepSeek API client + all prompt builders (chat, curate, tour)
│   ├── chat.ts                         # Chat prompt builder: teaches AI about ui_components
│   ├── component-registry.ts           # Maps ui_component.type string → React component
│   ├── routing.ts                       # Mapbox Directions API: GeoJSON polyline + turn-by-turn legs
│   ├── location.ts                     # Geolocation hook + geocoding utils
│   ├── types.ts                        # Shared TypeScript types (includes UIComponent types)
│   └── utils.ts                        # cn(), formatDistance, etc.
│
├── app/
│   ├── layout.tsx                      # Root layout: <html>, <body>, providers
│   ├── page.tsx                        # Landing page = chat-first welcome screen + ChatInput
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx                # Email + password login form
│   │   ├── signup/
│   │   │   └── page.tsx                # Email + password signup form
│   │   ├── callback/
│   │   │   └── route.ts                # Supabase OAuth/email callback handler
│   │   └── confirm/
│   │       └── route.ts                # Email confirmation route
│   │
│   ├── explore/
│   │   └── page.tsx                    # Fallback: standalone map + cards (accessed from chat action)
│   │
│   ├── tour/
│   │   ├── [id]/
│   │   │   └── page.tsx                # View a saved tour itinerary
│   │   └── new/
│   │       └── page.tsx                # Generate new tour from selected places
│   │
│   ├── favorites/
│   │   └── page.tsx                    # User's saved places
│   │
│   └── api/
│       ├── chat/
│       │   ├── route.ts                # POST { message, lat, lng, session_id? } → DeepSeek → { reply, ui_components[], places }
│       │   └── sessions/
│       │       ├── route.ts            # GET list user's chat sessions
│       │       └── [id]/
│       │           └── route.ts        # GET full history | DELETE session
│       ├── recommend/
│       │   └── route.ts                # POST { lat, lng, types?, radius? } → DB query (used by chat backend)
│       ├── tour/
│       │   ├── route.ts                # GET user's tours | POST save new tour
│       │   └── [id]/
│       │       └── route.ts            # GET tour detail | DELETE tour
│       ├── tour/generate/
│       │   └── route.ts                # POST { lat, lng, place_ids[] } → fetch DB places → DeepSeek plans itinerary
│       ├── favorites/
│       │   ├── route.ts                # GET favorites (joined with places) | POST add favorite { place_id }
│       │   └── [id]/
│       │       └── route.ts            # DELETE favorite
│       └── history/
│           └── route.ts                # GET search history
│
├── components/
│   ├── providers/
│   │   └── SupabaseProvider.tsx        # Supabase context + session listener
│   ├── layout/
│   │   ├── Navbar.tsx                  # Logo, nav links (Favorites, My Tours), avatar + dropdown
│   │   └── MobileNav.tsx               # Mobile hamburger menu
│   ├── auth/
│   │   ├── LoginForm.tsx               # Google OAuth button + email/password login
│   │   ├── SignupForm.tsx              # Email/password signup
│   │   ├── GoogleSignInButton.tsx      # "Sign in with Google" — Supabase OAuth (primary auth method)
│   │   └── AuthGuard.tsx               # Client-side auth check wrapper
│   ├── chat/
│   │   ├── ChatView.tsx                # Full-page chat wrapper (messages list + input)
│   │   ├── ChatMessage.tsx             # Message bubble: user text (right) or assistant bubble with DynamicRenderer
│   │   ├── ChatInput.tsx               # Text input + send button, autosize, loading state, location permission button
│   │   ├── ChatSessionList.tsx         # Sidebar list of past chat sessions (date, title, preview)
│   │   ├── DynamicRenderer.tsx         # Central runtime: reads ui_components[] → renders blocks in order
│   │   └── blocks/
│   │       ├── TextBlock.tsx           # Markdown-rendered text (always present as first component)
│   │       ├── MapBlock.tsx            # Inline interactive Leaflet map with markers
│   │       ├── PlaceCardsBlock.tsx      # Horizontal scroll / grid of PlaceCards
│   │       ├── PlaceDetailBlock.tsx     # Full expanded card: description, history, hours, images
│   │       ├── TourTimelineBlock.tsx    # Vertical timeline of tour stops (inline in chat)
│   │       ├── ImageGalleryBlock.tsx    # Image carousel / grid
│   │       ├── ComparisonBlock.tsx      # Side-by-side table comparing 2-3 places
│   │       └── QuickActionsBlock.tsx    # Button row: "Save All", "Plan Tour", "Show on Map", "More Like This"
│   ├── explore/
│   │   ├── MapView.tsx                 # Leaflet map with markers + popups
│   │   ├── PlaceCard.tsx               # Recommendation card (shared by chat blocks + explore page)
│   │   ├── PlaceCardSkeleton.tsx       # Loading skeleton
│   │   ├── CategoryTabs.tsx            # All | Attractions | Restaurants | Hotels
│   │   └── SaveButton.tsx              # Heart icon → toggle favorite
│   ├── tour/
│   │   ├── TourTimeline.tsx            # Vertical timeline of stops (full page version)
│   │   ├── TourMap.tsx                 # Map with route polyline + numbered markers
│   │   ├── TourActions.tsx             # Save / share / re-generate buttons
│   │   └── TourCard.tsx                # Card in the tours list
│   ├── favorites/
│   │   └── FavoriteCard.tsx            # Compact card with unsave button
│   └── ui/                             # shadcn/ui primitives (button, input, card, tabs, etc.)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       ├── skeleton.tsx
│       ├── avatar.tsx
│       ├── dropdown-menu.tsx
│       ├── separator.tsx
│       └── badge.tsx
│
├── hooks/
│   ├── useGeolocation.ts               # Wraps navigator.geolocation.getCurrentPosition
│   ├── useChat.ts                      # Chat session + messages + ui_components parsing + actions
│   ├── useFavorites.ts                 # CRUD favorites via API routes
│   ├── useTours.ts                     # CRUD tours via API routes
│   └── useDebounce.ts                  # Debounce hook for search input
│
├── middleware.ts                        # Supabase session check → redirect /auth/login
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql       # All table DDL + RLS policies
│   └── seed.sql                         # Pyay places seed data (attractions, restaurants, hotels)
│
└── public/
    ├── logo.svg
    └── map-marker.svg
```

---

## 4. Supabase Database Schema

### Design Principle: Category-Specific Tables

Instead of one generic `places` table with sparse nullable columns, each category gets its own table with only relevant columns. **22 tables total**.

**Tradeoffs**:

- `favorites` and `tour_stops` use polymorphic references (`place_type` + `place_id`)
- `nearby_places_all()` uses UNION ALL across all 22 tables
- Perf is fine at Pyay scale (< 500 total rows across all tables)

### Shared Columns (every category table)

```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL
lat             DOUBLE PRECISION NOT NULL
lng             DOUBLE PRECISION NOT NULL
address         TEXT
contact         TEXT
description     TEXT
images          JSONB DEFAULT '[]'
tags            JSONB DEFAULT '[]'
rating          REAL CHECK (rating BETWEEN 1 AND 5)
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

### Category Tables (22 total)

```sql
-- ============================================================
-- 1. RESTAURANTS
-- ============================================================
CREATE TABLE restaurants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    cuisine_type    TEXT,
    price_range     TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    opening_hours   TEXT,
    has_delivery    BOOLEAN DEFAULT false,
    has_vegetarian  BOOLEAN DEFAULT false,
    has_alcohol     BOOLEAN DEFAULT false,
    seating_capacity INTEGER,
    specialities    JSONB DEFAULT '[]',
    menu            JSONB DEFAULT '{}',              -- structured menu: { sections: [{ name, items: [{ name, price, description, image, spicy_level }] }] }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. HOTELS
-- ============================================================
CREATE TABLE hotels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    star_rating     SMALLINT CHECK (star_rating BETWEEN 1 AND 5),
    price_range     TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    room_types      JSONB DEFAULT '[]',
    amenities       JSONB DEFAULT '[]',
    check_in_time   TEXT,
    check_out_time  TEXT,
    total_rooms     INTEGER,
    booking_url     TEXT,
    packages        JSONB DEFAULT '[]',              -- hotel packages: [{ name, price, includes[], description }]
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. PAGODAS (Buddhist Temples)
-- ============================================================
CREATE TABLE pagodas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    history         TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    built_century   INTEGER,
    architecture_style TEXT,
    relics          TEXT,
    festival_dates  TEXT,
    dress_code      TEXT,
    entry_fee       TEXT,
    opening_hours   TEXT,
    monks_residing  INTEGER,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. ARCHAEOLOGICAL SITES
-- ============================================================
CREATE TABLE archaeological_sites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    history         TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    unesco_status   BOOLEAN DEFAULT false,
    historical_period TEXT,
    excavation_status TEXT,
    guided_tours    BOOLEAN DEFAULT false,
    entry_fee       TEXT,
    opening_hours   TEXT,
    site_area_hectares REAL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. MONUMENTS (Statues, Memorials, Clock Towers)
-- ============================================================
CREATE TABLE monuments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    built_year      INTEGER,
    dedicated_to    TEXT,
    material        TEXT,
    height_meters   REAL,
    is_accessible   BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ATTRACTIONS (Museums, Caves, Waterfalls, Viewpoints, Zoos, Bridges, Gardens)
-- ============================================================
CREATE TABLE attractions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    history         TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    sub_category    TEXT NOT NULL,
    entry_fee       TEXT,
    opening_hours   TEXT,
    best_visit_time TEXT,
    family_friendly BOOLEAN DEFAULT true,
    parking_available BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. KTVs (Karaoke)
-- ============================================================
CREATE TABLE ktvs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    room_count      INTEGER,
    price_per_hour  TEXT,
    opening_hours   TEXT,
    has_food_menu   BOOLEAN DEFAULT false,
    has_alcohol     BOOLEAN DEFAULT false,
    private_rooms   BOOLEAN DEFAULT true,
    sound_quality   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. TRANSPORTATION
-- ============================================================
CREATE TABLE transportation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    transport_type  TEXT NOT NULL CHECK (transport_type IN ('bus_station','train_station','motorcycle_taxi_stand', 'tuk_tuk')),
    routes          JSONB DEFAULT '[]',
    schedule        TEXT,
    fare_range      TEXT,
    operator        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. CONVENIENCE STORES
-- ============================================================
CREATE TABLE convenience_stores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    chain           TEXT,
    is_24hr         BOOLEAN DEFAULT false,
    opening_hours   TEXT,
    services        JSONB DEFAULT '[]',
    has_parking     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. PHARMACIES
-- ============================================================
CREATE TABLE pharmacies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    is_24hr         BOOLEAN DEFAULT false,
    opening_hours   TEXT,
    has_prescription BOOLEAN DEFAULT true,
    has_delivery    BOOLEAN DEFAULT false,
    accepts_insurance BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. MARKETS
-- ============================================================
CREATE TABLE markets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    market_type     TEXT NOT NULL CHECK (market_type IN ('night_market','supermarket','shopping_mall','street_market', 'central_market')),
    operating_days  TEXT,
    opening_hours   TEXT,
    stall_count     INTEGER,
    has_parking     BOOLEAN DEFAULT false,
    popular_for     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. SCHOOLS (Universities, Colleges, Schools)
-- ============================================================
CREATE TABLE schools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    institution_type TEXT NOT NULL CHECK (institution_type IN ('university','college','high_school','primary_school','language_center','monastery_school','vocational_school')),
    programs        JSONB DEFAULT '[]',
    student_count   INTEGER,
    established_year INTEGER,
    is_private      BOOLEAN DEFAULT false,
    website         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. HOSPITALS & CLINICS
-- ============================================================
CREATE TABLE hospitals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    hospital_type   TEXT NOT NULL CHECK (hospital_type IN ('general_hospital','clinic', 'traditional_medicine')),
    has_emergency   BOOLEAN DEFAULT false,
    is_24hr         BOOLEAN DEFAULT false,
    bed_count       INTEGER,
    departments     JSONB DEFAULT '[]',
    opening_hours   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. BANKS & ATMs
-- ============================================================
CREATE TABLE banks_atms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    bank_name       TEXT,
    has_atm         BOOLEAN DEFAULT false,
    has_currency_exchange BOOLEAN DEFAULT false,
    is_24hr_atm     BOOLEAN DEFAULT false,
    opening_hours   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. POLICE STATIONS
-- ============================================================
CREATE TABLE police_stations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    station_type    TEXT CHECK (station_type IN ('township','district')),
    is_24hr         BOOLEAN DEFAULT false,
    emergency_phone TEXT,
    jurisdiction    TEXT,
    services        JSONB DEFAULT '[]',
    opening_hours   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 16. GAS STATIONS
-- ============================================================
CREATE TABLE gas_stations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    chain           TEXT,
    fuel_types      JSONB DEFAULT '[]',
    is_24hr         BOOLEAN DEFAULT false,
    opening_hours   TEXT,
    has_shop        BOOLEAN DEFAULT false,
    has_restroom    BOOLEAN DEFAULT false,
    has_air_pump    BOOLEAN DEFAULT false,
    payment_methods JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 17. POST OFFICES
-- ============================================================
CREATE TABLE post_offices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    postal_code     TEXT,
    services        JSONB DEFAULT '[]',
    opening_hours   TEXT,
    has_po_box      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 18. PARKS
-- ============================================================
CREATE TABLE parks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    park_type       TEXT CHECK (park_type IN ('public_garden')),
    area_hectares   REAL,
    amenities       JSONB DEFAULT '[]',
    opening_hours   TEXT,
    entry_fee       TEXT,
    pet_allowed     BOOLEAN DEFAULT true,
    is_gated        BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 19. GYMS & FITNESS
-- ============================================================
CREATE TABLE gyms_fitness (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    equipment       JSONB DEFAULT '[]',
    has_trainer     BOOLEAN DEFAULT false,
    has_shower      BOOLEAN DEFAULT false,
    has_lockers     BOOLEAN DEFAULT false,
    has_air_con     BOOLEAN DEFAULT false,
    monthly_fee     TEXT,
    day_pass_fee    TEXT,
    opening_hours   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. COFFEE SHOPS
-- ============================================================
CREATE TABLE coffee_shops (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),

    has_wifi        BOOLEAN DEFAULT false,
    has_ac          BOOLEAN DEFAULT false,
    has_outdoor     BOOLEAN DEFAULT false,
    has_food        BOOLEAN DEFAULT false,
    seating_capacity INTEGER,
    opening_hours   TEXT,
    price_range     TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    popular_drinks  JSONB DEFAULT '[]',
    menu            JSONB DEFAULT '{}',              -- drinks/food menu: { sections: [{ name, items: [{ name, price }] }] }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 21. BAKERIES
-- ============================================================
CREATE TABLE bakeries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),

    specialities    JSONB DEFAULT '[]',
    has_seating     BOOLEAN DEFAULT false,
    has_delivery    BOOLEAN DEFAULT false,
    accepts_orders  BOOLEAN DEFAULT false,
    opening_hours   TEXT,
    price_range     TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    menu            JSONB DEFAULT '{}',              -- bakery menu: { sections: [{ name, items: [{ name, price }] }] }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 22. SALONS
-- ============================================================
CREATE TABLE salons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    address         TEXT,
    contact         TEXT,
    description     TEXT,
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    rating          REAL CHECK (rating BETWEEN 1 AND 5),
    salon_type      TEXT CHECK (salon_type IN ('hair_salon','barber_shop','nail_spa','massage','facial_skincare','traditional_massage','unisex')),
    services        JSONB DEFAULT '[]',
    has_appointment BOOLEAN DEFAULT false,
    price_range     TEXT CHECK (price_range IN ('$','$$','$$$','$$$$')),
    opening_hours   TEXT,
    staff_count     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### User Tables

```sql
-- Profiles: extends auth.users with display info
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',       -- Google OAuth
            NEW.raw_user_meta_data->>'display_name',    -- email signup
            'Explorer'
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',       -- Google OAuth
            NULL
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Favorites: polymorphic reference (place_type + place_id)
CREATE TABLE favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    place_type  TEXT NOT NULL,
    place_id    UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, place_type, place_id)
);

-- Search history
CREATE TABLE search_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    query       TEXT,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tours
CREATE TABLE tours (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    start_lat   DOUBLE PRECISION NOT NULL,
    start_lng   DOUBLE PRECISION NOT NULL,
    route_geometry JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tour stops: polymorphic reference + routing data
CREATE TABLE tour_stops (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id                 UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    place_type              TEXT NOT NULL,
    place_id                UUID NOT NULL,
    stop_order              SMALLINT NOT NULL,
    estimated_duration_min  INTEGER,
    tips                    TEXT,
    travel_distance_m       REAL,
    travel_duration_sec     INTEGER,
    travel_summary          TEXT,
    travel_steps            JSONB DEFAULT '[]',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat
CREATE TABLE chat_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title       TEXT,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Haversine + UNION ALL Proximity Query

```sql
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

CREATE OR REPLACE FUNCTION nearby_places_all(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_km  DOUBLE PRECISION DEFAULT 10,
    place_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    place_type  TEXT,
    place_id    UUID,
    name        TEXT,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    address     TEXT,
    contact     TEXT,
    description TEXT,
    images      JSONB,
    tags        JSONB,
    rating      REAL,
    data        JSONB,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY

    SELECT 'restaurants'::TEXT, r.id, r.name, r.lat, r.lng, r.address, r.contact,
           r.description, r.images, r.tags, r.rating, to_jsonb(r.*),
           haversine(center_lat, center_lng, r.lat, r.lng)
    FROM restaurants r
    WHERE (place_types IS NULL OR 'restaurants' = ANY(place_types))
      AND haversine(center_lat, center_lng, r.lat, r.lng) <= radius_km

    UNION ALL
    SELECT 'hotels', h.id, h.name, h.lat, h.lng, h.address, h.contact,
           h.description, h.images, h.tags, h.rating, to_jsonb(h.*),
           haversine(center_lat, center_lng, h.lat, h.lng)
    FROM hotels h
    WHERE (place_types IS NULL OR 'hotels' = ANY(place_types))
      AND haversine(center_lat, center_lng, h.lat, h.lng) <= radius_km

    UNION ALL SELECT 'pagodas', p.id, p.name, p.lat, p.lng, p.address, p.contact, p.description, p.images, p.tags, p.rating, to_jsonb(p.*), haversine(center_lat, center_lng, p.lat, p.lng) FROM pagodas p WHERE (place_types IS NULL OR 'pagodas' = ANY(place_types)) AND haversine(center_lat, center_lng, p.lat, p.lng) <= radius_km
    UNION ALL SELECT 'archaeological_sites', a.id, a.name, a.lat, a.lng, a.address, a.contact, a.description, a.images, a.tags, a.rating, to_jsonb(a.*), haversine(center_lat, center_lng, a.lat, a.lng) FROM archaeological_sites a WHERE (place_types IS NULL OR 'archaeological_sites' = ANY(place_types)) AND haversine(center_lat, center_lng, a.lat, a.lng) <= radius_km
    UNION ALL SELECT 'monuments', m.id, m.name, m.lat, m.lng, m.address, m.contact, m.description, m.images, m.tags, m.rating, to_jsonb(m.*), haversine(center_lat, center_lng, m.lat, m.lng) FROM monuments m WHERE (place_types IS NULL OR 'monuments' = ANY(place_types)) AND haversine(center_lat, center_lng, m.lat, m.lng) <= radius_km
    UNION ALL SELECT 'attractions', a.id, a.name, a.lat, a.lng, a.address, a.contact, a.description, a.images, a.tags, a.rating, to_jsonb(a.*), haversine(center_lat, center_lng, a.lat, a.lng) FROM attractions a WHERE (place_types IS NULL OR 'attractions' = ANY(place_types)) AND haversine(center_lat, center_lng, a.lat, a.lng) <= radius_km
    UNION ALL SELECT 'ktvs', k.id, k.name, k.lat, k.lng, k.address, k.contact, k.description, k.images, k.tags, k.rating, to_jsonb(k.*), haversine(center_lat, center_lng, k.lat, k.lng) FROM ktvs k WHERE (place_types IS NULL OR 'ktvs' = ANY(place_types)) AND haversine(center_lat, center_lng, k.lat, k.lng) <= radius_km
    UNION ALL SELECT 'transportation', t.id, t.name, t.lat, t.lng, t.address, t.contact, t.description, t.images, t.tags, t.rating, to_jsonb(t.*), haversine(center_lat, center_lng, t.lat, t.lng) FROM transportation t WHERE (place_types IS NULL OR 'transportation' = ANY(place_types)) AND haversine(center_lat, center_lng, t.lat, t.lng) <= radius_km
    UNION ALL SELECT 'convenience_stores', c.id, c.name, c.lat, c.lng, c.address, c.contact, c.description, c.images, c.tags, c.rating, to_jsonb(c.*), haversine(center_lat, center_lng, c.lat, c.lng) FROM convenience_stores c WHERE (place_types IS NULL OR 'convenience_stores' = ANY(place_types)) AND haversine(center_lat, center_lng, c.lat, c.lng) <= radius_km
    UNION ALL SELECT 'pharmacies', p.id, p.name, p.lat, p.lng, p.address, p.contact, p.description, p.images, p.tags, p.rating, to_jsonb(p.*), haversine(center_lat, center_lng, p.lat, p.lng) FROM pharmacies p WHERE (place_types IS NULL OR 'pharmacies' = ANY(place_types)) AND haversine(center_lat, center_lng, p.lat, p.lng) <= radius_km
    UNION ALL SELECT 'markets', m.id, m.name, m.lat, m.lng, m.address, m.contact, m.description, m.images, m.tags, m.rating, to_jsonb(m.*), haversine(center_lat, center_lng, m.lat, m.lng) FROM markets m WHERE (place_types IS NULL OR 'markets' = ANY(place_types)) AND haversine(center_lat, center_lng, m.lat, m.lng) <= radius_km
    UNION ALL SELECT 'schools', s.id, s.name, s.lat, s.lng, s.address, s.contact, s.description, s.images, s.tags, s.rating, to_jsonb(s.*), haversine(center_lat, center_lng, s.lat, s.lng) FROM schools s WHERE (place_types IS NULL OR 'schools' = ANY(place_types)) AND haversine(center_lat, center_lng, s.lat, s.lng) <= radius_km
    UNION ALL SELECT 'hospitals', h.id, h.name, h.lat, h.lng, h.address, h.contact, h.description, h.images, h.tags, h.rating, to_jsonb(h.*), haversine(center_lat, center_lng, h.lat, h.lng) FROM hospitals h WHERE (place_types IS NULL OR 'hospitals' = ANY(place_types)) AND haversine(center_lat, center_lng, h.lat, h.lng) <= radius_km
    UNION ALL SELECT 'banks_atms', b.id, b.name, b.lat, b.lng, b.address, b.contact, b.description, b.images, b.tags, b.rating, to_jsonb(b.*), haversine(center_lat, center_lng, b.lat, b.lng) FROM banks_atms b WHERE (place_types IS NULL OR 'banks_atms' = ANY(place_types)) AND haversine(center_lat, center_lng, b.lat, b.lng) <= radius_km
    UNION ALL SELECT 'police_stations', p.id, p.name, p.lat, p.lng, p.address, p.contact, p.description, p.images, p.tags, p.rating, to_jsonb(p.*), haversine(center_lat, center_lng, p.lat, p.lng) FROM police_stations p WHERE (place_types IS NULL OR 'police_stations' = ANY(place_types)) AND haversine(center_lat, center_lng, p.lat, p.lng) <= radius_km
    UNION ALL SELECT 'gas_stations', g.id, g.name, g.lat, g.lng, g.address, g.contact, g.description, g.images, g.tags, g.rating, to_jsonb(g.*), haversine(center_lat, center_lng, g.lat, g.lng) FROM gas_stations g WHERE (place_types IS NULL OR 'gas_stations' = ANY(place_types)) AND haversine(center_lat, center_lng, g.lat, g.lng) <= radius_km
    UNION ALL SELECT 'post_offices', p.id, p.name, p.lat, p.lng, p.address, p.contact, p.description, p.images, p.tags, p.rating, to_jsonb(p.*), haversine(center_lat, center_lng, p.lat, p.lng) FROM post_offices p WHERE (place_types IS NULL OR 'post_offices' = ANY(place_types)) AND haversine(center_lat, center_lng, p.lat, p.lng) <= radius_km
    UNION ALL SELECT 'parks', p.id, p.name, p.lat, p.lng, p.address, p.contact, p.description, p.images, p.tags, p.rating, to_jsonb(p.*), haversine(center_lat, center_lng, p.lat, p.lng) FROM parks p WHERE (place_types IS NULL OR 'parks' = ANY(place_types)) AND haversine(center_lat, center_lng, p.lat, p.lng) <= radius_km
    UNION ALL SELECT 'gyms_fitness', g.id, g.name, g.lat, g.lng, g.address, g.contact, g.description, g.images, g.tags, g.rating, to_jsonb(g.*), haversine(center_lat, center_lng, g.lat, g.lng) FROM gyms_fitness g WHERE (place_types IS NULL OR 'gyms_fitness' = ANY(place_types)) AND haversine(center_lat, center_lng, g.lat, g.lng) <= radius_km
    UNION ALL SELECT 'coffee_shops', c.id, c.name, c.lat, c.lng, c.address, c.contact, c.description, c.images, c.tags, c.rating, to_jsonb(c.*), haversine(center_lat, center_lng, c.lat, c.lng) FROM coffee_shops c WHERE (place_types IS NULL OR 'coffee_shops' = ANY(place_types)) AND haversine(center_lat, center_lng, c.lat, c.lng) <= radius_km
    UNION ALL SELECT 'bakeries', b.id, b.name, b.lat, b.lng, b.address, b.contact, b.description, b.images, b.tags, b.rating, to_jsonb(b.*), haversine(center_lat, center_lng, b.lat, b.lng) FROM bakeries b WHERE (place_types IS NULL OR 'bakeries' = ANY(place_types)) AND haversine(center_lat, center_lng, b.lat, b.lng) <= radius_km
    UNION ALL SELECT 'salons', s.id, s.name, s.lat, s.lng, s.address, s.contact, s.description, s.images, s.tags, s.rating, to_jsonb(s.*), haversine(center_lat, center_lng, s.lat, s.lng) FROM salons s WHERE (place_types IS NULL OR 'salons' = ANY(place_types)) AND haversine(center_lat, center_lng, s.lat, s.lng) <= radius_km

    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### RLS (All Tables)

```sql
-- Category tables: authenticated read-only for all users; insert/update/delete admin-only
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagodas ENABLE ROW LEVEL SECURITY;
ALTER TABLE archaeological_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE monuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ktvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenience_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks_atms ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gas_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms_fitness ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bakeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read restaurants" ON restaurants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone authenticated can read hotels" ON hotels FOR SELECT USING (auth.role() = 'authenticated');
-- (repeat per category table — same pattern)

-- User tables: same RLS as before (own data only)
-- (profiles, favorites, search_history, tours, tour_stops, chat_sessions, chat_messages)
```

---

### Indexes

```sql
-- Per category table: location + key filter columns
CREATE INDEX idx_restaurants_location ON restaurants(lat, lng);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_hotels_location ON hotels(lat, lng);
CREATE INDEX idx_hotels_star ON hotels(star_rating);
CREATE INDEX idx_pagodas_location ON pagodas(lat, lng);
CREATE INDEX idx_archaeological_sites_location ON archaeological_sites(lat, lng);
CREATE INDEX idx_monuments_location ON monuments(lat, lng);
CREATE INDEX idx_attractions_location ON attractions(lat, lng);
CREATE INDEX idx_attractions_sub ON attractions(sub_category);
CREATE INDEX idx_ktvs_location ON ktvs(lat, lng);
CREATE INDEX idx_transportation_location ON transportation(lat, lng);
CREATE INDEX idx_transportation_type ON transportation(transport_type);
CREATE INDEX idx_convenience_stores_location ON convenience_stores(lat, lng);
CREATE INDEX idx_pharmacies_location ON pharmacies(lat, lng);
CREATE INDEX idx_markets_location ON markets(lat, lng);
CREATE INDEX idx_markets_type ON markets(market_type);
CREATE INDEX idx_schools_location ON schools(lat, lng);
CREATE INDEX idx_hospitals_location ON hospitals(lat, lng);
CREATE INDEX idx_banks_atms_location ON banks_atms(lat, lng);
CREATE INDEX idx_police_stations_location ON police_stations(lat, lng);
CREATE INDEX idx_gas_stations_location ON gas_stations(lat, lng);
CREATE INDEX idx_post_offices_location ON post_offices(lat, lng);
CREATE INDEX idx_parks_location ON parks(lat, lng);
CREATE INDEX idx_gyms_fitness_location ON gyms_fitness(lat, lng);
CREATE INDEX idx_coffee_shops_location ON coffee_shops(lat, lng);
CREATE INDEX idx_bakeries_location ON bakeries(lat, lng);
CREATE INDEX idx_salons_location ON salons(lat, lng);

-- User table indexes
CREATE INDEX idx_favorites_user_place ON favorites(user_id, place_type, place_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(user_id, created_at DESC);
CREATE INDEX idx_tours_user_id ON tours(user_id);
CREATE INDEX idx_tour_stops_tour_id ON tour_stops(tour_id);
CREATE INDEX idx_tour_stops_order ON tour_stops(tour_id, stop_order);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(session_id, created_at);
```

---

## 5. API Routes — Full Detail

### `POST /api/recommend`

```
Request:  { lat: number, lng: number, types?: PlaceType[], radius?: number, ai_curate?: boolean }
Response: { places: NearbyPlace[], meta: { total, radius_km, ai_curated?: boolean } }
```

**Flow (DB-First):**

1. Validate input with Zod (types array matches 22 valid PlaceType values)
2. Call `nearby_places_all(lat, lng, radius, place_types)` → UNION ALL across category tables
3. **Option A (default)**: Return raw DB results directly (fast, no API cost)
4. **Option B (`ai_curate: true`)**: Send DB results to DeepSeek for curation with strict "DO NOT add places" constraint
5. Store search history row in Supabase
6. Return result to client

### `POST /api/tour/generate`

```
Request:  { lat: number, lng: number, places: { place_type: string, place_id: string }[] }
Response: {
  tour: { title, description, stops: TourStop[], route_geometry: GeoJSON.LineString },
  total_distance_km: number,
  total_travel_min: number,
  total_duration_full_min: number    // travel + time-at-places
}
```

**Flow (Database-First + DeepSeek planning + Mapbox routing):**

1. Fetch full place details from their respective category tables (22 possible tables) by `(place_type, place_id)` pairs
2. Send to DeepSeek: "Order these stops logically, estimate time-at-place, add tips." DeepSeek returns ordered `stops[]`
3. **Call Mapbox Directions** with ordered waypoints:
   ```
   GET https://api.mapbox.com/directions/v5/mapbox/driving/{lng1},{lat1};{lng2},{lat2};...
     ?access_token={MAPBOX_ACCESS_TOKEN}
     &geometries=geojson
     &steps=true
     &overview=full
     &alternatives=false
   ```
4. Mapbox returns:
   - `routes[0].geometry` → full GeoJSON LineString (real road path across all stops)
   - `routes[0].legs[]` → one leg per waypoint pair: `{ distance, duration, summary, steps[] }`
5. **Merge legs into stops**: each `TourStop` (except the last) gets `travel_to_next` populated from the corresponding leg
6. Return `{ tour, route_geometry, totals }` to client
7. On save: store `route_geometry` on `tours` row, `travel_*` columns on `tour_stops` rows

**Waypoint limit**: Mapbox allows up to 25 waypoints per request. For Pyay day tours (typically 4-8 stops), this is more than enough.

### `GET /api/favorites` → user's saved favorites (joined against all category tables via place_type + place_id, paginated)

### `POST /api/favorites` → save a place `{ place_type: string, place_id: string }`

### `DELETE /api/favorites/[id]` → removes a favorite

### `GET /api/history` → user's search history (last 20, descending)

### `GET /api/tours` → user's saved tours list (with stop count)

### `POST /api/tours` → save generated tour `{ title, description, start_lat, start_lng, route_geometry, stops: [{ place_type, place_id, stop_order, estimated_duration_min, tips, travel_* }] }`

### `GET /api/tours/[id]` → full tour with stops ordered by stop_order (includes travel data per stop, joined with category tables)

### `DELETE /api/tours/[id]` → deletes tour + cascades stops

### `POST /api/chat`

```
Request:  { message: string, lat: number, lng: number, session_id?: string, radius?: number }
Response: {
  reply: string,
  ui_components: UIComponent[],   // AI-decided layout (text, map, place_cards, etc.)
  places: NearbyPlace[],           // full place data for matched (place_type, place_id) from 22 category tables
  session_id: string,
  filters_applied: object,
  context: { selected_places: string[], session_state: string }
}
```

**Flow (Chat-First with Dynamic UI):**

1. Validate input with Zod
2. Create or resume `chat_sessions` row
3. Call `nearby_places_all(lat, lng, radius)` → get all nearby places from 22 category tables (UNION ALL)
4. Fetch last 10 messages from `chat_messages` for this session (conversation context)
5. Build DeepSeek prompt including: user message + all nearby places + previous messages + available UI component types + category table schemas
6. Store user message in `chat_messages`
7. DeepSeek interprets intent, matches places across categories, decides which `ui_components[]` to render
8. DeepSeek returns: `{ reply, ui_components: [...], context: {}, filters_applied: {} }`
9. Resolve all referenced `(place_type, place_id)` pairs to full data from respective tables
10. Store assistant reply + metadata in `chat_messages`
11. Return reply + ui_components + resolved places + session_id

### `GET /api/chat/sessions` → user's chat sessions (last 20, with title and last message preview)

### `GET /api/chat/sessions/[id]` → full conversation history (messages array with role, content, metadata)

### `DELETE /api/chat/sessions/[id]` → deletes session + all messages cascaded

---

## 6. Middleware (Route Protection)

```ts
// middleware.ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Protected: all routes except auth pages, static assets, and API auth callbacks
    "/((?!auth|_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
```

- `updateSession()` refreshes the Supabase session cookie
- If no valid session → redirects to `/auth/login?redirect=<original_url>`
- Auth pages are public (login, signup, callback, confirm)

---

## 7. Component Details

### Landing Page (`app/page.tsx` — Chat-First)

```
After login, user sees:
  ┌──────────────────────────────────────────┐
  │  🌍 Pyay Tour Guide                      │
  │                                          │
  │  "Ask me anything about Pyay!"           │
  │  ┌──────────────────────────────────────┐│
  │  │ e.g. Burmese curry under $$         ││  ← ChatInput (auto-focused)
  │  │                              [📍] [➤]││      📍 = location button, ➤ = send
  │  └──────────────────────────────────────┘│
  │                                          │
  │  Suggested prompts:                      │
  │  🍛 Best Burmese restaurants             │
  │  🏛️ Must-see attractions                 │
  │  🏨 Hotels under $$                      │
  │  📋 Plan my day in Pyay                  │
  │                                          │
  │  [Recent chats sidebar →]                │
  └──────────────────────────────────────────┘
```

- The landing page IS the chat view. No redirection to `/explore`.
- On first visit: welcome message + suggested prompts + location permission prompt
- On subsequent visits: shows last chat session (resumed)
- Navbar: logo + "Favorites" / "My Tours" nav links + avatar

### `ChatView.tsx`

- Full-page chat container (fills viewport below navbar)
- Scrollable message list, auto-scrolls to bottom on new messages
- Footer: `ChatInput` pinned to bottom
- Toggleable sidebar: `ChatSessionList` (past sessions)
- States: empty (welcome + suggestions), loading (AI thinking), loaded (conversation), error

### `ChatMessage.tsx`

- **User messages**: right-aligned bubble with user's text, timestamp
- **Assistant messages**: left-aligned bubble containing:
  1. Assistant's text reply (rendered as markdown from `TextBlock`)
  2. `DynamicRenderer` for additional `ui_components[]` below the text
- Loading state: three-dot animation ("AI is thinking...")
- Each assistant bubble can contain one or more interactive blocks

### `ChatInput.tsx`

- Textarea with auto-resize, placeholder: "e.g. Find me a Burmese restaurant under $$"
- Two buttons: 📍 location permission (triggers geolocation) + ➤ send
- Keyboard shortcut: Enter to send, Shift+Enter for newline
- Loading state: send button becomes spinner, input disabled
- Displays current location status (📍 detected / tap to share)

### `ChatSessionList.tsx`

- Sidebar (left or right, toggleable) showing past chat sessions
- Each session: auto-generated title, last message preview, relative timestamp, delete button
- Click → loads session messages into ChatView
- "New Chat" button at top

---

### Dynamic UI Component System

**Core idea**: The AI response includes `ui_components[]` — an ordered array of component descriptors. `DynamicRenderer` reads these and renders the appropriate React components inline in the chat bubble.

### `DynamicRenderer.tsx`

```tsx
// Central runtime — reads ui_components[] and renders blocks in order
function DynamicRenderer({
  components, // UIComponent[] from AI response
  places, // PlaceWithDistance[] lookup map (place_id → place)
  onAction, // callback for QuickActions / SaveButton clicks
}: Props) {
  const registry: Record<string, ComponentType> = {
    text: TextBlock,
    map: MapBlock,
    place_cards: PlaceCardsBlock,
    place_detail: PlaceDetailBlock,
    tour_timeline: TourTimelineBlock,
    image_gallery: ImageGalleryBlock,
    comparison: ComparisonBlock,
    quick_actions: QuickActionsBlock,
  };

  return (
    <div className="flex flex-col gap-4">
      {components.map((c, i) => {
        const Comp = registry[c.type];
        if (!Comp) return null;
        return (
          <Comp
            key={`${c.type}-${i}`}
            {...c}
            places={places}
            onAction={onAction}
          />
        );
      })}
    </div>
  );
}
```

Each block component:

- Is **self-contained** and sized for inline display (not full-page)
- Can be **expanded** to full-screen modal on tap (esp. map, gallery, detail)
- Shares **state** with sibling blocks (click card → highlight map marker)

### `blocks/TextBlock.tsx` (type: `text`)

- Renders `content` as Markdown (bold, italic, lists, links, emoji)
- Always present as the first component in every AI response
- Props: `{ content: string }`

### `blocks/MapBlock.tsx` (type: `map`)

- Inline interactive Leaflet map with markers for `place_ids`
- Props: `{ place_ids: string[], center?: {lat, lng}, zoom?: number, height?: number }`
- Default height: 300px, default zoom: 14
- Markers colored by place type (attraction=orange, restaurant=red, hotel=blue)
- Click marker → highlight corresponding PlaceCard (if sibling)
- Expand button → full-screen modal map
- Fits bounds to show all markers if center not specified

### `blocks/PlaceCardsBlock.tsx` (type: `place_cards`)

- Horizontal scroll or grid of `PlaceCard` components
- Props: `{ place_ids: string[], layout: "horizontal_scroll" | "grid" | "list", show: string[] }`
- `show` controls visible fields: `["name", "price_level", "rating", "match_reason", "distance"]`
- Each card shows: type badge, name, fields per `show`, match_reason (from AI)
- Action buttons per card: heart (save), "+ tour"
- Horizontal scroll on mobile, grid (2-col) on desktop
- Can contain up to 6-8 cards inline; "View all →" for more

### `blocks/PlaceDetailBlock.tsx` (type: `place_detail`)

- Full expanded card for a single place
- Props: `{ place_id: string }`
- Shows: name, type badge, all images, description, history, hours, entry_fee, contact, address, tags, rating, price_level
- AI chooses this when user asks "tell me about [specific place]"
- Expandable full-screen on mobile

### `blocks/TourTimelineBlock.tsx` (type: `tour_timeline`)

- Vertical timeline of stops (inline version)
- Props: `{ stops: TourStop[], routeGeometry?: GeoJSON.LineString }`
- Numbered circles connected by a colored line
- Each stop shows:
  - **Place info**: place name, type badge, DeepSeek's estimated time-at-place, DeepSeek's tips
  - **Travel to next** (between stops): `🚗 3.2km · 8min via Strand Rd, Pyay-Taungoo Rd`
  - Collapse/expand per stop for full travel steps: "1. Turn right onto Strand Rd (1.2km) · 2. Continue on Pyay-Taungoo Rd (2.0km)"
- Only shows first 3 stops inline; "View full itinerary →" button for complete tour
- Full tour opens `/tour/new` or a modal

### `blocks/MapBlock.tsx` (type: `map`) — updated for routing

- Props: `{ place_ids: string[], route_geometry?: GeoJSON.LineString, center?: {lat, lng}, zoom?: number, height?: number }`
- If `route_geometry` present: renders GeoJSON polyline (real road curve!) connecting markers in order — NOT a straight line
- Numbered markers (1, 2, 3...) instead of type-colored markers when in tour mode
- Fits bounds to show all markers + route

### `blocks/ImageGalleryBlock.tsx` (type: `image_gallery`)

- Horizontal scroll of images
- Props: `{ place_id: string }` or `{ image_urls: string[] }`
- Click image → lightbox view with swipe
- AI triggers this only when `place.images.length > 0`

### `blocks/ComparisonBlock.tsx` (type: `comparison`)

- Side-by-side comparison table of 2-3 places
- Props: `{ place_ids: string[], fields: string[] }`
- Table rows: price_level, rating, distance, description excerpt, cuisine/category
- Best value highlighted with a subtle green accent
- AI triggers when user asks "compare X and Y"

### `blocks/QuickActionsBlock.tsx` (type: `quick_actions`)

- Horizontal row of action buttons
- Props: `{ actions: { id: string, label: string, type: string }[] }`
- Action types:
  - `save_all` → save all current places to favorites
  - `plan_tour` → generate tour from current places
  - `show_on_map` → open full-screen map with highlighted places
  - `more_like_this` → "find similar places" (new chat query)
  - `share` → share results via URL
- Icon + label per button, full-width on mobile

### Existing Shared Components (unchanged)

- `MapView.tsx` — full-page map (for `/explore` standalone and map expansion)
- `PlaceCard.tsx` — shared card (used by `PlaceCardsBlock` and `PlaceDetailBlock`)
- `PlaceCardSkeleton.tsx` — loading skeleton
- `SaveButton.tsx` — heart toggle (used in cards)
- `TourTimeline.tsx` — full-page timeline (for `/tour/[id]`)
- `TourMap.tsx` — full-page tour map with GeoJSON route polyline + numbered markers, turn-by-turn summary panel
- `TourCard.tsx` — tour list card
- `FavoriteCard.tsx` — favorites list card
- `CategoryTabs.tsx` — type filter tabs (for `/explore` page)

---

## 8. Hooks Detail

### `useGeolocation()`

```ts
// Returns: { coords, loading, error, denied, requestLocation }
// On mount: check permission state
// requestLocation: calls navigator.geolocation.getCurrentPosition
// Handles: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
```

### `useChat()`

```ts
// Returns: {
//   sessions, currentSession, messages, loading,
//   sendMessage(text), loadSession(id), newChat(), deleteSession(id),
//   currentUIComponents,    // UIComponent[] from latest assistant message
//   currentPlaces,          // PlaceWithDistance[] lookup map
//   executeAction(action)   // handle QuickAction clicks (save_all, plan_tour, etc.)
// }
// sendMessage(text):
//   1. Gets current location from geolocation hook (or stored)
//   2. Sends POST /api/chat with message + lat + lng + session_id
//   3. Receives { reply, ui_components[], places, context }
//   4. Appends user message + assistant message to messages[]
//   5. Parses ui_components[], resolves all place_ids to full PlaceWithDistance[]
//   6. Updates currentUIComponents and currentPlaces for DynamicRenderer
// Messages array stores: { role, content, ui_components, places, metadata, created_at }
```

### `useFavorites()`

```ts
// Returns: { favorites, loading, addFavorite, removeFavorite, isFavorited(name) }
// addFavorite / removeFavorite do optimistic updates + server sync
// isFavorited does O(1) lookup via Map
```

### `useTours()`

```ts
// Returns: { tours, loading, saveTour, deleteTour, getTour(id) }
```

### `useChat()`

```ts
// Returns: { sessions, currentSession, messages, loading, sendMessage, loadSession, newChat, deleteSession }
// sendMessage(text) → creates/updates session, sends message, appends AI reply
// messages includes { role, content, metadata } plus a temp "pending" assistant message while loading
// Sends full conversation history (last 10 messages) to API for context
```

### `useDebounce(value, delay)`

```ts
// Standard debounce hook for search input
```

---

## 9. DeepSeek Integration

### `lib/deepseek.ts`

```ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

// Curate/re-rank places from the database (optional AI step)
async function curateRecommendations(params: {
  lat: number;
  lng: number;
  locationName: string;
  places: NearbyPlace[]; // from DB nearby_places_all() query
  userPreferences?: string;
}): Promise<
  {
    place_type: PlaceType;
    place_id: string;
    ai_insight: string;
    rank: number;
  }[]
>;

// Generate tour itinerary — DeepSeek orders stops + estimates time + adds tips
async function generateTourPlan(params: {
  lat: number;
  lng: number;
  locationName: string;
  places: NearbyPlace[]; // selected places from DB
  preferences?: string;
}): Promise<{
  title: string;
  description: string;
  stops: {
    place_type: PlaceType;
    place_id: string;
    stop_order: number;
    estimated_duration_min: number;
    tips: string;
  }[];
}>;

// Handle chat messages — interpret user query, match against DB places
async function handleChat(params: {
  lat: number;
  lng: number;
  locationName: string;
  message: string;
  previousMessages: { role: "user" | "assistant"; content: string }[];
  places: NearbyPlace[]; // nearby places from all 22 category tables
  radius: number;
}): Promise<ChatResponse>;
```

**Prompt Template (curate — AI re-ranks DB results):**

```
You are an expert local tour guide for {locationName}.
A traveler ({userPreferences}) is at coordinates ({lat}, {lng}).

Here are the available places from our verified database within {radius}km:
{JSON array of places from DB}

Select and re-rank the best 10 places for this traveler.
For each selected place, provide a 1-sentence `ai_insight` explaining why you recommend it.
DO NOT add, create, or invent any place not listed above.
Only use place IDs that exist in the input.

Return ONLY valid JSON:
{
  "curated": [
    { "place_id": "uuid-from-input", "ai_insight": "...", "rank": 1 }
  ]
}
```

**Prompt Template (tour generation — AI plans route from DB places):**

```
You are an expert tour planner for {locationName}.
Create a {preferences} itinerary using ONLY the places listed below.

Available places:
{JSON array of selected places}

For each stop provide: stop_order, estimated_duration_min, tips (1 sentence).
DO NOT add, create, or invent any place not listed below.

Return ONLY valid JSON:
{
  "title": "A descriptive tour title",
  "description": "Short tour description",
  "stops": [
    {
      "place_id": "uuid-from-input",
      "stop_order": 1,
      "estimated_duration_min": 60,
      "tips": "Best visited in the morning..."
    }
  ]
}
```

**Critical Constraint**: All DeepSeek prompts include `DO NOT add any place not in this list.` This ensures zero hallucination — the AI enhances but never invents.

**Prompt Template (chat — AI as UX designer with dynamic UI components):**

```
You are a local tour assistant for Pyay, Myanmar.
The user is at coordinates ({lat}, {lng}).

Previous conversation for context:
{previous messages, last 10}

User query: "{message}"

Here are ALL places within {radius}km from our verified database:
{JSON array of nearby places from DB. Each place has place_type, place_id, name, lat, lng, data (category-specific fields)}

AVAILABLE CATEGORIES (use in filters, each with its own filterable columns):
- restaurants: cuisine_type, price_range, has_vegetarian, has_delivery, has_alcohol, opening_hours, menu (sections of items with names/prices)
- hotels: star_rating, price_range, amenities, room_types, check_in_time, packages (deals/specials with price and includes)
- pagodas: built_century, entry_fee, dress_code, festival_dates, is_active
- archaeological_sites: unesco_status, historical_period, guided_tours, site_area_hectares
- monuments: built_year, dedicated_to, material, height_meters
- attractions: sub_category, family_friendly, parking_available, best_visit_time
- ktvs: price_per_hour, has_food_menu, has_alcohol, private_rooms, room_count
- transportation: transport_type, routes, fare_range, operator, schedule
- convenience_stores: chain, is_24hr, services, has_parking
- pharmacies: is_24hr, has_delivery, has_prescription, accepts_insurance
- markets: market_type, operating_days, stall_count, popular_for
- schools: institution_type, programs, student_count, is_private
- hospitals: hospital_type, has_emergency, is_24hr, departments
- banks_atms: bank_name, has_atm, has_currency_exchange, is_24hr_atm
- police_stations: station_type, is_24hr, emergency_phone, services
- gas_stations: chain, fuel_types, is_24hr, payment_methods
- post_offices: postal_code, services, has_po_box
- parks: park_type, amenities, entry_fee, is_gated, pet_allowed
- gyms_fitness: gym_type, day_pass_fee, has_shower, has_air_con
- coffee_shops: coffee_style, has_wifi, has_ac, has_outdoor, menu (drinks & food items per section)
- bakeries: bakery_type, specialities, has_delivery, has_seating, menu (baked goods items)
- salons: salon_type, services, has_appointment, price_range

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE: You are both a tour guide AND a UX designer.
For every response, you decide WHAT to say AND HOW to display it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AVAILABLE UI COMPONENTS (include in ui_components[] array):
Use these to enrich your response with interactive elements.

1. "text" — Plain markdown text. ALWAYS include as the FIRST component with your conversational reply.
   { "type": "text", "content": "Your markdown reply..." }

2. "map" — Interactive map. Use when showing 2+ locations.
   { "type": "map", "place_ids": ["uuid", ...], "center": {"lat":0,"lng":0}, "zoom": 14, "height": 300 }
   - Default zoom: 14. Default height: 300 (pixels).

3. "place_cards" — Scrollable cards. Use when listing 2+ places.
   { "type": "place_cards", "place_ids": ["uuid", ...], "layout": "horizontal_scroll|grid|list", "show": ["name","price_level","rating","match_reason","distance"] }
   - layout: "horizontal_scroll" (best for 2-5 cards), "grid" (6+ cards, 2-column), "list" (compact text list)
   - show: which fields to display on each card

4. "place_detail" — Full detail card. Use when user asks about ONE specific place.
   { "type": "place_detail", "place_id": "uuid" }
   - Shows all fields: images, description, history, hours, fee, contact, tags

5. "tour_timeline" — Timeline of stops. Use when user asks to plan a tour/route.
   { "type": "tour_timeline", "stops": [{ "place_id":"uuid", "stop_order":1, "estimated_duration_min":60, "tips":"..." }] }
   - Order stops efficiently. Estimate reasonable durations. Keep tips to 1 sentence.

6. "image_gallery" — Photo gallery. Use when a place has images (images array not empty).
   { "type": "image_gallery", "place_id": "uuid" }

7. "comparison" — Comparison table. Use when user asks to compare 2-3 places.
   { "type": "comparison", "place_ids": ["uuid","uuid"], "fields": ["price_level","rating","distance","category"] }

8. "quick_actions" — Action buttons. Use to suggest next steps.
   { "type": "quick_actions", "actions": [{ "id": "save_all", "label": "Save All to Favorites", "type": "save_all" }] }
   - Available action types: "save_all", "plan_tour", "show_on_map", "more_like_this"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT SELECTION GUIDELINES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When user asks for...                    → Include these components:
─────────────────────────────────────────────────────────────────
"Find me [type] near..."                → text + map + place_cards + quick_actions
"Tell me about [specific place]"        → text + place_detail [+ image_gallery if has images]
"Plan a tour / my day"                  → text + tour_timeline [+ map] + quick_actions
"Compare X and Y"                       → text + comparison + quick_actions
"What's the best...?"                   → text + place_cards (ranked) + map
"Show me on the map"                    → text + map (zoomed to the place)
"How much / what time / contact?"       → text + place_detail

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ONLY use place_ids from the provided database. DO NOT invent any place.
- If nothing matches, say so honestly. DO NOT make up places.
- ALWAYS include "text" as the first component (your conversational reply).
- Set context.selected_places to ALL place_ids you reference (for follow-up messages).
- Return ONLY valid JSON:

{
  "reply": "Friendly, conversational reply...",
  "filters_applied": { "type": "restaurant", "price_level": "$$" },
  "ui_components": [
    { "type": "text", "content": "I found 3 Burmese curry spots..." },
    { "type": "map", "place_ids": ["uuid-1","uuid-2","uuid-3"], "zoom": 14, "height": 300 },
    { "type": "place_cards", "place_ids": ["uuid-1","uuid-2","uuid-3"], "layout": "horizontal_scroll", "show": ["name","price_level","rating","match_reason"] },
    { "type": "quick_actions", "actions": [{ "id": "save_all", "label": "Save All", "type": "save_all" }, { "id": "plan_tour", "label": "Plan a Tour", "type": "plan_tour" }] }
  ],
  "context": { "selected_places": ["uuid-1","uuid-2","uuid-3"], "session_state": "browsing_results" }
}
```

---

### `lib/routing.ts` — Mapbox Directions Client

Mapbox Directions provides real road-based routing between ordered waypoints, returning a GeoJSON polyline + turn-by-turn steps per leg.

**API Call**:

```
GET https://api.mapbox.com/directions/v5/mapbox/driving/{lng1},{lat1};{lng2},{lat2};{lng3},{lat3}
  ?access_token={MAPBOX_ACCESS_TOKEN}
  &geometries=geojson
  &steps=true
  &overview=full
  &alternatives=false
```

```ts
// lib/routing.ts
async function getRoute(params: {
  waypoints: { lat: number; lng: number }[]; // ordered stops
  profile?: "driving" | "walking" | "cycling"; // default: "driving"
}): Promise<{
  route_geometry: GeoJSON.LineString; // full road path across ALL stops
  legs: Array<{
    distance_m: number;
    duration_sec: number;
    summary: string; // "via Strand Rd, Pyay-Taungoo Rd"
    steps: Array<{
      instruction: string; // "Turn right onto Strand Rd"
      distance_m: number;
      duration_sec: number;
      road_name: string;
    }>;
  }>;
  total_distance_km: number;
  total_duration_min: number;
}>;
```

**Leg-to-stop merging** (done in `/api/tour/generate`):

```
DeepSeek returns N stops with stop_order + time-at-place + tips
Mapbox returns N-1 legs with distance + duration + steps + summary

Merge: stop[i].travel_to_next ← leg[i]
       stop[last].travel_to_next ← null
```

**TourMap / MapBlock rendering**:

- Render `route_geometry` as a Leaflet `Polyline` — real road curves, not straight lines
- Each leg's `steps[]` shown as a collapsible turn-by-turn under the timeline stop
- Fit map bounds to `route_geometry` coordinates

**Waypoint limit**: 25 per request (Mapbox limit). Pyay day tours typically 4-8 stops.

---

## 10. Types (`lib/types.ts`)

```ts
export type PlaceType =
  | "restaurants"
  | "hotels"
  | "pagodas"
  | "archaeological_sites"
  | "monuments"
  | "attractions"
  | "ktvs"
  | "transportation"
  | "convenience_stores"
  | "pharmacies"
  | "markets"
  | "schools"
  | "hospitals"
  | "banks_atms"
  | "police_stations"
  | "gas_stations"
  | "post_offices"
  | "parks"
  | "gyms_fitness"
  | "coffee_shops"
  | "bakeries"
  | "salons";

export type PriceLevel = "$" | "$$" | "$$$" | "$$$$";

// Unified row from nearby_places_all() — common fields + category-specific JSONB
export interface NearbyPlace {
  place_type: PlaceType;
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  contact: string | null;
  description: string | null;
  images: string[];
  tags: string[];
  rating: number | null;
  data: Record<string, unknown>; // category-specific fields (parsed from JSONB)
  distance_km: number;
}

// Curation result from DeepSeek
export interface CuratedPlace {
  place_type: PlaceType;
  place_id: string;
  ai_insight: string;
  rank: number;
}

// Tour stop (polymorphic reference)
export interface TourStop {
  id?: string;
  place_type: PlaceType;
  place_id: string;
  stop_order: number;
  estimated_duration_min: number;
  tips: string;
  travel_to_next: {
    distance_km: number;
    duration_min: number;
    summary: string;
    steps: {
      instruction: string;
      distance_km: number;
      duration_min: number;
      road_name: string;
    }[];
  } | null;
}

export interface Tour {
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  start_lat: number;
  start_lng: number;
  route_geometry?: GeoJSON.LineString;
  stops: TourStop[];
  created_at?: string;
}

export interface TourResponse {
  tour: Tour;
  route_geometry: GeoJSON.LineString;
  total_distance_km: number;
  total_travel_min: number;
  total_duration_full_min: number;
}

// ── Mapbox Routing Types ──

export interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number; // meters, total
    duration: number; // seconds, total
    geometry: GeoJSON.LineString; // full road path
    legs: Array<{
      distance: number;
      duration: number;
      summary: string;
      steps: Array<{
        maneuver: {
          type: string;
          instruction: string;
        };
        distance: number;
        duration: number;
        name: string;
      }>;
    }>;
  }>;
}

// Favorite (polymorphic reference)
export interface Favorite {
  id: string;
  user_id: string;
  place_type: PlaceType;
  place_id: string;
  place?: NearbyPlace; // resolved on read (joined against correct table)
  created_at: string;
}

export interface SearchHistory {
  id: string;
  query: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

// Chat
export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: ChatMessageMeta;
  created_at: string;
}

export interface ChatMessageMeta {
  ui_components?: UIComponent[];
  place_ids?: { place_type: PlaceType; place_id: string }[];
  filters_applied?: Record<string, string>;
  context?: {
    selected_places: { place_type: PlaceType; place_id: string }[];
    session_state: string;
  };
}

// ── Dynamic UI Component Types ──

export type UIComponentType =
  | "text"
  | "map"
  | "place_cards"
  | "place_detail"
  | "tour_timeline"
  | "image_gallery"
  | "comparison"
  | "quick_actions";

export type UIComponent =
  | TextComponent
  | MapComponent
  | PlaceCardsComponent
  | PlaceDetailComponent
  | TourTimelineComponent
  | ImageGalleryComponent
  | ComparisonComponent
  | QuickActionsComponent;

export interface TextComponent {
  type: "text";
  content: string; // markdown text
}

export interface MapComponent {
  type: "map";
  place_ids: string[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
}

export interface PlaceCardsComponent {
  type: "place_cards";
  place_ids: string[];
  layout: "horizontal_scroll" | "grid" | "list";
  show: string[]; // fields to display: name, price_level, rating, match_reason, distance, category
}

export interface PlaceDetailComponent {
  type: "place_detail";
  place_id: string;
}

export interface TourTimelineComponent {
  type: "tour_timeline";
  stops: {
    place_id: string;
    stop_order: number;
    estimated_duration_min: number;
    tips: string;
  }[];
}

export interface ImageGalleryComponent {
  type: "image_gallery";
  place_id: string;
}

export interface ComparisonComponent {
  type: "comparison";
  place_ids: string[];
  fields: string[];
}

export interface QuickActionsComponent {
  type: "quick_actions";
  actions: {
    id: string;
    label: string;
    type: "save_all" | "plan_tour" | "show_on_map" | "more_like_this" | "share";
  }[];
}

// Chat API response (updated for chat-first)
export interface ChatResponse {
  reply: string;
  ui_components: UIComponent[];
  places: NearbyPlace[];
  session_id: string;
  filters_applied: Record<string, string>;
  context: {
    selected_places: { place_type: PlaceType; place_id: string }[];
    session_state: string;
  };
}
```

---

## 11. Page States (UX)

### Landing Page (`/` — Chat-First)

| State            | What shows                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **First visit**  | Welcome message + suggested prompt buttons + ChatInput (auto-focused) + location permission prompt |
| **Returning**    | Last chat session resumed, scrolled to bottom. "New Chat" button available                         |
| **Loading**      | Three-dot animation on assistant bubble, ChatInput disabled, send button = spinner                 |
| **Loaded**       | Assistant bubble with text + `DynamicRenderer` for `ui_components[]` (map, cards, actions, etc.)   |
| **Empty result** | "I couldn't find any places matching that. Try a different query?" text only                       |
| **Error**        | "Hmm, something went wrong. Try again?" error bubble, retry button                                 |
| **Location**     | ChatInput shows "📍 Location required" badge until user grants permission                          |

### `/explore` Page (Standalone Map — accessed via chat action or nav)

| State       | What shows                                                      |
| ----------- | --------------------------------------------------------------- |
| **Loading** | Skeleton cards (6), map centered on coords with spinner overlay |
| **Loaded**  | Map + sidebar with cards, category tabs active                  |
| **Empty**   | "No places found in this area."                                 |
| **Error**   | "Something went wrong. [Retry]" toast, error message            |

### `/tour/new` Page

| State       | What shows                                                 |
| ----------- | ---------------------------------------------------------- |
| **Loading** | "Generating your tour..." with animated progress           |
| **Loaded**  | TourTimeline + TourMap side by side (or stacked on mobile) |
| **Error**   | "Couldn't generate tour. [Try again]"                      |

### Auth Pages

| State       | What shows                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------ |
| **Login**   | "Sign in with Google" button (primary, prominent) + divider "or" + email/password fields + "Sign up" link |
| **Signup**  | Email + password + confirm password + display name, "Log in" link                                |
| **Loading** | Button shows spinner, fields disabled                                                            |
| **Error**   | Inline error message below form (invalid credentials, etc.)                                      |
| **Success** | Redirect to landing page `/`                                                                     |

### Google Authentication Setup (Supabase)

1. **Google Cloud Console**: Create OAuth 2.0 Client ID (Web application), set redirect URIs to `https://{project}.supabase.co/auth/v1/callback`
2. **Supabase Dashboard**: Authentication → Providers → Google → paste Client ID + Client Secret
3. **Frontend call**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })`
4. **Callback route** (`app/auth/callback/route.ts`): exchanges the code for a session, redirects to `/`

### `GoogleSignInButton.tsx`
- Prominent "Sign in with Google" button with Google "G" logo
- `w-full h-12 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 text-slate-700 font-medium`
- Supabase OAuth handled client-side via `signInWithOAuth()`

---

## 12. Data Flow Diagrams

### Chat-First Flow (Primary UX Path)

```
User logs in → landing page `/`
        │
        ▼
  Welcome text + "📍 Share location" prompt (or auto-detect)
        │
        ▼
  User types: "Find me Burmese curry under $$"
        │
        ▼
  POST /api/chat { message: "...", lat: 18.8167, lng: 95.2167, radius: 10 }
        │
        ▼
  Server: create/resume chat session → SELECT * FROM nearby_places_all(lat, lng, 10)
        │
        ▼
  Build DeepSeek prompt:
  "User: 'Find Burmese curry...' | DB places: [{...}, ...] | Previous context: [...]"
        │
        ▼
  DeepSeek decides:
    - intent: filter restaurants by price_level $$ and tags ~ curry
    - ui_components: [text, map, place_cards, quick_actions]
    - matches: [place_id_1, place_id_2, place_id_3]
    - reply: "I found 3 spots..."
        │
        ▼
  Store messages in chat_messages (both user + assistant)
        │
        ▼
  Return { reply, ui_components[], places[], context } to client
        │
        ▼
  Client: DynamicRenderer reads ui_components[]:
    [1] TextBlock: "I found 3 Burmese curry spots under $$..."
    [2] MapBlock: inline map with 3 markers, zoom 14, height 300
    [3] PlaceCardsBlock: horizontal scroll of 3 cards showing name, price, rating
    [4] QuickActionsBlock: [Save All] [Plan a Tour]
        │
        ▼
  User taps "Plan a Tour" action
        │
        ▼
  POST /api/tour/generate { lat, lng, place_ids: [id1, id2, id3] }
        │
        ▼
  DeepSeek orders stops → Mapbox Directions gets real road geometry + turn-by-turn
  Client shows TourTimelineBlock inline with 🚗 travel info per leg
```

### Component Selection Flow (AI decides what to render)

```
User says:                             AI selects ui_components:
─────────────────────────────────────────────────────────────────
"Find me hotels near downtown"   →    [text, map, place_cards, quick_actions]
"Tell me about Shwesandaw"       →    [text, place_detail, image_gallery]
"Compare these two restaurants"  →    [text, comparison, quick_actions]
"Plan my morning"                →    [text, tour_timeline, map(with route), quick_actions]
"What's the best pagoda?"        →    [text, place_cards(ranked), map]
"Show me on the map"             →    [text, map(highlighted markers)]
```

### Key Architecture: AI → Server → Client

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  DeepSeek    │────▶│  /api/chat       │────▶│  ChatView +             │
│  interprets  │     │  stores messages │     │  DynamicRenderer        │
│  selects     │     │  resolves        │     │                         │
│  components  │     │  place_ids→data  │     │  ui_components[]        │
│              │     │                  │     │  mapped to React blocks │
└─────────────┘     └──────────────────┘     └─────────────────────────┘
     AI is               Server is                Client is
   UX designer        data resolver          component runtime
```

### Favorite Toggle Flow

```
User clicks heart on PlaceCard
        │
        ▼ (optimistic)
  UI: heart fills immediately
        │
        ▼
  POST /api/favorites { place_id: "uuid-from-db" }
        │
        ├── Success → no change
        │
        └── Error → UI: unfill heart, toast "Couldn't save"
```

### Tour Generation Flow (DeepSeek + Mapbox Routing)

```
User selects places (checkboxes on PlaceCards) → all are from DB
        │
        ▼
  Clicks "Generate Tour" → POST /api/tour/generate
        │
        ▼
  Server: fetch places from their respective category tables by (place_type, place_id) pairs
        │
        ├── Step 1: DeepSeek planning
        │   "Order these stops logically. Estimate time-at-place. Add tips."
        │   → [{ place_id: "id-1", stop_order: 1, estimated_duration_min: 45, tips: "..." }]
        │
        ├── Step 2: Mapbox Directions
        │   GET .../driving/lng1,lat1;lng2,lat2;lng3,lat3
        │   ?geometries=geojson&steps=true&overview=full
        │   → { geometry: GeoJSON.LineString (real road!), legs: [{ distance, duration, steps }] }
        │
        ├── Step 3: Merge
        │   Per stop: DeepSeek (time-at-place + tips) + Mapbox leg (travel_to_next)
        │   Last stop: travel_to_next = null
        │
        ▼
  Return { tour: { stops[] with travel_to_next }, route_geometry, totals }
        │
        ▼
  Client renders:
    TourTimeline: each stop shows location + travel summary between
    TourMap: renders route_geometry as GeoJSON polyline (real road curve!)
        │
        ▼
  User clicks "Save Tour"
        │
        ▼
  POST /api/tours { title, route_geometry, stops: [{ place_type, place_id, ..., travel_* }] }
  → stores route_geometry in tours, travel columns + polymorphic refs in tour_stops
```

---

## 13. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...    # server-only, for admin ops
DEEPSEEK_API_KEY=sk-xxxxx...
MAPBOX_ACCESS_TOKEN=pk.xxxxx...           # Mapbox Directions API (server-side, free 100k req/month)
```

---

## 14. Implementation Phases

| Phase                     | What                                                                                                                                                                                                                    | Files                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **1. Scaffold**           | `create-next-app`, install deps, shadcn/ui init, Tailwind setup, env vars                                                                                                                                               | `package.json`, `tailwind.config.ts`, `.env.local`                                 |
| **2. Supabase Init**      | Supabase project, run migration SQL (22 category tables + favorites + tours + chat + nearby_places_all() + RLS + indexes), client/server/middleware libs                                                                | `lib/supabase/*`, `middleware.ts`, `supabase/migrations/`                          |
| **3. Seed Data**          | Insert Pyay places into 22 category tables (restaurants, hotels, pagodas, etc.) with coordinates, descriptions, images, tags                                                                                            | `supabase/seed.sql`                                                                |
| **4. Auth** | Google OAuth (primary) + email/password login/signup pages, OAuth callback route, AuthGuard, SupabaseProvider, Navbar with avatar | `app/auth/*`, `components/auth/*`, `components/providers/*`, `components/layout/*` |
| **5. Types & Utils**      | Define all TypeScript types (including UIComponent union), utility functions, component-registry                                                                                                                        | `lib/types.ts`, `lib/utils.ts`, `lib/component-registry.ts`                        |
| **6. Location**           | Geolocation hook, geocoding utility, debounce hook                                                                                                                                                                      | `hooks/useGeolocation.ts`, `hooks/useDebounce.ts`, `lib/location.ts`               |
| **7. API Routes**         | All `/api/*` routes with Zod validation, DB queries, and error handling (chat, recommend, tour, favorites, history)                                                                                                     | `app/api/**/route.ts`                                                              |
| **8. DeepSeek + Routing** | DeepSeek API client + all prompt templates (chat with ui_components, tour planning), Mapbox Directions client (`lib/routing.ts`), GeoJSON route polyline handling                                                       | `lib/deepseek.ts`, `lib/chat.ts`, `lib/routing.ts`                                 |
| **9. Dynamic Renderer**   | `DynamicRenderer.tsx` + all 8 block components (TextBlock, MapBlock(with route support), PlaceCardsBlock, PlaceDetailBlock, TourTimelineBlock(with travel info), ImageGalleryBlock, ComparisonBlock, QuickActionsBlock) | `components/chat/DynamicRenderer.tsx`, `components/chat/blocks/*`                  |
| **10. Chat Page**         | Landing page (`app/page.tsx`) with ChatView, ChatMessage, ChatInput, ChatSessionList, useChat hook, welcome + suggestions                                                                                               | `app/page.tsx`, `components/chat/*`, `hooks/useChat.ts`                            |
| **11. Explore Page**      | Standalone map page (accessed from nav or chat action), MapView, PlaceCard, CategoryTabs                                                                                                                                | `app/explore/page.tsx`, `components/explore/*`                                     |
| **12. Favorites**         | Favorites page, SaveButton (references place_id), useFavorites hook                                                                                                                                                     | `app/favorites/page.tsx`, `components/favorites/*`, `hooks/useFavorites.ts`        |
| **13. Tour**              | Tour generation, TourTimeline, TourMap, save/load tours (all stops reference place_id)                                                                                                                                  | `app/tour/**`, `components/tour/*`, `hooks/useTours.ts`                            |
| **14. Polish**            | Loading skeletons, error toasts, mobile responsive, animations, expand-to-fullscreen for inline blocks, session persistence                                                                                             | All components                                                                     |

---

## 15. Outstanding Decisions

| #   | Decision           | Options                                | Default Pick                                                                              |
| --- | ------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | **Map tiles**      | Free OpenStreetMap vs. paid MapTiler   | OSM (free, no API key)                                                                    |
| 2   | **Geocoding**      | Free Nominatim vs. paid Google/Mapbox  | Nominatim (free, rate-limited)                                                            |
| 3   | **DeepSeek model** | `deepseek-chat` vs `deepseek-reasoner` | `deepseek-chat` (faster, cheaper, sufficient)                                             |
| 4   | **Tour routing**   | Straight line vs real road routing     | Mapbox Directions (real GeoJSON roads, turn-by-turn, 100k free/month, up to 25 waypoints) |
