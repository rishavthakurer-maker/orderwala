import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/delivery/earnings - Get delivery partner earnings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // today | week | month | all

    const now = new Date();
    let startDate: string | null = null;

    if (period === 'today') {
      const d = new Date(now); d.setHours(0, 0, 0, 0);
      startDate = d.toISOString();
    } else if (period === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      startDate = d.toISOString();
    } else if (period === 'month') {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString();
    }

    // Get delivered orders with earnings
    let earningsQuery = supabase
      .from('orders')
      .select('id, order_number, delivery_earnings, delivered_at, total, items')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false });

    if (startDate) {
      earningsQuery = earningsQuery.gte('delivered_at', startDate);
    }

    const { data: earningsData } = await earningsQuery;

    // Calculate totals
    const totalEarnings = earningsData?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;
    const totalDeliveries = earningsData?.length || 0;

    // Today's earnings
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const { data: todayData } = await supabase
      .from('orders')
      .select('delivery_earnings')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered')
      .gte('delivered_at', todayStart.toISOString());

    const todayEarnings = todayData?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;

    // This week
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
    const { data: weekData } = await supabase
      .from('orders')
      .select('delivery_earnings, delivered_at')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered')
      .gte('delivered_at', weekStart.toISOString());

    const weekEarnings = weekData?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;

    // This month
    const monthStart = new Date(now); monthStart.setMonth(monthStart.getMonth() - 1);
    const { data: monthData } = await supabase
      .from('orders')
      .select('delivery_earnings')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered')
      .gte('delivered_at', monthStart.toISOString());

    const monthEarnings = monthData?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;

    // All-time earnings
    const { data: allTimeData } = await supabase
      .from('orders')
      .select('delivery_earnings')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered');

    const allTimeEarnings = allTimeData?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;

    // Weekly chart data (last 7 days, grouped by day)
    const weeklyChart: { day: string; earnings: number; deliveries: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = (weekData || []).filter((o: Record<string, string>) => {
        const dt = new Date(o.delivered_at);
        return dt >= dayStart && dt <= dayEnd;
      });

      weeklyChart.push({
        day: dayNames[d.getDay()],
        earnings: dayOrders.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0),
        deliveries: dayOrders.length,
      });
    }

    // Recent earnings list
    const recentEarnings = (earningsData || []).slice(0, 20).map((o: Record<string, unknown>) => ({
      orderId: o.order_number,
      amount: o.delivery_earnings || 0,
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
          todayDeliveries: todayData?.length || 0,
          weekDeliveries: weekData?.length || 0,
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
