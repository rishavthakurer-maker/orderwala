import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
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

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendor');

    const userRole = session.user.role;
    const userId = session.user.id;

    // Build Firestore query
    let query: FirebaseFirestore.Query = db.collection(Collections.ORDERS);

    // Filter based on user role
    if (userRole === 'customer') {
      query = query.where('customer_id', '==', userId);
    } else if (userRole === 'vendor') {
      query = query.where('vendor_id', '==', vendorId || userId);
    } else if (userRole === 'delivery') {
      query = query.where('delivery_partner_id', '==', userId);
    }
    // Admin can see all orders

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('created_at', 'desc');

    // Get total count for pagination
    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    // Paginate
    const offset = (page - 1) * limit;
    const ordersSnap = await query.offset(offset).limit(limit).get();

    const orders: OrderRecord[] = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch related docs (customer, vendor, delivery_partner) in parallel
    const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))];
    const vendorIds = [...new Set(orders.map(o => o.vendor_id).filter(Boolean))];
    const deliveryPartnerIds = [...new Set(orders.map(o => o.delivery_partner_id).filter(Boolean))];

    const [customerDocs, vendorDocs, deliveryDocs] = await Promise.all([
      Promise.all(customerIds.map(cid => db.collection(Collections.USERS).doc(cid).get())),
      Promise.all(vendorIds.map(vid => db.collection(Collections.VENDORS).doc(vid).get())),
      Promise.all(deliveryPartnerIds.map(did => db.collection(Collections.USERS).doc(did).get())),
    ]);

    const customersMap: Record<string, OrderRecord> = {};
    for (const doc of customerDocs) {
      if (doc.exists) customersMap[doc.id] = { id: doc.id, ...doc.data() };
    }
    const vendorsMap: Record<string, OrderRecord> = {};
    for (const doc of vendorDocs) {
      if (doc.exists) vendorsMap[doc.id] = { id: doc.id, ...doc.data() };
    }
    const deliveryMap: Record<string, OrderRecord> = {};
    for (const doc of deliveryDocs) {
      if (doc.exists) deliveryMap[doc.id] = { id: doc.id, ...doc.data() };
    }

    // Transform to match frontend expectations
    const transformedOrders = orders.map((order: OrderRecord) => {
      const customer = customersMap[order.customer_id] || null;
      const vendor = vendorsMap[order.vendor_id] || null;
      const delivery_partner = deliveryMap[order.delivery_partner_id] || null;

      return {
        _id: order.id,
        orderId: order.order_number,
        customer: customer ? {
          _id: customer.id,
          name: customer.name,
          phone: customer.phone,
        } : null,
        vendor: vendor ? {
          _id: vendor.id,
          storeName: vendor.store_name,
          phone: vendor.phone,
        } : null,
        deliveryPartner: delivery_partner ? {
          _id: delivery_partner.id,
          name: delivery_partner.name,
          phone: delivery_partner.phone,
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
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
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

    const db = getDb();
    const body = await request.json();
    const { items, vendorId, deliveryAddress, paymentMethod, instructions, promoCode } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is missing. Please try adding the item to cart again.' },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendorDoc = await db.collection(Collections.VENDORS).doc(vendorId).get();
    if (!vendorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productDoc = await db.collection(Collections.PRODUCTS).doc(item.productId).get();
      if (!productDoc.exists) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      const product = { id: productDoc.id, ...productDoc.data() } as OrderRecord;
      const currentStock = typeof product.stock === 'number' ? product.stock : 999;

      if (currentStock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const itemPrice = typeof product.price === 'number' ? product.price : 0;

      orderItems.push({
        product: product.id,
        name: product.name || 'Unknown Product',
        price: itemPrice,
        quantity: item.quantity,
        unit: product.unit || 'pc',
        image: product.images?.[0] || '',
      });

      subtotal += itemPrice * item.quantity;

      // Update stock
      await db.collection(Collections.PRODUCTS).doc(product.id).update({
        stock: currentStock - item.quantity,
        updated_at: new Date().toISOString(),
      });
    }

    // Calculate delivery charge
    const deliveryCharge = subtotal >= 199 ? 0 : 30;

    // Apply promo code discount
    let discount = 0;
    if (promoCode) {
      const promoSnap = await db.collection(Collections.PROMO_CODES)
        .where('code', '==', promoCode.toUpperCase())
        .where('is_active', '==', true)
        .limit(1)
        .get();

      if (!promoSnap.empty) {
        const promo = promoSnap.docs[0].data();
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

    // Generate order number
    const countSnap = await db.collection(Collections.ORDERS).count().get();
    const orderCount = countSnap.data().count;

    const orderNumber = `OW${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${(orderCount + 1).toString().padStart(6, '0')}`;

    const now = new Date().toISOString();
    const orderId = generateId();

    const orderData = {
      order_number: orderNumber,
      customer_id: session.user.id,
      vendor_id: vendorId,
      delivery_partner_id: null,
      items: orderItems,
      subtotal,
      delivery_fee: deliveryCharge,
      discount,
      total,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      payment_status: 'pending',
      delivery_instructions: instructions || '',
      promo_code: promoCode || '',
      status: 'pending',
      status_history: [{
        status: 'pending',
        timestamp: now,
        note: 'Order placed',
      }],
      created_at: now,
      updated_at: now,
    };

    // Create order
    await db.collection(Collections.ORDERS).doc(orderId).set(orderData);

    // Fetch customer & vendor for response
    const [customerDoc, vendorDataDoc] = await Promise.all([
      db.collection(Collections.USERS).doc(session.user.id).get(),
      db.collection(Collections.VENDORS).doc(vendorId).get(),
    ]);

    const customer = customerDoc.exists ? { id: customerDoc.id, ...customerDoc.data() } as OrderRecord : null;
    const vendor = vendorDataDoc.exists ? { id: vendorDataDoc.id, ...vendorDataDoc.data() } as OrderRecord : null;

    // Transform response
    const response = {
      _id: orderId,
      orderId: orderNumber,
      customer: customer ? { _id: customer.id, name: customer.name, phone: customer.phone } : null,
      vendor: vendor ? { _id: vendor.id, store_name: vendor.store_name, phone: vendor.phone } : null,
      items: orderItems,
      subtotal,
      deliveryCharge,
      discount,
      total,
      deliveryAddress: deliveryAddress,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      instructions: instructions,
      promoCode: promoCode,
      createdAt: now,
    };

    return NextResponse.json(
      { success: true, data: response },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      { success: false, error: `Failed to create order: ${errorMessage}` },
      { status: 500 }
    );
  }
}
