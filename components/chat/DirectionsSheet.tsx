"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Map, Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import type { GeoPosition } from "@/lib/types";
import { formatDistance, formatDuration } from "@/lib/utils";
import { placeTypeLabel } from "@/lib/utils";
import {
  X,
  Navigation,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
  Clock,
  Navigation2,
  LocateFixed,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface RouteStep {
  maneuver: Record<string, unknown>;
  distance: number;
  duration: number;
  name: string;
}

interface RouteData {
  route: GeoJSON.Geometry;
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface DirectionsPopupProps {
  origin: GeoPosition;
  destination: GeoPosition;
  placeName: string;
  placeType: string;
  placeRating?: number;
  placeAddress?: string;
  placeDistanceKm?: number;
  placeDurationSec?: number;
  onClose: () => void;
}

async function fetchRoute(
  origin: GeoPosition,
  dest: GeoPosition
): Promise<RouteData | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&steps=true&overview=full&language=my&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.length) return null;
    const r = data.routes[0];
    return {
      route: r.geometry,
      distance: r.distance,
      duration: r.duration,
      steps: r.legs[0]?.steps ?? [],
    };
  } catch {
    return null;
  }
}

function maneuverIcon(type: string) {
  switch (type) {
    case "arrive":
      return "🏁";
    case "turn":
      return "↪";
    case "depart":
      return "🚗";
    case "continue":
      return "↑";
    case "fork":
      return "↗";
    case "rotary":
      return "🔄";
    case "roundabout":
      return "🔄";
    default:
      return "→";
  }
}

function NavigationMap({
  origin,
  destination,
  routeData,
  livePosition,
  followMode,
}: {
  origin: GeoPosition;
  destination: GeoPosition;
  routeData: RouteData | null;
  livePosition: GeoPosition | null;
  followMode: boolean;
}) {
  const mapRef = useRef<MapRef>(null);
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const bounds = new LngLatBounds();
    bounds.extend([origin.lng, origin.lat]);
    bounds.extend([destination.lng, destination.lat]);
    mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
  }, [origin, destination]);

  useEffect(() => {
    if (!mapRef.current || !livePosition || !followMode) return;
    const key = `${livePosition.lat},${livePosition.lng}`;
    if (key === lastTracked.current) return;
    lastTracked.current = key;
    mapRef.current.flyTo({
      center: [livePosition.lng, livePosition.lat],
      zoom: 16,
      duration: 800,
    });
  }, [livePosition, followMode]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN!}
      initialViewState={{
        longitude: origin.lng,
        latitude: origin.lat,
        zoom: 12,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      reuseMaps
    >
      {/* Origin */}
      <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
        <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white shadow" />
      </Marker>

      {/* Live position (only in nav mode) */}
      {livePosition && followMode && (
        <Marker
          longitude={livePosition.lng}
          latitude={livePosition.lat}
          anchor="center"
        >
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-200 animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-full rounded-full bg-blue-400/30 animate-ping" />
          </div>
        </Marker>
      )}

      {/* Destination */}
      <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 border-2 border-white shadow-md"
          style={{ borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)" }}
        >
          <div style={{ transform: "rotate(45deg)", color: "white", fontSize: 10, fontWeight: "bold" }}>
            ●
          </div>
        </div>
      </Marker>

      {routeData && (
        <Source id="nav-route" type="geojson" data={routeData.route}>
          <Layer
            id="nav-route-line"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{ "line-color": "#2563eb", "line-width": 4, "line-opacity": 0.8 }}
          />
        </Source>
      )}
    </Map>
  );
}

