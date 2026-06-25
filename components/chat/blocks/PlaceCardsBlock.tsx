"use client";

import type { NearbyPlace } from "@/lib/types";
import { placeTypeLabel } from "@/lib/utils";
import { Navigation, Star, Clock } from "lucide-react";
import type { DynamicRendererAction } from "@/components/chat/DynamicRenderer";

interface PlaceCardsBlockProps {
  place_ids?: string[];
  layout?: "horizontal_scroll" | "grid" | "list" | "scroll";
  show?: string[];
  places: NearbyPlace[];
  inlinePlaces?: NearbyPlace[];
  onAction?: (action: DynamicRendererAction) => void;
  disabled?: boolean;
}

function placeField(place: NearbyPlace, field: string): string | null {
  switch (field) {
    case "name":
      return place.name;
    case "price_level": {
      const price = place.data?.price_range as string;
      return price || null;
    }
    case "rating":
      return place.rating != null ? `★ ${place.rating.toFixed(1)}` : null;
    case "match_reason":
      return null;
    case "distance":
      return place.distance_km != null
        ? `${place.distance_km.toFixed(1)} ကီလိုမီတာ`
        : null;
    case "category":
      return placeTypeLabel(place.category);
    default: {
      const val = place.data?.[field];
      if (val == null) return null;
      if (typeof val === "string") return val;
      if (typeof val === "boolean") return val ? "ရှိ" : "မရှိ";
      return String(val);
    }
  }
}

function PlaceCardItem({
  place,
  showFields,
  onAction,
  disabled,
}: {
  place: NearbyPlace;
  showFields: string[];
  onAction?: (action: DynamicRendererAction) => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={() =>
        onAction?.({
          type: "show_directions",
          payload: { place },
        })
      }
      className="min-w-[180px] sm:min-w-[220px] rounded-xl border border-border p-3.5 shrink-0 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer text-left flex flex-col gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <p className="font-semibold text-sm break-words leading-snug">
        {place.name}
      </p>

      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        {place.rating ? (
          <span className="text-amber-500 flex items-center gap-0.5 font-medium">
            <Star size={11} className="fill-amber-500" />
            {place.rating.toFixed(1)}
          </span>
        ) : null}
        <span className="break-words">{placeTypeLabel(place.category)}</span>
      </div>

      {showFields.map((field) => {
        if (field === "name" || field === "category" || field === "rating") return null;
        const value = placeField(place, field);
        if (!value) return null;
        return (
          <p key={field} className="text-xs text-muted-foreground">
            {value}
          </p>
        );
      })}

      {place.distance_km != null && place.distance_km > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>{place.distance_km.toFixed(1)} ကီလိုမီတာ</span>
          {place.duration_sec > 0 && (
            <>
              <span className="text-border">·</span>
              <Clock size={10} />
              <span>{Math.round(place.duration_sec / 60)} မိနစ်</span>
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-1 mt-auto pt-2 text-[10px] text-primary font-medium">
        <Navigation size={10} />
        လမ်းညွှန်
      </div>
    </button>
  );
}

export function PlaceCardsBlock({
  place_ids = [],
  layout = "horizontal_scroll",
  show = [],
  places,
  inlinePlaces,
  onAction,
  disabled,
}: PlaceCardsBlockProps) {
  const matched = inlinePlaces?.length
    ? inlinePlaces
    : place_ids.length > 0
      ? places.filter((p) => place_ids.includes(p.place_id))
      : places.slice(0, 8);

  if (!matched.length) {
    return (
      <p className="text-sm text-muted-foreground">နေရာများ မတွေ့ပါ</p>
    );
  }

  if (layout === "scroll" || layout === "horizontal_scroll") {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {matched.map((place) => (
          <PlaceCardItem
            key={place.place_id}
            place={place}
            showFields={show}
            onAction={onAction}
            disabled={disabled}
          />
        ))}
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {matched.map((place) => (
          <PlaceCardItem
            key={place.place_id}
            place={place}
            showFields={show}
            onAction={onAction}
            disabled={disabled}
          />
        ))}
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="space-y-2">
        {matched.map((place) => (
          <button
            key={place.place_id}
            disabled={disabled}
            onClick={() =>
              onAction?.({
                type: "show_directions",
                payload: { place },
              })
            }
            className="w-full flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm break-words">{place.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {placeTypeLabel(place.category)}
                {place.rating ? ` · ${place.rating.toFixed(1)} ★` : ""}
              </p>
            </div>
            <div className="text-xs text-muted-foreground shrink-0 ml-3 text-right">
              {place.distance_km != null && place.distance_km > 0 ? (
                <p>{place.distance_km.toFixed(1)} ကီလိုမီတာ</p>
              ) : null}
              {place.duration_sec > 0 && (
                <p>{Math.round(place.duration_sec / 60)} မိနစ်</p>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return null;
}
