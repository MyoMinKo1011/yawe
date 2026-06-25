export const PLACE_CATEGORIES = [
  "restaurant",
  "hotel",
  "pagoda",
  "archaeological_site",
  "monument",
  "attraction",
  "ktv",
  "transportation",
  "convenience_store",
  "pharmacy",
  "market",
  "school",
  "hospital",
  "bank_atm",
  "police_station",
  "gas_station",
  "post_office",
  "park",
  "gym_fitness",
  "coffee_shop",
  "bakery",
  "salon",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export interface NearbyPlace {
  category: PlaceCategory;
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
  data: Record<string, unknown>;
  distance_km: number;
  duration_sec: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface TourStop {
  id: string;
  tour_id: string;
  place_type: PlaceCategory | null;
  place_id: string;
  stop_order: number;
  estimated_duration_min: number | null;
  tips: string | null;
  travel_distance_m: number | null;
  travel_duration_sec: number | null;
  travel_summary: string | null;
  travel_steps: unknown[];
  created_at: string;
}

export interface Tour {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_lat: number;
  start_lng: number;
  route_geometry: GeoJSON.LineString | null;
  created_at: string;
  stops?: TourStop[];
}

export interface Favorite {
  id: string;
  user_id: string;
  place_id: string;
  place_data?: Record<string, unknown>;
  created_at: string;
}

export type UIComponentType =
  | "text"
  | "map"
  | "place_cards"
  | "place_detail"
  | "tour_timeline"
  | "image_gallery"
  | "comparison"
  | "quick_actions";

export interface UIComponent {
  type: UIComponentType;
  props: Record<string, unknown>;
}

export interface AIResponse {
  reply: string;
  ui_components: UIComponent[];
  places: NearbyPlace[];
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
