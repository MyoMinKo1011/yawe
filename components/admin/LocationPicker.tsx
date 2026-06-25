"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Map, Marker } from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.flyTo({ center: [lng, lat], duration: 800 });
    }
  }, [lat, lng, mapReady]);

  const onMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const onMapClick = useCallback(
    (e: MapMouseEvent) => {
      onChange(e.lngLat.lat, e.lngLat.lng);
    },
    [onChange]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-64 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground border border-border">
        Mapbox token required
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">
        Location (click map to pin, drag to adjust)
      </label>
      <div className="h-64 rounded-xl overflow-hidden border border-border">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: lng,
            latitude: lat,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={onMapClick}
          onLoad={onMapLoad}
          reuseMaps
        >
          <Marker
            ref={markerRef}
            longitude={lng}
            latitude={lat}
            draggable
            onDragEnd={(e) => {
              onChange(e.lngLat.lat, e.lngLat.lng);
            }}
            anchor="bottom"
          >
            <div className="relative cursor-grab active:cursor-grabbing">
              <MapPin
                size={32}
                className="text-red-600 drop-shadow-lg"
                fill="currentColor"
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-900 rounded-full" />
            </div>
          </Marker>
        </Map>
      </div>
      <p className="text-xs text-muted-foreground">
        {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>
    </div>
  );
}
