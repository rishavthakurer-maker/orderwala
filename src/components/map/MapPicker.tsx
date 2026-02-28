'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';

// Fix Leaflet default marker icon (webpack/bundler issue)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center
const DEFAULT_ZOOM = 5;
const LOCATED_ZOOM = 16;

interface LocationResult {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface MapPickerProps {
  onLocationSelect: (location: LocationResult) => void;
  initialLocation?: { lat: number; lng: number } | null;
  height?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
}

// Extract city/state/pincode from Nominatim address
function parseNominatimAddress(data: NominatimResult) {
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || '';
  const state = addr.state || '';
  const pincode = addr.postcode || '';
  return { city, state, pincode, address: data.display_name };
}

// Component to handle map click events
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to programmatically fly the map to a position
function MapFlyTo({ position, zoom }: { position: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 1 });
    }
  }, [map, position, zoom]);
  return null;
}

export function MapPicker({ onLocationSelect, initialLocation, height = '350px' }: MapPickerProps) {
  const [marker, setMarker] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [flyZoom, setFlyZoom] = useState(initialLocation ? LOCATED_ZOOM : DEFAULT_ZOOM);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // Reverse geocode using Nominatim (free OpenStreetMap)
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: NominatimResult = await res.json();
      if (data.display_name) {
        const parsed = parseNominatimAddress(data);
        setAddress(parsed.address);
        onLocationSelect({ lat, lng, ...parsed });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      onLocationSelect({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect]);

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarker([lat, lng]);
    setFlyTarget([lat, lng]);
    setFlyZoom(LOCATED_ZOOM);
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarker([lat, lng]);
        setFlyTarget([lat, lng]);
        setFlyZoom(LOCATED_ZOOM);
        reverseGeocode(lat, lng);
        setGeoLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGeoLoading(false);
        alert('Unable to get your location. Please allow location access or search manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  // Auto-detect location on mount (only if no initial location)
  useEffect(() => {
    if (!mountedRef.current && !initialLocation) {
      mountedRef.current = true;
      getCurrentLocation();
    }
  }, [initialLocation, getCurrentLocation]);

  // Search using Nominatim (debounced)
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=in&addressdetails=1&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  }, []);

  // Select a suggestion
  const handleSelectSuggestion = useCallback((suggestion: NominatimResult) => {
    setSuggestions([]);
    setSearchQuery(suggestion.display_name);
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setMarker([lat, lng]);
    setFlyTarget([lat, lng]);
    setFlyZoom(LOCATED_ZOOM);
    const parsed = parseNominatimAddress(suggestion);
    setAddress(parsed.address);
    onLocationSelect({ lat, lng, ...parsed });
  }, [onLocationSelect]);

  const center: [number, number] = marker || DEFAULT_CENTER;
  const zoom = marker ? LOCATED_ZOOM : DEFAULT_ZOOM;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search for area, street name..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setSuggestions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2" title="Clear search">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-[1000] max-h-60 overflow-y-auto">
            {suggestions.map((s) => {
              const parts = s.display_name.split(', ');
              const mainText = parts[0] || s.display_name;
              const secondaryText = parts.slice(1).join(', ');
              return (
                <button
                  key={s.place_id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mainText}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{secondaryText}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border relative" style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onClick={handleMapClick} />
          <MapFlyTo position={flyTarget} zoom={flyZoom} />
          {marker && <Marker position={marker} />}
        </MapContainer>

        {/* Locate Me Button */}
        <button
          onClick={getCurrentLocation}
          disabled={geoLoading}
          className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg border hover:bg-gray-50 disabled:opacity-50 z-[1000]"
          title="Use my current location"
        >
          {geoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          ) : (
            <Navigation className="h-5 w-5 text-green-600" />
          )}
        </button>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1000]">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        )}
      </div>

      {/* Selected Address Display */}
      {address && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800">{address}</p>
        </div>
      )}
    </div>
  );
}
