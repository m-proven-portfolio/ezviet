import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  CreateAssignmentRequest,
  AssignmentWithStats,
} from '@/lib/classroom/types';

interface RouteParams {
  params: Promise<{ classroomId: string }>;
}

/**
 * GET /api/classrooms/[classroomId]/assignments
 * List assignments for a classroom (teacher or enrolled student)
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

    // Check access (teacher or enrolled student)
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const isTeacher = classroom.teacher_id === user.id;

    if (!isTeacher) {
      // Check enrollment
      const { data: enrollment } = await supabase
        .from('classroom_enrollments')
        .select('status')
        .eq('classroom_id', classroomId)
        .eq('student_id', user.id)
        .eq('status', 'active')
        .single();

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You are not enrolled in this classroom' },
          { status: 403 }
        );
      }
    }

    // Fetch assignments
    const { data: assignments, error: fetchError } = await supabase
      .from('classroom_assignments')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Fetch assignments error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // For teachers, add completion stats
    if (isTeacher) {
      const assignmentsWithStats: AssignmentWithStats[] = await Promise.all(
        (assignments || []).map(async (assignment) => {
          // Get total enrolled students
          const { count: studentCount } = await supabase
            .from('classroom_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', classroomId)
            .eq('status', 'active');

          // Get students who completed all items
          const totalItems = assignment.content_ids.length;
          const { data: progressData } = await supabase
            .from('classroom_progress')
            .select('student_id')
            .eq('assignment_id', assignment.id)
            .not('completed_at', 'is', null);

          // Count unique students with completed progress
          const completedStudents = new Set(
            (progressData || []).map((p) => p.student_id)
          ).size;

          const total = studentCount || 0;
          const percentage = total > 0 ? Math.round((completedStudents / total) * 100) : 0;

          return {
            ...assignment,
            total_students: total,
            completed_count: completedStudents,
            completion_percentage: percentage,
          };
        })
      );

      return NextResponse.json(assignmentsWithStats);
    }

    // For students, add their own progress
    const assignmentsWithProgress = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { data: progress } = await supabase
          .from('classroom_progress')
          .select('content_id, completed_at')
          .eq('assignment_id', assignment.id)
          .eq('student_id', user.id);

        const completedIds = (progress || [])
          .filter((p) => p.completed_at)
          .map((p) => p.content_id);

        return {
          ...assignment,
          my_completed_items: completedIds,
          my_completion_percentage:
            assignment.content_ids.length > 0
              ? Math.round(
                  (completedIds.length / assignment.content_ids.length) * 100
                )
              : 0,
        };
      })
    );

    return NextResponse.json(assignmentsWithProgress);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

/**
 * POST /api/classrooms/[classroomId]/assignments
 * Create a new assignment (teacher only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!classroom || classroom.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this classroom' },
        { status: 403 }
      );
    }

    const body: CreateAssignmentRequest = await request.json();

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 }
      );
    }

    if (!body.content_type) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    if (!body.content_ids || body.content_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one content item is required' },
        { status: 400 }
      );
    }

    // Get current max sort_order
    const { data: lastAssignment } = await supabase
      .from('classroom_assignments')
      .select('sort_order')
      .eq('classroom_id', classroomId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const newSortOrder = (lastAssignment?.sort_order ?? -1) + 1;

    // Create assignment
    const { data: assignment, error: createError } = await supabase
      .from('classroom_assignments')
      .insert({
        classroom_id: classroomId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        content_type: body.content_type,
        content_ids: body.content_ids,
        due_date: body.due_date || null,
        sort_order: newSortOrder,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create assignment error:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ...assignment,
        total_students: 0,
        completed_count: 0,
        completion_percentage: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
