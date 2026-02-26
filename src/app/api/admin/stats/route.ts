import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orderwala-admin-secret-key-2024';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();

    // Get counts and order data
    const [productsCount, categoriesCount, ordersSnapshot] = await Promise.all([
      db.collection(Collections.PRODUCTS).count().get(),
      db.collection(Collections.CATEGORIES).count().get(),
      db.collection(Collections.ORDERS).select('total_amount').get(),
    ]);

    const totalProducts = productsCount.data().count;
    const totalCategories = categoriesCount.data().count;
    const totalOrders = ordersSnapshot.size;
    
    // Calculate total revenue
    const totalRevenue = ordersSnapshot.docs.reduce(
      (sum: number, doc) => sum + (parseFloat(doc.data().total_amount) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
