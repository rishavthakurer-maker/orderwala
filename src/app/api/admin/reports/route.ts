import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7days';

    const db = getDb();

    // Calculate date range
    let startDate = new Date();
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const startDateISO = startDate.toISOString();

    // Get orders in date range, customers count, and active products count in parallel
    const [ordersSnapshot, customersCount, productsCount] = await Promise.all([
      db.collection(Collections.ORDERS)
        .where('created_at', '>=', startDateISO)
        .get(),
      db.collection(Collections.USERS)
        .where('role', '==', 'customer')
        .count()
        .get(),
      db.collection(Collections.PRODUCTS)
        .where('is_active', '==', true)
        .count()
        .get(),
    ]);

    const totalCustomers = customersCount.data().count;
    const totalProducts = productsCount.data().count;

    // Calculate stats from orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ordersList = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<Record<string, any>>;
    const totalRevenue = ordersList.reduce((sum: number, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const totalOrders = ordersList.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Aggregate top products from order items embedded in orders
    // Since Firestore has no joins, we look at items within orders
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
    for (const order of ordersList) {
      const items = order.items || order.order_items || [];
      for (const item of items) {
        const productName = item.product_name || item.name || 'Unknown Product';
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, sales: 0, revenue: 0 };
        }
        productSales[productName].sales += (item.quantity as number) || 0;
        productSales[productName].revenue += ((item.quantity as number) || 0) * (parseFloat(item.price) || 0);
      }
    }
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get top categories
    const categoriesSnapshot = await db
      .collection(Collections.CATEGORIES)
      .where('is_active', '==', true)
      .limit(5)
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topCategories = categoriesSnapshot.docs.map((doc) => {
      const cat = doc.data();
      return {
        name: cat.name,
        orders: Math.floor(Math.random() * 50), // Placeholder - would need order_items aggregation
        revenue: Math.floor(Math.random() * 10000), // Placeholder
      };
    });

    // Get recent orders
    const recentOrdersSnapshot = await db
      .collection(Collections.ORDERS)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();

    // Fetch user names for recent orders
    const recentOrders = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentOrdersSnapshot.docs.map(async (doc) => {
        const order = doc.data();
        let customerName = 'Guest';
        if (order.user_id) {
          const userDoc = await db.collection(Collections.USERS).doc(order.user_id).get();
          if (userDoc.exists) {
            customerName = userDoc.data()?.name || 'Guest';
          }
        }
        return {
          id: doc.id,
          customer: customerName,
          total: parseFloat(order.total_amount) || 0,
          status: order.status,
          date: new Date(order.created_at).toLocaleDateString('en-IN'),
        };
      })
    );

    // Calculate growth (placeholder - would need previous period comparison)
    const revenueGrowth = 12.5;
    const ordersGrowth = 8.3;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        revenueGrowth,
        ordersGrowth,
        avgOrderValue: Math.round(avgOrderValue),
        topProducts,
        topCategories,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
