import type { GeoPosition } from "@/lib/types";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN!;

interface MapboxDirectionsResponse {
  routes: {
    geometry: {
      coordinates: [number, number][];
      type: "LineString";
    };
    legs: {
      steps: unknown[];
      summary: string;
      distance: number;
      duration: number;
    }[];
    distance: number;
    duration: number;
  }[];
}

export interface RoutingResult {
  route: GeoJSON.LineString;
  legs: {
    steps: unknown[];
    summary: string;
    distance_m: number;
    duration_sec: number;
  }[];
  total_distance_m: number;
  total_duration_sec: number;
}

export async function getRoute(
  waypoints: GeoPosition[]
): Promise<RoutingResult | null> {
  if (waypoints.length < 2) return null;

  const coords = waypoints
    .map((wp) => `${wp.lng},${wp.lat}`)
    .join(";");

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&steps=true&overview=full&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as MapboxDirectionsResponse;
  if (!data.routes?.length) return null;

  const route = data.routes[0];

  return {
    route: {
      type: "LineString",
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [
        lng,
        lat,
      ]),
    },
    legs: route.legs.map((leg) => ({
      steps: leg.steps,
      summary: leg.summary,
      distance_m: leg.distance,
      duration_sec: leg.duration,
    })),
    total_distance_m: route.distance,
    total_duration_sec: route.duration,
  };
}
