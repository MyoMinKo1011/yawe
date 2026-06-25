import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import type { NearbyPlace } from "@/lib/types";
import { getDrivingDistances } from "@/lib/routing/matrix";

const recommendSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  categories: z.array(z.string()).optional(),
  radius: z.number().min(0.1).max(100).optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recommendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { lat, lng, categories, radius } = parsed.data;
    const supabase = await createSupabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: places, error } = await supabase.rpc("nearby_places_all", {
      center_lat: lat,
      center_lng: lng,
      radius_km: radius,
      place_categories: categories ?? null,
    });

    if (error) {
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    const rawPlaces = (places as NearbyPlace[]) ?? [];

    // Fetch driving distances from Mapbox Matrix API
    let enrichedPlaces = rawPlaces;
    if (rawPlaces.length > 0) {
      const destinations = rawPlaces.map((p) => ({ lat: p.lat, lng: p.lng }));
      const matrix = await getDrivingDistances({ lat, lng }, destinations);

      enrichedPlaces = rawPlaces.map((place, i) => ({
        ...place,
        distance_km: (matrix[i]?.distance_m ?? 0) / 1000,
        duration_sec: matrix[i]?.duration_sec ?? 0,
      }));

      // Sort by driving distance
      enrichedPlaces.sort((a, b) => a.distance_km - b.distance_km);
    }

    await supabase.from("search_history").insert({
      user_id: user.id,
      query: `Recommend: ${categories?.join(", ") ?? "all"} within ${radius}km`,
      lat,
      lng,
    });

    return NextResponse.json({
      places: enrichedPlaces,
      meta: { total: enrichedPlaces.length, radius_km: radius },
    });
  } catch (e) {
    console.error("Recommend error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
