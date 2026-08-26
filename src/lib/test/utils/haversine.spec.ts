import { describe, it, expect } from 'vitest';
import { calculateDistanceMeters, checkGeofence } from '@/lib/utils/haversine';

describe('Haversine Geodesic Distance Engine', () => {
  // Koordinat Kumpul Cafe Tebet
  const CAFE_LAT = -6.2297465;
  const CAFE_LON = 106.8557342;

  it('calculates 0 meters for identical coordinates', () => {
    const distance = calculateDistanceMeters(CAFE_LAT, CAFE_LON, CAFE_LAT, CAFE_LON);
    expect(distance).toBe(0);
  });

  it('calculates accurate short distance (~55 meters)', () => {
    // Titik ~55 meter dari kafe
    const NEAR_LAT = -6.22925;
    const NEAR_LON = 106.8557342;

    const distance = calculateDistanceMeters(CAFE_LAT, CAFE_LON, NEAR_LAT, NEAR_LON);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(60);
  });

  it('calculates accurate city distance (Monas to Tebet ~6.5 km)', () => {
    const MONAS_LAT = -6.1753924;
    const MONAS_LON = 106.8271528;

    const distance = calculateDistanceMeters(CAFE_LAT, CAFE_LON, MONAS_LAT, MONAS_LON);
    // Sekitar 6.8 km - 7.0 km
    expect(distance).toBeGreaterThan(6500);
    expect(distance).toBeLessThan(7500);
  });

  describe('checkGeofence', () => {
    it('returns isInside: true when staff is inside 100m radius', () => {
      // Titik ~30 meter
      const STAFF_LAT = -6.2295;
      const STAFF_LON = 106.8557342;

      const result = checkGeofence(STAFF_LAT, STAFF_LON, CAFE_LAT, CAFE_LON, 100);
      expect(result.isInside).toBe(true);
      expect(result.distanceMeters).toBeLessThanOrEqual(100);
      expect(result.exceededByMeters).toBe(0);
    });

    it('returns isInside: false when staff is outside 100m radius with exceededByMeters', () => {
      // Titik Monas (~6.9 km)
      const STAFF_LAT = -6.1753924;
      const STAFF_LON = 106.8271528;

      const result = checkGeofence(STAFF_LAT, STAFF_LON, CAFE_LAT, CAFE_LON, 100);
      expect(result.isInside).toBe(false);
      expect(result.distanceMeters).toBeGreaterThan(100);
      expect(result.exceededByMeters).toBe(result.distanceMeters - 100);
    });
  });
});
