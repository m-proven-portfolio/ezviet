import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { ClassroomWithDetails } from '@/lib/classroom/types';

interface RouteParams {
  params: Promise<{ classroomId: string }>;
}

/**
 * GET /api/classrooms/[classroomId]
 * Get classroom details (teacher or enrolled student)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { classroomId } = await params;
    const authClient = await createClient();
    const supabase = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch classroom with teacher info
    const { data: classroom, error: fetchError } = await supabase
      .from('classrooms')
      .select(
        `
        *,
        teacher:profiles!classrooms_teacher_id_fkey(id, display_name, avatar_url)
      `
      )
      .eq('id', classroomId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
      }
      console.error('Fetch classroom error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Determine user's role
    const isTeacher = classroom.teacher_id === user.id;

    if (!isTeacher) {
      // Check if user is enrolled
      const { data: enrollment } = await supabase
        .from('classroom_enrollments')
        .select('status')
        .eq('classroom_id', classroomId)
        .eq('student_id', user.id)
        .eq('status', 'active')
        .single();

      if (!enrollment) {
        // Return classroom preview info so the user can join
        return NextResponse.json(
          {
            error: 'You are not enrolled in this classroom',
            preview: {
              id: classroom.id,
              name: classroom.name,
              description: classroom.description,
              join_code: classroom.join_code,
              teacher: classroom.teacher,
            },
          },
          { status: 403 }
        );
      }
    }

    // Get enrollment count
    const { count: enrollmentCount } = await supabase
      .from('classroom_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', classroomId)
      .eq('status', 'active');

    // Get assignment count
    const { count: assignmentCount } = await supabase
      .from('classroom_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', classroomId)
      .eq('is_active', true);

    const result: ClassroomWithDetails & { role: 'teacher' | 'student' } = {
      ...classroom,
      enrollment_count: enrollmentCount || 0,
      assignment_count: assignmentCount || 0,
      role: isTeacher ? 'teacher' : 'student',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fetch classroom error:', error);
    return NextResponse.json({ error: 'Failed to fetch classroom' }, { status: 500 });
  }
}

/**
 * PATCH /api/classrooms/[classroomId]
 * Update classroom (teacher only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { classroomId } = await params;
    const authClient = await createClient();
    const supabase = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify teacher ownership
    const { data: existing } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!existing || existing.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this classroom' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Only allow certain fields to be updated
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: classroom, error: updateError } = await supabase
      .from('classrooms')
      .update(updates)
      .eq('id', classroomId)
      .select(
        `
        *,
        teacher:profiles!classrooms_teacher_id_fkey(id, display_name, avatar_url)
      `
      )
      .single();

    if (updateError) {
      console.error('Update classroom error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(classroom);
  } catch (error) {
    console.error('Update classroom error:', error);
    return NextResponse.json({ error: 'Failed to update classroom' }, { status: 500 });
  }
}

/**
 * DELETE /api/classrooms/[classroomId]
 * Soft delete classroom (set is_active = false)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { classroomId } = await params;
    const authClient = await createClient();
    const supabase = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify teacher ownership
    const { data: existing } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!existing || existing.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this classroom' },
        { status: 403 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('classrooms')
      .update({ is_active: false })
      .eq('id', classroomId);

    if (deleteError) {
      console.error('Delete classroom error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete classroom error:', error);
    return NextResponse.json({ error: 'Failed to delete classroom' }, { status: 500 });
  }
}
