"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Layers } from "lucide-react";

interface Place {
  id: string;
  category: string;
  name: string;
}

const CATEGORY_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea",
  "#0891b2", "#db2777", "#ea580c", "#4f46e5", "#059669",
  "#c026d3", "#65a30d", "#0284c7", "#b91c1c", "#7c3aed",
  "#0d9488", "#be123c", "#1d4ed8", "#a21caf", "#15803d",
  "#b45309", "#0e7490",
];

const CATEGORY_MAP: { value: string; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "pagoda", label: "Pagoda" },
  { value: "archaeological_site", label: "Archaeological" },
  { value: "monument", label: "Monument" },
  { value: "attraction", label: "Attraction" },
  { value: "ktv", label: "KTV" },
  { value: "transportation", label: "Transport" },
  { value: "convenience_store", label: "Store" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "market", label: "Market" },
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "bank_atm", label: "Bank/ATM" },
  { value: "police_station", label: "Police" },
  { value: "gas_station", label: "Gas Station" },
  { value: "post_office", label: "Post Office" },
  { value: "park", label: "Park" },
  { value: "gym_fitness", label: "Gym" },
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "bakery", label: "Bakery" },
  { value: "salon", label: "Salon" },
];

type SliceData = { category: string; label: string; count: number; color: string };

export default function AdminDashboardPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function fetchStats() {
      fetch("/api/admin/places?limit=500", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          setPlaces(data.places ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    fetchStats();
    function onFocus() { fetchStats(); }
    window.addEventListener("focus", onFocus);
    timer = setInterval(fetchStats, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const categories = new Set(places.map((p) => p.category));
    const categoryCounts = CATEGORY_MAP.map((cat, i) => ({
      category: cat.value,
      label: cat.label,
      count: places.filter((p) => p.category === cat.value).length,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })).filter((c) => c.count > 0);
    return { total: places.length, categories: categories.size, categoryCounts };
  }, [places]);

  return (
    <div className="p-4 sm:p-6 space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your place data</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={Store} color="primary" value={stats.total} label="Total Places" />
            <StatCard icon={Layers} color="accent" value={stats.categories} label="Categories" />
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm mb-4">Places by Category</h3>
              {stats.categoryCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No places yet.</p>
              ) : (
                <PieChartSection slices={stats.categoryCounts} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PieChartSection({ slices }: { slices: SliceData[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const total = slices.reduce((s, c) => s + c.count, 0);

  return (
    <div
      className="flex flex-col lg:flex-row items-center gap-6"
      onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
    >
      <PieChart
        slices={slices}
        total={total}
        hovered={hovered}
        onHover={setHovered}
      />
      <Legend
        items={slices}
        total={total}
        hovered={hovered}
        onHover={setHovered}
      />
      {hovered && (
        <Tooltip
          slice={slices.find((s) => s.category === hovered)!}
          total={total}
          pos={tooltipPos}
        />
      )}
    </div>
  );
}

function Tooltip({
  slice,
  total,
  pos,
}: {
  slice: SliceData;
  total: number;
  pos: { x: number; y: number };
}) {
  const pct = ((slice.count / total) * 100).toFixed(1);
  return (
    <div
      className="fixed z-50 pointer-events-none text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 shadow-md"
      style={{ left: pos.x + 12, top: pos.y - 32 }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: slice.color }}
        />
        <span className="font-medium">{slice.label}</span>
      </div>
      <div className="text-muted-foreground mt-0.5">
        {slice.count} place{slice.count !== 1 ? "s" : ""} &middot; {pct}%
      </div>
    </div>
  );
}

function PieChart({
  slices,
  total,
  hovered,
  onHover,
}: {
  slices: SliceData[];
  total: number;
  hovered: string | null;
  onHover: (c: string | null) => void;
}) {
  const size = 200;
  const center = size / 2;
  const radius = center - 4;
  let cumulative = 0;

  if (total === 0) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 w-48 sm:w-auto"
      aria-label="Pie chart of places by category"
    >
      {slices.map((slice) => {
        const startAngle = (cumulative / total) * 360;
        const endAngle = ((cumulative + slice.count) / total) * 360;
        cumulative += slice.count;

        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;

        const isHovered = hovered === slice.category;
        const dimmed = hovered !== null && !isHovered;
        const offset = isHovered ? 6 : 0;
        const r = radius;
        const cx = center + offset * Math.cos(midRad);
        const cy = center + offset * Math.sin(midRad);

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return (
          <path
            key={slice.category}
            d={[
              `M ${cx} ${cy}`,
              `L ${x1} ${y1}`,
              `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
              "Z",
            ].join(" ")}
            fill={slice.color}
            stroke="var(--background, #fff)"
            strokeWidth={1.5}
            opacity={dimmed ? 0.35 : 1}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => onHover(slice.category)}
            onMouseLeave={() => onHover(null)}
          >
            <title>{`${slice.label}: ${slice.count}`}</title>
          </path>
        );
      })}
    </svg>
  );
}

function Legend({
  items,
  total,
  hovered,
  onHover,
}: {
  items: SliceData[];
  total: number;
  hovered: string | null;
  onHover: (c: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {items.map((item) => {
        const isHovered = hovered === item.category;
        const dimmed = hovered !== null && !isHovered;
        const pct = ((item.count / total) * 100).toFixed(0);
        return (
          <button
            key={item.category}
            className={`flex items-center gap-1 rounded px-1 py-0.5 transition-opacity ${
              dimmed ? "opacity-35" : "opacity-100"
            } ${isHovered ? "bg-muted font-medium" : ""}`}
            onMouseEnter={() => onHover(item.category)}
            onMouseLeave={() => onHover(null)}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate max-w-[100px] sm:max-w-[120px] text-xs sm:text-sm">{item.label}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {item.count}
              <span className="hidden sm:inline"> &middot; {pct}%</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  value: string | number;
  label: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent text-accent-foreground",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${colorMap[color] ?? ""}`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
