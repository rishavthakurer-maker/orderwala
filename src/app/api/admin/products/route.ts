import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
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

// Get all products (admin)
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        vendor:vendors(id, store_name)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    const { data: products, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Create new product
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
    const { name, description, price, discountPrice, unit, categoryId, vendorId, images, stock, isVeg, isFeatured, isAvailable, tags, minOrderQty, maxOrderQty } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, message: 'Name, price, and category are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const supabase = createAdminSupabaseClient();

    // Get vendor_id - use provided or find first vendor
    let finalVendorId = vendorId;
    if (!finalVendorId) {
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id')
        .limit(1)
        .single();
      finalVendorId = vendors?.id;
      if (!finalVendorId) {
        return NextResponse.json(
          { success: false, message: 'No vendor found. Please create a vendor first.' },
          { status: 400 }
        );
      }
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description: description || '',
        price,
        discount_price: discountPrice || null,
        unit: unit || 'piece',
        category_id: categoryId,
        vendor_id: finalVendorId,
        images: images || [],
        stock: stock || 0,
        is_veg: isVeg !== false,
        is_featured: isFeatured || false,
        is_available: isAvailable !== false,
        is_active: true,
        tags: tags || [],
        min_order_qty: minOrderQty || 1,
        max_order_qty: maxOrderQty || 10,
      } as Record<string, unknown>)
      .select(`
        *,
        category:categories(id, name, slug),
        vendor:vendors(id, store_name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
