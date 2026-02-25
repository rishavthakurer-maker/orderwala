import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/delivery/nearby - Get nearby available orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10'); // default 10km

    // Fetch available orders (status = 'ready', no delivery partner)
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, items, total, delivery_fee, delivery_address, created_at, status,
        vendor:vendors(id, store_name, phone, address, logo, category)
      `)
      .is('delivery_partner_id', null)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

interface NearbyOrderResult {
  _id: unknown;
  orderId: unknown;
  items: unknown[];
  itemCount: number;
  total: unknown;
  deliveryFee: unknown;
  deliveryEarnings: unknown;
  status: unknown;
  createdAt: unknown;
  deliveryAddress: Record<string, unknown>;
  vendor: Record<string, unknown> | null;
  pickupDistance: number | null;
  deliveryDistance: number | null;
  totalDistance: number | null;
}

    // Calculate distances and filter by radius
    const ordersWithDistance: NearbyOrderResult[] = (orders || []).map((o: Record<string, unknown>) => {
      const deliveryAddr = o.delivery_address as Record<string, unknown> | null;
      const vendor = o.vendor as Record<string, unknown> | null;
      const vendorAddr = vendor?.address as Record<string, unknown> | null;

      // Try to get vendor location from vendor address
      let vendorLat = 0, vendorLng = 0;
      if (vendorAddr) {
        vendorLat = parseFloat(String(vendorAddr.lat || vendorAddr.latitude || 0));
        vendorLng = parseFloat(String(vendorAddr.lng || vendorAddr.longitude || 0));
      }

      // Try to get delivery location
      let deliveryLat = 0, deliveryLng = 0;
      if (deliveryAddr) {
        deliveryLat = parseFloat(String(deliveryAddr.lat || deliveryAddr.latitude || 0));
        deliveryLng = parseFloat(String(deliveryAddr.lng || deliveryAddr.longitude || 0));
      }

      // Distance from delivery partner to vendor (pickup point)
      let pickupDistance = null;
      if (lat && lng && vendorLat && vendorLng) {
        pickupDistance = haversineDistance(lat, lng, vendorLat, vendorLng);
      }

      // Distance from vendor to customer (delivery route)
      let deliveryDistance = null;
      if (vendorLat && vendorLng && deliveryLat && deliveryLng) {
        deliveryDistance = haversineDistance(vendorLat, vendorLng, deliveryLat, deliveryLng);
      }

      // Estimated total distance (partner → vendor → customer)
      const totalDistance = (pickupDistance || 0) + (deliveryDistance || 0);

      const items = Array.isArray(o.items) ? o.items : [];

      return {
        _id: o.id,
        orderId: o.order_number,
        items,
        itemCount: items.length,
        total: o.total,
        deliveryFee: o.delivery_fee,
        deliveryEarnings: o.delivery_fee || 0,
        status: o.status,
        createdAt: o.created_at,
        deliveryAddress: {
          address: deliveryAddr?.address || '',
          city: deliveryAddr?.city || '',
          pincode: deliveryAddr?.pincode || '',
          lat: deliveryLat || null,
          lng: deliveryLng || null,
        },
        vendor: vendor ? {
          _id: vendor.id,
          storeName: vendor.store_name,
          phone: vendor.phone,
          logo: vendor.logo,
          category: vendor.category,
          address: vendorAddr ? {
            address: vendorAddr.address || vendorAddr.street || '',
            city: vendorAddr.city || '',
            lat: vendorLat || null,
            lng: vendorLng || null,
          } : null,
        } : null,
        pickupDistance: pickupDistance !== null ? Math.round(pickupDistance * 10) / 10 : null,
        deliveryDistance: deliveryDistance !== null ? Math.round(deliveryDistance * 10) / 10 : null,
        totalDistance: totalDistance ? Math.round(totalDistance * 10) / 10 : null,
      };
    });

    // Filter by radius (if lat/lng provided and distances can be calculated)
    let filtered = ordersWithDistance;
    if (lat && lng) {
      filtered = ordersWithDistance.filter(o =>
        o.pickupDistance === null || o.pickupDistance <= radius
      );
      // Sort by pickup distance (nearest first)
      filtered.sort((a, b) => (a.pickupDistance || 999) - (b.pickupDistance || 999));
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: filtered,
        total: filtered.length,
        partnerLocation: lat && lng ? { lat, lng } : null,
        radius,
      },
    });
  } catch (error) {
    console.error('Nearby orders error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
