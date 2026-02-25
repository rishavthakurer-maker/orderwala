import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const offset = (page - 1) * limit;
    const { data: reviews, count, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users(id, name, image)
      `, { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate rating distribution
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    (allRatings || []).forEach((r: { rating: number }) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      totalRating += r.rating;
    });
    const avgRating = allRatings && allRatings.length > 0 ? totalRating / allRatings.length : 0;

    const transformed = (reviews || []).map((r: Record<string, unknown>) => {
      const u = r.user as Record<string, unknown> | null;
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
          totalReviews: allRatings?.length || 0,
          distribution,
        },
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
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

    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    if (!body.productId || !body.rating) {
      return NextResponse.json({ success: false, error: 'Product ID and rating required' }, { status: 400 });
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if user already reviewed this product
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', body.productId)
      .single();

    if (existing) {
      // Update existing review
      const { data: review, error } = await supabase
        .from('reviews')
        .update({
          rating: body.rating,
          comment: body.comment || '',
          images: body.images || [],
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // Update product average rating
      await updateProductRating(supabase, body.productId);

      return NextResponse.json({ success: true, data: review });
    }

    // Create new review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        user_id: session.user.id,
        product_id: body.productId,
        order_id: body.orderId || null,
        rating: body.rating,
        comment: body.comment || '',
        images: body.images || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Update product average rating
    await updateProductRating(supabase, body.productId);

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProductRating(supabase: any, productId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
    await supabase
      .from('products')
      .update({
        average_rating: Math.round(avg * 10) / 10,
        total_ratings: reviews.length,
      })
      .eq('id', productId);
  }
}
