import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Try to find by UUID id or order_id string
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, name, phone, email),
        vendor:vendors(id, store_name, phone, address),
        delivery_partner:users!orders_delivery_partner_id_fkey(id, name, phone)
      `);

    // Check if id is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('order_number', id);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform response
    const response = {
      _id: order.id,
      orderId: order.order_number,
      customer: order.customer ? {
        _id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
      } : null,
      vendor: order.vendor ? {
        _id: order.vendor.id,
        storeName: order.vendor.store_name,
        phone: order.vendor.phone,
        address: order.vendor.address,
      } : null,
      deliveryPartner: order.delivery_partner ? {
        _id: order.delivery_partner.id,
        name: order.delivery_partner.name,
        phone: order.delivery_partner.phone,
      } : null,
      items: order.items,
      subtotal: order.subtotal,
      deliveryCharge: order.delivery_fee,
      discount: order.discount,
      total: order.total,
      deliveryAddress: order.delivery_address,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      status: order.status,
      instructions: order.delivery_instructions,
      promoCode: order.promo_code,
      timeline: order.status_history,
      confirmedAt: order.confirmed_at,
      preparingAt: order.preparing_at,
      readyAt: order.ready_at,
      pickedUpAt: order.picked_up_at,
      deliveredAt: order.delivered_at,
      cancelledAt: order.cancelled_at,
      cancellationReason: order.cancel_reason,
      rating: order.rating || null,
      review: order.review || null,
      deliveryRating: order.delivery_rating || null,
      deliveryFeedback: order.delivery_feedback || null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const body = await request.json();
    const { status, deliveryPartner, cancellationReason, note } = body;

    // Find the order
    let findQuery = supabase.from('orders').select('*');
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      findQuery = findQuery.eq('id', id);
    } else {
      findQuery = findQuery.eq('order_number', id);
    }

    const { data: order, error: findError } = await findQuery.single();

    if (findError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['picked_up', 'cancelled'],
      picked_up: ['on_the_way'],
      on_the_way: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (status && !validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;

      // Add to status history
      const currentHistory = order.status_history || [];
      updateData.status_history = [
        ...currentHistory,
        {
          status,
          timestamp: new Date().toISOString(),
          note: note || '',
        },
      ];

      // Set timestamps based on status
      if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
      if (status === 'preparing') updateData.preparing_at = new Date().toISOString();
      if (status === 'ready') updateData.ready_at = new Date().toISOString();
      if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString();
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        updateData.payment_status = 'completed';
      }
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancel_reason = cancellationReason;
      }
    }

    if (deliveryPartner) {
      updateData.delivery_partner_id = deliveryPartner;
      updateData.assigned_at = new Date().toISOString();
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, name, phone),
        vendor:vendors(id, store_name, phone),
        delivery_partner:users!orders_delivery_partner_id_fkey(id, name, phone)
      `)
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Create notification
    if (status) {
      const statusMessages: Record<string, string> = {
        confirmed: 'Your order has been confirmed by the vendor',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready for pickup',
        picked_up: 'Your order has been picked up by delivery partner',
        on_the_way: 'Your order is on the way',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled',
      };

      await supabase.from('notifications').insert({
        user_id: order.customer_id,
        type: 'order',
        title: `Order ${status.replace('_', ' ').toUpperCase()}`,
        message: statusMessages[status],
        data: { orderId: order.order_number },
      });
    }

    // Transform response
    const response = {
      _id: updatedOrder.id,
      orderId: updatedOrder.order_number,
      customer: updatedOrder.customer ? {
        _id: updatedOrder.customer.id,
        name: updatedOrder.customer.name,
        phone: updatedOrder.customer.phone,
      } : null,
      vendor: updatedOrder.vendor ? {
        _id: updatedOrder.vendor.id,
        storeName: updatedOrder.vendor.store_name,
        phone: updatedOrder.vendor.phone,
      } : null,
      deliveryPartner: updatedOrder.delivery_partner ? {
        _id: updatedOrder.delivery_partner.id,
        name: updatedOrder.delivery_partner.name,
        phone: updatedOrder.delivery_partner.phone,
      } : null,
      status: updatedOrder.status,
      timeline: updatedOrder.status_history,
      updatedAt: updatedOrder.updated_at,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
