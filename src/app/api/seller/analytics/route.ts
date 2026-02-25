import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as Record<string, unknown>).role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Get vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get all orders for this vendor
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: true });

    const allOrders = orders || [];

    // Calculate monthly revenue (last 6 months)
    const now = new Date();
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthOrders = allOrders.filter(
        (o: Record<string, unknown>) => String(o.created_at) >= monthStart && String(o.created_at) <= monthEnd && o.status === 'delivered'
      );
      monthlyRevenue.push({
        month: monthLabel,
        revenue: monthOrders.reduce((sum: number, o: Record<string, unknown>) => sum + (Number(o.total) || 0), 0),
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
        (o: Record<string, unknown>) => String(o.created_at) >= dayStart && String(o.created_at) <= dayEnd && o.status === 'delivered'
      );
      dailyRevenue.push({
        day: dayLabel,
        revenue: dayOrders.reduce((sum: number, o: Record<string, unknown>) => sum + (Number(o.total) || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Order status breakdown
    const statusBreakdown = {
      delivered: allOrders.filter((o: Record<string, unknown>) => o.status === 'delivered').length,
      cancelled: allOrders.filter((o: Record<string, unknown>) => o.status === 'cancelled').length,
      pending: allOrders.filter((o: Record<string, unknown>) => o.status === 'pending').length,
      confirmed: allOrders.filter((o: Record<string, unknown>) => o.status === 'confirmed').length,
      preparing: allOrders.filter((o: Record<string, unknown>) => o.status === 'preparing').length,
      ready: allOrders.filter((o: Record<string, unknown>) => o.status === 'ready').length,
    };

    // Top products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, price')
      .in('order_id', allOrders.filter((o: Record<string, unknown>) => o.status === 'delivered').map((o: Record<string, unknown>) => String(o.id)));

    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    (orderItems || []).forEach((item: Record<string, unknown>) => {
      const pid = String(item.product_id);
      if (!productMap[pid]) {
        productMap[pid] = { name: String(item.product_name || 'Unknown'), quantity: 0, revenue: 0 };
      }
      productMap[pid].quantity += Number(item.quantity) || 0;
      productMap[pid].revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
    });

    const topProducts = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Summary stats
    const totalRevenue = allOrders
      .filter((o: Record<string, unknown>) => o.status === 'delivered')
      .reduce((sum: number, o: Record<string, unknown>) => sum + (Number(o.total) || 0), 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / allOrders.filter((o: Record<string, unknown>) => o.status === 'delivered').length : 0;

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
