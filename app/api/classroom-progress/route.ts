import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { RecordProgressRequest } from '@/lib/classroom/types';

/**
 * POST /api/classroom-progress
 * Record student progress on an assignment item
 */
export async function POST(request: NextRequest) {
  try {
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

    const body: RecordProgressRequest = await request.json();

    // Validate required fields
    if (!body.assignment_id) {
      return NextResponse.json(
        { error: 'assignment_id is required' },
        { status: 400 }
      );
    }

    if (!body.content_id) {
      return NextResponse.json(
        { error: 'content_id is required' },
        { status: 400 }
      );
    }

    // Verify the assignment exists and user is enrolled in the classroom
    const { data: assignment, error: assignmentError } = await supabase
      .from('classroom_assignments')
      .select('id, classroom_id')
      .eq('id', body.assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from('classroom_enrollments')
      .select('status')
      .eq('classroom_id', assignment.classroom_id)
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this classroom' },
        { status: 403 }
      );
    }

    // Check if progress record exists
    const { data: existingProgress } = await supabase
      .from('classroom_progress')
      .select('id, progress_data')
      .eq('assignment_id', body.assignment_id)
      .eq('student_id', user.id)
      .eq('content_id', body.content_id)
      .single();

    if (existingProgress) {
      // Update existing progress
      const updates: Record<string, unknown> = {};

      if (body.completed !== undefined) {
        updates.completed_at = body.completed ? new Date().toISOString() : null;
      }

      if (body.progress_data) {
        // Merge progress data
        updates.progress_data = {
          ...(existingProgress.progress_data || {}),
          ...body.progress_data,
          views: ((existingProgress.progress_data as Record<string, number>)?.views || 0) + 1,
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from('classroom_progress')
        .update(updates)
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update progress error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json(updated);
    }

    // Create new progress record
    const { data: progress, error: createError } = await supabase
      .from('classroom_progress')
      .insert({
        assignment_id: body.assignment_id,
        student_id: user.id,
        content_id: body.content_id,
        completed_at: body.completed ? new Date().toISOString() : null,
        progress_data: {
          views: 1,
          ...body.progress_data,
        },
      })
      .select()
      .single();

    if (createError) {
      console.error('Create progress error:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Record progress error:', error);
    return NextResponse.json({ error: 'Failed to record progress' }, { status: 500 });
  }
}

/**
 * GET /api/classroom-progress?assignmentId=xxx
 * Get progress for an assignment (teacher: all students, student: own progress)
 */
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'assignmentId is required' },
        { status: 400 }
      );
    }

    // Get assignment and classroom
    const { data: assignment } = await supabase
      .from('classroom_assignments')
      .select('id, classroom_id, content_ids')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get classroom to check role
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', assignment.classroom_id)
      .single();

    const isTeacher = classroom?.teacher_id === user.id;

    if (isTeacher) {
      // Teacher view: get all students' progress
      const { data: enrollments } = await supabase
        .from('classroom_enrollments')
        .select(
          `
          student_id,
          student:profiles!classroom_enrollments_student_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `
        )
        .eq('classroom_id', assignment.classroom_id)
        .eq('status', 'active');

      const { data: allProgress } = await supabase
        .from('classroom_progress')
        .select('*')
        .eq('assignment_id', assignmentId);

      // Build per-student summary
      const studentProgress = (enrollments || []).map((enrollment) => {
        const studentProgressRecords = (allProgress || []).filter(
          (p) => p.student_id === enrollment.student_id
        );

        const completedItems = studentProgressRecords
          .filter((p) => p.completed_at)
          .map((p) => p.content_id);

        const totalItems = assignment.content_ids.length;

        return {
          student_id: enrollment.student_id,
          student: enrollment.student,
          items_completed: completedItems.length,
          total_items: totalItems,
          completion_percentage:
            totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0,
          completed_items: completedItems,
          last_activity:
            studentProgressRecords.length > 0
              ? studentProgressRecords.sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )[0].updated_at
              : null,
        };
      });

      return NextResponse.json({
        assignment_id: assignmentId,
        total_students: enrollments?.length || 0,
        student_progress: studentProgress,
      });
    }

    // Student view: own progress only
    const { data: enrollment } = await supabase
      .from('classroom_enrollments')
      .select('status')
      .eq('classroom_id', assignment.classroom_id)
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this classroom' },
        { status: 403 }
      );
    }

    const { data: myProgress } = await supabase
      .from('classroom_progress')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id);

    const completedItems = (myProgress || [])
      .filter((p) => p.completed_at)
      .map((p) => p.content_id);

    return NextResponse.json({
      assignment_id: assignmentId,
      total_items: assignment.content_ids.length,
      completed_items: completedItems,
      completion_percentage:
        assignment.content_ids.length > 0
          ? Math.round((completedItems.length / assignment.content_ids.length) * 100)
          : 0,
      progress_records: myProgress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}
