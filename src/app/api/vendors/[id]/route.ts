import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// GET /api/vendors/[id] - Get a single vendor with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('products') === 'true';

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    let products = null;
    if (includeProducts) {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .eq('vendor_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      products = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        products: includeProducts ? products : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/[id] - Update a vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Deactivate a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('vendors')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Also deactivate all vendor products
    await supabase
      .from('products')
      .update({ is_active: false })
      .eq('vendor_id', id);

    return NextResponse.json({
      success: true,
      message: 'Vendor deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate vendor' },
      { status: 500 }
    );
  }
}
