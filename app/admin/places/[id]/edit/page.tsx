"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PlaceForm } from "@/components/admin/PlaceForm";
import { Skeleton } from "@/components/ui/skeleton";

interface Place {
  id: string;
  category: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  contact: string | null;
  description: string | null;
  images: string[];
  tags: string[];
  rating: number | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/places/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.place) {
          setPlace(data.place);
        } else {
          router.push("/admin/places");
        }
      })
      .catch(() => router.push("/admin/places"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl min-w-0 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!place) return null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl min-w-0">
      <h1 className="text-xl font-bold mb-4 truncate">Edit: {place.name}</h1>
      <PlaceForm initial={place} onSaved={() => router.push("/admin/places")} />
    </div>
  );
}
