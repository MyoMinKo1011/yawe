"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { Map, Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import type { NearbyPlace } from "@/lib/types";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Badge } from "@/components/ui/badge";
import { placeTypeLabel, formatDistance, formatDuration, formatPriceRange } from "@/lib/utils";
import {
  MapPin,
  Navigation,
  X,
  Star,
  Clock,
  Phone,
  Search,
  SlidersHorizontal,
  UtensilsCrossed,
  Building2,
  Landmark,
  Pyramid,
  MapPinned,
  Sparkles,
  Music,
  Bus,
  ShoppingCart,
  Pill,
  Store,
  GraduationCap,
  Hospital,
  LandmarkIcon,
  ShieldCheck,
  Fuel,
  Mail,
  Trees,
  Dumbbell,
  Coffee,
  CakeSlice,
  Scissors,
  AlertTriangle,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const PYAY_CENTER = { lat: 18.8244, lng: 95.2179 };

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "#dc2626",
  hotel: "#7c3aed",
  pagoda: "#f59e0b",
  archaeological_site: "#8B4513",
  monument: "#6366f1",
  attraction: "#0891b2",
  ktv: "#ec4899",
  transportation: "#64748b",
  convenience_store: "#10b981",
  pharmacy: "#ef4444",
  market: "#f97316",
  school: "#3b82f6",
  hospital: "#dc2626",
  bank_atm: "#14b8a6",
  police_station: "#1e40af",
  gas_station: "#eab308",
  post_office: "#8b5cf6",
  park: "#22c55e",
  gym_fitness: "#a855f7",
  coffee_shop: "#92400e",
  bakery: "#d97706",
  salon: "#db2777",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#6b7280";
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  restaurant: <UtensilsCrossed size={12} strokeWidth={2.5} />,
  hotel: <Building2 size={12} strokeWidth={2.5} />,
  pagoda: <Landmark size={12} strokeWidth={2.5} />,
  archaeological_site: <Pyramid size={12} strokeWidth={2.5} />,
  monument: <MapPinned size={12} strokeWidth={2.5} />,
  attraction: <Sparkles size={12} strokeWidth={2.5} />,
  ktv: <Music size={12} strokeWidth={2.5} />,
  transportation: <Bus size={12} strokeWidth={2.5} />,
  convenience_store: <ShoppingCart size={12} strokeWidth={2.5} />,
  pharmacy: <Pill size={12} strokeWidth={2.5} />,
  market: <Store size={12} strokeWidth={2.5} />,
  school: <GraduationCap size={12} strokeWidth={2.5} />,
  hospital: <Hospital size={12} strokeWidth={2.5} />,
  bank_atm: <LandmarkIcon size={12} strokeWidth={2.5} />,
  police_station: <ShieldCheck size={12} strokeWidth={2.5} />,
  gas_station: <Fuel size={12} strokeWidth={2.5} />,
  post_office: <Mail size={12} strokeWidth={2.5} />,
  park: <Trees size={12} strokeWidth={2.5} />,
  gym_fitness: <Dumbbell size={12} strokeWidth={2.5} />,
  coffee_shop: <Coffee size={12} strokeWidth={2.5} />,
  bakery: <CakeSlice size={12} strokeWidth={2.5} />,
  salon: <Scissors size={12} strokeWidth={2.5} />,
};

function getCategoryIcon(category: string): React.ReactNode {
  return CATEGORY_ICONS[category] ?? <MapPin size={12} strokeWidth={2.5} />;
}

interface RouteData {
  route: GeoJSON.Geometry;
  distance: number;
  duration: number;
  steps: Array<{
    maneuver: Record<string, unknown>;
    distance: number;
    duration: number;
    name: string;
  }>;
}

function getData(place: NearbyPlace, key: string) {
  return (place.data as Record<string, unknown>)?.[key];
}

