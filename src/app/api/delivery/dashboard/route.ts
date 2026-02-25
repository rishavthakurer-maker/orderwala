import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const userId = session.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Today's deliveries
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, delivery_earnings, delivery_rating')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered')
      .gte('delivered_at', todayStart.toISOString());

    const todayDeliveries = todayOrders?.length || 0;
    const todayEarnings = todayOrders?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;

    // Active orders (assigned but not delivered)
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('delivery_partner_id', userId)
      .not('status', 'in', '("delivered","cancelled")');

    // Average rating from delivery_rating
    const { data: ratedOrders } = await supabase
      .from('orders')
      .select('delivery_rating')
      .eq('delivery_partner_id', userId)
      .not('delivery_rating', 'is', null);

    const avgRating = ratedOrders && ratedOrders.length > 0
      ? (ratedOrders.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_rating || 0), 0) / ratedOrders.length).toFixed(1)
      : '0.0';

    // Week stats
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('id, delivery_earnings, delivered_at')
      .eq('delivery_partner_id', userId)
      .eq('status', 'delivered')
      .gte('delivered_at', weekStart.toISOString());

    const weekDeliveries = weekOrders?.length || 0;
    const weekEarnings = weekOrders?.reduce((sum: number, o: Record<string, number>) => sum + (o.delivery_earnings || 0), 0) || 0;

    // Available orders (status = 'ready' and no delivery partner assigned)
    const { data: availableOrders } = await supabase
      .from('orders')
      .select(`
        id, order_number, items, total, delivery_fee, delivery_address, created_at,
        vendor:vendors(id, store_name, phone, address)
      `)
      .is('delivery_partner_id', null)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(10);

    // My active orders
    const { data: myActiveOrders } = await supabase
      .from('orders')
      .select(`
        id, order_number, items, total, delivery_fee, delivery_address, delivery_earnings, status, created_at,
        vendor:vendors(id, store_name, phone, address),
        customer:users!orders_customer_id_fkey(id, name, phone)
      `)
      .eq('delivery_partner_id', userId)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false });

    const transformOrder = (o: Record<string, unknown>) => ({
      _id: o.id,
      orderId: o.order_number,
      items: Array.isArray(o.items) ? o.items : [],
      total: o.total,
      deliveryFee: o.delivery_fee,
      deliveryAddress: o.delivery_address,
      deliveryEarnings: o.delivery_earnings || o.delivery_fee || 0,
      status: o.status,
      createdAt: o.created_at,
      vendor: o.vendor ? {
        _id: (o.vendor as Record<string, unknown>).id,
        storeName: (o.vendor as Record<string, unknown>).store_name,
        phone: (o.vendor as Record<string, unknown>).phone,
        address: (o.vendor as Record<string, unknown>).address,
      } : null,
      customer: o.customer ? {
        _id: (o.customer as Record<string, unknown>).id,
        name: (o.customer as Record<string, unknown>).name,
        phone: (o.customer as Record<string, unknown>).phone,
      } : null,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayDeliveries,
          todayEarnings,
          activeOrders: activeOrders?.length || 0,
          rating: parseFloat(avgRating as string),
          weekDeliveries,
          weekEarnings,
          totalRatings: ratedOrders?.length || 0,
        },
        activeOrders: (myActiveOrders || []).map(transformOrder),
        availableOrders: (availableOrders || []).map(transformOrder),
      },
    });
  } catch (error) {
    console.error('Delivery dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
