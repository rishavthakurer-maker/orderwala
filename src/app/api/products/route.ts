import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

// GET /api/products - Get all products with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const vendor = searchParams.get('vendor');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const inStock = searchParams.get('inStock');
    const featured = searchParams.get('featured');

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        vendor:vendors(id, store_name, logo)
      `, { count: 'exact' })
      .eq('is_active', true);

    if (category) {
      // Support both UUID and slug
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(category)) {
        query = query.eq('category_id', category);
      } else {
        // Look up category by slug
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();
        if (cat) {
          query = query.eq('category_id', cat.id);
        } else {
          // No matching category, return empty
          return NextResponse.json({
            success: true,
            data: { products: [], pagination: { page, limit, total: 0, pages: 0 } },
          });
        }
      }
    }

    if (vendor) {
      query = query.eq('vendor_id', vendor);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (inStock === 'true') {
      query = query.gt('stock', 0);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Sort - map frontend field names to database column names
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : 
                       sortBy === 'price' ? 'price' : 
                       sortBy === 'name' ? 'name' : 'created_at';
    
    query = query
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data: products, error, count } = await query;

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedProducts = products?.map((product: Product & { vendor?: { id: string; store_name: string; logo?: string | null } | null; category?: { id: string; name: string; slug: string } | null }) => ({
      _id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      images: product.images,
      price: product.price,
      discountPrice: product.discount_price,
      unit: product.unit,
      stock: product.stock,
      minOrderQty: product.min_order_qty,
      maxOrderQty: product.max_order_qty,
      isVeg: product.is_veg,
      isFeatured: product.is_featured,
      isAvailable: product.is_available,
      averageRating: product.average_rating,
      totalRatings: product.total_ratings,
      totalSold: product.total_sold,
      category: product.category ? {
        _id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : null,
      vendor: product.vendor ? {
        _id: product.vendor.id,
        storeName: product.vendor.store_name,
        logo: product.vendor.logo,
      } : null,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'category', 'vendor', 'price', 'unit'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if category exists
    const { data: categoryExists } = await supabase
      .from('categories')
      .select('id')
      .eq('id', body.category)
      .single();

    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if vendor exists
    const { data: vendorExists } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', body.vendor)
      .single();

    if (!vendorExists) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        vendor_id: body.vendor,
        category_id: body.category,
        name: body.name,
        slug,
        description: body.description,
        images: body.images || ['https://via.placeholder.com/400'],
        price: body.price,
        discount_price: body.discountPrice,
        unit: body.unit,
        stock: body.stock || 0,
        min_order_qty: body.minOrderQty || 1,
        max_order_qty: body.maxOrderQty || 10,
        is_veg: body.isVeg ?? true,
        is_featured: body.isFeatured ?? false,
        is_available: body.isAvailable ?? true,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: { _id: product.id, ...product } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
