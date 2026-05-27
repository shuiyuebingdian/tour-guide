import type { Attraction } from '../types';

const EARTH_RADIUS_M = 6_371_000;

// WGS-84 → GCJ-02 (火星坐标系) transform constants
const PI = Math.PI;
const A = 6378245.0;
const EE = 0.006693421622965943;

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320.0 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / (30.0 * PI)) * PI)) * 2.0) / 3.0;
  return ret;
}

function isOutOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

/** Convert WGS-84 (GPS) coordinates to GCJ-02 (AMap) coordinates */
export function wgs84ToGcj02([lng, lat]: number[]): [number, number] {
  if (isOutOfChina(lng, lat)) return [lng, lat];

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);

  return [lng + dLng, lat + dLat];
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in meters between two [lng, lat] points */
export function haversineDistance(
  [lng1, lat1]: number[],
  [lng2, lat2]: number[],
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isNearby(
  userLocation: number[],
  attraction: { location: number[]; radius: number },
  triggerDistance?: number,
): boolean {
  return (
    haversineDistance(userLocation, attraction.location) <=
    (triggerDistance ?? attraction.radius)
  );
}

export function sortByDistance(
  userLocation: number[],
  attractions: Attraction[],
): Attraction[] {
  return [...attractions].sort(
    (a, b) =>
      haversineDistance(userLocation, a.location) -
      haversineDistance(userLocation, b.location),
  );
}
