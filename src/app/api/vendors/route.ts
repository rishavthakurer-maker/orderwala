import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isOpen = searchParams.get('isOpen');

    // For text search, we need to fetch all matching docs and filter in JS
    if (search) {
      let query: FirebaseFirestore.Query = db
        .collection(Collections.VENDORS)
        .where('is_active', '==', true)
        .where('is_verified', '==', true);

      if (isOpen === 'true') {
        query = query.where('is_open', '==', true);
      }

      if (category) {
        query = query.where('category', '==', category);
      }

      const snapshot = await query.get();

      const searchLower = search.toLowerCase();
      let allVendors = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, any>))
        .filter(
          (v) =>
            (v.store_name && v.store_name.toLowerCase().includes(searchLower)) ||
            (v.description && v.description.toLowerCase().includes(searchLower))
        );

      // Sort by average_rating desc
      allVendors.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));

      const total = allVendors.length;
      const from = (page - 1) * limit;
      const paged = allVendors.slice(from, from + limit);

      const transformedVendors = paged.map((vendor) => transformVendor(vendor));

      return NextResponse.json({
        success: true,
        data: {
          vendors: transformedVendors,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    }

    // Non-search path: use Firestore queries directly
    let query: FirebaseFirestore.Query = db
      .collection(Collections.VENDORS)
      .where('is_active', '==', true)
      .where('is_verified', '==', true);

    if (isOpen === 'true') {
      query = query.where('is_open', '==', true);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    query = query.orderBy('average_rating', 'desc');

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Pagination
    const from = (page - 1) * limit;
    const paginatedQuery = query.offset(from).limit(limit);
    const snapshot = await paginatedQuery.get();

    const transformedVendors = snapshot.docs.map((doc) => {
      const vendor = { id: doc.id, ...doc.data() } as Record<string, any>;
      return transformVendor(vendor);
    });

    return NextResponse.json({
      success: true,
      data: {
        vendors: transformedVendors,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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
    const db = getDb();
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
    const existingSnapshot = await db
      .collection(Collections.VENDORS)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'A vendor with this name already exists' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    // Create vendor
    const vendorData = {
      owner_id: body.owner,
      store_name: body.storeName,
      slug,
      description: body.description || null,
      logo: body.logo || 'https://via.placeholder.com/200',
      cover_image: body.coverImage || null,
      phone: body.phone,
      email: body.email || null,
      address: body.address,
      category: body.category || 'general',
      cuisines: body.cuisines || [],
      delivery_radius: body.deliveryRadius || 5,
      min_order_amount: body.minOrderAmount || 0,
      delivery_fee: body.deliveryFee || 0,
      commission_rate: body.commissionRate || 10,
      average_rating: 0,
      total_ratings: 0,
      total_orders: 0,
      is_open: body.isOpen ?? true,
      is_verified: false,
      is_active: true,
      opening_hours: body.openingHours || [],
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.VENDORS).doc(id).set(vendorData);

    return NextResponse.json(
      { success: true, data: { _id: id, id, ...vendorData } },
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

function transformVendor(vendor: Record<string, any>) {
  return {
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
  };
}
