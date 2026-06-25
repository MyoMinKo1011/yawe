"use client";

import type { UIComponent, NearbyPlace } from "@/lib/types";
import { TextBlock } from "@/components/chat/blocks/TextBlock";
import { PlaceCardsBlock } from "@/components/chat/blocks/PlaceCardsBlock";
import { PlaceDetailBlock } from "@/components/chat/blocks/PlaceDetailBlock";
import { TourTimelineBlock } from "@/components/chat/blocks/TourTimelineBlock";
import { ImageGalleryBlock } from "@/components/chat/blocks/ImageGalleryBlock";
import { ComparisonBlock } from "@/components/chat/blocks/ComparisonBlock";
import dynamic from "next/dynamic";

const MapBlock = dynamic(
  () =>
    import("@/components/chat/blocks/MapBlock").then((m) => ({
      default: m.MapBlock,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 sm:h-56 md:h-64 rounded-xl bg-muted animate-pulse flex items-center justify-center text-sm text-muted-foreground border border-border">
        မြေပုံဖွင့်နေသည်...
      </div>
    ),
  }
);

export interface DynamicRendererAction {
  type: "show_directions" | "show_on_map" | "save_place" | "learn_more" | "custom";
  payload: {
    place?: NearbyPlace;
    places?: NearbyPlace[];
    label?: string;
    [key: string]: unknown;
  };
}

interface DynamicRendererProps {
  components: UIComponent[];
  places: NearbyPlace[];
  onAction?: (action: DynamicRendererAction) => void;
}

function p(comp: UIComponent, key: string) {
  return comp.props?.[key];
}

function safeArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  return [];
}

function safeString(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return "";
}

function safeNumber(val: unknown, fallback: number = 0): number {
  if (typeof val === "number") return val;
  return fallback;
}

function isNearbyPlace(obj: unknown): obj is NearbyPlace {
  return (
    !!obj &&
    typeof obj === "object" &&
    "place_id" in (obj as Record<string, unknown>) &&
    "name" in (obj as Record<string, unknown>) &&
    "category" in (obj as Record<string, unknown>)
  );
}

export function DynamicRenderer({
  components,
  places,
  onAction,
}: DynamicRendererProps) {
  if (!components.length) {
    return (
      <TextBlock content="ဤအကြောင်းအရာကို ပြသ၍မရပါ။ ထပ်မံကြိုးစားပါ။" />
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden space-y-4">
      {components.map((comp, i) => {
        const componentKey = `${comp.type}-${i}`;
        switch (comp.type) {
          case "text": {
            const content = safeString(p(comp, "content"));
            if (!content) return null;
            return <TextBlock key={componentKey} content={content} />;
          }

          case "map": {
            const center =
              (p(comp, "center") as { lat: number; lng: number }) ?? {
                lat: 18.8244,
                lng: 95.2179,
              };
            const zoom = safeNumber(p(comp, "zoom"), 13);
            const markers = safeArray<{
              lat: number;
              lng: number;
              label: string;
              place_type?: string;
            }>(p(comp, "markers"));
            return (
              <MapBlock
                key={componentKey}
                center={center}
                zoom={zoom}
                markers={markers}
              />
            );
          }

          case "place_cards": {
            const title = safeString(p(comp, "title"));
            const cardLayout = (p(comp, "layout") as string) || "horizontal_scroll";
            const cardShow = safeArray<string>(p(comp, "show"));
            const cardPlaceIds = safeArray<string>(p(comp, "place_ids"));

            const rawPlaces = p(comp, "places");
            const inlinePlaces = safeArray<NearbyPlace>(rawPlaces).filter(isNearbyPlace);

            const resolvedPlaces = inlinePlaces.length > 0
              ? inlinePlaces
              : cardPlaceIds.length > 0
                ? places.filter((pl) => cardPlaceIds.includes(pl.place_id))
                : places.slice(0, 8);

            return (
              <div key={componentKey} className="space-y-2">
                {title && (
                  <h4 className="font-semibold text-sm">{title}</h4>
                )}
                <PlaceCardsBlock
                  place_ids={cardPlaceIds}
                  layout={cardLayout as "horizontal_scroll" | "grid" | "list"}
                  show={cardShow}
                  places={places}
                  inlinePlaces={resolvedPlaces}
                  onAction={onAction}
                />
              </div>
            );
          }

          case "place_detail": {
            const rawPlace = p(comp, "place");
            const placeId = safeString(p(comp, "place_id"));

            let place: NearbyPlace | undefined;
            if (isNearbyPlace(rawPlace)) {
              place = rawPlace;
            } else if (placeId) {
              place = places.find((pl) => pl.place_id === placeId);
            }

            if (!place) {
              place = places[0];
            }
            if (!place) return null;

            return (
              <PlaceDetailBlock
                key={componentKey}
                place={place}
                onAction={onAction}
              />
            );
          }

          case "tour_timeline": {
            const title = safeString(p(comp, "title"));
            const stops = safeArray<{
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
            }>(p(comp, "stops"));

            return (
              <TourTimelineBlock
                key={componentKey}
                title={title || undefined}
                stops={stops}
                places={places}
                onAction={onAction}
              />
            );
          }

          case "comparison": {
            const title = safeString(p(comp, "title"));
            const rawColumns = p(comp, "columns");
            const rawRows = p(comp, "rows");
            const compPlaceIds = safeArray<string>(p(comp, "place_ids"));
            const compFields = safeArray<string>(p(comp, "fields"));

            if (Array.isArray(rawColumns) && Array.isArray(rawRows)) {
              return (
                <ComparisonBlock
                  key={componentKey}
                  title={title || undefined}
                  columns={rawColumns as string[]}
                  rows={
                    rawRows as Array<{ label: string; values: string[] }>
                  }
                  places={places}
                  place_ids={[]}
                />
              );
            }

            return (
              <ComparisonBlock
                key={componentKey}
                title={title || undefined}
                place_ids={compPlaceIds}
                fields={compFields}
                places={places}
              />
            );
          }

          case "image_gallery": {
            const title = safeString(p(comp, "title"));
            const rawImages = p(comp, "images");
            const imagePlaceId = safeString(p(comp, "place_id"));

            let galleryImages = safeArray<string>(rawImages);
            if (!galleryImages.length && imagePlaceId) {
              const imgPlace = places.find((pl) => pl.place_id === imagePlaceId);
              galleryImages = (imgPlace?.images as string[]) ?? [];
            }

            return (
              <ImageGalleryBlock
                key={componentKey}
                title={title || undefined}
                images={galleryImages}
              />
            );
          }

          case "quick_actions": {
            const actions = safeArray<{
              id: string;
              label: string;
              type: "save_all" | "plan_tour" | "show_on_map" | "more_like_this" | "share";
            }>(p(comp, "actions"));

            if (!actions.length) return null;

            return (
              <div key={componentKey} className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      switch (action.type) {
                        case "save_all":
                          onAction?.({
                            type: "save_place",
                            payload: { places, label: action.label },
                          });
                          break;
                        case "show_on_map":
                          if (places.length > 0) {
                            onAction?.({
                              type: "show_directions",
                              payload: { place: places[0] },
                            });
                          }
                          break;
                        default:
                          onAction?.({
                            type: "custom",
                            payload: { label: action.label, actionType: action.type, places },
                          });
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs border border-border bg-transparent hover:bg-muted"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
