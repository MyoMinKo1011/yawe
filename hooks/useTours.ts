"use client";

import { useState, useCallback, useEffect } from "react";
import type { Tour } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTours = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTours([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("tours")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchErr) {
        setError("ခရီးစဉ်များ ဖော်ပြ၍မရပါ။");
      } else {
        setError(null);
        setTours((data as Tour[]) ?? []);
      }
    } catch {
      setError("ခရီးစဉ်များ ဖော်ပြ၍မရပါ။");
    } finally {
      setLoading(false);
    }
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
      setActionLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("အကောင့်ဝင်ရန် လိုအပ်ပါသည်။");
          return null;
        }

        const { data, error: insertErr } = await supabase
          .from("tours")
          .insert({ ...tour, user_id: user.id })
          .select()
          .single();

        if (insertErr) {
          setError("ခရီးစဉ် သိမ်းဆည်း၍မရပါ။");
          return null;
        }

        setError(null);
        fetchTours();
        return data as Tour;
      } catch {
        setError("ခရီးစဉ် သိမ်းဆည်း၍မရပါ။");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTours]
  );

  const deleteTour = useCallback(async (tourId: string) => {
    setActionLoading(true);
    try {
      const supabase = createClient();
      const { error: removeErr } = await supabase.from("tours").delete().eq("id", tourId);
      if (removeErr) {
        setError("ခရီးစဉ် ဖျက်၍မရပါ။");
      } else {
        setError(null);
        setTours((prev) => prev.filter((t) => t.id !== tourId));
      }
    } catch {
      setError("ခရီးစဉ် ဖျက်၍မရပါ။");
    } finally {
      setActionLoading(false);
    }
  }, []);

  return { tours, loading, error, actionLoading, saveTour, deleteTour, refresh: fetchTours };
}
