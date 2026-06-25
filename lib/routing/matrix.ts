import type { GeoPosition } from "@/lib/types";

const MAX_COORDS = 24; // origin + 23 destinations = 24 coords (limit is 25)

function getToken() {
  return process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

function haversineDistance(a: GeoPosition, b: GeoPosition): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function fetchMatrixChunk(
  token: string,
  origin: GeoPosition,
  destinations: GeoPosition[]
): Promise<{ distance_m: number; duration_sec: number }[]> {
  const coords = [origin, ...destinations].map((p) => `${p.lng},${p.lat}`).join(";");
  const destIndices = destinations.map((_, i) => String(i + 1)).join(";");

  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?sources=0&destinations=${destIndices}&annotations=distance,duration&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Matrix API ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (!data.distances?.[0] || !data.durations?.[0]) {
    throw new Error(`Matrix API: unexpected format`);
  }

  return destinations.map((_, i) => ({
    distance_m: data.distances[0][i] ?? 0,
    duration_sec: data.durations[0][i] ?? 0,
  }));
}

export async function getDrivingDistances(
  origin: GeoPosition,
  destinations: GeoPosition[]
): Promise<{ distance_m: number; duration_sec: number; is_driving: boolean }[]> {
  if (!destinations.length) return [];

  const token = getToken();
  if (!token) {
    console.warn("Matrix API: No token, using straight-line");
    return destinations.map((d) => ({
      distance_m: haversineDistance(origin, d) * 1000,
      duration_sec: 0,
      is_driving: false,
    }));
  }

  try {
    const results: { distance_m: number; duration_sec: number }[] = [];

    for (let i = 0; i < destinations.length; i += MAX_COORDS - 1) {
      const chunk = destinations.slice(i, i + MAX_COORDS - 1);
      const chunkResults = await fetchMatrixChunk(token, origin, chunk);
      results.push(...chunkResults);
    }

    return results.map((r) => ({ ...r, is_driving: true }));
  } catch (err) {
    console.error("Matrix API failed, using straight-line fallback:", (err as Error).message);
    return destinations.map((d) => ({
      distance_m: haversineDistance(origin, d) * 1000,
      duration_sec: 0,
      is_driving: false,
    }));
  }
}