export function DirectionsPopup({
  origin,
  destination,
  placeName,
  placeType,
  placeRating,
  placeAddress,
  placeDistanceKm,
  placeDurationSec,
  onClose,
}: DirectionsPopupProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navMode, setNavMode] = useState(false);
  const [livePosition, setLivePosition] = useState<GeoPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    fetchRoute(origin, destination).then((r) => {
      setRouteData(r);
      setLoading(false);
    });
  }, [origin, destination]);

  const startNavigation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("GPS မရရှိပါ");
      return;
    }
    setNavMode(true);
    setGpsError(null);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLivePosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setGpsError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );
    watchRef.current = watchId;
  }, []);

  const stopNavigation = useCallback(() => {
    setNavMode(false);
    if (watchRef.current != null) {
      navigator.geolocation?.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchRef.current != null) {
        navigator.geolocation?.clearWatch(watchRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-background rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col transition-all duration-300 ${
          navMode ? "max-w-sm h-[85vh]" : "max-w-md max-h-[85vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between p-3 sm:p-4 pb-2">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
              {placeTypeLabel(placeType)}
            </span>
            <h2 className="text-sm sm:text-base font-bold mt-0.5 leading-snug truncate">
              {placeName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
              {placeRating ? (
                <span className="flex items-center gap-0.5">
                  <Star size={11} className="text-amber-500 fill-amber-500" />
                  {Number(placeRating).toFixed(1)}
                </span>
              ) : null}
              {/* Route distance */}
              {!routeData && placeDistanceKm != null && placeDistanceKm > 0 ? (
                <span className="text-muted-foreground">
                  🚗 {formatDistance(placeDistanceKm)}
                </span>
              ) : null}
              {routeData && routeData.distance > 0 ? (
                <span className="text-blue-700 font-medium">
                  🚗 {formatDistance(routeData.distance / 1000)} · ~{formatDuration(routeData.duration)}
                </span>
              ) : null}
            </div>
          </div>
          <button
            onClick={() => {
              stopNavigation();
              onClose();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-muted flex items-center justify-center shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* ---- Navigation banner ---- */}
        {routeData && !navMode && (
          <div className="mx-3 sm:mx-4 mb-2">
            <Button
              size="sm"
              className="w-full"
              onClick={startNavigation}
            >
              <LocateFixed size={14} className="mr-1.5" />
              GPS လမ်းညွှန် စတင်ရန်
            </Button>
          </div>
        )}

        {/* Navigation active banner */}
        {navMode && (
          <div className="mx-3 sm:mx-4 mb-2 flex items-center gap-2">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-green-700">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                GPS လမ်းညွှန် အသက်ဝင်နေသည်
              </div>
              {gpsError ? (
                <p className="text-[10px] text-red-600 mt-0.5">{gpsError}</p>
              ) : livePosition ? (
                <p className="text-[10px] text-green-600 mt-0.5">တည်နေရာ ရရှိနေသည်</p>
              ) : (
                <p className="text-[10px] text-amber-600 mt-0.5">တည်နေရာ ရှာဖွေနေသည်...</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={stopNavigation} className="shrink-0">
              ရပ်ရန်
            </Button>
          </div>
        )}

        {/* ---- Map ---- */}
        <div className={`mx-3 sm:mx-4 rounded-xl overflow-hidden border border-border ${navMode ? "h-48" : "h-36 sm:h-44"}`}>
          {MAPBOX_TOKEN ? (
            <NavigationMap
              origin={origin}
              destination={destination}
              routeData={routeData}
              livePosition={livePosition}
              followMode={navMode}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
              Mapbox token လိုအပ်ပါသည်
            </div>
          )}
        </div>

        {/* ---- Route info ---- */}
        {loading ? (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-3 w-14 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : routeData ? (
          <div className="px-3 sm:px-4 py-3">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Navigation size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">
                    {formatDistance(routeData.distance / 1000)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">အကွာအဝေး</p>
                </div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">
                    ~{formatDuration(routeData.duration)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">ကြာချိန်</p>
                </div>
              </div>
            </div>

            {/* Current instruction (nav mode) */}
            {navMode && routeData.steps.length > 0 && (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="text-lg shrink-0 mt-0.5">
                    {maneuverIcon(String(routeData.steps[0].maneuver.type ?? ""))}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 leading-snug break-words">
                      {String(routeData.steps[0].maneuver.instruction ?? "")}
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {routeData.steps[0].name || ""}
                      {routeData.steps[0].distance > 0
                        ? ` · ${Math.round(routeData.steps[0].distance)}m`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle steps */}
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
            >
              <span className="font-medium">
                {showSteps ? "အဆင့်များ ဖျောက်ရန်" : "အဆင့်ဆင့် လမ်းညွှန်"}
              </span>
              {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSteps && (
              <div className="mt-2 max-h-40 overflow-y-auto scrollbar-thin space-y-1 pr-1">
                {routeData.steps.map((step, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                      {maneuverIcon(String(step.maneuver.type ?? ""))}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug text-foreground break-words">
                        {String(step.maneuver.instruction ?? "")}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {step.name || ""}
                        {step.distance > 0
                          ? ` · ${Math.round(step.distance)}m`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            လမ်းကြောင်း မရရှိပါ
          </div>
        )}

      </div>
    </div>
  );
}
