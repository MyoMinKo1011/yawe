import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const addFavoriteSchema = z.object({
  place_id: z.string().uuid(),
  category: z.string().optional(),
  place_data: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ favorites: favorites ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addFavoriteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { place_id, place_data } = parsed.data;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("favorites")
      .upsert(
        {
          user_id: user.id,
          place_id,
          place_data: place_data ?? {},
        },
        {
          onConflict: "user_id, place_id",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save favorite", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite: data });
  } catch (error) {
    console.error("Favorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
