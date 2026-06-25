"use client";

import type { NearbyPlace } from "@/lib/types";
import { placeTypeLabel } from "@/lib/utils";

interface ComparisonBlockProps {
  title?: string;
  places: NearbyPlace[];
  place_ids: string[];
  fields?: string[];
  columns?: string[];
  rows?: Array<{ label: string; values: string[] }>;
}

const FIELD_LABELS: Record<string, string> = {
  name: "အမည်",
  category: "အမျိုးအစား",
  rating: "အဆင့်သတ်မှတ်ချက်",
  price_level: "စျေးနှုန်း",
  price_range: "စျေးနှုန်း",
  distance: "အကွာအဝေး",
  distance_km: "အကွာအဝေး",
  address: "လိပ်စာ",
  description: "ဖော်ပြချက်",
  contact: "ဆက်သွယ်ရန်",
  opening_hours: "ဖွင့်ချိန်",
  cuisine_type: "အစားအစာအမျိုးအစား",
  star_rating: "ကြယ်အဆင့်",
  entry_fee: "ဝင်ကြေး",
  has_wifi: "WiFi",
  has_ac: "AC",
  has_delivery: "ပို့ဆောင်မှု",
  has_vegetarian: "သက်သတ်လွတ်",
};

function getField(place: NearbyPlace, field: string): string {
  switch (field) {
    case "name":
      return place.name;
    case "category":
      return placeTypeLabel(place.category) ?? "";
    case "rating":
      return place.rating != null ? `★ ${place.rating.toFixed(1)}` : "—";
    case "price_level":
    case "price_range":
      return (place.data?.price_range as string) ?? "—";
    case "distance":
    case "distance_km":
      return place.distance_km != null
        ? `${place.distance_km.toFixed(1)} ကီလိုမီတာ`
        : "—";
    case "address":
      return place.address ?? "—";
    case "description":
      return place.description
        ? place.description.slice(0, 80) + (place.description.length > 80 ? "..." : "")
        : "—";
    case "contact":
      return place.contact ?? "—";
    default: {
      const val = place.data?.[field];
      if (val == null) return "—";
      if (typeof val === "boolean") return val ? "ရှိ" : "မရှိ";
      return String(val);
    }
  }
}

export function ComparisonBlock({
  title,
  places,
  place_ids,
  fields,
  columns: rawColumns,
  rows: rawRows,
}: ComparisonBlockProps) {
  if (rawColumns && rawColumns.length > 0 && rawRows && rawRows.length > 0) {
    return (
      <div className="space-y-2">
        {title && <h4 className="font-semibold text-sm">{title}</h4>}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[300px] text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/50">
                {rawColumns.map((col, j) => (
                  <th
                    key={`col-${j}`}
                    className={`px-3 py-2.5 text-left font-semibold break-words ${
                      j === 0 ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rawRows.map((row, j) => (
                <tr key={`row-${j}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-muted-foreground text-xs sm:text-sm">
                    {row.label}
                  </td>
                  {row.values.map((val, k) => (
                    <td key={`cell-${j}-${k}`} className="px-3 py-2.5 break-words text-xs sm:text-sm">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const matched = places.filter((p) => place_ids.includes(p.place_id));
  if (matched.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        နှိုင်းယှဉ်ရန် နေရာ အနည်းဆုံး ၂ ခု လိုအပ်ပါသည်
      </p>
    );
  }

  const defaultFields = ["name", "category", "rating", "price_range", "distance"];
  const compareFields = fields && fields.length > 0 ? fields : defaultFields;
  const columns = ["", ...matched.map((p) => p.name)];

  return (
    <div className="space-y-2">
      {title && <h4 className="font-semibold text-sm">{title}</h4>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[300px] text-xs sm:text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col, j) => (
                <th
                  key={`col-${j}`}
                  className={`px-3 py-2.5 text-left font-semibold break-words ${
                    j === 0 ? "text-muted-foreground w-24 sm:w-32" : "text-foreground"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {compareFields.map((field) => (
              <tr key={field} className="hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2.5 font-medium text-muted-foreground text-xs sm:text-sm">
                  {FIELD_LABELS[field] ?? field}
                </td>
                {matched.map((place) => (
                  <td
                    key={`${place.place_id}-${field}`}
                    className="px-3 py-2.5 break-words text-xs sm:text-sm"
                  >
                    {getField(place, field)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
