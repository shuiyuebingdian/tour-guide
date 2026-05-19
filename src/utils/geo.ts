import type { Attraction } from '../types';

const EARTH_RADIUS_M = 6_371_000;

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
): boolean {
  return haversineDistance(userLocation, attraction.location) <= attraction.radius;
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
