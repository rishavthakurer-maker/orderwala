import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/auth';

const LOCATION_COLLECTION = 'delivery_locations';

// POST /api/delivery/location - Delivery partner updates their live location
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, lat, lng } = body;

    if (!orderId || lat == null || lng == null) {
      return NextResponse.json({ success: false, error: 'Missing orderId, lat, or lng' }, { status: 400 });
    }

    const db = getDb();
    const userId = session.user.id;

    // Verify this delivery partner owns this order
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    const orderData = orderSnap.data()!;
    if (orderData.delivery_partner_id !== userId) {
      return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
    }

    // Only track when order is actively being delivered
    if (!['picked_up', 'on_the_way'].includes(orderData.status)) {
      return NextResponse.json({ success: false, error: 'Order is not in delivery' }, { status: 400 });
    }

    // Upsert location document (keyed by orderId)
    await db.collection(LOCATION_COLLECTION).doc(orderId).set({
      order_id: orderId,
      delivery_partner_id: userId,
      delivery_partner_name: session.user.name || '',
      lat: Number(lat),
      lng: Number(lng),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating delivery location:', error);
    return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
  }
}

// GET /api/delivery/location?orderId=xxx - Get delivery partner's live location for an order
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const db = getDb();

    // Verify user is associated with this order (customer, vendor, delivery, or admin)
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data()!;
    const userId = session.user.id;
    const role = session.user.role;

    const isAllowed =
      role === 'admin' ||
      orderData.customer_id === userId ||
      orderData.vendor_id === userId ||
      orderData.delivery_partner_id === userId;

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Get live location
    const locDoc = await db.collection(LOCATION_COLLECTION).doc(orderId).get();

    if (!locDoc.exists) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Location not available yet',
      });
    }

    const loc = locDoc.data()!;

    return NextResponse.json({
      success: true,
      data: {
        lat: loc.lat,
        lng: loc.lng,
        deliveryPartnerName: loc.delivery_partner_name,
        updatedAt: loc.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching delivery location:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch location' }, { status: 500 });
  }
}
