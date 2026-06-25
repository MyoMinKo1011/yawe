"use client";

import { useState, useCallback, useEffect } from "react";
import type { Favorite } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchErr) {
        setError("သိမ်းထားသောနေရာများ ဖော်ပြ၍မရပါ။");
      } else {
        setError(null);
        setFavorites((data as Favorite[]) ?? []);
      }
    } catch {
      setError("သိမ်းထားသောနေရာများ ဖော်ပြ၍မရပါ။");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(
    async (placeId: string, placeName?: string) => {
      setActionLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("အကောင့်ဝင်ရန် လိုအပ်ပါသည်။");
          return;
        }

        const { error: insertErr } = await supabase.from("favorites").insert({
          user_id: user.id,
          place_id: placeId,
        });

        if (insertErr) {
          setError("နေရာ သိမ်းဆည်း၍မရပါ။");
        } else {
          setError(null);
          setFavorites((prev) => {
            if (prev.some((f) => f.place_id === placeId)) return prev;
            return prev;
          });
          fetchFavorites();
        }
      } catch {
        setError("နေရာ သိမ်းဆည်း၍မရပါ။");
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFavorites]
  );

  const removeFavorite = useCallback(async (favoriteId: string) => {
    setActionLoading(true);
    try {
      const supabase = createClient();
      const { error: removeErr } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (removeErr) {
        setError("နေရာ ဖယ်ရှား၍မရပါ။");
      } else {
        setError(null);
        setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      }
    } catch {
      setError("နေရာ ဖယ်ရှား၍မရပါ။");
    } finally {
      setActionLoading(false);
    }
  }, []);

  const isFavorite = useCallback(
    (placeId: string) => {
      return favorites.some((f) => f.place_id === placeId);
    },
    [favorites]
  );

  return {
    favorites,
    loading,
    error,
    actionLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refresh: fetchFavorites,
  };
}
