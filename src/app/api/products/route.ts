import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';

// GET /api/products - Get all products with filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();

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

    // Build base Firestore query with equality filters only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collection(Collections.PRODUCTS).where('is_active', '==', true);

    // Resolve category filter
    let categoryId: string | null = null;
    if (category) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(category)) {
        categoryId = category;
      } else {
        // Look up category by slug
        const catSnap = await db.collection(Collections.CATEGORIES).where('slug', '==', category).limit(1).get();
        if (!catSnap.empty) {
          categoryId = catSnap.docs[0].id;
        } else {
          // No matching category, return empty
          return NextResponse.json({
            success: true,
            data: { products: [], pagination: { page, limit, total: 0, pages: 0 } },
          });
        }
      }
      query = query.where('category_id', '==', categoryId);
    }

    if (vendor) {
      query = query.where('vendor_id', '==', vendor);
    }

    if (featured === 'true') {
      query = query.where('is_featured', '==', true);
    }

    // Fetch all matching docs (equality-filtered)
    const snapshot = await query.get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let products: any[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply remaining filters in JS (range, text search, stock)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) =>
          (p.name && p.name.toLowerCase().includes(searchLower)) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products = products.filter((p: any) => p.price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products = products.filter((p: any) => p.price <= max);
    }

    if (inStock === 'true') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products = products.filter((p: any) => p.stock > 0);
    }

    // Total count after filtering
    const total = products.length;

    // Sort in JS
    const sortColumn = sortBy === 'createdAt' ? 'created_at' :
                       sortBy === 'price' ? 'price' :
                       sortBy === 'name' ? 'name' : 'created_at';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products.sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination via array slice
    const from = (page - 1) * limit;
    products = products.slice(from, from + limit);

    // Fetch related vendor and category docs
    const vendorIds = [...new Set(products.map((p) => p.vendor_id).filter(Boolean))];
    const categoryIds = [...new Set(products.map((p) => p.category_id).filter(Boolean))];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vendorMap: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryMap: Record<string, any> = {};

    await Promise.all([
      ...vendorIds.map(async (vid) => {
        const vDoc = await db.collection(Collections.VENDORS).doc(vid).get();
        if (vDoc.exists) vendorMap[vid] = { id: vDoc.id, ...vDoc.data() };
      }),
      ...categoryIds.map(async (cid) => {
        const cDoc = await db.collection(Collections.CATEGORIES).doc(cid).get();
        if (cDoc.exists) categoryMap[cid] = { id: cDoc.id, ...cDoc.data() };
      }),
    ]);

    // Transform to match frontend expectations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedProducts = products.map((product: any) => {
      const cat = categoryMap[product.category_id] || null;
      const ven = vendorMap[product.vendor_id] || null;
      return {
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
        category: cat ? {
          _id: cat.id,
          name: cat.name,
          slug: cat.slug,
        } : null,
        vendor: ven ? {
          _id: ven.id,
          storeName: ven.store_name,
          logo: ven.logo,
        } : null,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    });

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
    const db = getDb();
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
    const categoryDoc = await db.collection(Collections.CATEGORIES).doc(body.category).get();
    if (!categoryDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if vendor exists
    const vendorDoc = await db.collection(Collections.VENDORS).doc(body.vendor).get();
    if (!vendorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');

    const now = new Date().toISOString();
    const id = generateId();

    const productData = {
      vendor_id: body.vendor,
      category_id: body.category,
      name: body.name,
      slug,
      description: body.description || null,
      images: body.images || ['https://via.placeholder.com/400'],
      price: body.price,
      discount_price: body.discountPrice || null,
      unit: body.unit,
      stock: body.stock || 0,
      min_order_qty: body.minOrderQty || 1,
      max_order_qty: body.maxOrderQty || 10,
      is_veg: body.isVeg ?? true,
      is_featured: body.isFeatured ?? false,
      is_available: body.isAvailable ?? true,
      is_active: body.isActive ?? true,
      average_rating: 0,
      total_ratings: 0,
      total_sold: 0,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.PRODUCTS).doc(id).set(productData);

    return NextResponse.json(
      { success: true, data: { _id: id, id, ...productData } },
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
