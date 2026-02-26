import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, Collections } from '@/lib/firebase';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as Record<string, unknown>).role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get vendor
    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id, ...vendorSnap.docs[0].data() };

    // Get all orders for this vendor
    const ordersSnap = await db.collection(Collections.ORDERS)
      .where('vendor_id', '==', vendor.id)
      .orderBy('created_at', 'asc')
      .get();

    const allOrders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    // Calculate monthly revenue (last 6 months)
    const now = new Date();
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const monthOrders = allOrders.filter(
        (o) => String(o.created_at) >= monthStart && String(o.created_at) <= monthEnd && o.status === 'delivered'
      );
      monthlyRevenue.push({
        month: monthLabel,
        revenue: monthOrders.reduce((sum: number, o) => sum + (Number(o.total) || 0), 0),
        orders: monthOrders.length,
      });
    }

    // Daily revenue (last 7 days)
    const dailyRevenue: { day: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayOrders = allOrders.filter(
        (o) => String(o.created_at) >= dayStart && String(o.created_at) <= dayEnd && o.status === 'delivered'
      );
      dailyRevenue.push({
        day: dayLabel,
        revenue: dayOrders.reduce((sum: number, o) => sum + (Number(o.total) || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Order status breakdown
    const statusBreakdown = {
      delivered: allOrders.filter((o) => o.status === 'delivered').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
      pending: allOrders.filter((o) => o.status === 'pending').length,
      confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
      preparing: allOrders.filter((o) => o.status === 'preparing').length,
      ready: allOrders.filter((o) => o.status === 'ready').length,
    };

    // Top products – aggregate from order items embedded in delivered orders
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');
    for (const order of deliveredOrders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const itm = item as Record<string, unknown>;
        const pid = String(itm.product_id || itm.id || 'unknown');
        if (!productMap[pid]) {
          productMap[pid] = { name: String(itm.product_name || itm.name || 'Unknown'), quantity: 0, revenue: 0 };
        }
        productMap[pid].quantity += Number(itm.quantity) || 0;
        productMap[pid].revenue += (Number(itm.quantity) || 0) * (Number(itm.price) || 0);
      }
    }

    const topProducts = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Summary stats
    const totalRevenue = deliveredOrders
      .reduce((sum: number, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: { totalRevenue, totalOrders, avgOrderValue },
        monthlyRevenue,
        dailyRevenue,
        statusBreakdown,
        topProducts,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
