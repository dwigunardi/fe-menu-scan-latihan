'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseGoogleMapsCoordinates } from '@/lib/utils/gmaps-parser';
import { reverseGeocode, forwardGeocode } from '@/lib/utils/geocoding';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

interface BranchMapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onChangeCoordinates: (lat: number, lon: number, resolvedAddress?: string) => void;
  disabled?: boolean;
}

export function BranchMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onChangeCoordinates,
  disabled = false,
}: BranchMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [searchInput, setSearchInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Debounced reverse geocoding handler
  const handleResolveAddress = useCallback(
    async (lat: number, lon: number) => {
      setIsGeocoding(true);
      const addr = await reverseGeocode(lat, lon);
      setIsGeocoding(false);
      if (addr) {
        setDetectedAddress(addr);
        onChangeCoordinates(lat, lon, addr);
      } else {
        onChangeCoordinates(lat, lon);
      }
    },
    [onChangeCoordinates]
  );

  // Initialize Leaflet map on client mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isSubscribed = true;

    async function initLeaflet() {
      const L = (await import('leaflet')).default;

      if (!isSubscribed || !mapContainerRef.current) return;

      // Fix default Leaflet marker icon paths for Next.js / Webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Custom Amber Pin Icon
      const customPinIcon = L.divIcon({
        className: 'custom-cafe-marker',
        html: `
          <div style="
            background-color: #D97706;
            color: #FFFFFF;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.45);
          ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 45 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        scrollWheelZoom: 'center',
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker([latitude, longitude], {
        draggable: !disabled,
        icon: customPinIcon,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #1C1917; text-align: center;">
          Titik Pusat Kafe<br/><span style="font-size: 10px; font-weight: normal; color: #78716C;">Geser pin untuk ubah lokasi</span>
        </div>`
      );

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const lat = Math.round(pos.lat * 10000000) / 10000000;
        const lon = Math.round(pos.lng * 10000000) / 10000000;
        handleResolveAddress(lat, lon);
      });

      // Add Geofence Circle Overlay
      const circle = L.circle([latitude, longitude], {
        radius: radiusMeters,
        color: '#D97706',
        fillColor: '#F59E0B',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      // Click on map to move marker
      map.on('click', (e: any) => {
        if (disabled) return;
        const { lat: rawLat, lng: rawLng } = e.latlng;
        const lat = Math.round(rawLat * 10000000) / 10000000;
        const lon = Math.round(rawLng * 10000000) / 10000000;
        marker.setLatLng([lat, lon]);
        circle.setLatLng([lat, lon]);
        handleResolveAddress(lat, lon);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      setMapReady(true);
    }

    initLeaflet();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Synchronize Leaflet map and circle when props change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([latitude, longitude]);
      circleRef.current.setRadius(radiusMeters);
    }
    mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
  }, [latitude, longitude, radiusMeters, mapReady]);

  // 1-Tap Device GPS Locating
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung Geolocation API.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = Math.round(position.coords.latitude * 10000000) / 10000000;
        const lon = Math.round(position.coords.longitude * 10000000) / 10000000;
        toast.success('Lokasi GPS perangkat berhasil dideteksi!');
        await handleResolveAddress(lat, lon);
      },
      (error) => {
        setIsLocating(false);
        toast.error(`Gagal mendeteksi lokasi GPS: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Google Maps URL Parse or Address Search Handler
  const handleApplySearchOrLink = async () => {
    const query = searchInput.trim();
    if (!query) return;

    // 1. Try parsing as Google Maps link or coordinates
    const parsed = parseGoogleMapsCoordinates(query);
    if (parsed) {
      toast.success('Koordinat berhasil diekstrak!');
      setSearchInput('');
      await handleResolveAddress(parsed.latitude, parsed.longitude);
      return;
    }

    // 2. Try forward geocoding query by address name
    setIsGeocoding(true);
    const result = await forwardGeocode(query);
    setIsGeocoding(false);

    if (result) {
      toast.success(`Lokasi ditemukan: ${result.displayName.slice(0, 45)}...`);
      setDetectedAddress(result.displayName);
      setSearchInput('');
      onChangeCoordinates(result.lat, result.lon, result.displayName);
    } else {
      toast.error(
        'Lokasi tidak ditemukan. Masukkan nama jalan lengkap atau paste link Google Maps.'
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* 3-Way Input Control Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        {/* Search Address or Google Maps Link */}
        <div className="sm:col-span-8 flex items-center gap-1.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              {isGeocoding ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </span>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), handleApplySearchOrLink())
              }
              placeholder="Cari nama jalan / paste link Google Maps..."
              disabled={disabled || isGeocoding}
              className="pl-9 text-xs rounded-xl h-9.5 bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplySearchOrLink}
            disabled={disabled || !searchInput.trim() || isGeocoding}
            className="h-9.5 px-3 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
          >
            {isGeocoding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Cari / Terapkan'}
          </Button>
        </div>

        {/* Method 1: 1-Tap Browser GPS */}
        <div className="sm:col-span-4 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={disabled || isLocating}
            className="w-full h-9.5 px-3 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Navigation className="h-3.5 w-3.5" />
            )}
            <span>Lokasi GPS Saya</span>
          </Button>
        </div>
      </div>

      {/* Interactive Map Visual Box */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200/80 dark:border-zinc-800 shadow-sm">
        <div
          ref={mapContainerRef}
          style={{ height: '340px', width: '100%' }}
          className="z-10 bg-stone-100 dark:bg-zinc-800"
        />

        {/* Floating Coordinates & Address Info Badge */}
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
          <div className="p-2.5 px-3 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-stone-200/80 dark:border-zinc-800 shadow-md text-xs space-y-1 pointer-events-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-zinc-100">
                <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Titik Pusat Geofence:</span>
              </div>
              <span className="text-amber-600 font-bold text-[11px] shrink-0 font-mono">
                Radius {radiusMeters}m
              </span>
            </div>

            <div className="font-mono text-[10px] text-stone-500 dark:text-zinc-400 flex items-center gap-2">
              <span>Lat: {latitude.toFixed(6)}</span>
              <span>Lon: {longitude.toFixed(6)}</span>
            </div>

            {detectedAddress && (
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 pt-0.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-1 truncate">
                <Sparkles className="h-3 w-3 shrink-0 text-emerald-500" />
                <span className="truncate">Tersinkron: {detectedAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-stone-400 dark:text-zinc-500">
        💡 <em>Tips:</em> Geser pin atau klik peta untuk memilih lokasi baru. Alamat form di sebelah kiri akan otomatis tersinkronisasi dengan titik peta yang dipilih.
      </p>
    </div>
  );
}
