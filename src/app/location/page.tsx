'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, ArrowLeft, Loader2, Home, Briefcase, MapPinned } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { useLocationStore } from '@/store';
import toast from 'react-hot-toast';

const MapPicker = dynamic(() => import('@/components/map/MapPicker').then(m => ({ default: m.MapPicker })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-lg border">
      <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      <span className="ml-2 text-sm text-gray-500">Loading map...</span>
    </div>
  ),
});

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

function LocationPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { setSelectedAddress, setCurrentLocation, currentLocation } = useLocationStore();

  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [detecting, setDetecting] = useState(false);

  const handleLocationSelect = (loc: LocationData) => {
    setLocation(loc);
    setManualAddress(loc.address);
    setManualCity(loc.city || '');
    setManualState(loc.state || '');
    setManualPincode(loc.pincode || '');
  };

  const handleConfirm = () => {
    if (location) {
      setSelectedAddress({
        lat: location.lat,
        lng: location.lng,
        address: manualAddress || location.address,
        city: manualCity || location.city,
        state: manualState || location.state,
        pincode: manualPincode || location.pincode,
      });
      setCurrentLocation({
        lat: location.lat,
        lng: location.lng,
        address: manualAddress || location.address,
        city: manualCity || location.city,
        state: manualState || location.state,
        pincode: manualPincode || location.pincode,
      });
      toast.success('Location set successfully!');
      router.push(redirect);
    } else if (manualMode && manualAddress.trim()) {
      // Manual-only mode, use 0,0 for lat/lng
      setSelectedAddress({
        lat: 0,
        lng: 0,
        address: manualAddress,
        city: manualCity,
        state: manualState,
        pincode: manualPincode,
      });
      toast.success('Address saved!');
      router.push(redirect);
    } else {
      toast.error('Please select a location on the map or enter an address');
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();
          if (data.results?.[0]) {
            const place = data.results[0];
            let city = '', state = '', pincode = '';
            place.address_components?.forEach((c: { types: string[]; long_name: string }) => {
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pincode = c.long_name;
            });
            handleLocationSelect({ lat, lng, address: place.formatted_address, city, state, pincode });
          }
        } catch {
          handleLocationSelect({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
        setDetecting(false);
      },
      () => {
        toast.error('Unable to detect location. Please allow location access.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-lg" title="Go back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Set Delivery Location</h1>
            <p className="text-xs text-gray-500">Choose where you want your order delivered</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Quick detect button */}
        <Button
          onClick={detectCurrentLocation}
          disabled={detecting}
          variant="outline"
          className="w-full border-green-200 text-green-700 hover:bg-green-50"
        >
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {detecting ? 'Detecting your location...' : 'Use My Current Location'}
        </Button>

        {/* Map */}
        <MapPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null}
          height="300px"
        />

        {/* Address Details Form */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-green-600" />
                Delivery Address Details
              </h3>
              <button
                onClick={() => setManualMode(!manualMode)}
                className="text-xs text-green-600 hover:underline"
              >
                {manualMode ? 'Use map instead' : 'Enter manually'}
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Complete Address *</label>
              <textarea
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="House no., Building, Street, Area"
                rows={2}
                title="Complete delivery address"
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <Input
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">State</label>
                <Input
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                <Input
                  value={manualPincode}
                  onChange={(e) => setManualPincode(e.target.value)}
                  placeholder="Pincode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleConfirm}
          disabled={!location && !manualAddress.trim()}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Confirm Location
        </Button>

        {/* Saved locations shortcut */}
        {currentLocation && (
          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-2">Previously used</p>
            <button
              onClick={() => {
                handleLocationSelect({
                  lat: currentLocation.lat,
                  lng: currentLocation.lng,
                  address: currentLocation.address,
                  city: currentLocation.city,
                  state: currentLocation.state,
                  pincode: currentLocation.pincode,
                });
              }}
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
            >
              <div className="p-2 bg-green-50 rounded-lg">
                <Home className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentLocation.address}</p>
                <p className="text-xs text-gray-500">
                  {[currentLocation.city, currentLocation.state, currentLocation.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    }>
      <LocationPageContent />
    </Suspense>
  );
}
