import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/delivery/orders - Get delivery partner's orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active'; // active | history
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        id, order_number, items, total, delivery_fee, delivery_address,
        delivery_earnings, delivery_rating, delivery_feedback,
        status, payment_method, payment_status, delivery_instructions,
        status_history, created_at, delivered_at,
        vendor:vendors(id, store_name, phone, address),
        customer:users!orders_customer_id_fkey(id, name, phone)
      `, { count: 'exact' })
      .eq('delivery_partner_id', userId);

    if (type === 'active') {
      query = query.not('status', 'in', '("delivered","cancelled")');
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.in('status', ['delivered', 'cancelled']);
      query = query.order('delivered_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching delivery orders:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }

    const transformed = (orders || []).map((o: Record<string, unknown>) => ({
      _id: o.id,
      orderId: o.order_number,
      items: o.items || [],
      total: o.total,
      deliveryFee: o.delivery_fee,
      deliveryAddress: o.delivery_address,
      deliveryEarnings: o.delivery_earnings || o.delivery_fee || 0,
      deliveryRating: o.delivery_rating,
      deliveryFeedback: o.delivery_feedback,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      instructions: o.delivery_instructions,
      timeline: o.status_history,
      createdAt: o.created_at,
      deliveredAt: o.delivered_at,
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
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: { page, limit, total: count || 0 },
    });
  } catch (error) {
    console.error('Delivery orders error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/delivery/orders - Accept an order (assign delivery partner)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const userId = session.user.id;
    const body = await request.json();
    const { orderId, action } = body; // action: accept | pickup | on_the_way | delivered

    // Find the order
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (findErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const statusHistory = order.status_history || [];

    if (action === 'accept') {
      if (order.delivery_partner_id) {
        return NextResponse.json({ success: false, error: 'Order already assigned' }, { status: 400 });
      }
      if (order.status !== 'ready') {
        return NextResponse.json({ success: false, error: 'Order is not ready for pickup' }, { status: 400 });
      }
      updateData.delivery_partner_id = userId;
      updateData.assigned_at = new Date().toISOString();
      // Calculate delivery earnings (e.g., delivery_fee or a fixed amount)
      updateData.delivery_earnings = order.delivery_fee || 30;
    } else if (action === 'pickup') {
      if (order.delivery_partner_id !== userId) {
        return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
      }
      updateData.status = 'picked_up';
      updateData.picked_up_at = new Date().toISOString();
      statusHistory.push({ status: 'picked_up', timestamp: new Date().toISOString(), note: 'Picked up by delivery partner' });
      updateData.status_history = statusHistory;
    } else if (action === 'on_the_way') {
      if (order.delivery_partner_id !== userId) {
        return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
      }
      updateData.status = 'on_the_way';
      statusHistory.push({ status: 'on_the_way', timestamp: new Date().toISOString(), note: 'On the way to delivery' });
      updateData.status_history = statusHistory;
    } else if (action === 'delivered') {
      if (order.delivery_partner_id !== userId) {
        return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
      }
      updateData.status = 'delivered';
      updateData.delivered_at = new Date().toISOString();
      updateData.payment_status = 'completed';
      statusHistory.push({ status: 'delivered', timestamp: new Date().toISOString(), note: 'Delivered by delivery partner' });
      updateData.status_history = statusHistory;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateErr) {
      console.error('Error updating order:', updateErr);
      return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
    }

    // Send notification to customer
    const statusMsgs: Record<string, string> = {
      accept: 'A delivery partner has been assigned to your order',
      pickup: 'Your order has been picked up by the delivery partner',
      on_the_way: 'Your order is on the way',
      delivered: 'Your order has been delivered',
    };

    if (statusMsgs[action]) {
      await supabase.from('notifications').insert({
        user_id: order.customer_id,
        type: 'order',
        title: `Order ${action === 'accept' ? 'Assigned' : (updateData.status as string || '').replace('_', ' ').toUpperCase()}`,
        message: statusMsgs[action],
        data: { orderId: order.order_number },
      });
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Delivery order update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
