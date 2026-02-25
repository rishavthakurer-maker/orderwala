import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orderwala-admin-secret-key-2024';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('vendors')
      .select('id, store_name, slug, phone, email, category, description, logo, address, commission_rate, average_rating, total_ratings, total_orders, is_open, is_active, is_verified, delivery_radius, min_order_amount, delivery_fee, created_at')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`store_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: vendors, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: vendors || [] });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    // Create slug from store_name
    const slug = (body.store_name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const insertData: Record<string, unknown> = {
      owner_id: decoded.userId,
      store_name: body.store_name,
      slug,
      phone: body.phone,
      email: body.email || null,
      category: body.category,
      description: body.description || '',
      logo: body.logo || '/placeholder.png',
      address: body.address || {},
      commission_rate: body.commission_rate || 10,
      is_verified: body.is_verified || false,
      is_active: true,
      is_open: true,
      delivery_radius: body.delivery_radius || 5,
      min_order_amount: body.min_order_amount || 0,
      delivery_fee: body.delivery_fee || 0,
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
