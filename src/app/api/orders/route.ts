import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderRecord = Record<string, any>;

// GET /api/orders - Get orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendor');

    const userRole = session.user.role;
    const userId = session.user.id;

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, name, phone),
        vendor:vendors(id, store_name, phone),
        delivery_partner:users!orders_delivery_partner_id_fkey(id, name, phone)
      `, { count: 'exact' });

    // Filter based on user role
    if (userRole === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (userRole === 'vendor') {
      query = query.eq('vendor_id', vendorId || userId);
    } else if (userRole === 'delivery') {
      query = query.eq('delivery_partner_id', userId);
    }
    // Admin can see all orders

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: orders, count, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Transform to match frontend expectations
    const transformedOrders = (orders || []).map((order: OrderRecord) => ({
      _id: order.id,
      orderId: order.order_number,
      customer: order.customer ? {
        _id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
      } : null,
      vendor: order.vendor ? {
        _id: order.vendor.id,
        storeName: order.vendor.store_name,
        phone: order.vendor.phone,
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
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const body = await request.json();
    const { items, vendorId, deliveryAddress, paymentMethod, instructions, promoCode } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      orderItems.push({
        product: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        image: product.images?.[0] || '',
      });

      subtotal += product.price * item.quantity;

      // Update stock
      await supabase
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', product.id);
    }

    // Calculate delivery charge
    const deliveryCharge = subtotal >= 199 ? 0 : 30;

    // Apply promo code discount
    let discount = 0;
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promo) {
        if (promo.discount_type === 'percentage') {
          discount = Math.round(subtotal * (promo.discount_value / 100));
          if (promo.max_discount && discount > promo.max_discount) {
            discount = promo.max_discount;
          }
        } else {
          discount = promo.discount_value;
        }
      }
    }

    const total = subtotal + deliveryCharge - discount;

    // Generate order ID
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const orderNumber = `OW${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${((orderCount || 0) + 1).toString().padStart(6, '0')}`;

    // Create order
    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: session.user.id,
        vendor_id: vendorId,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryCharge,
        discount,
        total,
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        payment_status: 'pending',
        delivery_instructions: instructions,
        promo_code: promoCode,
        status: 'pending',
        status_history: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Order placed',
        }],
      })
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, name, phone),
        vendor:vendors(id, store_name, phone)
      `)
      .single();

    if (createError) {
      console.error('Error creating order:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Transform response
    const response = {
      _id: order.id,
      orderId: order.order_number,
      customer: order.customer,
      vendor: order.vendor,
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
      createdAt: order.created_at,
    };

    return NextResponse.json(
      { success: true, data: response },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
