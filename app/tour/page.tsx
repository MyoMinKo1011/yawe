"use client";

import { useTours } from "@/hooks/useTours";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ToursPage() {
  const { tours, loading, deleteTour } = useTours();

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ကျွန်ုပ်၏ ခရီးစဉ်များ</h1>
          <p className="text-sm text-muted-foreground">
            သိမ်းထားသော ခရီးစဉ်များ
          </p>
        </div>
        <Link href="/">
          <Button size="sm">ခရီးစဉ်အသစ် စီစဉ်ရန်</Button>
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && tours.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Map size={48} className="mx-auto mb-3 opacity-50" />
          <p>ခရီးစဉ်များ မရှိသေးပါ</p>
          <p className="text-sm">
            Chat သို့မဟုတ် စူးစမ်းရန် စာမျက်နှာမှတစ်ဆင့် ခရီးစဉ်စီစဉ်ပါ
          </p>
        </div>
      )}

      <div className="space-y-3">
        {tours.map((tour) => (
          <Card key={tour.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardHeader>
                  <CardTitle>{tour.title}</CardTitle>
                </CardHeader>
                {tour.description && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tour.description}
                    </p>
                  </CardContent>
                )}
                <div className="px-4 pb-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(tour.created_at).toLocaleDateString()} တွင် ဖန်တီးခဲ့သည်
                  </p>
                </div>
              </div>
              <div className="flex gap-1 p-2">
                <Link href={`/tour/${tour.id}`}>
                  <Button variant="ghost" size="sm">
                    <Map size={14} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => deleteTour(tour.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
