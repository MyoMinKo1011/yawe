"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function MapLoading() {
  return (
    <div className="h-64 rounded-xl bg-muted animate-pulse flex items-center justify-center text-sm text-muted-foreground border border-border">
      မြေပုံဖွင့်နေသည်...
    </div>
  );
}
