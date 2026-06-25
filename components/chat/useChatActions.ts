import type { DynamicRendererAction } from "@/components/chat/DynamicRenderer";
import type { NearbyPlace } from "@/lib/types";
import { toast } from "sonner";
import { useCallback } from "react";

export function useChatActions(location: { lat: number; lng: number } | null) {
  const setDirections = useCallback(
    (_place: NearbyPlace) => {
      // handled in ChatView via callback
    },
    []
  );

  const handleAction = useCallback(
    async (
      action: DynamicRendererAction,
      onDirections: (place: NearbyPlace) => void
    ) => {
      switch (action.type) {
        case "show_directions": {
          const place = action.payload.place;
          if (!place) return;
          onDirections(place);
          break;
        }
        case "save_place": {
          const places = (action.payload.places as NearbyPlace[] | undefined) ?? [];
          const singlePlace = action.payload.place as NearbyPlace | undefined;
          const allToSave = places.length > 0 ? places : singlePlace ? [singlePlace] : [];

          if (allToSave.length === 0) return;

          let saved = 0;
          for (const place of allToSave) {
            try {
              const res = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  place_id: place.place_id,
                  category: place.category,
                  place_data: {
                    name: place.name,
                    category: place.category,
                    rating: place.rating,
                    address: place.address,
                    distance_km: place.distance_km,
                    duration_sec: place.duration_sec,
                    lat: place.lat,
                    lng: place.lng,
                    images: place.images,
                  },
                }),
              });
              if (res.ok) saved++;
            } catch {
              // skip failures
            }
          }
          toast.success(`${saved} နေရာ သိမ်းဆည်းလိုက်ပါပြီ`);
          break;
        }
        default:
          break;
      }
    },
    []
  );

  return { handleAction, setDirections };
}
