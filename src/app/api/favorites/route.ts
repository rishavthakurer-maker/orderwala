import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/favorites - Get user favorites
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        product_id,
        created_at,
        product:products(
          id, name, slug, images, price, discount_price, unit, is_veg, average_rating, total_ratings, is_available,
          vendor:vendors(id, store_name),
          category:categories(id, name, slug)
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformed = (favorites || []).map((f: Record<string, unknown>) => {
      const p = f.product as Record<string, unknown> | null;
      const v = p?.vendor as Record<string, unknown> | null;
      return {
        id: f.id,
        productId: f.product_id,
        product: p ? {
          _id: p.id,
          name: p.name,
          slug: p.slug,
          images: p.images,
          price: p.price,
          discountPrice: p.discount_price,
          unit: p.unit,
          isVeg: p.is_veg,
          averageRating: p.average_rating,
          totalRatings: p.total_ratings,
          isAvailable: p.is_available,
          vendor: v ? { _id: v.id, storeName: v.store_name } : null,
        } : null,
        createdAt: f.created_at,
      };
    });

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, data: existing, message: 'Already in favorites' });
    }

    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({ user_id: session.user.id, product_id: productId })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ success: false, error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { productId } = await request.json();

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', session.user.id)
      .eq('product_id', productId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove favorite' }, { status: 500 });
  }
}
