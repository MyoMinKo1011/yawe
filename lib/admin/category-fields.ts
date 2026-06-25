export interface CategoryField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "textarea" | "tags" | "json";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

import { PRICE_RANGE_OPTIONS } from "@/lib/utils";

const COMMON = {
  opening_hours: { key: "opening_hours", label: "Opening Hours", type: "text" as const, placeholder: "e.g. 9:00 AM - 9:00 PM" },
  price_range: { key: "price_range", label: "Price Range", type: "select" as const, options: PRICE_RANGE_OPTIONS },
  entry_fee: { key: "entry_fee", label: "Entry Fee", type: "text" as const, placeholder: "e.g. Free, 1000 MMK" },
  is_24hr: { key: "is_24hr", label: "24 Hours", type: "boolean" as const },
  has_parking: { key: "has_parking", label: "Has Parking", type: "boolean" as const },
};

export const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  restaurant: [
    { key: "cuisine_type", label: "Cuisine Type", type: "select", options: [
      { label: "Myanmar", value: "myanmar" },
      { label: "Chinese", value: "chinese" },
      { label: "Thai", value: "thai" },
      { label: "BBQ", value: "bbq" },
      { label: "Indian", value: "indian" },
      { label: "Western", value: "western" },
      { label: "Japanese", value: "japanese" },
      { label: "Korean", value: "korean" },
      { label: "Mixed", value: "mixed" },
    ]},
    COMMON.price_range,
    COMMON.opening_hours,
    { key: "has_delivery", label: "Has Delivery", type: "boolean" },
    { key: "has_vegetarian", label: "Vegetarian Options", type: "boolean" },
    { key: "has_alcohol", label: "Alcohol Served", type: "boolean" },
    { key: "seating_capacity", label: "Seating Capacity", type: "number" },
    { key: "specialities", label: "Specialities (tags)", type: "tags", placeholder: "Mohinga, Curry, ..." },
    { key: "menu", label: "Menu (JSON)", type: "json", placeholder: '[{"name":"Mohinga","price":"2,000 Ks"}]' },
  ],

  hotel: [
    { key: "star_rating", label: "Star Rating", type: "select", options: [
      { label: "1 Star", value: "1" },
      { label: "2 Stars", value: "2" },
      { label: "3 Stars", value: "3" },
      { label: "4 Stars", value: "4" },
      { label: "5 Stars", value: "5" },
    ]},
    COMMON.price_range,
    { key: "room_types", label: "Room Types (JSON)", type: "json", placeholder: '["Single","Double","Suite"]' },
    { key: "amenities", label: "Amenities (tags)", type: "tags", placeholder: "WiFi, Pool, Gym, ..." },
    { key: "check_in_time", label: "Check-in Time", type: "text", placeholder: "2:00 PM" },
    { key: "check_out_time", label: "Check-out Time", type: "text", placeholder: "12:00 PM" },
    { key: "total_rooms", label: "Total Rooms", type: "number" },
    { key: "booking_url", label: "Booking URL", type: "text", placeholder: "https://..." },
    { key: "packages", label: "Packages (JSON)", type: "json", placeholder: '[{"name":"1 Night","price":"80,000 Ks","includes":"Breakfast"}]' },
  ],

  pagoda: [
    { key: "history", label: "History", type: "textarea" },
    { key: "built_century", label: "Built Century", type: "number" },
    { key: "architecture_style", label: "Architecture Style", type: "text", placeholder: "e.g. Burmese, Mon" },
    { key: "relics", label: "Relics", type: "text" },
    { key: "festival_dates", label: "Festival Dates", type: "text", placeholder: "e.g. Tazaungmon full moon" },
    { key: "dress_code", label: "Dress Code", type: "textarea" },
    COMMON.entry_fee,
    COMMON.opening_hours,
    { key: "monks_residing", label: "Monks Residing", type: "number" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],

  archaeological_site: [
    { key: "history", label: "History", type: "textarea" },
    { key: "historical_period", label: "Historical Period", type: "text", placeholder: "e.g. Pyu, Bagan era" },
    { key: "unesco_status", label: "UNESCO Status", type: "boolean" },
    { key: "excavation_status", label: "Excavation Status", type: "text", placeholder: "Active / Completed / Partial" },
    { key: "guided_tours", label: "Guided Tours Available", type: "boolean" },
    COMMON.entry_fee,
    COMMON.opening_hours,
    { key: "site_area_hectares", label: "Area (hectares)", type: "number" },
  ],

  monument: [
    { key: "built_year", label: "Built Year", type: "number" },
    { key: "dedicated_to", label: "Dedicated To", type: "text" },
    { key: "material", label: "Material", type: "text", placeholder: "e.g. Brick, Stone, Marble" },
    { key: "height_meters", label: "Height (meters)", type: "number" },
    { key: "is_accessible", label: "Publicly Accessible", type: "boolean" },
  ],

  attraction: [
    { key: "sub_category", label: "Sub Category", type: "text", placeholder: "e.g. Viewpoint, Garden, Museum" },
    COMMON.entry_fee,
    COMMON.opening_hours,
    { key: "best_visit_time", label: "Best Visit Time", type: "text", placeholder: "e.g. Morning, Sunset" },
    { key: "family_friendly", label: "Family Friendly", type: "boolean" },
    COMMON.has_parking,
  ],

  ktv: [
    { key: "room_count", label: "Room Count", type: "number" },
    { key: "price_per_hour", label: "Price per Hour", type: "text", placeholder: "e.g. 10,000 MMK" },
    COMMON.opening_hours,
    { key: "has_food_menu", label: "Food Menu", type: "boolean" },
    { key: "has_alcohol", label: "Alcohol", type: "boolean" },
    { key: "private_rooms", label: "Private Rooms", type: "boolean" },
    { key: "sound_quality", label: "Sound Quality", type: "select", options: [
      { label: "Standard", value: "standard" },
      { label: "Good", value: "good" },
      { label: "Excellent", value: "excellent" },
    ]},
  ],

  transportation: [
    { key: "transport_type", label: "Type", type: "select", options: [
      { label: "Bus Station", value: "bus_station" },
      { label: "Train Station", value: "train_station" },
      { label: "Motorcycle Taxi Stand", value: "motorcycle_taxi_stand" },
      { label: "Tuk Tuk Stand", value: "tuk_tuk" },
    ]},
    { key: "routes", label: "Routes (JSON)", type: "json", placeholder: '["Pyay-Yangon","Pyay-Mandalay","Pyay-Naypyidaw"]' },
    { key: "schedule", label: "Schedule", type: "text" },
    { key: "fare_range", label: "Fare Range", type: "text", placeholder: "e.g. 500-5000 MMK" },
    { key: "operator", label: "Operator", type: "text" },
  ],

  convenience_store: [
    { key: "chain", label: "Chain", type: "text", placeholder: "e.g. 7-Eleven, ABC" },
    COMMON.is_24hr,
    COMMON.opening_hours,
    { key: "services", label: "Services (tags)", type: "tags", placeholder: "ATM, Bill Pay, ..." },
    COMMON.has_parking,
  ],

  pharmacy: [
    COMMON.is_24hr,
    COMMON.opening_hours,
    { key: "has_prescription", label: "Prescription Service", type: "boolean" },
    { key: "has_delivery", label: "Delivery", type: "boolean" },
    { key: "accepts_insurance", label: "Accepts Insurance", type: "boolean" },
  ],

  market: [
    { key: "market_type", label: "Market Type", type: "select", options: [
      { label: "Night Market", value: "night_market" },
      { label: "Supermarket", value: "supermarket" },
      { label: "Shopping Mall", value: "shopping_mall" },
      { label: "Street Market", value: "street_market" },
      { label: "Central Market", value: "central_market" },
    ]},
    { key: "operating_days", label: "Operating Days", type: "text", placeholder: "e.g. Mon-Sun" },
    COMMON.opening_hours,
    { key: "stall_count", label: "Stall Count", type: "number" },
    COMMON.has_parking,
    { key: "popular_for", label: "Popular For", type: "text" },
  ],

  school: [
    { key: "institution_type", label: "Institution Type", type: "select", options: [
      { label: "University", value: "university" },
      { label: "College", value: "college" },
      { label: "High School", value: "high_school" },
      { label: "Primary School", value: "primary_school" },
      { label: "Language Center", value: "language_center" },
      { label: "Monastery School", value: "monastery_school" },
      { label: "Vocational School", value: "vocational_school" },
    ]},
    { key: "programs", label: "Programs (JSON)", type: "json", placeholder: '["Computer Science","Business","Engineering"]' },
    { key: "student_count", label: "Student Count", type: "number" },
    { key: "established_year", label: "Established Year", type: "number" },
    { key: "is_private", label: "Private Institution", type: "boolean" },
    { key: "website", label: "Website", type: "text", placeholder: "https://..." },
  ],

  hospital: [
    { key: "hospital_type", label: "Hospital Type", type: "select", options: [
      { label: "General Hospital", value: "general_hospital" },
      { label: "Clinic", value: "clinic" },
      { label: "Traditional Medicine", value: "traditional_medicine" },
    ]},
    { key: "has_emergency", label: "Emergency Service", type: "boolean" },
    COMMON.is_24hr,
    { key: "bed_count", label: "Bed Count", type: "number" },
    { key: "departments", label: "Departments (tags)", type: "tags", placeholder: "Surgery, Pediatrics, ..." },
    COMMON.opening_hours,
  ],

  bank_atm: [
    { key: "bank_name", label: "Bank Name", type: "text" },
    { key: "has_atm", label: "Has ATM", type: "boolean" },
    { key: "has_currency_exchange", label: "Currency Exchange", type: "boolean" },
    { key: "is_24hr_atm", label: "24hr ATM", type: "boolean" },
    COMMON.opening_hours,
  ],

  police_station: [
    { key: "station_type", label: "Station Type", type: "select", options: [
      { label: "Township", value: "township" },
      { label: "District", value: "district" },
    ]},
    COMMON.is_24hr,
    { key: "emergency_phone", label: "Emergency Phone", type: "text" },
    { key: "jurisdiction", label: "Jurisdiction", type: "text" },
    { key: "services", label: "Services (JSON)", type: "json", placeholder: '["Passport Application","Visa Extension","Complaint Filing"]' },
    COMMON.opening_hours,
  ],

  gas_station: [
    { key: "chain", label: "Chain", type: "text", placeholder: "e.g. Max, Denko" },
    { key: "fuel_types", label: "Fuel Types (tags)", type: "tags", placeholder: "Diesel, 92, 95, ..." },
    COMMON.is_24hr,
    COMMON.opening_hours,
    { key: "has_shop", label: "Convenience Shop", type: "boolean" },
    { key: "has_restroom", label: "Restroom", type: "boolean" },
    { key: "has_air_pump", label: "Air Pump", type: "boolean" },
    { key: "payment_methods", label: "Payment Methods (tags)", type: "tags", placeholder: "Cash, Card, KPay, ..." },
  ],

  post_office: [
    { key: "postal_code", label: "Postal Code", type: "text" },
    { key: "services", label: "Services (JSON)", type: "json", placeholder: '["Mail","Parcel","Money Transfer"]' },
    COMMON.opening_hours,
    { key: "has_po_box", label: "P.O. Box Available", type: "boolean" },
  ],

  park: [
    { key: "park_type", label: "Park Type", type: "select", options: [
      { label: "Public Garden", value: "public_garden" },
    ]},
    { key: "area_hectares", label: "Area (hectares)", type: "number" },
    { key: "amenities", label: "Amenities (tags)", type: "tags", placeholder: "Playground, Benches, Toilets, ..." },
    COMMON.opening_hours,
    COMMON.entry_fee,
    { key: "pet_allowed", label: "Pets Allowed", type: "boolean" },
    { key: "is_gated", label: "Gated", type: "boolean" },
  ],

  gym_fitness: [
    { key: "equipment", label: "Equipment (tags)", type: "tags", placeholder: "Treadmill, Dumbbells, ..." },
    { key: "has_trainer", label: "Personal Trainer", type: "boolean" },
    { key: "has_shower", label: "Shower", type: "boolean" },
    { key: "has_lockers", label: "Lockers", type: "boolean" },
    { key: "has_air_con", label: "Air Conditioning", type: "boolean" },
    { key: "monthly_fee", label: "Monthly Fee", type: "text", placeholder: "e.g. 50,000 MMK" },
    { key: "day_pass_fee", label: "Day Pass Fee", type: "text", placeholder: "e.g. 5,000 MMK" },
    COMMON.opening_hours,
  ],

  coffee_shop: [
    { key: "has_wifi", label: "WiFi", type: "boolean" },
    { key: "has_ac", label: "Air Conditioning", type: "boolean" },
    { key: "has_outdoor", label: "Outdoor Seating", type: "boolean" },
    { key: "has_food", label: "Food Available", type: "boolean" },
    { key: "seating_capacity", label: "Seating Capacity", type: "number" },
    COMMON.opening_hours,
    COMMON.price_range,
    { key: "popular_drinks", label: "Popular Drinks (JSON)", type: "json", placeholder: '["Latte","Espresso","Cold Brew"]' },
    { key: "menu", label: "Menu (JSON)", type: "json", placeholder: '[{"name":"Latte","price":"3,500 Ks"}]' },
  ],

  bakery: [
    { key: "specialities", label: "Specialities (tags)", type: "tags", placeholder: "Bread, Cake, Pastry, ..." },
    { key: "has_seating", label: "Dine-in Seating", type: "boolean" },
    { key: "has_delivery", label: "Delivery", type: "boolean" },
    { key: "accepts_orders", label: "Custom Orders", type: "boolean" },
    COMMON.opening_hours,
    COMMON.price_range,
    { key: "menu", label: "Menu (JSON)", type: "json", placeholder: '[{"name":"Chocolate Cake","price":"5,000 Ks"}]' },
  ],

  salon: [
    { key: "salon_type", label: "Salon Type", type: "select", options: [
      { label: "Hair Salon", value: "hair_salon" },
      { label: "Barber Shop", value: "barber_shop" },
      { label: "Nail Spa", value: "nail_spa" },
      { label: "Massage", value: "massage" },
      { label: "Facial / Skincare", value: "facial_skincare" },
      { label: "Traditional Massage", value: "traditional_massage" },
      { label: "Unisex", value: "unisex" },
    ]},
    { key: "services", label: "Services (tags)", type: "tags", placeholder: "Haircut, Coloring, Manicure, ..." },
    { key: "has_appointment", label: "Appointment Required", type: "boolean" },
    COMMON.price_range,
    COMMON.opening_hours,
    { key: "staff_count", label: "Staff Count", type: "number" },
  ],
};
