import { NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/seller/dashboard - Get seller dashboard stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get vendor
    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id, ...vendorSnap.docs[0].data() } as Record<string, unknown>;

    // Get order stats
    const ordersSnap = await db.collection(Collections.ORDERS)
      .where('vendor_id', '==', vendor.id)
      .get();

    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => ['pending', 'confirmed', 'preparing'].includes(o.status as string)).length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

    const totalRevenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum: number, o) => sum + (parseFloat(String(o.total)) || 0), 0);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.created_at as string) >= today);
    const todayRevenue = todayOrders
      .filter((o) => o.status === 'delivered')
      .reduce((sum: number, o) => sum + (parseFloat(String(o.total)) || 0), 0);

    // Get product count
    const productsSnap = await db.collection(Collections.PRODUCTS)
      .where('vendor_id', '==', vendor.id)
      .get();

    const allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];
    const productCount = allProducts.length;

    // Low stock products
    const lowStock = allProducts
      .filter((p) => (Number(p.stock) || 0) < 10)
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock, images: p.images }));

    // Recent orders (last 5 by created_at desc)
    const recentOrdersSnap = await db.collection(Collections.ORDERS)
      .where('vendor_id', '==', vendor.id)
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const recentOrders: Record<string, unknown>[] = [];
    for (const doc of recentOrdersSnap.docs) {
      const o = { id: doc.id, ...doc.data() } as Record<string, unknown>;
      // Fetch customer name
      let customerName = 'Customer';
      if (o.customer_id) {
        const custDoc = await db.collection(Collections.USERS).doc(String(o.customer_id)).get();
        if (custDoc.exists) {
          customerName = String((custDoc.data() as Record<string, unknown>)?.name || 'Customer');
        }
      }
      recentOrders.push({
        id: o.id,
        orderId: o.order_number || o.id,
        customerName,
        total: o.total,
        status: o.status,
        items: o.items,
        createdAt: o.created_at,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        store: {
          name: vendor.store_name,
          isOpen: vendor.is_open,
          isVerified: vendor.is_verified,
          rating: vendor.average_rating,
          totalRatings: vendor.total_ratings,
        },
        stats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          todayOrders: todayOrders.length,
          todayRevenue,
          totalProducts: productCount || 0,
        },
        lowStock,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
