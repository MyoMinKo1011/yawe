"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { placeTypeLabel } from "@/lib/utils";
import { PLACE_CATEGORIES } from "@/lib/types";
import { Plus, Search, Pencil, Trash2, Star, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Place {
  id: string;
  category: string;
  name: string;
  address: string | null;
  description: string | null;
  rating: number | null;
  created_at: string;
}

export default function AdminPlacesPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    if (search) params.set("q", search);
    params.set("limit", "200");

    try {
      const res = await fetch(`/api/admin/places?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPlaces(data.places);
      } else {
        setError("နေရာများ ဖော်ပြ၍မရပါ။");
      }
    } catch {
      setError("ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။");
    }
    setLoading(false);
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/places/${id}`, { method: "DELETE", cache: "no-store" });
      if (res.ok) {
        toast.success(`"${name}" ဖျက်လိုက်ပါပြီ`);
        fetchPlaces();
        router.refresh();
      } else {
        toast.error(`"${name}" ဖျက်၍မရပါ။`);
      }
    } catch {
      toast.error("ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။");
    }
  }

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.address ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [places, categoryFilter, search]);

  return (
    <div className="p-4 sm:p-6 space-y-4 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Places</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} place{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { router.push("/admin/places/new"); router.refresh(); }} size="sm">
          <Plus size={14} className="mr-1" />
          Add Place
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search places..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All categories</option>
          {PLACE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {placeTypeLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle size={32} className="text-amber-500" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchPlaces()}>ထပ်ကြိုးစား</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Address</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell w-16">Rating</th>
                <th className="px-4 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin size={24} className="opacity-40" />
                      <p>No places found</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((place) => (
                <tr key={place.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate">{place.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline">{placeTypeLabel(place.category)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                    {place.address ?? "-"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {place.rating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        {place.rating.toFixed(1)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(place.id, place.name)}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
