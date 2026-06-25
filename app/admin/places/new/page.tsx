"use client";

import { useRouter } from "next/navigation";
import { PlaceForm } from "@/components/admin/PlaceForm";

export default function NewPlacePage() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 max-w-4xl min-w-0">
      <h1 className="text-xl font-bold mb-4">New Place</h1>
      <PlaceForm onSaved={() => router.push("/admin/places")} />
    </div>
  );
}
