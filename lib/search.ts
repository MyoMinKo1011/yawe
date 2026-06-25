import type { NearbyPlace, PlaceCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getDrivingDistances } from "@/lib/routing/matrix";

function applyDataFilters(
  query: any,
  filters: Record<string, unknown>
) {
  if (filters.price_range) query = query.eq("data->>price_range", filters.price_range as string);
  if (filters.cuisine_type) query = query.ilike("data->>cuisine_type", `%${filters.cuisine_type}%`);
  if (filters.star_rating) query = query.filter("data->star_rating", "eq", Number(filters.star_rating));
  if (filters.sub_category) query = query.ilike("data->>sub_category", `%${filters.sub_category}%`);
  if (filters.market_type) query = query.eq("data->>market_type", filters.market_type as string);
  if (filters.transport_type) query = query.eq("data->>transport_type", filters.transport_type as string);
  if (filters.hospital_type) query = query.eq("data->>hospital_type", filters.hospital_type as string);
  if (filters.institution_type) query = query.eq("data->>institution_type", filters.institution_type as string);
  if (filters.salon_type) query = query.eq("data->>salon_type", filters.salon_type as string);
  if (filters.has_wifi === true) query = query.or("data->>has_wifi.eq.true,data->>amenities.ilike.*WiFi*");
  if (filters.has_wifi === false) {
    query = query.filter("data->>has_wifi", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*WiFi*");
  }
  if (filters.has_ac === true) query = query.or("data->>has_ac.eq.true,data->>amenities.ilike.*Air Conditioning*");
  if (filters.has_ac === false) {
    query = query.filter("data->>has_ac", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*Air Conditioning*");
  }
  if (filters.has_delivery === true) query = query.or("data->>has_delivery.eq.true,data->>amenities.ilike.*Delivery*");
  if (filters.has_delivery === false) {
    query = query.filter("data->>has_delivery", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*Delivery*");
  }
  if (filters.is_24hr === true) query = query.or("data->>is_24hr.eq.true,data->>amenities.ilike.*24hr*");
  if (filters.is_24hr === false) {
    query = query.filter("data->>is_24hr", "not.eq", "true");
    query = query.filter("data->>amenities", "not.ilike", "*24hr*");
  }
  if (filters.amenities && Array.isArray(filters.amenities) && (filters.amenities as string[]).length > 0) {
    for (const amenity of filters.amenities as string[]) {
      query = query.ilike("data->>amenities", `%${amenity}%`);
    }
  }
  return query;
}

export async function searchPlaces(
  category: string | undefined,
  filters: Record<string, unknown>,
  searchTerm: string | undefined,
  centerLat: number,
  centerLng: number,
  radius: number = 20,
  sortBy: string | undefined,
  limit: number = 25
): Promise<NearbyPlace[]> {
  const supabase = await createClient();
  let query = supabase.from("places").select("*");

  if (category) query = query.eq("category", category);

  query = applyDataFilters(query, filters);

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,data->>specialities.ilike.%${searchTerm}%,data->>cuisine_type.ilike.%${searchTerm}%,data->>popular_drinks.ilike.%${searchTerm}%,data->>popular_for.ilike.%${searchTerm}%,data->>amenities.ilike.%${searchTerm}%`
    );
  }

  const latDelta = radius / 111.0;
  const lngDelta = radius / (111.0 * Math.cos((centerLat * Math.PI) / 180));
  query = query.gte("lat", centerLat - latDelta).lte("lat", centerLat + latDelta)
    .gte("lng", centerLng - lngDelta).lte("lng", centerLng + lngDelta);

  if (sortBy === "rating") query = query.order("rating", { ascending: false });
  query = query.limit(Math.min(limit, 25));

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    category: row.category as PlaceCategory,
    place_id: row.id as string,
    name: row.name as string,
    lat: row.lat as number,
    lng: row.lng as number,
    address: (row.address as string) ?? null,
    contact: (row.contact as string) ?? null,
    description: (row.description as string) ?? null,
    images: (row.images as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    rating: (row.rating as number) ?? null,
    data: (row.data as Record<string, unknown>) ?? {},
    distance_km: 0,
    duration_sec: 0,
  }));
}

export async function findPlaceByName(name: string): Promise<{
  lat: number; lng: number; name: string;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("places").select("name, lat, lng").ilike("name", `%${name}%`).limit(1).single();
  return data ? { lat: data.lat as number, lng: data.lng as number, name: data.name as string } : null;
}
