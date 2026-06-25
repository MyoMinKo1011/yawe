"use client";

import type { NearbyPlace } from "@/lib/types";
import { placeTypeLabel } from "@/lib/utils";
import { Navigation, Clock, MapPin } from "lucide-react";
import type { DynamicRendererAction } from "@/components/chat/DynamicRenderer";

interface TourStopData {
  place_id: string;
  stop_order: number;
  estimated_duration_min: number;
  tips: string;
  travel_to_next?: {
    distance_km: number;
    duration_min: number;
    summary: string;
    steps: Array<{
      instruction: string;
      distance_km: number;
      duration_min: number;
      road_name: string;
    }>;
  } | null;
}

interface TourTimelineBlockProps {
  title?: string;
  stops: TourStopData[];
  places: NearbyPlace[];
  onAction?: (action: DynamicRendererAction) => void;
}

function findPlace(
  placeId: string,
  places: NearbyPlace[]
): NearbyPlace | undefined {
  return places.find((p) => p.place_id === placeId);
}

export function TourTimelineBlock({
  title,
  stops,
  places,
  onAction,
}: TourTimelineBlockProps) {
  if (!stops.length) {
    return (
      <p className="text-sm text-muted-foreground">
        ခရီးစဉ် မရရှိပါ
      </p>
    );
  }

  const sorted = [...stops].sort(
    (a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0)
  );

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="font-semibold text-sm">{title}</h4>
      )}

      <div className="rounded-xl border border-border">
        {sorted.map((stop, j) => {
          const place = findPlace(stop.place_id, places);
          const isLast = j === sorted.length - 1;

          return (
            <div key={`stop-${stop.place_id}-${j}`}>
              <div className="flex gap-3 p-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border-2 border-primary/20">
                    {stop.stop_order ?? j + 1}
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 bg-primary/20 my-0.5" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div>
                    {place ? (
                      <button
                        onClick={() =>
                          onAction?.({
                            type: "show_directions",
                            payload: { place },
                          })
                        }
                        className="text-sm font-semibold hover:text-primary transition-colors text-left break-words"
                      >
                        {place.name}
                      </button>
                    ) : (
                      <p className="text-sm font-semibold break-words">
                        {stop.place_id}
                      </p>
                    )}

                    {place && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {placeTypeLabel(place.category)}
                      </p>
                    )}

                    {stop.estimated_duration_min && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        ~{stop.estimated_duration_min} မိနစ်
                      </p>
                    )}
                  </div>

                  {stop.tips && (
                    <p className="text-xs text-muted-foreground italic break-words">
                      {stop.tips}
                    </p>
                  )}

                  {place?.address && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 break-words">
                      <MapPin size={10} className="shrink-0 mt-0.5" />
                      <span>{place.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="mx-3 pl-10 pr-3 pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Navigation size={10} className="shrink-0 text-primary" />
                    <span>
                      {stop.travel_to_next ? (
                        <>
                          {stop.travel_to_next.distance_km.toFixed(1)} km ·{" "}
                          {stop.travel_to_next.duration_min} min
                          {stop.travel_to_next.summary && (
                            <> · {stop.travel_to_next.summary}</>
                          )}
                        </>
                      ) : (
                        "အနီးစပ်ဆုံးလမ်းကြောင်း"
                      )}
                    </span>
                  </div>
                  {stop.travel_to_next?.steps &&
                    stop.travel_to_next.steps.length > 0 && (
                      <div className="mt-1.5 space-y-1 pl-2">
                        {stop.travel_to_next.steps.slice(0, 3).map((step, si) => (
                          <p
                            key={si}
                            className="text-[10px] text-muted-foreground flex items-start gap-1 break-words"
                          >
                            <span className="shrink-0 mt-0.5">·</span>
                            <span>
                              {step.instruction}
                              {step.road_name
                                ? ` (${step.road_name}, ${step.distance_km.toFixed(1)} km)`
                                : ` (${step.distance_km.toFixed(1)} km)`}
                            </span>
                          </p>
                        ))}
                        {stop.travel_to_next.steps.length > 3 && (
                          <p className="text-[10px] text-muted-foreground pl-3">
                            + နောက်ထပ် {stop.travel_to_next.steps.length - 3}{" "}
                            ဆင့်
                          </p>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        ခရီးစဉ်တွင် နေရာ {sorted.length} ခု ပါဝင်သည်
      </p>
    </div>
  );
}
