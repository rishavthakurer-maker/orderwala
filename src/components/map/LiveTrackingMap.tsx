'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const deliveryIcon = L.divIcon({
  html: `<div style="background:#3b82f6;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🛵</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destinationIcon = L.divIcon({
  html: `<div style="background:#22c55e;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">🏠</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const vendorIcon = L.divIcon({
  html: `<div style="background:#f97316;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">🏪</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface LiveTrackingMapProps {
  orderId: string; // Firestore document ID
  deliveryAddress?: { lat?: number; lng?: number; address?: string };
  vendorAddress?: { lat?: number; lng?: number; name?: string };
  status: string;
}

// Component to auto-fit map bounds when markers change
function MapBoundsUpdater({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const hasSetBoundsRef = useRef(false);

  useEffect(() => {
    if (positions.length > 0 && !hasSetBoundsRef.current) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      hasSetBoundsRef.current = true;
    }
  }, [positions, map]);

  return null;
}

// Smoothly animate marker to new position
function AnimatedMarker({ position, icon, children }: { position: [number, number]; icon: L.DivIcon; children?: React.ReactNode }) {
  const markerRef = useRef<L.Marker>(null);
  const prevPosRef = useRef<[number, number]>(position);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      const start = prevPosRef.current;
      const end = position;
      const duration = 1000; // 1 second animation
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease-out
        const ease = 1 - Math.pow(1 - t, 3);
        const lat = start[0] + (end[0] - start[0]) * ease;
        const lng = start[1] + (end[1] - start[1]) * ease;
        marker.setLatLng([lat, lng]);
        if (t < 1) requestAnimationFrame(animate);
      };

      if (start[0] !== end[0] || start[1] !== end[1]) {
        animate();
      }
      prevPosRef.current = position;
    }
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
}

export default function LiveTrackingMap({ orderId, deliveryAddress, vendorAddress, status }: LiveTrackingMapProps) {
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number; name: string; updatedAt: string } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchLocation = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/location?orderId=${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDeliveryLocation({
          lat: data.data.lat,
          lng: data.data.lng,
          name: data.data.deliveryPartnerName || 'Delivery Partner',
          updatedAt: data.data.updatedAt,
        });
        setIsTracking(true);

        // Calculate time ago
        const seconds = Math.floor((Date.now() - new Date(data.data.updatedAt).getTime()) / 1000);
        if (seconds < 10) setLastUpdate('Just now');
        else if (seconds < 60) setLastUpdate(`${seconds}s ago`);
        else setLastUpdate(`${Math.floor(seconds / 60)}m ago`);
      }
    } catch {
      // Silently fail
    }
  }, [orderId]);

  useEffect(() => {
    // Only poll for live orders
    if (!['picked_up', 'on_the_way'].includes(status)) return;

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLocation, status]);

  // Determine map center and markers
  const positions: [number, number][] = [];
  if (deliveryLocation) positions.push([deliveryLocation.lat, deliveryLocation.lng]);
  if (deliveryAddress?.lat && deliveryAddress?.lng) positions.push([deliveryAddress.lat, deliveryAddress.lng]);
  if (vendorAddress?.lat && vendorAddress?.lng) positions.push([vendorAddress.lat, vendorAddress.lng]);

  // Default center: delivery location > delivery address > India center
  const center: [number, number] = deliveryLocation
    ? [deliveryLocation.lat, deliveryLocation.lng]
    : deliveryAddress?.lat && deliveryAddress?.lng
      ? [deliveryAddress.lat, deliveryAddress.lng]
      : [20.5937, 78.9629];

  const showMap = ['picked_up', 'on_the_way'].includes(status);

  if (!showMap) return null;

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="text-lg">🛵</span>
            {isTracking && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">Live Tracking</p>
            <p className="text-xs text-blue-100">
              {isTracking ? `Updated ${lastUpdate}` : 'Waiting for location...'}
            </p>
          </div>
        </div>
        {isTracking && deliveryLocation && (
          <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">{deliveryLocation.name}</span>
        )}
      </div>

      {/* Map */}
      <div style={{ height: '280px', width: '100%' }}>
        <MapContainer
          center={center}
          zoom={positions.length > 0 ? 14 : 5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {positions.length > 1 && <MapBoundsUpdater positions={positions} />}

          {/* Delivery Partner marker */}
          {deliveryLocation && (
            <AnimatedMarker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
              <Popup>{deliveryLocation.name}<br />🛵 On the way</Popup>
            </AnimatedMarker>
          )}

          {/* Delivery destination */}
          {deliveryAddress?.lat && deliveryAddress?.lng && (
            <Marker position={[deliveryAddress.lat, deliveryAddress.lng]} icon={destinationIcon}>
              <Popup>📍 Delivery Address<br />{deliveryAddress.address || 'Your location'}</Popup>
            </Marker>
          )}

          {/* Vendor/Pickup */}
          {vendorAddress?.lat && vendorAddress?.lng && (
            <Marker position={[vendorAddress.lat, vendorAddress.lng]} icon={vendorIcon}>
              <Popup>🏪 {vendorAddress.name || 'Vendor'}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1"><span>🛵</span> Delivery Partner</div>
        <div className="flex items-center gap-1"><span>🏠</span> Your Location</div>
        <div className="flex items-center gap-1"><span>🏪</span> Vendor</div>
      </div>
    </div>
  );
}
