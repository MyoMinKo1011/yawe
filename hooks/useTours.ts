"use client";

import { useState, useCallback, useEffect } from "react";
import type { Tour } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTours = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setTours((data as Tour[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const saveTour = useCallback(
    async (tour: {
      title: string;
      description?: string;
      start_lat: number;
      start_lng: number;
      route_geometry?: GeoJSON.LineString;
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("tours")
        .insert({ ...tour, user_id: user.id })
        .select()
        .single();

      if (!error) {
        fetchTours();
        return data as Tour;
      }
      return null;
    },
    [fetchTours]
  );

  const deleteTour = useCallback(async (tourId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("tours").delete().eq("id", tourId);
    if (!error) {
      setTours((prev) => prev.filter((t) => t.id !== tourId));
    }
  }, []);

  return { tours, loading, saveTour, deleteTour, refresh: fetchTours };
}
