import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/classrooms
 * List all classrooms (admin only)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all classrooms with teacher info
    const { data: classrooms, error: fetchError } = await supabase
      .from('classrooms')
      .select(
        `
        *,
        teacher:profiles!classrooms_teacher_id_fkey(id, display_name, avatar_url, email)
      `
      )
      .order('created_at', { ascending: false });

    if (fetchError) {
      // If table doesn't exist, return empty array instead of error
      const errorMsg = String(fetchError.message || JSON.stringify(fetchError) || '').toLowerCase();
      
      // Log warning for table not found, but return empty array for all errors
      if (
        errorMsg.includes('could not find the table') ||
        (errorMsg.includes('relation') && errorMsg.includes('does not exist')) ||
        errorMsg.includes('classrooms')
      ) {
        console.warn('classrooms table does not exist yet. Run migration 028_classrooms.sql');
      } else {
        console.error('Fetch classrooms error:', fetchError);
      }
      
      // Always return empty array instead of error to prevent admin page breakage
      return NextResponse.json({
        classrooms: [],
        stats: {
          total: 0,
          active: 0,
          totalStudents: 0,
          totalAssignments: 0,
        },
      });
    }

    // Add enrollment counts (handle missing tables gracefully)
    const classroomsWithCounts = await Promise.all(
      (classrooms || []).map(async (classroom) => {
        let enrollmentCount = 0;
        let assignmentCount = 0;
        
        try {
          const { count } = await supabase
            .from('classroom_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', classroom.id)
            .eq('status', 'active');
          enrollmentCount = count || 0;
        } catch (err) {
          // Table doesn't exist, use 0
          enrollmentCount = 0;
        }
        
        try {
          const { count } = await supabase
            .from('classroom_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', classroom.id)
            .eq('is_active', true);
          assignmentCount = count || 0;
        } catch (err) {
          // Table doesn't exist, use 0
          assignmentCount = 0;
        }

        return {
          ...classroom,
          teacher: Array.isArray(classroom.teacher) ? classroom.teacher[0] : classroom.teacher,
          enrollment_count: enrollmentCount,
          assignment_count: assignmentCount,
        };
      })
    );

    // Calculate stats
    const activeClassrooms = classroomsWithCounts.filter((c) => c.is_active);
    const totalStudents = classroomsWithCounts.reduce(
      (sum, c) => sum + (c.enrollment_count || 0),
      0
    );
    const totalAssignments = classroomsWithCounts.reduce(
      (sum, c) => sum + (c.assignment_count || 0),
      0
    );

    return NextResponse.json({
      classrooms: classroomsWithCounts,
      stats: {
        total: classroomsWithCounts.length,
        active: activeClassrooms.length,
        totalStudents,
        totalAssignments,
      },
    });
  } catch (error) {
    console.error('Admin classrooms error:', error);
    // Return empty array instead of error to prevent admin page breakage
    return NextResponse.json({
      classrooms: [],
      stats: {
        total: 0,
        active: 0,
        totalStudents: 0,
        totalAssignments: 0,
      },
    });
  }
}
