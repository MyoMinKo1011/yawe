import type { NearbyPlace, PlaceCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getDrivingDistances } from "@/lib/routing/matrix";
import { formatDistance, formatDuration } from "@/lib/utils";

// ── Tool Definitions for DeepSeek ──

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "search_places",
      description:
        "Search for places in Pyay database. Use this when the user asks about restaurants, hotels, pagodas, attractions, markets, shops, or any place category in Pyay. Always include the category if the user mentions what kind of place they want.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "Place category in English: restaurant, hotel, pagoda, archaeological_site, monument, attraction, ktv, transportation, convenience_store, pharmacy, market, school, hospital, bank_atm, police_station, gas_station, post_office, park, gym_fitness, coffee_shop, bakery, salon",
          },
          price_range: {
            type: "string",
            description:
              "Price level: $=budget (<5,000 Ks), $$=moderate (5K-15K Ks), $$$=expensive (15K-50K Ks), $$$$=luxury (50K+ Ks)",
          },
          cuisine_type: {
            type: "string",
            description: "Type of cuisine (e.g., myanmar, chinese, thai, bbq)",
          },
          star_rating: {
            type: "number",
            description: "Minimum star rating for hotels (1-5)",
          },
          search_term: {
            type: "string",
            description:
              "Free-text keyword to search in place name, description, specialities, cuisine and popular items",
          },
          radius_km: {
            type: "number",
            description:
              "Search radius in km from user's location. Default 20km.",
          },
          limit: {
            type: "number",
            description: "Maximum results. Default 10, max 25.",
          },
          sort_by: {
            type: "string",
            enum: ["distance", "rating"],
            description:
              "Sort results by distance (nearest first) or rating (highest first)",
          },
          sub_category: {
            type: "string",
            description:
              "Sub-category or specific type (e.g., viewpoint, museum, garden for attractions)",
          },
          market_type: {
            type: "string",
            enum: [
              "night_market",
              "supermarket",
              "shopping_mall",
              "street_market",
              "central_market",
            ],
            description: "Market type filter",
          },
          transport_type: {
            type: "string",
            enum: [
              "bus_station",
              "train_station",
              "motorcycle_taxi_stand",
              "tuk_tuk",
            ],
            description: "Transport type filter",
          },
          hospital_type: {
            type: "string",
            enum: ["general_hospital", "clinic", "traditional_medicine"],
            description: "Hospital type filter",
          },
          institution_type: {
            type: "string",
            enum: [
              "university",
              "college",
              "high_school",
              "primary_school",
              "language_center",
              "monastery_school",
              "vocational_school",
            ],
            description: "School/institution type filter",
          },
          salon_type: {
            type: "string",
            enum: [
              "hair_salon",
              "barber_shop",
              "nail_spa",
              "massage",
              "facial_skincare",
              "traditional_massage",
              "unisex",
            ],
            description: "Salon type filter",
          },
          has_wifi: {
            type: "boolean",
            description: "Filter places with WiFi (cafes, hotels, etc.)",
          },
          has_ac: {
            type: "boolean",
            description: "Filter places with air conditioning",
          },
          has_delivery: {
            type: "boolean",
            description: "Filter places with delivery service",
          },
          is_24hr: {
            type: "boolean",
            description: "Filter 24-hour places",
          },
          amenities: {
            type: "array",
            items: { type: "string" },
            description:
              "Specific amenities to filter by (e.g., ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Parking', 'Room Service', 'Breakfast', 'Laundry', 'Cable TV', 'Mini Bar', 'Safe Box', 'Bathtub', 'Balcony']). Only return places that have ALL listed amenities.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_place",
      description:
        "Find a specific place by name to get its details or location. Use this when the user asks about a specific named place or wants to search near a landmark.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Place name to search (supports partial match in Burmese or English)",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_directions",
      description:
        "Get driving directions, distance, and estimated time from the user's current location to a specific place.",
      parameters: {
        type: "object",
        properties: {
          place_id: {
            type: "string",
            description: "UUID of the place from search results",
          },
        },
        required: ["place_id"],
      },
    },
  },
];

