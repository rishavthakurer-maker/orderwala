'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';

const MAP_CONTAINER = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India center
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

export function MapPicker({ onLocationSelect, initialLocation, height = '350px' }: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    geocoder.current = new google.maps.Geocoder();
    autocompleteService.current = new google.maps.places.AutocompleteService();
    placesService.current = new google.maps.places.PlacesService(mapInstance);

    if (initialLocation) {
      mapInstance.panTo(initialLocation);
      mapInstance.setZoom(LOCATED_ZOOM);
    }
  }, [initialLocation]);

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoder.current) return;
    setLoading(true);
    try {
      const result = await geocoder.current.geocode({ location: { lat, lng } });
      if (result.results[0]) {
        const place = result.results[0];
        const components = place.address_components;
        let city = '', state = '', pincode = '';
        components.forEach((c) => {
          if (c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('administrative_area_level_1')) state = c.long_name;
          if (c.types.includes('postal_code')) pincode = c.long_name;
        });
        const addr = place.formatted_address;
        setAddress(addr);
        onLocationSelect({ lat, lng, address: addr, city, state, pincode });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect]);

  // Handle map click
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      map?.panTo({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [map, reverseGeocode]);

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
        setMarker({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(LOCATED_ZOOM);
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
  }, [map, reverseGeocode]);

  // Auto-detect location on mount
  useEffect(() => {
    if (isLoaded && map && !initialLocation) {
      getCurrentLocation();
    }
  }, [isLoaded, map, initialLocation, getCurrentLocation]);

  // Search autocomplete
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (!autocompleteService.current || value.length < 3) {
      setSuggestions([]);
      return;
    }
    autocompleteService.current.getPlacePredictions(
      { input: value, componentRestrictions: { country: 'in' } },
      (predictions) => {
        setSuggestions(predictions || []);
      }
    );
  }, []);

  // Select a suggestion
  const handleSelectSuggestion = useCallback((placeId: string, description: string) => {
    setSuggestions([]);
    setSearchQuery(description);
    if (!placesService.current) return;
    placesService.current.getDetails(
      { placeId, fields: ['geometry', 'address_components', 'formatted_address'] },
      (place) => {
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setMarker({ lat, lng });
          map?.panTo({ lat, lng });
          map?.setZoom(LOCATED_ZOOM);

          const components = place.address_components || [];
          let city = '', state = '', pincode = '';
          components.forEach((c) => {
            if (c.types.includes('locality')) city = c.long_name;
            if (c.types.includes('administrative_area_level_1')) state = c.long_name;
            if (c.types.includes('postal_code')) pincode = c.long_name;
          });
          const addr = place.formatted_address || description;
          setAddress(addr);
          onLocationSelect({ lat, lng, address: addr, city, state, pincode });
        }
      }
    );
  }, [map, onLocationSelect]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border" style={{ height }}>
        <MapPin className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-gray-500 text-sm text-center">Map could not be loaded. Please enter your address manually below.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        <span className="ml-2 text-sm text-gray-500">Loading map...</span>
      </div>
    );
  }

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
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                onClick={() => handleSelectSuggestion(s.place_id, s.description)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.structured_formatting.main_text}</p>
                  <p className="text-xs text-gray-500">{s.structured_formatting.secondary_text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border relative" style={{ height }}>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER}
          center={marker || DEFAULT_CENTER}
          zoom={marker ? LOCATED_ZOOM : DEFAULT_ZOOM}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
            zoomControl: true,
          }}
        >
          {marker && <Marker position={marker} animation={google.maps.Animation.DROP} />}
        </GoogleMap>

        {/* Locate Me Button */}
        <button
          onClick={getCurrentLocation}
          disabled={geoLoading}
          className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg border hover:bg-gray-50 disabled:opacity-50 z-10"
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
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
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
