import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedCategories = categories?.map((cat: Category) => ({
      _id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      parentCategory: cat.parent_category_id,
      isActive: cat.is_active,
      sortOrder: cat.sort_order,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: body.name,
        slug,
        description: body.description,
        image: body.image || 'https://via.placeholder.com/400',
        icon: body.icon,
        parent_category_id: body.parentCategory,
        is_active: body.isActive ?? true,
        sort_order: body.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: { _id: category.id, ...category } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
