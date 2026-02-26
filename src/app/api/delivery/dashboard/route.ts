import { NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = session.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Fetch all orders for this delivery partner
    const myOrdersSnap = await db.collection(Collections.ORDERS)
      .where('delivery_partner_id', '==', userId)
      .get();

    const myOrders = myOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    // Today's deliveries
    const todayOrders = myOrders.filter(o =>
      o.status === 'delivered' && (o.delivered_at as string) >= todayStart.toISOString()
    );
    const todayDeliveries = todayOrders.length;
    const todayEarnings = todayOrders.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);

    // Active orders (assigned but not delivered/cancelled)
    const activeOrdersList = myOrders.filter(o =>
      o.status !== 'delivered' && o.status !== 'cancelled'
    );

    // Average rating from delivery_rating
    const ratedOrders = myOrders.filter(o => o.delivery_rating != null);
    const avgRating = ratedOrders.length > 0
      ? (ratedOrders.reduce((sum, o) => sum + ((o.delivery_rating as number) || 0), 0) / ratedOrders.length).toFixed(1)
      : '0.0';

    // Week stats
    const weekOrders = myOrders.filter(o =>
      o.status === 'delivered' && (o.delivered_at as string) >= weekStart.toISOString()
    );
    const weekDeliveries = weekOrders.length;
    const weekEarnings = weekOrders.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);

    // Available orders (status = 'ready' and no delivery partner assigned)
    const availableSnap = await db.collection(Collections.ORDERS)
      .where('status', '==', 'ready')
      .where('delivery_partner_id', '==', null)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();

    const availableOrdersRaw = availableSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    const transformOrder = async (o: Record<string, unknown>) => {
      let vendor = null;
      let customer = null;

      if (o.vendor_id) {
        const vendorSnap = await db.collection(Collections.VENDORS).doc(o.vendor_id as string).get();
        if (vendorSnap.exists) {
          const v = vendorSnap.data()!;
          vendor = { _id: vendorSnap.id, storeName: v.store_name, phone: v.phone, address: v.address };
        }
      }

      if (o.customer_id) {
        const customerSnap = await db.collection(Collections.USERS).doc(o.customer_id as string).get();
        if (customerSnap.exists) {
          const c = customerSnap.data()!;
          customer = { _id: customerSnap.id, name: c.name, phone: c.phone };
        }
      }

      return {
        _id: o.id,
        orderId: o.order_number,
        items: Array.isArray(o.items) ? o.items : [],
        total: o.total,
        deliveryFee: o.delivery_fee,
        deliveryAddress: o.delivery_address,
        deliveryEarnings: o.delivery_earnings || o.delivery_fee || 0,
        status: o.status,
        createdAt: o.created_at,
        vendor,
        customer,
      };
    };

    // My active orders with vendor/customer data
    const myActiveOrdersRaw = activeOrdersList.sort((a, b) =>
      ((b.created_at as string) || '').localeCompare((a.created_at as string) || '')
    );

    const [transformedActive, transformedAvailable] = await Promise.all([
      Promise.all(myActiveOrdersRaw.map(transformOrder)),
      Promise.all(availableOrdersRaw.map(transformOrder)),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayDeliveries,
          todayEarnings,
          activeOrders: activeOrdersList.length,
          rating: parseFloat(avgRating as string),
          weekDeliveries,
          weekEarnings,
          totalRatings: ratedOrders.length,
        },
        activeOrders: transformedActive,
        availableOrders: transformedAvailable,
      },
    });
  } catch (error) {
    console.error('Delivery dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
