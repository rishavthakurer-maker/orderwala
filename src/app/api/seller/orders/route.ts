import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/seller/orders - Get seller's orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('orders')
      .select('*, customer:users!orders_customer_id_fkey(id, name, email, phone)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    const transformed = (orders || []).map((o: Record<string, unknown>) => ({
      id: o.id,
      orderId: o.order_number || o.id,
      customer: o.customer,
      items: o.items,
      subtotal: o.subtotal,
      deliveryCharge: o.delivery_charge,
      discount: o.discount,
      total: o.total,
      status: o.status,
      paymentMethod: o.payment_method,
      deliveryAddress: o.delivery_address,
      instructions: o.instructions,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
