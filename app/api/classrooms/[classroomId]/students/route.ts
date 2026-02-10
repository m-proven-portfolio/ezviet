import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { EnrollmentWithStudent } from '@/lib/classroom/types';

interface RouteParams {
  params: Promise<{ classroomId: string }>;
}

/**
 * GET /api/classrooms/[classroomId]/students
 * List enrolled students (teacher only)
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

    // Verify teacher ownership
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!classroom || classroom.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this classroom' },
        { status: 403 }
      );
    }

    // Fetch enrollments with student info
    const { data: enrollments, error: fetchError } = await supabase
      .from('classroom_enrollments')
      .select(
        `
        id,
        classroom_id,
        student_id,
        enrolled_at,
        status,
        student:profiles!classroom_enrollments_student_id_fkey(
          id,
          display_name,
          avatar_url,
          email
        )
      `
      )
      .eq('classroom_id', classroomId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (fetchError) {
      console.error('Fetch students error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Transform Supabase joined data (student comes as array, extract first item)
    const transformed = (enrollments || []).map((e) => ({
      ...e,
      student: Array.isArray(e.student) ? e.student[0] : e.student,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Fetch students error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

/**
 * DELETE /api/classrooms/[classroomId]/students?studentId=xxx
 * Remove a student from the classroom (teacher only)
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Verify teacher ownership
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!classroom || classroom.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this classroom' },
        { status: 403 }
      );
    }

    // Update enrollment status to 'removed'
    const { error: updateError } = await supabase
      .from('classroom_enrollments')
      .update({ status: 'removed' })
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId);

    if (updateError) {
      console.error('Remove student error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove student error:', error);
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }
}
