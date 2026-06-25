"use client";

import { useState } from "react";
import { LocationPicker } from "@/components/admin/LocationPicker";
import { CategoryFields } from "@/components/admin/CategoryFields";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { placeTypeLabel } from "@/lib/utils";
import { PLACE_CATEGORIES } from "@/lib/types";
import { AlertCircle, Save, X, ChevronDown, ChevronUp } from "lucide-react";

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

type PlaceFormData = Omit<Place, "id" | "created_at" | "updated_at">;

export function emptyForm(): PlaceFormData {
  return {
    category: "restaurant",
    name: "",
    lat: 18.8244,
    lng: 95.2179,
    address: "",
    contact: "",
    description: "",
    images: [],
    tags: [],
    rating: null,
    data: {},
  };
}

interface PlaceFormProps {
  initial?: Place;
  onSaved?: () => void;
}

export function PlaceForm({ initial, onSaved }: PlaceFormProps) {
  const [form, setForm] = useState<PlaceFormData>(
    initial
      ? {
          category: initial.category,
          name: initial.name,
          lat: initial.lat,
          lng: initial.lng,
          address: initial.address,
          contact: initial.contact,
          description: initial.description,
          images: initial.images ?? [],
          tags: initial.tags ?? [],
          rating: initial.rating,
          data: initial.data ?? {},
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isEditing = !!initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setSaving(true);

    const body: Record<string, unknown> = { ...form };
    if (body.rating === "" || body.rating === undefined) body.rating = null;

    const url = isEditing
      ? `/api/admin/places/${initial.id}`
      : "/api/admin/places";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSaved?.();
      } else {
        const err = await res.json();
        setError(err.error ?? (isEditing ? "Update failed" : "Create failed"));
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  }

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCategoryChange(cat: string) {
    if (!isEditing) {
      setForm((prev) => ({ ...prev, category: cat, data: {} }));
    } else {
      setForm((prev) => ({ ...prev, category: cat }));
    }
  }

  function handleCancel() {
    if (isEditing) {
      window.history.back();
    } else {
      window.location.href = "/admin/places";
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? "Edit Place" : "New Place"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X size={14} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PLACE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {placeTypeLabel(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Name *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Place name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Rating
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating ?? ""}
                    onChange={(e) =>
                      updateField(
                        "rating",
                        e.target.value === "" ? null : parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Contact
                  </label>
                  <Input
                    value={form.contact ?? ""}
                    onChange={(e) => updateField("contact", e.target.value)}
                    placeholder="Phone or website"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Address
                </label>
                <Input
                  value={form.address ?? ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Description
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => {
                  updateField("lat", lat);
                  updateField("lng", lng);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(e) => updateField("lat", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={(e) => updateField("lng", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <CategoryFields
              category={form.category}
              data={form.data as Record<string, unknown>}
              onChange={(data) => updateField("data", data)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced (Images, Tags, Raw JSON)
          </button>

          {showAdvanced && (
            <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Images (comma-separated URLs)
                  </label>
                  <Input
                    value={form.images.join(", ")}
                    onChange={(e) => {
                      const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      updateField("images", arr);
                    }}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={form.tags.join(", ")}
                    onChange={(e) => {
                      const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      updateField("tags", arr);
                    }}
                    placeholder="popular, wifi, outdoor"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Raw data JSON (overrides category fields above)
                </label>
                <textarea
                  value={JSON.stringify(form.data, null, 2)}
                  onChange={(e) => {
                    try {
                      updateField("data", JSON.parse(e.target.value));
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder={`// Example format (category-specific):\n// Restaurant: {"cuisine_type":"myanmar","price_range":"$","opening_hours":"9AM-9PM"}\n// Hotel: {"star_rating":"3","price_range":"$$","amenities":["WiFi","Pool"]}\n// Pagoda: {"built_century":11,"architecture_style":"Burmese"}`}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save size={14} className="mr-1" />
              {saving ? "Saving..." : isEditing ? "Update Place" : "Create Place"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
