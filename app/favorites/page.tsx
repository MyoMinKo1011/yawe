"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trash2, Star, MapPin, Navigation, Clock } from "lucide-react";
import { placeTypeLabel, formatDistance, formatDuration } from "@/lib/utils";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, loading, removeFavorite } = useFavorites();

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">သိမ်းထားများ</h1>
        <p className="text-sm text-muted-foreground">
          ပြည်မြို့တွင် သင်သိမ်းထားသော နေရာများ
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Heart size={48} className="mx-auto mb-3 opacity-50" />
          <p>သိမ်းထားမှုများ မရှိသေးပါ</p>
          <p className="text-sm">
            Chat သို့မဟုတ် စူးစမ်းရန် စာမျက်နှာမှ နေရာများကို သိမ်းထားပါ
          </p>
          <Link href="/explore">
            <Button variant="outline" size="sm" className="mt-3">
              စူးစမ်းရန်
            </Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {favorites.map((fav) => {
          const placeData = (fav as unknown as Record<string, unknown>).place_data as Record<string, unknown> | undefined;
          const name = (placeData?.name as string) ?? "နေရာ";
          const category = (placeData?.category as string) ?? "unknown";
          const rating = placeData?.rating as number | undefined;
          const address = placeData?.address as string | undefined;
          const images = placeData?.images as string[] | undefined;
          const imageUrl = images?.[0];
          const lat = placeData?.lat as number | undefined;
          const lng = placeData?.lng as number | undefined;
          const distanceKm = placeData?.distance_km as number | undefined;
          const durationSec = placeData?.duration_sec as number | undefined;

          return (
            <Card key={fav.id} className="p-0 overflow-hidden">
              <div className="flex">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-24 h-24 object-cover shrink-0 bg-muted" />
                ) : (
                  <div className="w-24 h-24 bg-primary/5 shrink-0 flex items-center justify-center">
                    <MapPin size={24} className="text-primary/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {placeTypeLabel(category)}
                          </Badge>
                          {rating ? (
                            <span className="text-xs text-amber-500 flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-500" />
                              {Number(rating).toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {address ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{address}</p>
                    ) : null}
                    {distanceKm != null ? (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Navigation size={10} className="text-primary" />
                          {formatDistance(distanceKm)}
                        </span>
                        {durationSec != null ? (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            ~{formatDuration(durationSec)}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(fav.created_at).toLocaleDateString("my-MM")}
                    </span>
                    <div className="flex gap-1">
                      {lat != null && lng != null ? (
                        <a
                          href={`https://www.google.com/maps/dir//${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-muted text-primary"
                        >
                          <Navigation size={14} />
                        </a>
                      ) : null}
                      <button
                        onClick={() => removeFavorite(fav.id)}
                        className="p-1.5 rounded-md hover:bg-muted text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
