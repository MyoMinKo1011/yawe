"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Tour } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { placeTypeLabel } from "@/lib/utils";
import { MapPin, Clock, AlertTriangle } from "lucide-react";

export default function TourDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTour() {
      try {
        const res = await fetch(`/api/tour/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTour(data.tour);
        } else if (res.status === 404) {
          setError("ခရီးစဉ် မတွေ့ပါ");
        } else {
          setError("ခရီးစဉ် ဖော်ပြ၍မရပါ။");
        }
      } catch {
        setError("ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadTour();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 text-center">
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle size={32} className="text-amber-500" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">ခရီးစဉ် မတွေ့ပါ</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tour.title}</h1>
        {tour.description && (
          <p className="text-sm text-muted-foreground mt-1">{tour.description}</p>
        )}
      </div>
      {(tour.stops ?? []).length > 0 && (
        <div className="space-y-0">
          {(tour.stops ?? []).map((stop, i) => (
            <div key={stop.id} className="flex gap-3">
              <div className="flex flex-col items-center pt-4">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {stop.stop_order}
                </div>
                {i < (tour.stops ?? []).length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
              </div>
              <Card className="flex-1 mb-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">ရပ်နားခြင်း {stop.stop_order}</CardTitle>
                    <Badge variant="outline">{placeTypeLabel(stop.place_type ?? "")}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {stop.estimated_duration_min && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />{stop.estimated_duration_min} မိနစ်
                      </span>
                    )}
                    {stop.travel_summary && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />{stop.travel_summary}
                      </span>
                    )}
                  </div>
                  {stop.tips && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{stop.tips}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
