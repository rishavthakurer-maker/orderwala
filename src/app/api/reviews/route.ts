import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    // Fetch all reviews for this product (needed for distribution + count)
    const allSnap = await db.collection(Collections.REVIEWS)
      .where('product_id', '==', productId)
      .orderBy('created_at', 'desc')
      .get();

    const allReviews = allSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Record<string, unknown>[];
    const total = allReviews.length;

    // Rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    allReviews.forEach((r) => {
      const rating = r.rating as number;
      distribution[rating] = (distribution[rating] || 0) + 1;
      totalRating += rating;
    });
    const avgRating = total > 0 ? totalRating / total : 0;

    // Paginate in JS
    const offset = (page - 1) * limit;
    const pageReviews = allReviews.slice(offset, offset + limit);

    // Fetch user docs for page reviews
    const userIds = [...new Set(pageReviews.map(r => r.user_id as string).filter(Boolean))];
    const userMap: Record<string, Record<string, unknown>> = {};
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const snap = await db.collection(Collections.USERS).where('__name__', 'in', batch).get();
      snap.docs.forEach(d => { userMap[d.id] = { id: d.id, ...d.data() }; });
    }

    const transformed = pageReviews.map((r) => {
      const u = userMap[r.user_id as string] || null;
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        images: r.images,
        user: u ? { id: u.id, name: u.name, image: u.image } : null,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews: transformed,
        summary: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: total,
          distribution,
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Submit a review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();

    if (!body.productId || !body.rating) {
      return NextResponse.json({ success: false, error: 'Product ID and rating required' }, { status: 400 });
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Check if user already reviewed this product
    const existingSnap = await db.collection(Collections.REVIEWS)
      .where('user_id', '==', session.user.id)
      .where('product_id', '==', body.productId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Update existing review
      const docRef = existingSnap.docs[0].ref;
      const updateData = {
        rating: body.rating,
        comment: body.comment || '',
        images: body.images || [],
        updated_at: now,
      };
      await docRef.update(updateData);
      const updated = await docRef.get();
      const review = { id: updated.id, ...updated.data() };

      // Update product average rating
      await updateProductRating(db, body.productId);

      return NextResponse.json({ success: true, data: review });
    }

    // Create new review
    const id = generateId();
    const reviewData = {
      user_id: session.user.id,
      product_id: body.productId,
      order_id: body.orderId || null,
      rating: body.rating,
      comment: body.comment || '',
      images: body.images || [],
      created_at: now,
      updated_at: now,
    };
    await db.collection(Collections.REVIEWS).doc(id).set(reviewData);

    // Update product average rating
    await updateProductRating(db, body.productId);

    return NextResponse.json({ success: true, data: { id, ...reviewData } }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProductRating(db: any, productId: string) {
  const snap = await db.collection(Collections.REVIEWS)
    .where('product_id', '==', productId)
    .get();

  const reviews = snap.docs.map((d: FirebaseFirestore.DocumentSnapshot) => d.data());
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum: number, r: Record<string, unknown>) => sum + (r?.rating as number || 0), 0) / reviews.length;
    await db.collection(Collections.PRODUCTS).doc(productId).update({
      average_rating: Math.round(avg * 10) / 10,
      total_ratings: reviews.length,
      updated_at: new Date().toISOString(),
    });
  }
}
