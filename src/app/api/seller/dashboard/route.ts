import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/seller/dashboard - Get seller dashboard stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Get order stats
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('vendor_id', vendor.id);

    const orders: Record<string, unknown>[] = allOrders || [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: Record<string, unknown>) => ['pending', 'confirmed', 'preparing'].includes(o.status as string)).length;
    const completedOrders = orders.filter((o: Record<string, unknown>) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o: Record<string, unknown>) => o.status === 'cancelled').length;

    const totalRevenue = orders
      .filter((o: Record<string, unknown>) => o.status === 'delivered')
      .reduce((sum: number, o: Record<string, unknown>) => sum + (parseFloat(String(o.total)) || 0), 0);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o: Record<string, unknown>) => new Date(o.created_at as string) >= today);
    const todayRevenue = todayOrders
      .filter((o: Record<string, unknown>) => o.status === 'delivered')
      .reduce((sum: number, o: Record<string, unknown>) => sum + (parseFloat(String(o.total)) || 0), 0);

    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id);

    // Low stock products
    const { data: lowStock } = await supabase
      .from('products')
      .select('id, name, stock, images')
      .eq('vendor_id', vendor.id)
      .lt('stock', 10)
      .order('stock', { ascending: true })
      .limit(5);

    // Recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*, customer:users!orders_customer_id_fkey(name)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(5);

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
        lowStock: lowStock || [],
        recentOrders: (recentOrders || []).map((o: Record<string, unknown>) => ({
          id: o.id,
          orderId: o.order_number || o.id,
          customerName: (o.customer as Record<string, unknown>)?.name || 'Customer',
          total: o.total,
          status: o.status,
          items: o.items,
          createdAt: o.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