const DATA_FIELD_LABELS: Record<string, string> = {
  cuisine_type: "Cuisine",
  price_range: "Price",
  specialities: "Specialities",
  opening_hours: "Hours",
  has_delivery: "Delivery",
  has_vegetarian: "Vegetarian",
  has_alcohol: "Alcohol",
  seating_capacity: "Seating",
  menu: "Menu",
  star_rating: "Stars",
  room_types: "Room Types",
  amenities: "Amenities",
  check_in_time: "Check-in",
  check_out_time: "Check-out",
  total_rooms: "Rooms",
  booking_url: "Booking",
  packages: "Packages",
  history: "History",
  built_century: "Built",
  architecture_style: "Style",
  relics: "Relics",
  festival_dates: "Festival",
  dress_code: "Dress Code",
  entry_fee: "Entry Fee",
  monks_residing: "Monks",
  is_active: "Active",
  historical_period: "Period",
  unesco_status: "UNESCO",
  excavation_status: "Excavation",
  guided_tours: "Guided Tours",
  site_area_hectares: "Area (ha)",
  built_year: "Built",
  dedicated_to: "Dedicated To",
  material: "Material",
  height_meters: "Height (m)",
  is_accessible: "Accessible",
  sub_category: "Type",
  best_visit_time: "Best Time",
  family_friendly: "Family Friendly",
  has_parking: "Parking",
  room_count: "Rooms",
  price_per_hour: "Price/hr",
  has_food_menu: "Food Menu",
  private_rooms: "Private Rooms",
  sound_quality: "Sound",
  transport_type: "Type",
  routes: "Routes",
  schedule: "Schedule",
  fare_range: "Fare",
  operator: "Operator",
  chain: "Chain",
  is_24hr: "24 Hours",
  services: "Services",
  has_prescription: "Prescription",
  accepts_insurance: "Insurance",
  market_type: "Type",
  operating_days: "Days",
  stall_count: "Stalls",
  popular_for: "Popular For",
  institution_type: "Type",
  programs: "Programs",
  student_count: "Students",
  established_year: "Est.",
  is_private: "Private",
  website: "Website",
  hospital_type: "Type",
  has_emergency: "Emergency",
  bed_count: "Beds",
  departments: "Departments",
  bank_name: "Bank",
  has_atm: "ATM",
  has_currency_exchange: "Exchange",
  is_24hr_atm: "24hr ATM",
  station_type: "Type",
  emergency_phone: "Emergency",
  jurisdiction: "Jurisdiction",
  fuel_types: "Fuel",
  has_shop: "Shop",
  has_restroom: "Restroom",
  has_air_pump: "Air Pump",
  payment_methods: "Payments",
  postal_code: "Postal Code",
  has_po_box: "PO Box",
  park_type: "Type",
  area_hectares: "Area (ha)",
  pet_allowed: "Pets",
  is_gated: "Gated",
  equipment: "Equipment",
  has_trainer: "Trainer",
  has_shower: "Shower",
  has_lockers: "Lockers",
  has_air_con: "Air Con",
  monthly_fee: "Monthly",
  day_pass_fee: "Day Pass",
  has_wifi: "WiFi",
  has_ac: "AC",
  has_outdoor: "Outdoor",
  has_food: "Food",
  popular_drinks: "Drinks",
  has_seating: "Seating",
  accepts_orders: "Orders",
  salon_type: "Type",
  has_appointment: "Appointment",
  staff_count: "Staff",
  contact: "Contact",
};

const SKIP_DATA_KEYS = new Set(["opening_hours", "price_range", "contact"]);

