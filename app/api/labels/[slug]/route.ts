import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type {
  LabelSetWithLabels,
  UpdateLabelSetRequest,
  CreateLabelRequest,
} from '@/lib/labels/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/labels/[slug]
 * Get a single label set with all its labels (public for published sets)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: labelSet, error } = await supabase
      .from('label_sets')
      .select(
        `
        *,
        category:categories(id, name, slug, icon),
        labels:labels(
          id, label_set_id, x, y, vietnamese, english,
          pronunciation, audio_url, hints, card_id, sort_order, created_at,
          accent, tts_hint, romanization
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
      }
      console.error('Error fetching label set:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if published or user is admin/creator
    if (!labelSet.is_published) {
      const authClient = await createClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
      }

      // Check if admin or creator
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin && labelSet.created_by !== user.id) {
        return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
      }
    }

    // Sort labels by sort_order
    if (labelSet.labels) {
      labelSet.labels.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    // Increment view count for published sets (fire and forget)
    if (labelSet.is_published) {
      supabase.rpc('increment_label_set_view', { p_slug: slug }).then(() => {});
    }

    return NextResponse.json(labelSet as LabelSetWithLabels);
  } catch (error) {
    console.error('Label set GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch label set' }, { status: 500 });
  }
}

/**
 * PUT /api/labels/[slug]
 * Update a label set (admin/creator only)
 * Can also include labels array to bulk update labels
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Check authentication
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user can edit this label set
    const { data: existing } = await supabase
      .from('label_sets')
      .select('id, created_by')
      .eq('slug', slug)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && existing.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body: UpdateLabelSetRequest & { labels?: CreateLabelRequest[] } =
      await request.json();

    // Update label set fields
    const updateFields: Record<string, unknown> = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.instructions !== undefined) updateFields.instructions = body.instructions;
    if (body.image_url !== undefined) updateFields.image_url = body.image_url;
    if (body.difficulty !== undefined) updateFields.difficulty = body.difficulty;
    if (body.category_id !== undefined) updateFields.category_id = body.category_id;
    if (body.is_published !== undefined) updateFields.is_published = body.is_published;
    if (body.default_accent !== undefined) updateFields.default_accent = body.default_accent;
    if (body.intensity_config !== undefined) updateFields.intensity_config = body.intensity_config;

    if (Object.keys(updateFields).length > 0) {
      const { error: updateError } = await supabase
        .from('label_sets')
        .update(updateFields)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating label set:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Handle labels array if provided (bulk update)
    if (body.labels && Array.isArray(body.labels)) {
      // Delete existing labels
      await supabase.from('labels').delete().eq('label_set_id', existing.id);

      // Insert new labels
      if (body.labels.length > 0) {
        const labelsToInsert = body.labels.map((label, index) => ({
          label_set_id: existing.id,
          x: label.x,
          y: label.y,
          vietnamese: label.vietnamese,
          english: label.english,
          pronunciation: label.pronunciation || null,
          audio_url: label.audio_url || null,
          hints: label.hints || null,
          card_id: label.card_id || null,
          sort_order: label.sort_order ?? index,
          accent: label.accent || null,
          tts_hint: label.tts_hint || null,
          romanization: label.romanization || null,
        }));

        const { error: labelsError } = await supabase
          .from('labels')
          .insert(labelsToInsert);

        if (labelsError) {
          console.error('Error updating labels:', labelsError);
          return NextResponse.json({ error: labelsError.message }, { status: 500 });
        }
      }
    }

    // Return updated label set with labels
    const { data: updated } = await supabase
      .from('label_sets')
      .select(
        `
        *,
        category:categories(id, name, slug, icon),
        labels:labels(*)
      `
      )
      .eq('id', existing.id)
      .single();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Label set PUT error:', error);
    return NextResponse.json({ error: 'Failed to update label set' }, { status: 500 });
  }
}

/**
 * DELETE /api/labels/[slug]
 * Delete a label set and all its labels (admin/creator only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Check authentication
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user can delete this label set
    const { data: existing } = await supabase
      .from('label_sets')
      .select('id, created_by')
      .eq('slug', slug)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && existing.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete label set (labels cascade delete via FK)
    const { error } = await supabase.from('label_sets').delete().eq('id', existing.id);

    if (error) {
      console.error('Error deleting label set:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Label set DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete label set' }, { status: 500 });
  }
}