// ── Tool Result Types ──

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ── Tool Handlers ──

interface ToolCallContext {
  userLat: number;
  userLng: number;
}

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  switch (name) {
    case "search_places":
      return handleSearchPlaces(args, ctx);
    case "find_place":
      return handleFindPlace(args);
    case "get_directions":
      return handleGetDirections(args, ctx);
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

async function handleSearchPlaces(
  args: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const supabase = await createClient();

  let query = supabase.from("places").select("*");

  if (args.category) {
    query = query.eq("category", args.category as string);
  }

  if (args.price_range) {
    query = query.eq("data->>price_range", args.price_range as string);
  }

  if (args.cuisine_type) {
    query = query.ilike("data->>cuisine_type", `%${args.cuisine_type}%`);
  }

  if (args.star_rating) {
    query = query.filter("data->star_rating", "eq", Number(args.star_rating));
  }

  if (args.sub_category) {
    query = query.ilike("data->>sub_category", `%${args.sub_category}%`);
  }

  if (args.market_type) {
    query = query.eq("data->>market_type", args.market_type as string);
  }

  if (args.transport_type) {
    query = query.eq("data->>transport_type", args.transport_type as string);
  }

  if (args.hospital_type) {
    query = query.eq("data->>hospital_type", args.hospital_type as string);
  }

  if (args.institution_type) {
    query = query.eq(
      "data->>institution_type",
      args.institution_type as string,
    );
  }

  if (args.salon_type) {
    query = query.eq("data->>salon_type", args.salon_type as string);
  }

  if (args.has_wifi === true || args.has_wifi === "true") {
    query = query.or("data->>has_wifi.eq.true,data->>amenities.ilike.*WiFi*");
  } else if (args.has_wifi === false || args.has_wifi === "false") {
    query = query.filter("data->>has_wifi", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*WiFi*");
  }

  if (args.has_ac === true || args.has_ac === "true") {
    query = query.or(
      "data->>has_ac.eq.true,data->>amenities.ilike.*Air Conditioning*",
    );
  } else if (args.has_ac === false || args.has_ac === "false") {
    query = query.filter("data->>has_ac", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*Air Conditioning*");
  }

  if (args.has_delivery === true || args.has_delivery === "true") {
    query = query.or(
      "data->>has_delivery.eq.true,data->>amenities.ilike.*Delivery*",
    );
  } else if (args.has_delivery === false || args.has_delivery === "false") {
    query = query.filter("data->>has_delivery", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*Delivery*");
  }

  if (args.is_24hr === true || args.is_24hr === "true") {
    query = query.or("data->>is_24hr.eq.true,data->>amenities.ilike.*24hr*");
  } else if (args.is_24hr === false || args.is_24hr === "false") {
    query = query.filter("data->>is_24hr", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*24hr*");
  }

  if (
    args.amenities &&
    Array.isArray(args.amenities) &&
    (args.amenities as string[]).length > 0
  ) {
    for (const amenity of args.amenities as string[]) {
      query = query.ilike("data->>amenities", `%${amenity}%`);
    }
  }

  if (args.search_term) {
    const term = args.search_term as string;
    query = query.or(
      `name.ilike.%${term}%,description.ilike.%${term}%,data->>specialities.ilike.%${term}%,data->>cuisine_type.ilike.%${term}%,data->>popular_drinks.ilike.%${term}%,data->>popular_for.ilike.%${term}%,data->>amenities.ilike.%${term}%`,
    );
  }

  const radius = (args.radius_km as number) ?? 20;
  const latDelta = radius / 111.0;
  const lngDelta = radius / (111.0 * Math.cos((ctx.userLat * Math.PI) / 180));

  query = query
    .gte("lat", ctx.userLat - latDelta)
    .lte("lat", ctx.userLat + latDelta)
    .gte("lng", ctx.userLng - lngDelta)
    .lte("lng", ctx.userLng + lngDelta);

  if (args.sort_by === "rating") {
    query = query.order("rating", { ascending: false });
  }

  const limit = Math.min((args.limit as number) ?? 10, 25);
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const places = (data ?? []).map((row: Record<string, unknown>) => ({
    category: row.category,
    place_id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    address: row.address ?? null,
    contact: row.contact ?? null,
    description: row.description ?? null,
    rating: row.rating ?? null,
    data: row.data ?? {},
  }));

  // Get driving distances
  if (places.length > 0) {
    const destinations = places.map((p) => ({
      lat: p.lat as number,
      lng: p.lng as number,
    }));
    const matrix = await getDrivingDistances(
      { lat: ctx.userLat, lng: ctx.userLng },
      destinations,
    );

    const enriched = places.map((place, i) => ({
      ...place,
      distance_km: (matrix[i]?.distance_m ?? 0) / 1000,
      duration_min: Math.round((matrix[i]?.duration_sec ?? 0) / 60),
      distance_label: formatDistance((matrix[i]?.distance_m ?? 0) / 1000),
      duration_label: formatDuration(matrix[i]?.duration_sec ?? 0),
    }));

    if (args.sort_by === "distance" || !args.sort_by) {
      enriched.sort(
        (a, b) => (a.distance_km as number) - (b.distance_km as number),
      );
    }

    if (args.sort_by === "rating") {
      enriched.sort(
        (a, b) => ((b.rating as number) ?? 0) - ((a.rating as number) ?? 0),
      );
    }

    return {
      success: true,
      data: {
        total: enriched.length,
        search_location: { lat: ctx.userLat, lng: ctx.userLng },
        radius_km: radius,
        places: enriched,
      },
    };
  }

  return {
    success: true,
    data: {
      total: 0,
      places: [],
      search_location: { lat: ctx.userLat, lng: ctx.userLng },
      radius_km: radius,
    },
  };
}

async function handleFindPlace(
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const name = args.name as string;
  if (!name) return { success: false, error: "Name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .ilike("name", `%${name}%`)
    .limit(3);

  if (error) return { success: false, error: error.message };
  if (!data?.length)
    return { success: false, error: `Place "${name}" not found` };

  return {
    success: true,
    data: {
      matches: data.length,
      places: data.map((row: Record<string, unknown>) => ({
        category: row.category,
        place_id: row.id,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        address: row.address ?? null,
        description: row.description ?? null,
        rating: row.rating ?? null,
        data: row.data ?? {},
      })),
    },
  };
}

async function handleGetDirections(
  args: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const supabase = await createClient();
  const { data: place } = await supabase
    .from("places")
    .select("name, lat, lng, address, rating, category")
    .eq("id", args.place_id as string)
    .single();

  if (!place) return { success: false, error: "Place not found" };

  const destinations = [{ lat: place.lat as number, lng: place.lng as number }];
  const matrix = await getDrivingDistances(
    { lat: ctx.userLat, lng: ctx.userLng },
    destinations,
  );

  return {
    success: true,
    data: {
      place: {
        name: place.name,
        category: place.category,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
      },
      from: { lat: ctx.userLat, lng: ctx.userLng },
      distance_km: (matrix[0]?.distance_m ?? 0) / 1000,
      duration_min: Math.round((matrix[0]?.duration_sec ?? 0) / 60),
      distance_label: formatDistance((matrix[0]?.distance_m ?? 0) / 1000),
      duration_label: formatDuration(matrix[0]?.duration_sec ?? 0),
    },
  };
}

export async function getFullPlaceById(
  placeId: string,
): Promise<NearbyPlace | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("places")
    .select("*")
    .eq("id", placeId)
    .single();

  if (!row) return null;
  const r = row as unknown as Record<string, unknown>;

  return {
    category: r.category as PlaceCategory,
    place_id: r.id as string,
    name: r.name as string,
    lat: r.lat as number,
    lng: r.lng as number,
    address: (r.address as string) ?? null,
    contact: (r.contact as string) ?? null,
    description: (r.description as string) ?? null,
    images: (r.images as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
    rating: (r.rating as number) ?? null,
    data: (r.data as Record<string, unknown>) ?? {},
    distance_km: 0,
    duration_sec: 0,
  };
}
