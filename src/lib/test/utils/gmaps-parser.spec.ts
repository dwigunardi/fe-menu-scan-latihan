import { describe, it, expect } from 'vitest';
import { parseGoogleMapsCoordinates } from '@/lib/utils/gmaps-parser';

describe('Google Maps Coordinates Parser', () => {
  it('parses Google Maps @lat,lng URL format', () => {
    const url = 'https://www.google.com/maps/@-6.2297465,106.8557342,17z';
    const result = parseGoogleMapsCoordinates(url);

    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(-6.2297465);
    expect(result?.longitude).toBeCloseTo(106.8557342);
    expect(result?.source).toBe('google-maps-url');
  });

  it('parses Google Maps place URL format with @lat,lng', () => {
    const url = 'https://www.google.com/maps/place/Kumpul+Cafe/@-6.2297465,106.8557342,15.2z/data=!4m6!3m5';
    const result = parseGoogleMapsCoordinates(url);

    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(-6.2297465);
    expect(result?.longitude).toBeCloseTo(106.8557342);
  });

  it('parses query parameter ?q=lat,lng format', () => {
    const url = 'https://maps.google.com/?q=-6.2297465,106.8557342';
    const result = parseGoogleMapsCoordinates(url);

    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(-6.2297465);
    expect(result?.longitude).toBeCloseTo(106.8557342);
  });

  it('parses raw coordinate string with comma', () => {
    const raw = '-6.2297465, 106.8557342';
    const result = parseGoogleMapsCoordinates(raw);

    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(-6.2297465);
    expect(result?.longitude).toBeCloseTo(106.8557342);
    expect(result?.source).toBe('raw-coordinates');
  });

  it('parses raw coordinate string with space separator', () => {
    const raw = '-6.2297465 106.8557342';
    const result = parseGoogleMapsCoordinates(raw);

    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(-6.2297465);
    expect(result?.longitude).toBeCloseTo(106.8557342);
  });

  it('returns null for invalid inputs or random strings', () => {
    expect(parseGoogleMapsCoordinates('')).toBeNull();
    expect(parseGoogleMapsCoordinates('https://google.com')).toBeNull();
    expect(parseGoogleMapsCoordinates('invalid coordinates')).toBeNull();
    expect(parseGoogleMapsCoordinates('-999, 999')).toBeNull(); // Out of range lat/lon
  });
});
