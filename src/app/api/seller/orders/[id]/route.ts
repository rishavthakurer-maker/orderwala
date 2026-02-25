import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// PUT /api/seller/orders/[id] - Update order status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Verify order belongs to this vendor
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, status_history')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['picked_up'],
      picked_up: ['on_the_way'],
      on_the_way: ['delivered'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      }, { status: 400 });
    }

    const statusHistory = Array.isArray(order.status_history) ? order.status_history : [];
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      by: session.user.name || 'Vendor',
    });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status,
        status_history: statusHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}

// GET /api/seller/orders/[id] - Get single order
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, customer:users!orders_customer_id_fkey(id, name, email, phone)')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