function DataDetails({ place }: { place: NearbyPlace }) {
  const data = place.data as Record<string, unknown> ?? {};
  const entries = Object.entries(data)
    .filter(([key]) => !SKIP_DATA_KEYS.has(key))
    .filter(([, val]) => {
      if (val === null || val === undefined || val === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      if (typeof val === "object" && Object.keys(val as object).length === 0) return false;
      return true;
    });

  if (entries.length === 0) return null;

  return (
    <div className="px-3 pb-3 border-t border-border pt-2 mt-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Details
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {entries.map(([key, val]) => (
          <span key={key} className="text-[11px] leading-relaxed">
            <span className="text-muted-foreground">
              {DATA_FIELD_LABELS[key] ?? key}:
            </span>{" "}
            <span className="text-foreground">
              {formatDataValue(val)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function formatDataValue(val: unknown): string {
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) return val.map(String).join(", ");
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return "";
    return keys.slice(0, 2).map(k => `${k}: ${String(obj[k])}`).join("; ") + (keys.length > 2 ? "..." : "");
  }
  return String(val);
}

async function fetchRoute(
  origin: { lng: number; lat: number },
  dest: { lng: number; lat: number },
): Promise<RouteData | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&steps=true&overview=full&language=my&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.length) return null;
    const r = data.routes[0];
    return {
      route: r.geometry,
      distance: r.distance,
      duration: r.duration,
      steps: r.legs[0]?.steps ?? [],
    };
  } catch {
    return null;
  }
}

function maneuverIcon(type: string) {
  switch (type) {
    case "arrive":
      return "🏁";
    case "turn":
      return "↪";
    case "depart":
      return "🚗";
    case "continue":
      return "↑";
    default:
      return "→";
  }
}

export default function ExplorePage() {
  const mapRef = useRef<MapRef>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const { location, error: geoError, loading: geoLoading, getLocation } =
    useGeolocation();
  const isRealLocation = location != null && !geoError;
  const effectiveLocation = location ?? PYAY_CENTER;

  const fetchPlaces = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, radius: 15 }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlaces(data.places ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaces(effectiveLocation.lat, effectiveLocation.lng);
  }, [effectiveLocation.lat, effectiveLocation.lng, fetchPlaces]);

  useEffect(() => {
    if (!showFilterDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-filter-dropdown]")) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFilterDropdown]);

  // Derive available categories from loaded places
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of places) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats);
  }, [places]);

  // Filter places by search + category
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.address ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategories.size === 0 || activeCategories.has(p.category);
      return matchesSearch && matchesCategory;
    });
  }, [places, searchQuery, activeCategories]);

  const onMapLoad = useCallback(() => {
    if (!mapRef.current || !filteredPlaces.length) return;
    const bounds = new LngLatBounds();
    for (const p of filteredPlaces) bounds.extend([p.lng, p.lat]);
    bounds.extend([effectiveLocation.lng, effectiveLocation.lat]);
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
  }, [filteredPlaces, effectiveLocation]);

  const handleSelectPlace = useCallback(
    async (place: NearbyPlace) => {
      setSelectedPlace(place);
      setShowDirections(false);
      mapRef.current?.flyTo({
        center: [place.lng, place.lat],
        zoom: 15,
        duration: 700,
      });

      const route = await fetchRoute(effectiveLocation, place);
      if (route) {
        setRouteData(route);
        const bounds = new LngLatBounds();
        bounds.extend([effectiveLocation.lng, effectiveLocation.lat]);
        bounds.extend([place.lng, place.lat]);
        setTimeout(() => {
          mapRef.current?.fitBounds(bounds, { padding: 80, maxZoom: 15 });
        }, 800);
      }
    },
    [effectiveLocation],
  );

  const deselectPlace = () => {
    setSelectedPlace(null);
    setRouteData(null);
    setShowDirections(false);
  };

  const isSelected = (place: NearbyPlace) =>
    selectedPlace?.place_id === place.place_id;

  return (
    <div className="flex-1 relative">
      {/* Top overlay: search + filter */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-3 px-3">
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="နေရာရှာရန်..."
              className="w-full h-10 pl-9 pr-8 rounded-full border border-border/80 bg-background/90 backdrop-blur shadow-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter button */}
          <div className="relative" data-filter-dropdown>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`shrink-0 w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all ${
                activeCategories.size > 0
                  ? "bg-primary text-white border-primary"
                  : "bg-background/90 backdrop-blur border-border/80 hover:bg-muted"
              }`}
            >
              <SlidersHorizontal size={17} />
            </button>

            {/* Filter dropdown */}
            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-background rounded-2xl border border-border shadow-xl overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    အမျိုးအစား စစ်ရန်
                  </span>
                  <button
                    onClick={() => setActiveCategories(new Set())}
                    className="text-[10px] text-primary hover:underline"
                  >
                    ရှင်းရန်
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin p-2">
                  {availableCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={activeCategories.has(cat)}
                        onChange={(e) => {
                          const next = new Set(activeCategories);
                          if (e.target.checked) {
                            next.add(cat);
                          } else {
                            next.delete(cat);
                          }
                          setActiveCategories(next);
                        }}
                        className="rounded border-border text-primary focus:ring-primary"
                        style={{ accentColor: getCategoryColor(cat) }}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(cat) }}
                      />
                      <span className="text-xs">{placeTypeLabel(cat)}</span>
                    </label>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    စစ်ထုတ်မည်
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh location */}
          <button
            onClick={getLocation}
            className={`shrink-0 w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border/80 shadow-md flex items-center justify-center hover:bg-muted transition-all ${geoLoading ? "animate-pulse" : ""}`}
            aria-label="တည်နေရာ ထပ်ရှာရန်"
          >
            <Navigation size={17} />
          </button>
        </div>

        {/* Geolocation error banner */}
        {geoError && !isRealLocation && (
          <div className="mt-2 mx-auto max-w-md flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-xs text-amber-800 shadow-md">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="truncate flex-1">{geoError}</span>
            <button
              onClick={getLocation}
              className="shrink-0 font-medium underline hover:text-amber-900"
            >
              ထပ်ကြိုးစား
            </button>
          </div>
        )}

        {/* Active filter chips */}
        {activeCategories.size > 0 && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none pb-1 px-1">
            {Array.from(activeCategories).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const next = new Set(activeCategories);
                  next.delete(cat);
                  setActiveCategories(next);
                }}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-white shadow-sm transition-all"
                style={{ backgroundColor: getCategoryColor(cat) }}
              >
                {placeTypeLabel(cat)}
                <X size={11} />
              </button>
            ))}
            {activeCategories.size > 1 && (
              <button
                onClick={() => setActiveCategories(new Set())}
                className="shrink-0 px-2.5 py-1.5 rounded-full text-xs bg-background/90 backdrop-blur border border-border/60 text-muted-foreground hover:bg-muted shadow-sm"
              >
                အားလုံးရှင်းရန်
              </button>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center mt-2">
            <div className="bg-background/90 backdrop-blur border border-border rounded-full px-3 py-1 text-xs shadow-md text-muted-foreground animate-pulse">
              ရှာဖွေနေသည်...
            </div>
          </div>
        )}

        {/* Result count */}
        {!loading && (searchQuery || activeCategories.size > 0) && (
          <div className="flex justify-center mt-2">
            <div className="bg-background/90 backdrop-blur border border-border rounded-full px-3 py-1 text-xs shadow-md text-muted-foreground">
              {filteredPlaces.length} နေရာ
            </div>
          </div>
        )}
      </div>

      {!MAPBOX_TOKEN ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Mapbox token လိုအပ်ပါသည်
        </div>
      ) : (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: effectiveLocation.lng,
            latitude: effectiveLocation.lat,
            zoom: 13,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onLoad={onMapLoad}
          reuseMaps
          onClick={deselectPlace}
        >
          {routeData && (
            <Source id="route" type="geojson" data={routeData.route}>
              <Layer
                id="route-line"
                type="line"
                layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{
                  "line-color": "#2563eb",
                  "line-width": 4,
                  "line-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {isRealLocation && location && (
            <Marker
              longitude={location.lng}
              latitude={location.lat}
              anchor="center"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-200 animate-pulse" />
            </Marker>
          )}

          {filteredPlaces.map((place, i) => {
            const sel = isSelected(place);
            const color = getCategoryColor(place.category);
            return (
              <Marker
                key={`${place.category}-${place.place_id}-${i}`}
                longitude={place.lng}
                latitude={place.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleSelectPlace(place);
                }}
              >
                <div
                  className="relative cursor-pointer transition-transform duration-200 hover:scale-125"
                  style={{
                    width: sel ? 38 : 30,
                    height: sel ? 38 : 30,
                  }}
                >
                  <div
                    className="flex items-center justify-center border-2 border-white shadow-lg"
                    style={{
                      borderRadius: "50% 50% 50% 0",
                      transform: "rotate(-45deg)",
                      width: "100%",
                      height: "100%",
                      backgroundColor: sel ? "#ef4444" : color,
                    }}
                  >
                    <div
                      style={{
                        transform: "rotate(45deg)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getCategoryIcon(place.category)}
                    </div>
                  </div>
                </div>
              </Marker>
            );
          })}

          {selectedPlace && (
            <Popup
              longitude={selectedPlace.lng}
              latitude={selectedPlace.lat}
              anchor="bottom"
              offset={35}
              onClose={deselectPlace}
              closeButton={false}
              className="[&_.mapboxgl-popup-content]:rounded-xl [&_.mapboxgl-popup-content]:p-0 [&_.mapboxgl-popup-content]:shadow-xl [&_.mapboxgl-popup-content]:overflow-hidden [&_.mapboxgl-popup-tip]:hidden"
              maxWidth="300px"
            >
              <div className="w-[280px] max-h-[60vh] overflow-y-auto scrollbar-thin">
                <button
                  onClick={deselectPlace}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-muted"
                >
                  <X size={12} />
                </button>

                <div className="p-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] mb-1"
                    style={{
                      borderColor: getCategoryColor(selectedPlace.category),
                      color: getCategoryColor(selectedPlace.category),
                    }}
                  >
                    {placeTypeLabel(selectedPlace.category)}
                  </Badge>
                  <h3 className="text-sm font-bold">{selectedPlace.name}</h3>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {selectedPlace.rating ? (
                      <span className="text-xs flex items-center gap-0.5">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        {selectedPlace.rating.toFixed(1)}
                      </span>
                    ) : null}

                    {/* Unified distance: use Directions route data if available, else Matrix */}
                    {!routeData && isRealLocation && selectedPlace.distance_km > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        🚗 {formatDistance(selectedPlace.distance_km)}
                        {selectedPlace.duration_sec > 0
                          ? ` · ~${formatDuration(selectedPlace.duration_sec)}`
                          : ""}
                      </span>
                    ) : null}
                    {routeData && routeData.distance > 0 ? (
                      <span className="text-xs font-medium text-blue-700">
                        🚗 {formatDistance(routeData.distance / 1000)}
                        {" · "}~{formatDuration(routeData.duration)}
                      </span>
                    ) : null}

                    {getData(selectedPlace, "price_range") ? (
                      <Badge variant="outline" className="text-[10px]">
                        {formatPriceRange(String(getData(selectedPlace, "price_range")))}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {routeData && (
                  <div className="mx-3 mb-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {routeData.steps.length} steps
                      </span>
                      <button
                        onClick={() => setShowDirections(!showDirections)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {showDirections ? "ဖျောက်ရန် ↑" : "လမ်းညွှန် ↓"}
                      </button>
                    </div>
                    {showDirections && (
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                        {routeData.steps.map((step, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 text-xs"
                          >
                            <span className="shrink-0 mt-0.5">
                              {maneuverIcon(String(step.maneuver.type ?? ""))}
                            </span>
                            <div className="min-w-0">
                              <p className="text-foreground leading-snug">
                                {String(step.maneuver.instruction ?? "")}
                              </p>
                              <p className="text-muted-foreground">
                                {step.name} · {Math.round(step.distance)}m
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedPlace.description ? (
                  <div className="px-3 pb-2">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {selectedPlace.description}
                    </p>
                  </div>
                ) : null}

                <div className="px-3 pb-2 space-y-1">
                  {selectedPlace.address ? (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={12} className="shrink-0 mt-0.5" />
                      <span>{selectedPlace.address}</span>
                    </div>
                  ) : null}
                  {getData(selectedPlace, "opening_hours") ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>
                        {String(getData(selectedPlace, "opening_hours"))}
                      </span>
                    </div>
                  ) : null}
                  {selectedPlace.contact ||
                  getData(selectedPlace, "contact") ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone size={12} />
                      <span>
                        {selectedPlace.contact ??
                          String(getData(selectedPlace, "contact"))}
                      </span>
                    </div>
                  ) : null}
                </div>

                <DataDetails place={selectedPlace} />
              </div>
            </Popup>
          )}
        </Map>
      )}
    </div>
  );
}
