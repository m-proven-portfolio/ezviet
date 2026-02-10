import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { CreateLabelSetRequest } from '@/lib/labels/types';

/**
 * GET /api/labels
 * List label sets
 * Query params: category_id, limit, offset, admin (returns all for admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get('category_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const isAdminRequest = searchParams.get('admin') === 'true';

    // For admin requests, verify user is admin
    let isAdmin = false;
    if (isAdminRequest) {
      const authClient = await createClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        isAdmin = profile?.is_admin || false;
      }
    }

    let query = supabase
      .from('label_sets')
      .select(
        `
        *,
        category:categories(id, name, slug, icon),
        labels:labels(count)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Only filter by is_published for non-admin requests
    if (!isAdmin) {
      query = query.eq('is_published', true);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error, count } = await query;

    if (error) {
      // If table doesn't exist, return empty array instead of error
      const errorMsg = String(error.message || JSON.stringify(error) || '').toLowerCase();
      
      // Log warning for table not found, but return empty array for all errors
      if (
        errorMsg.includes('could not find the table') ||
        (errorMsg.includes('relation') && errorMsg.includes('does not exist')) ||
        errorMsg.includes('label_sets')
      ) {
        console.warn('label_sets table does not exist yet. Run migration 030_image_labels.sql');
      } else {
        console.error('Error fetching label sets:', error);
      }
      
      // Always return empty array instead of error to prevent admin page breakage
      return NextResponse.json({
        data: [],
        total: 0,
        limit,
        offset,
      });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Label sets GET error:', error);
    // Return empty array instead of error to prevent admin page breakage
    return NextResponse.json({
      data: [],
      total: 0,
      limit: parseInt(new URL(request.url).searchParams.get('limit') || '20', 10),
      offset: parseInt(new URL(request.url).searchParams.get('offset') || '0', 10),
    });
  }
}

/**
 * POST /api/labels
 * Create a new label set (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body: CreateLabelSetRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.image_url) {
      return NextResponse.json(
        { error: 'title and image_url are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let slug = body.slug || slugify(body.title);

    // Check for slug collision and append number if needed
    const { data: existing } = await supabase
      .from('label_sets')
      .select('slug')
      .like('slug', `${slug}%`);

    if (existing && existing.length > 0) {
      const existingSlugs = new Set(existing.map((e) => e.slug));
      if (existingSlugs.has(slug)) {
        let counter = 1;
        while (existingSlugs.has(`${slug}-${counter}`)) {
          counter++;
        }
        slug = `${slug}-${counter}`;
      }
    }

    // Create the label set
    const { data: labelSet, error } = await supabase
      .from('label_sets')
      .insert({
        slug,
        title: body.title,
        description: body.description || null,
        instructions: body.instructions || null,
        image_url: body.image_url,
        difficulty: body.difficulty || 'medium',
        category_id: body.category_id || null,
        created_by: user.id,
        is_published: body.is_published || false,
        intensity_config: body.intensity_config || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating label set:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(labelSet, { status: 201 });
  } catch (error) {
    console.error('Label set POST error:', error);
    return NextResponse.json({ error: 'Failed to create label set' }, { status: 500 });
  }
}
