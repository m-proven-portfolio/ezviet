import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { normalizeJoinCode, isValidJoinCodeFormat } from '@/lib/classroom/utils';
import type { JoinClassroomRequest } from '@/lib/classroom/types';

/**
 * POST /api/classroom-join
 * Join a classroom using a join code
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

    const body: JoinClassroomRequest = await request.json();

    // Validate join code format
    if (!body.join_code || !isValidJoinCodeFormat(body.join_code)) {
      return NextResponse.json(
        { error: 'Invalid join code format. Please enter a 6-character code.' },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeJoinCode(body.join_code);

    // Find the classroom by join code
    const { data: classroom, error: findError } = await supabase
      .from('classrooms')
      .select(
        `
        id,
        name,
        teacher_id,
        is_active,
        teacher:profiles!classrooms_teacher_id_fkey(id, display_name, avatar_url)
      `
      )
      .eq('join_code', normalizedCode)
      .single();

    if (findError || !classroom) {
      return NextResponse.json(
        { error: 'Classroom not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    // Check if classroom is active
    if (!classroom.is_active) {
      return NextResponse.json(
        { error: 'This classroom is no longer active.' },
        { status: 410 }
      );
    }

    // Check if user is the teacher (can't join own classroom)
    if (classroom.teacher_id === user.id) {
      return NextResponse.json(
        { error: "You can't join your own classroom as a student." },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('classroom_enrollments')
      .select('id, status')
      .eq('classroom_id', classroom.id)
      .eq('student_id', user.id)
      .single();

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        return NextResponse.json(
          { error: 'You are already enrolled in this classroom.' },
          { status: 409 }
        );
      }

      // Reactivate if previously left
      const { error: updateError } = await supabase
        .from('classroom_enrollments')
        .update({ status: 'active', enrolled_at: new Date().toISOString() })
        .eq('id', existingEnrollment.id);

      if (updateError) {
        console.error('Re-enrollment error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        classroom: {
          id: classroom.id,
          name: classroom.name,
          teacher: classroom.teacher,
        },
        message: 'Welcome back! You have rejoined the classroom.',
      });
    }

    // Create new enrollment
    const { error: enrollError } = await supabase
      .from('classroom_enrollments')
      .insert({
        classroom_id: classroom.id,
        student_id: user.id,
        status: 'active',
      });

    if (enrollError) {
      console.error('Enrollment error:', enrollError);
      return NextResponse.json({ error: enrollError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        classroom: {
          id: classroom.id,
          name: classroom.name,
          teacher: classroom.teacher,
        },
        message: 'Successfully joined the classroom!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Join classroom error:', error);
    return NextResponse.json({ error: 'Failed to join classroom' }, { status: 500 });
  }
}

/**
 * GET /api/classroom-join?code=ABC123
 * Preview classroom info before joining (without actually joining)
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
    const code = searchParams.get('code');

    if (!code || !isValidJoinCodeFormat(code)) {
      return NextResponse.json(
        { error: 'Invalid join code format' },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeJoinCode(code);

    // Find the classroom
    const { data: classroom, error: findError } = await supabase
      .from('classrooms')
      .select(
        `
        id,
        name,
        description,
        is_active,
        teacher:profiles!classrooms_teacher_id_fkey(id, display_name, avatar_url)
      `
      )
      .eq('join_code', normalizedCode)
      .single();

    if (findError || !classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    if (!classroom.is_active) {
      return NextResponse.json(
        { error: 'This classroom is no longer active' },
        { status: 410 }
      );
    }

    // Get enrollment count
    const { count } = await supabase
      .from('classroom_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id)
      .eq('status', 'active');

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('classroom_enrollments')
      .select('status')
      .eq('classroom_id', classroom.id)
      .eq('student_id', user.id)
      .single();

    return NextResponse.json({
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      teacher: classroom.teacher,
      student_count: count || 0,
      already_enrolled: existingEnrollment?.status === 'active',
    });
  } catch (error) {
    console.error('Preview classroom error:', error);
    return NextResponse.json({ error: 'Failed to fetch classroom info' }, { status: 500 });
  }
}
