import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/types';

type Vendor = Database['public']['Tables']['vendors']['Row'];

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isOpen = searchParams.get('isOpen');

    // Build query
    let query = supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('is_verified', true);

    if (isOpen === 'true') {
      query = query.eq('is_open', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`store_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order('average_rating', { ascending: false })
      .range(from, to);

    const { data: vendors, error, count } = await query;

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedVendors = vendors?.map((vendor: Vendor) => ({
      _id: vendor.id,
      owner: vendor.owner_id,
      storeName: vendor.store_name,
      slug: vendor.slug,
      description: vendor.description,
      logo: vendor.logo,
      coverImage: vendor.cover_image,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      category: vendor.category,
      cuisines: vendor.cuisines,
      deliveryRadius: vendor.delivery_radius,
      minOrderAmount: vendor.min_order_amount,
      deliveryFee: vendor.delivery_fee,
      commissionRate: vendor.commission_rate,
      averageRating: vendor.average_rating,
      totalRatings: vendor.total_ratings,
      totalOrders: vendor.total_orders,
      isOpen: vendor.is_open,
      isVerified: vendor.is_verified,
      isActive: vendor.is_active,
      openingHours: vendor.opening_hours,
      createdAt: vendor.created_at,
      updatedAt: vendor.updated_at,
    }));

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        vendors: transformedVendors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Register a new vendor
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['storeName', 'owner', 'phone', 'address'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Generate slug
    const slug = body.slug || body.storeName.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already exists
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingVendor) {
      return NextResponse.json(
        { success: false, error: 'A vendor with this name already exists' },
        { status: 400 }
      );
    }

    // Create vendor
    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        owner_id: body.owner,
        store_name: body.storeName,
        slug,
        description: body.description,
        logo: body.logo || 'https://via.placeholder.com/200',
        cover_image: body.coverImage,
        phone: body.phone,
        email: body.email,
        address: body.address,
        category: body.category || 'general',
        cuisines: body.cuisines,
        delivery_radius: body.deliveryRadius || 5,
        min_order_amount: body.minOrderAmount || 0,
        delivery_fee: body.deliveryFee || 0,
        commission_rate: body.commissionRate || 10,
        is_open: body.isOpen ?? true,
        is_verified: false,
        is_active: true,
        opening_hours: body.openingHours || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: { _id: vendor.id, ...vendor } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
