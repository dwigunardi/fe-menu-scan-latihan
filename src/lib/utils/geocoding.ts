/**
 * Reverse Geocoding and Forward Geocoding using OpenStreetMap Nominatim API.
 */

export interface ReverseGeocodeResult {
  displayName: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * Translates latitude and longitude into a human-readable street address.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'id,en',
        'User-Agent': 'KumpulCafe-App/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.display_name) return null;

    // Build concise, clean Indonesian address if details exist
    const address = data.address || {};
    const road = address.road || address.pedestrian || address.path || '';
    const houseNumber = address.house_number ? `No. ${address.house_number}` : '';
    const village = address.village || address.suburb || address.neighbourhood || '';
    const city = address.city || address.town || address.municipality || address.county || '';
    const state = address.state || '';

    const parts = [
      [road, houseNumber].filter(Boolean).join(' '),
      village,
      city,
      state,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return data.display_name;
  } catch {
    return null;
  }
}

/**
 * Searches for coordinates from a textual query or address string.
 */
export async function forwardGeocode(
  query: string
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query
    )}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'id,en',
        'User-Agent': 'KumpulCafe-App/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const first = results[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lon)) return null;

    return {
      lat,
      lon,
      displayName: first.display_name,
    };
  } catch {
    return null;
  }
}
