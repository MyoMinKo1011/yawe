"use client";

import { LngLatBounds } from "mapbox-gl";
import { useRef, useCallback } from "react";
import { Map, Marker } from "react-map-gl/mapbox";
import type { MapRef, MapEvent } from "react-map-gl/mapbox";

interface MapBlockProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    label: string;
    place_type?: string;
  }>;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function fitMap(
  map: MapRef,
  center: { lat: number; lng: number },
  markers: MapBlockProps["markers"]
) {
  if (markers && markers.length > 0) {
    const bounds = new LngLatBounds();
    bounds.extend([center.lng, center.lat]);
    for (const m of markers) {
      bounds.extend([m.lng, m.lat]);
    }
    map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
  }
}

export function MapBlock({ center, zoom, markers }: MapBlockProps) {
  const mapRef = useRef<MapRef>(null);

  const onLoad = useCallback(
    () => {
      if (mapRef.current) {
        fitMap(mapRef.current, center, markers);
      }
    },
    [center, markers]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-48 sm:h-56 md:h-64 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Mapbox token required
      </div>
    );
  }

  return (
    <div className="h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden border border-border">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: zoom ?? 13,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={onLoad}
        reuseMaps
      >
        {markers?.map((marker, i) => (
          <Marker
            key={i}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
          >
            <div className="relative cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center -rotate-45">
                <div className="rotate-45 text-white text-[10px] font-bold">
                  ●
                </div>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-2 h-2 bg-blue-600 rotate-45" />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
