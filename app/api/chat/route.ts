import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { chatWithAI, extractIntent } from "@/lib/chat";
import { searchPlaces, findPlaceByName } from "@/lib/search";
import { getDrivingDistances } from "@/lib/routing/matrix";
import { z } from "zod";
import type { NearbyPlace } from "@/lib/types";

const chatSchema = z.object({
  message: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  session_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, lat, lng, session_id } = parsed.data;
    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let sessionId = session_id;
    if (!sessionId) {
      const { data: sessionData } = await supabase.from("chat_sessions").insert({
        user_id: user.id, title: message.slice(0, 100), lat: lat ?? null, lng: lng ?? null,
      }).select().single();
      if (sessionData) sessionId = sessionData.id;
    }

    if (sessionId) {
      await supabase.from("chat_messages").insert({
        session_id: sessionId, role: "user", content: message, metadata: { lat, lng },
      });
    }

    // ---- STEP 1: Extract search intent (fast, no place data) ----
    const intent = await extractIntent(message);

    const userLat = lat ?? 18.8244;
    const userLng = lng ?? 95.2179;
    let availablePlaces: NearbyPlace[] = [];
    let intentContext = "";

    if (intent) {
      let searchLat = userLat;
      let searchLng = userLng;

      // Resolve "near_place" → coordinates
      if (intent.near_place) {
        const place = await findPlaceByName(intent.near_place);
        if (place) {
          searchLat = place.lat;
          searchLng = place.lng;
          intent.reply_intro = `${place.name} အနီးရှိ ${intent.category || "နေရာများ"}:\n${intent.reply_intro}`;
        }
      }

      // ---- STEP 2: DB query with intent filters ----
      if (intent.reply_action === "search") {
        const places = await searchPlaces(
          intent.category,
          intent.filters || {},
          intent.search_term,
          searchLat,
          searchLng,
          intent.radius_km ?? 20,
          intent.sort_by,
          25
        );

        // Get driving distances
        if (places.length > 0 && lat != null && lng != null) {
          const destinations = places.map((p) => ({ lat: p.lat, lng: p.lng }));
          const matrix = await getDrivingDistances({ lat: userLat, lng: userLng }, destinations);

          availablePlaces = places.map((place, i) => ({
            ...place,
            distance_km: (matrix[i]?.distance_m ?? 0) / 1000,
            duration_sec: matrix[i]?.duration_sec ?? 0,
          }));

          if (intent.sort_by === "distance" || !intent.sort_by) {
            availablePlaces.sort((a, b) => a.distance_km - b.distance_km);
          }
        } else {
          availablePlaces = places;
        }
      }
    }

    // Fallback: no intent or casual chat — query nearby places
    if (!availablePlaces.length) {
      const { data: places } = await supabase.rpc("nearby_places_all", {
        center_lat: userLat, center_lng: userLng, radius_km: 20, place_categories: null,
      });
      const rawPlaces = (places as NearbyPlace[]) ?? [];
      if (rawPlaces.length > 0) {
        const destinations = rawPlaces.map((p) => ({ lat: p.lat, lng: p.lng }));
        const matrix = await getDrivingDistances({ lat: userLat, lng: userLng }, destinations);
        availablePlaces = rawPlaces.map((place, i) => ({
          ...place,
          distance_km: (matrix[i]?.distance_m ?? 0) / 1000,
          duration_sec: matrix[i]?.duration_sec ?? 0,
        }));
        availablePlaces.sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    // ---- STEP 3: Conversation history ----
    const { data: historyMessages } = sessionId
      ? await supabase.from("chat_messages").select("role, content").eq("session_id", sessionId).order("created_at", { ascending: true }).limit(20)
      : { data: [] };

    const conversationHistory = (historyMessages as { role: string; content: string }[] | null)?.map((m) => ({
      role: m.role as "user" | "assistant", content: m.content,
    })) ?? undefined;

    // ---- STEP 4: Generate response with filtered places ----
    const finalMessage = intent?.reply_intro ? `${intent.reply_intro}\n\n${message}` : message;
    const aiResponse = await chatWithAI(
      finalMessage,
      availablePlaces,
      lat != null && lng != null ? { lat, lng } : null,
      conversationHistory
    );

    if (sessionId) {
      await supabase.from("chat_messages").insert({
        session_id: sessionId, role: "assistant", content: aiResponse.reply,
        metadata: { ui_components: aiResponse.ui_components, place_count: aiResponse.places?.length ?? 0, intent },
      });
      await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
    }

    if (lat && lng) {
      await supabase.from("search_history").insert({ user_id: user.id, query: message, lat, lng });
    }

    return NextResponse.json({
      reply: aiResponse.reply,
      ui_components: (aiResponse.ui_components ?? []).map((c) => ({
        type: c.type || "text",
        props: c.props && typeof c.props === "object" ? c.props : { content: aiResponse.reply || "" },
      })),
      places: aiResponse.places ?? [],
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    const err = error as { code?: string; message?: string };
    const isTimeout = err.code === "ETIMEDOUT" || err.message?.includes("timed out");
    return NextResponse.json({
      reply: isTimeout ? "ဝမ်းနည်းပါသည်။ တောင်းဆိုမှု အချိန်ကြာသွားပါသည်။ ထပ်မံကြိုးစားပါ။" : "ဝမ်းနည်းပါသည်။ တစ်ခုခုမှားယွင်းသွားပါသည်။ ထပ်မံကြိုးစားပါ။",
      ui_components: [{ type: "text", props: { content: isTimeout ? "ဝမ်းနည်းပါသည်။ တောင်းဆိုမှု အချိန်ကြာသွားပါသည်။ ထပ်မံကြိုးစားပါ။" : "ဝမ်းနည်းပါသည်။ တစ်ခုခုမှားယွင်းသွားပါသည်။ ထပ်မံကြိုးစားပါ။" } }],
      places: [],
    }, { status: 500 });
  }
}
