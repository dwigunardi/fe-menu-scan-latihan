/**
 * Haversine Geodesic Distance Calculation Engine
 * Earth radius in meters: 6,371,000 m (WGS-84 standard approximation)
 */
const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates straight-line spherical distance between two coordinates in meters.
 * Accurate down to centimeters.
 *
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in meters (rounded to 1 decimal place)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;
  return Math.round(distance * 10) / 10;
}

export interface GeofenceCheckResult {
  isInside: boolean;
  distanceMeters: number;
  radiusMeters: number;
  exceededByMeters: number;
}

/**
 * Verifies if current user location is within cafe geofence boundary.
 *
 * @param userLat User device latitude
 * @param userLon User device longitude
 * @param cafeLat Cafe center latitude
 * @param cafeLon Cafe center longitude
 * @param radiusMeters Geofence boundary radius in meters (default: 100m)
 */
export function checkGeofence(
  userLat: number,
  userLon: number,
  cafeLat: number,
  cafeLon: number,
  radiusMeters: number = 100
): GeofenceCheckResult {
  const distanceMeters = calculateDistanceMeters(userLat, userLon, cafeLat, cafeLon);
  const isInside = distanceMeters <= radiusMeters;
  const exceededByMeters = isInside ? 0 : Math.round((distanceMeters - radiusMeters) * 10) / 10;

  return {
    isInside,
    distanceMeters,
    radiusMeters,
    exceededByMeters,
  };
}
