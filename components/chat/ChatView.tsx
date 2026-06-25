"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { DirectionsPopup } from "@/components/chat/DirectionsSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { DynamicRendererAction } from "@/components/chat/DynamicRenderer";
import type { NearbyPlace, GeoPosition } from "@/lib/types";
import { toast } from "sonner";
import { MapPin, AlertTriangle } from "lucide-react";

export function ChatView() {
  const { messages, loading, sendMessage } = useChat();
  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();
  const { displayName, avatarUrl } = useSupabase();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [directions, setDirections] = useState<{
    place: NearbyPlace;
    origin: GeoPosition;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (geoError) {
      toast.warning(geoError, {
        duration: 6000,
        action: {
          label: "ထပ်ကြိုးစား",
          onClick: () => getLocation(),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAction = useCallback(
    async (action: DynamicRendererAction) => {
      switch (action.type) {
        case "show_directions": {
          const place = action.payload.place;
          if (!place) return;
          if (!location) {
            toast.error("တည်နေရာကို ဦးစွာဖွင့်ပေးပါ");
            return;
          }
          const origin = location;
          setDirections({ place, origin });
          break;
        }
        case "save_place": {
          const places = (action.payload.places as NearbyPlace[] | undefined) ?? [];
          const singlePlace = action.payload.place as NearbyPlace | undefined;
          const allToSave = places.length > 0 ? places : singlePlace ? [singlePlace] : [];

          if (allToSave.length === 0) return;

          setSaving(true);
          let saved = 0;
          let failed = 0;
          for (const place of allToSave) {
            try {
              const res = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  place_id: place.place_id,
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
              else failed++;
            } catch {
              failed++;
            }
          }
          setSaving(false);
          if (failed > 0) {
            toast.error(`${saved} နေရာ သိမ်းဆည်းပြီး · ${failed} နေရာ မအောင်မြင်ပါ`);
          } else {
            toast.success(`${saved} နေရာ သိမ်းဆည်းလိုက်ပါပြီ`);
          }
          break;
        }
        default:
          break;
      }
    },
    [location]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-3xl mx-auto w-full px-4">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight px-2">
              ပြည်မြို့ကို AI ဖြင့် ရှာဖွေပါ
            </h1>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base px-2">
              ပြည်မြို့အကြောင်း မေးမြန်းပါ — စားသောက်ဆိုင်များ၊ ဘုရားများ၊
              ဟိုတယ်များ၊ ခရီးစဉ်များ နှင့် အခြားအကြောင်းအရာများ
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "ပြည်မြို့ရဲ့ အကောင်းဆုံး မြန်မာစားသောက်ဆိုင်များ",
              "လည်ပတ်စရာ ဘုရားစေတီများ",
              "တစ်ရက်တာ ခရီးစဉ် စီစဉ်ပေးပါ",
              "အဆင့်ကောင်းတဲ့ ဟိုတယ်များ",
              "အနီးအနားက ကော်ဖီဆိုင်များ",
            ].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q, location?.lat, location?.lng)}
                className="px-2.5 py-1.5 text-xs sm:text-sm rounded-full border border-border hover:bg-muted transition-colors max-w-[90vw] truncate"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
            {geoLoading ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                နေရာရှာဖွေနေသည်...
              </>
            ) : geoError ? (
              <>
                <AlertTriangle size={12} className="text-amber-500" />
                {geoError.length > 60 ? geoError.slice(0, 60) + "..." : geoError}
              </>
            ) : location ? (
              <>
                <MapPin size={12} className="text-green-500" />
                နေရာရရှိပါပြီ
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-none min-w-0">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} displayName={displayName} avatarUrl={avatarUrl} onAction={handleAction} disabled={saving} />
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">AI</span>
              </div>
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="sticky bottom-0 bg-background pt-2 pb-3 sm:py-4 border-t border-border px-1 sm:px-0">
        <ChatInput onSubmit={(msg) => sendMessage(msg, location?.lat, location?.lng)} loading={loading} />
        <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground mt-1.5 h-5">
          {geoLoading ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              တည်နေရာရှာဖွေနေသည်...
            </>
          ) : geoError ? (
            <button onClick={() => getLocation()} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
              <span className="truncate max-w-[280px]">{geoError}</span>
              <span className="text-primary underline shrink-0 ml-0.5">ထပ်ကြိုးစား</span>
            </button>
          ) : location ? (
            <>
              <MapPin size={12} className="text-green-500" />
              တည်နေရာရရှိပါပြီ
            </>
          ) : null}
        </div>
      </div>

      {directions && (
        <DirectionsPopup
          origin={directions.origin}
          destination={{
            lat: directions.place.lat,
            lng: directions.place.lng,
          }}
          placeName={directions.place.name}
          placeType={directions.place.category}
          placeRating={directions.place.rating ?? undefined}
          placeAddress={directions.place.address ?? undefined}
          placeDistanceKm={directions.place.distance_km ?? undefined}
          placeDurationSec={directions.place.duration_sec ?? undefined}
          onClose={() => setDirections(null)}
        />
      )}
    </div>
  );
}
