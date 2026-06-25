import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";
import { generateTour } from "@/lib/chat";
import { getRoute } from "@/lib/routing";
import type { NearbyPlace } from "@/lib/types";

const tourGenerateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  places: z.array(
    z.object({
      category: z.string(),
      place_id: z.string(),
    })
  ),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = tourGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lat, lng, places, message } = parsed.data;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const placePromises = places.map(async (p) => {
      const { data } = await supabase
        .from("places")
        .select("*")
        .eq("id", p.place_id)
        .single();

      if (!data) return null;
      return {
        ...data,
        category: data.category,
        place_id: data.id,
      } as unknown as NearbyPlace;
    });

    const resolvedPlaces = (await Promise.all(placePromises)).filter(
      Boolean
    ) as NearbyPlace[];

    if (resolvedPlaces.length === 0) {
      return NextResponse.json(
        { error: "No valid places found" },
        { status: 404 }
      );
    }

    const waypoints = resolvedPlaces.map((p) => ({
      lat: p.lat,
      lng: p.lng,
    }));

    let routeGeometry: GeoJSON.LineString | null = null;
    let totalDistance = 0;
    let totalDuration = 0;

    try {
      const routing = await getRoute(waypoints);
      if (routing) {
        routeGeometry = routing.route;
        totalDistance = routing.total_distance_m;
        totalDuration = routing.total_duration_sec;
      }
    } catch {
      // Routing failed, continue without route
    }

    const aiResponse = await generateTour(
      message ?? "Plan a tour visiting these places",
      resolvedPlaces,
      { lat, lng }
    );

    const { data: tourData } = await supabase
      .from("tours")
      .insert({
        user_id: user.id,
        title:
          aiResponse.ui_components
            ?.find((c) => c.type === "tour_timeline")
            ?.props?.title?.toString() ?? "Tour",
        description: aiResponse.reply,
        start_lat: lat,
        start_lng: lng,
        route_geometry: routeGeometry ?? undefined,
      })
      .select()
      .single();

    if (tourData) {
      for (let i = 0; i < resolvedPlaces.length; i++) {
        await supabase.from("tour_stops").insert({
          tour_id: tourData.id,
          place_type: resolvedPlaces[i].category,
          place_id: resolvedPlaces[i].place_id,
          stop_order: i + 1,
        });
      }
    }

    return NextResponse.json({
      tour: tourData,
      reply: aiResponse.reply,
      ui_components: aiResponse.ui_components,
      route: routeGeometry,
      total_distance_m: totalDistance,
      total_duration_sec: totalDuration,
    });
  } catch (error) {
    console.error("Tour generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
