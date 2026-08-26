export interface ParsedCoordinates {
  latitude: number;
  longitude: number;
  source: 'google-maps-url' | 'raw-coordinates';
}

/**
 * Extracts latitude and longitude from Google Maps URLs, query links, or raw coordinate strings.
 *
 * Supported Formats:
 * 1. Google Maps @lat,lng: https://www.google.com/maps/@-6.2297465,106.8557342,17z
 * 2. Google Maps Place @lat,lng: https://www.google.com/maps/place/.../@-6.2297465,106.8557342,17z/...
 * 3. Query string ?q=lat,lng: https://maps.google.com/?q=-6.2297465,106.8557342
 * 4. Query string ?ll=lat,lng: https://maps.google.com/?ll=-6.2297465,106.8557342
 * 5. Raw coordinate strings: "-6.2297465, 106.8557342" or "-6.2297465 106.8557342"
 *
 * @param input URL or raw coordinate string
 * @returns ParsedCoordinates object or null if parsing fails
 */
export function parseGoogleMapsCoordinates(input: string): ParsedCoordinates | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Google Maps @lat,lng pattern (e.g. @-6.2297465,106.8557342,17z)
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (isValidLatLon(lat, lon)) {
      return { latitude: lat, longitude: lon, source: 'google-maps-url' };
    }
  }

  // 2. Query param ?q=lat,lng or ?ll=lat,lng or ?daddr=lat,lng
  const queryMatch = trimmed.match(/[?&](?:q|ll|daddr|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lon = parseFloat(queryMatch[2]);
    if (isValidLatLon(lat, lon)) {
      return { latitude: lat, longitude: lon, source: 'google-maps-url' };
    }
  }

  // 3. Raw decimal coordinates format (e.g. "-6.2297465, 106.8557342" or "-6.2297465 106.8557342")
  const rawCoordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lon = parseFloat(rawCoordMatch[2]);
    if (isValidLatLon(lat, lon)) {
      return { latitude: lat, longitude: lon, source: 'raw-coordinates' };
    }
  }

  return null;
}

function isValidLatLon(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
