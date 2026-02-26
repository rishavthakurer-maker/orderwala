import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId, docsToArray } from '@/lib/firebase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orderwala-admin-secret-key-2024';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

// Get all categories (admin)
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();

    const snapshot = await db
      .collection(Collections.CATEGORIES)
      .orderBy('sort_order', 'asc')
      .get();

    const categories = docsToArray<Record<string, unknown>>(snapshot);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Create new category
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, image, icon, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const db = getDb();
    const id = generateId();
    const now = new Date().toISOString();

    const categoryData: Record<string, unknown> = {
      name,
      slug,
      description: description || '',
      image: image || '',
      icon: icon || '',
      sort_order: sortOrder || 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.CATEGORIES).doc(id).set(categoryData);

    return NextResponse.json({
      success: true,
      data: { id, ...categoryData },
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
