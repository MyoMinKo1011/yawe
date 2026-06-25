"use client";

import { useState, useCallback, useEffect } from "react";
import type { Favorite } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { PlaceCategory } from "@/lib/types";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setFavorites((data as Favorite[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(
    async (placeId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        place_id: placeId,
      });

      if (!error) {
        fetchFavorites();
      }
    },
    [fetchFavorites]
  );

  const removeFavorite = useCallback(async (favoriteId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (!error) {
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
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
    addFavorite,
    removeFavorite,
    isFavorite,
    refresh: fetchFavorites,
  };
}
