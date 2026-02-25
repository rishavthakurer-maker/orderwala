import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/seller/products - Get seller's products
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Get vendor for this user
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query = supabase
      .from('products')
      .select('*, category:categories(id, name, slug)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (category) {
      query = query.eq('category_id', category);
    }

    const { data: products, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: products || [] });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/seller/products - Create a product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, price, discountPrice, unit, categoryId, images, stock, isVeg, tags } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        vendor_id: vendor.id,
        category_id: categoryId || null,
        name,
        slug,
        description: description || '',
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        unit: unit || 'piece',
        images: images || [],
        stock: stock ? parseInt(stock) : 0,
        is_veg: isVeg !== undefined ? isVeg : true,
        is_available: true,
        is_featured: false,
        tags: tags || [],
      })
      .select('*, category:categories(id, name, slug)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
