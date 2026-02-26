import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/delivery/earnings - Get delivery partner earnings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // today | week | month | all

    const now = new Date();

    // Fetch all delivered orders for this delivery partner
    const allDeliveredSnap = await db.collection(Collections.ORDERS)
      .where('delivery_partner_id', '==', userId)
      .where('status', '==', 'delivered')
      .orderBy('delivered_at', 'desc')
      .get();

    const allDelivered = allDeliveredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    // Helper to filter by date
    const filterByDate = (orders: Record<string, unknown>[], startDate: string | null) => {
      if (!startDate) return orders;
      return orders.filter(o => (o.delivered_at as string) >= startDate);
    };

    // Calculate period start dates
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now); monthStart.setMonth(monthStart.getMonth() - 1);

    let periodStartDate: string | null = null;
    if (period === 'today') periodStartDate = todayStart.toISOString();
    else if (period === 'week') periodStartDate = weekStart.toISOString();
    else if (period === 'month') periodStartDate = monthStart.toISOString();

    // Filter for the requested period
    const earningsData = filterByDate(allDelivered, periodStartDate);
    const totalEarnings = earningsData.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);
    const totalDeliveries = earningsData.length;

    // Today's earnings
    const todayData = filterByDate(allDelivered, todayStart.toISOString());
    const todayEarnings = todayData.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);

    // This week
    const weekData = filterByDate(allDelivered, weekStart.toISOString());
    const weekEarnings = weekData.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);

    // This month
    const monthData = filterByDate(allDelivered, monthStart.toISOString());
    const monthEarnings = monthData.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);

    // All-time earnings
    const allTimeEarnings = allDelivered.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0);

    // Weekly chart data (last 7 days, grouped by day)
    const weeklyChart: { day: string; earnings: number; deliveries: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = weekData.filter((o) => {
        const dt = new Date(o.delivered_at as string);
        return dt >= dayStart && dt <= dayEnd;
      });

      weeklyChart.push({
        day: dayNames[d.getDay()],
        earnings: dayOrders.reduce((sum, o) => sum + ((o.delivery_earnings as number) || 0), 0),
        deliveries: dayOrders.length,
      });
    }

    // Recent earnings list
    const recentEarnings = earningsData.slice(0, 20).map((o) => ({
      orderId: o.order_number,
      amount: (o.delivery_earnings as number) || 0,
      type: 'delivery',
      date: o.delivered_at,
      itemCount: Array.isArray(o.items) ? o.items.length : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          todayEarnings,
          weekEarnings,
          monthEarnings,
          allTimeEarnings,
          todayDeliveries: todayData.length,
          weekDeliveries: weekData.length,
          periodEarnings: totalEarnings,
          periodDeliveries: totalDeliveries,
        },
        weeklyChart,
        recentEarnings,
      },
    });
  } catch (error) {
    console.error('Delivery earnings error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
