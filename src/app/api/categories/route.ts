import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    let query: FirebaseFirestore.Query = db
      .collection(Collections.CATEGORIES)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');

    if (isActive === 'true') {
      query = query.where('is_active', '==', true);
    }

    const snapshot = await query.get();

    // Transform to match frontend expectations
    const transformedCategories = snapshot.docs.map((doc) => {
      const cat = doc.data();
      return {
        _id: doc.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        parentCategory: cat.parent_category_id,
        isActive: cat.is_active,
        sortOrder: cat.sort_order,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already exists
    const existingSnapshot = await db
      .collection(Collections.CATEGORIES)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    const categoryData = {
      name: body.name,
      slug,
      description: body.description || null,
      image: body.image || 'https://via.placeholder.com/400',
      icon: body.icon || null,
      parent_category_id: body.parentCategory || null,
      is_active: body.isActive ?? true,
      sort_order: body.sortOrder ?? 0,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.CATEGORIES).doc(id).set(categoryData);

    return NextResponse.json(
      { success: true, data: { _id: id, id, ...categoryData } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
