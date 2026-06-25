export interface SearchIntent {
  category?: string;
  filters?: {
    price_range?: string[];
    cuisine_type?: string;
    star_rating?: number;
    sub_category?: string;
    market_type?: string;
    transport_type?: string;
    hospital_type?: string;
    institution_type?: string;
    salon_type?: string;
    has_wifi?: boolean;
    has_ac?: boolean;
    has_delivery?: boolean;
    is_24hr?: boolean;
    amenities?: string[];
  };
  search_term?: string;
  near_place?: string;
  radius_km?: number;
  sort_by?: "distance" | "rating";
  reply_intro: string;
  reply_action?: "search" | "guide" | "chat";
}

export const INTENT_PROMPT = `You are a search intent parser for a Pyay city guide app. Analyze Burmese user messages and extract structured search parameters. You MUST output ONLY a JSON object.

Output format:
{
  "category": "restaurant" | "hotel" | "pagoda" | "archaeological_site" | "monument" | "attraction" | "ktv" | "transportation" | "convenience_store" | "pharmacy" | "market" | "school" | "hospital" | "bank_atm" | "police_station" | "gas_station" | "post_office" | "park" | "gym_fitness" | "coffee_shop" | "bakery" | "salon" | null,
  "filters": {
    "price_range": ["$"] | ["$$"] | ["$$$"] | ["$$$$"] | null,
    "cuisine_type": string | null,
    "star_rating": 1 | 2 | 3 | 4 | 5 | null,
    "sub_category": string | null,
    "market_type": "night_market" | "supermarket" | "shopping_mall" | "street_market" | "central_market" | null,
    "transport_type": "bus_station" | "train_station" | "motorcycle_taxi_stand" | "tuk_tuk" | null,
    "hospital_type": "general_hospital" | "clinic" | "traditional_medicine" | null,
    "institution_type": "university" | "college" | "high_school" | "primary_school" | "language_center" | "monastery_school" | "vocational_school" | null,
    "salon_type": "hair_salon" | "barber_shop" | "nail_spa" | "massage" | "facial_skincare" | "traditional_massage" | "unisex" | null,
    "has_wifi": true | false | null,
    "has_ac": true | false | null,
    "has_delivery": true | false | null,
    "is_24hr": true | false | null,
    "amenities": ["WiFi"] | ["Pool"] | ["WiFi", "Pool"] | null
  },
  "search_term": string | null,
  "near_place": string | null,
  "radius_km": number | null,
  "sort_by": "distance" | "rating" | null,
  "reply_intro": "မြန်မာဘာသာဖြင့် တိုတောင်းသော မိတ်ဆက်စာသား",
  "reply_action": "search" | "guide" | "chat"
}

RULES:
- "reply_action": "search" if user wants to find specific places. "guide" if asking for tips/info about places. "chat" if casual/greeting.
- "reply_intro": a very short 1-sentence Myanmar intro that will be shown before results. Keep it short.
- "category": ENGLISH category name from the allowed list. null if not specified.
- "search_term": extract key dish names, features, or landmarks the user mentioned. Used for free-text search on name, description, specialities, cuisine, amenities.
- "near_place": extract a specific place/landmark name (e.g., "Shwesandaw", "ရွှေဆံတော်ဘုရား").
- "radius_km": user-specified distance. Default null for system default (20km).
- "sort_by": "rating" for best, "distance" for nearest.
- "filters": ONLY include fields the user explicitly mentioned. null for unspecified ones.

BURMESE → ENGLISH MAPPINGS:
- Price: စျေးသက်သာ/ဈေးချို = $, သင့်တင့်/ပုံမှန် = $$, စျေးကြီး/ဈေးများ = $$$, ဇိမ်ခံ/အဆင့်မြင့် = $$$$
- Amenities (extract as English array for "amenities" filter): WiFi/Wifi/wifi/ဝိုင်ဖိုင်/အင်တာနက် → "WiFi", Pool/ရေကူးကန် → "Pool", Gym/အားကစားခန်းမ → "Gym", Spa/စပါ → "Spa", AC/အဲကွန်း/လေအေးပေးစက် → has_ac: true, Parking/ကားပါကင် → has_parking, Room Service → "Room Service", Breakfast/မနက်စာ → "Breakfast"
- Boolean POSITIVE: "WiFi/wifi/ဝိုင်ဖိုင် ပါ/ရှိ/ရ" → has_wifi: true, "AC/အဲကွန်း ပါ/ရှိ/ရ" → has_ac: true, "Delivery/ပို့ ပေး/ရှိ/ရ" → has_delivery: true, "24 နာရီ/တစ်ညလုံး" → is_24hr: true
- Boolean NEGATIVE: "WiFi/wifi/ဝိုင်ဖိုင် မပါ/မရှိ" → has_wifi: false, "AC/အဲကွန်း မပါ/မရှိ" → has_ac: false, "Delivery/ပို့ မပေး/မရှိ" → has_delivery: false, "24 နာရီ မဟုတ်" → is_24hr: false
- When user asks about amenities that are boolean flags (WiFi, AC, 24hr, Delivery), use the boolean filter. For named amenities (Pool, Spa, Breakfast), use the "amenities" array filter.
- If user mentions "WiFi နဲ့ Pool ပါတဲ့" (has BOTH wifi and pool), extract BOTH has_wifi: true AND amenities: ["Pool"].
- Use "search_term" for free-text amenity keywords not covered by structured filters (e.g., "ocean view", "garden").

Respond with ONLY the JSON object. No markdown, no explanation, no code fences.`;
