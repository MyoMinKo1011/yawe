"use client";

import type { NearbyPlace } from "@/lib/types";
import { placeTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Tag,
} from "lucide-react";
import type { DynamicRendererAction } from "@/components/chat/DynamicRenderer";

interface PlaceDetailBlockProps {
  place: NearbyPlace;
  onAction?: (action: DynamicRendererAction) => void;
  disabled?: boolean;
}

export function PlaceDetailBlock({ place, onAction, disabled }: PlaceDetailBlockProps) {
  if (!place) {
    return (
      <p className="text-sm text-muted-foreground">နေရာ အချက်အလက် မရရှိပါ</p>
    );
  }

  const data = place.data ?? {};
  const images = (place.images && place.images.length > 0 ? place.images : data?.images) as string[] | undefined;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {images && images.length > 0 && (
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-3 pt-3 pb-2">
            {images.slice(0, 5).map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="h-32 w-48 sm:h-40 sm:w-56 rounded-lg object-cover shrink-0 bg-muted"
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] shrink-0">
              {placeTypeLabel(place.category)}
            </Badge>
            {place.rating ? (
              <span className="text-xs text-amber-500 flex items-center gap-0.5">
                <Star size={11} className="fill-amber-500" />
                {place.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-bold mt-1.5 break-words">{place.name}</h3>
        </div>

        {place.description && (
          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            {place.description}
          </p>
        )}

        <div className="space-y-1.5 text-xs">
          {place.address && (
            <p className="text-muted-foreground flex items-start gap-1.5 break-words">
              <MapPin size={12} className="shrink-0 mt-0.5 text-primary" />
              <span>{place.address}</span>
            </p>
          )}
          {place.contact && (
            <p className="text-muted-foreground flex items-start gap-1.5 break-words">
              <Phone size={12} className="shrink-0 mt-0.5 text-primary" />
              <span>{place.contact}</span>
            </p>
          )}
          {Boolean(data.opening_hours) && (
            <p className="text-muted-foreground flex items-start gap-1.5 break-words">
              <Clock size={12} className="shrink-0 mt-0.5 text-primary" />
              <span>{String(data.opening_hours)}</span>
            </p>
          )}
          {Boolean(data.entry_fee) && (
            <p className="text-muted-foreground flex items-start gap-1.5 break-words">
              <Tag size={12} className="shrink-0 mt-0.5 text-primary" />
              <span>ဝင်ကြေး: {String(data.entry_fee)}</span>
            </p>
          )}
          {Boolean(data.website) && (
            <p className="text-muted-foreground flex items-start gap-1.5 break-words">
              <Globe size={12} className="shrink-0 mt-0.5 text-primary" />
              <a
                href={String(data.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {String(data.website)}
              </a>
            </p>
          )}
        </div>

        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {place.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {place.distance_km != null && place.distance_km > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Navigation size={11} />
              {place.distance_km.toFixed(1)} ကီလိုမီတာ
            </span>
            {place.duration_sec > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {Math.round(place.duration_sec / 60)} မိနစ်
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() =>
              onAction?.({
                type: "show_directions",
                payload: { place },
              })
            }
          >
            <Navigation size={12} className="mr-1" />
            လမ်းညွှန်
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              onAction?.({
                type: "save_place",
                payload: { place },
              })
            }
          >
            {disabled ? "သိမ်းဆည်းနေသည်..." : "သိမ်းရန်"}
          </Button>
        </div>
      </div>
    </div>
  );
}
