'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Loader2,
  BookOpen,
  Copy,
  Check,
  Plus,
  Settings,
  ClipboardList,
  LogIn,
} from 'lucide-react';
import type {
  ClassroomWithDetails,
  EnrollmentWithStudent,
  AssignmentWithStats,
} from '@/lib/classroom/types';
import {
  formatJoinCode,
  formatEnrollmentCount,
  formatCompletionPercentage,
  getCompletionBgClass,
} from '@/lib/classroom/utils';
import { isNetworkError } from '@/lib/utils';

interface PageProps {
  params: Promise<{ classroomId: string }>;
}

type TabType = 'assignments' | 'students' | 'settings';

interface ClassroomPreview {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  teacher: { id: string; display_name: string | null; avatar_url: string | null } | null;
}

export default function ClassroomDetailPage({ params }: PageProps) {
  const { classroomId } = use(params);
  const router = useRouter();

  const [classroom, setClassroom] = useState<
    (ClassroomWithDetails & { role: 'teacher' | 'student' }) | null
  >(null);
  const [students, setStudents] = useState<EnrollmentWithStudent[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('assignments');
  const [copied, setCopied] = useState(false);
  const [notEnrolledPreview, setNotEnrolledPreview] = useState<ClassroomPreview | null>(null);
  const [joining, setJoining] = useState(false);

  // Fetch classroom details
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch classroom
        const classroomRes = await fetch(`/api/classrooms/${classroomId}`);
        const classroomData = await classroomRes.json();

        if (!classroomRes.ok) {
          if (classroomRes.status === 401) {
            router.push('/login?redirectTo=/classroom');
            return;
          }
          if (classroomRes.status === 404) {
            setError('Classroom not found');
            setLoading(false);
            return;
          }
          // Handle "not enrolled" case - show join prompt
          if (classroomRes.status === 403 && classroomData.preview) {
            setNotEnrolledPreview(classroomData.preview);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch classroom');
        }
        setClassroom(classroomData);

        // Fetch assignments
        const assignmentsRes = await fetch(
          `/api/classrooms/${classroomId}/assignments`
        );
        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          setAssignments(assignmentsData);
        }

        // Fetch students (teacher only)
        if (classroomData.role === 'teacher') {
          const studentsRes = await fetch(
            `/api/classrooms/${classroomId}/students`
          );
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            setStudents(studentsData);
          }
        }
      } catch (err) {
        if (!isNetworkError(err)) {
          console.error('Fetch error:', err);
          setError('Failed to load classroom');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classroomId, router]);

  const copyJoinCode = async () => {
    if (!classroom) return;
    await navigator.clipboard.writeText(classroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinClassroom = async () => {
    if (!notEnrolledPreview) return;

    setJoining(true);
    try {
      const res = await fetch('/api/classroom-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: notEnrolledPreview.join_code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join classroom');
      }

      // Success - reload to get full classroom data
      window.location.reload();
    } catch (err) {
      if (!isNetworkError(err)) {
        setError(err instanceof Error ? err.message : 'Failed to join classroom');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Show join prompt when user accessed a classroom link but isn't enrolled
  if (notEnrolledPreview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Join Classroom?
            </h1>
            <p className="text-gray-500">
              You&apos;ve been invited to join this classroom
            </p>
          </div>

          {/* Classroom Info */}
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="mb-1 font-semibold text-gray-900">
              {notEnrolledPreview.name}
            </h2>
            {notEnrolledPreview.description && (
              <p className="mb-2 text-sm text-gray-600">
                {notEnrolledPreview.description}
              </p>
            )}
            {notEnrolledPreview.teacher && (
              <p className="text-xs text-gray-500">
                Teacher: {notEnrolledPreview.teacher.display_name || 'Unknown'}
              </p>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleJoinClassroom}
              disabled={joining}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Join This Classroom
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/classroom')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Classrooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Classroom not found'}</p>
        <button
          onClick={() => router.push('/classroom')}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Classrooms
        </button>
      </div>
    );
  }

  const isTeacher = classroom.role === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/classroom')}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {classroom.name}
                </h1>
                {isTeacher && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Teacher
                  </span>
                )}
              </div>
              {classroom.description && (
                <p className="text-sm text-gray-500">{classroom.description}</p>
              )}
            </div>
          </div>

          {/* Stats & Join Code */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              {formatEnrollmentCount(classroom.enrollment_count || 0)}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <ClipboardList className="h-4 w-4" />
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
            </span>

            {isTeacher && (
              <button
                onClick={copyJoinCode}
                className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="font-mono">
                  {formatJoinCode(classroom.join_code, true)}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs (teacher only) */}
      {isTeacher && (
        <div className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-6">
            <nav className="flex gap-6">
              {(['assignments', 'students', 'settings'] as TabType[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 py-3 text-sm font-medium capitalize transition ${
                      activeTab === tab
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-6">
        {/* Assignments Tab */}
        {(activeTab === 'assignments' || !isTeacher) && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Assignments
              </h2>
              {isTeacher && (
                <button
                  onClick={() =>
                    router.push(`/classroom/${classroomId}/assignments/new`)
                  }
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  New Assignment
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No assignments yet</p>
                {isTeacher && (
                  <button
                    onClick={() =>
                      router.push(`/classroom/${classroomId}/assignments/new`)
                    }
                    className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Create First Assignment
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isTeacher={isTeacher}
                    onClick={() =>
                      router.push(
                        `/classroom/${classroomId}/assignments/${assignment.id}`
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab (teacher only) */}
        {activeTab === 'students' && isTeacher && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Enrolled Students ({students.length})
            </h2>
            {students.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="mb-2 text-gray-500">No students enrolled yet</p>
                <p className="text-sm text-gray-400">
                  Share the join code:{' '}
                  <span className="font-mono font-bold">
                    {formatJoinCode(classroom.join_code, true)}
                  </span>
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white">
                {students.map((enrollment, idx) => (
                  <div
                    key={enrollment.id}
                    className={`flex items-center gap-4 px-4 py-3 ${
                      idx !== students.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {enrollment.student?.display_name?.[0]?.toUpperCase() ||
                        '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {enrollment.student?.display_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined{' '}
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab (teacher only) */}
        {activeTab === 'settings' && isTeacher && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Classroom Settings
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Join Code
                </label>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-emerald-600">
                    {formatJoinCode(classroom.join_code, true)}
                  </span>
                  <button
                    onClick={copyJoinCode}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                More settings coming soon...
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Inline AssignmentCard to stay under 300 LOC
interface AssignmentCardProps {
  assignment: AssignmentWithStats;
  isTeacher: boolean;
  onClick: () => void;
}

function AssignmentCard({ assignment, isTeacher, onClick }: AssignmentCardProps) {
  const percentage = isTeacher
    ? assignment.completion_percentage
    : (assignment as AssignmentWithStats & { my_completion_percentage?: number })
        .my_completion_percentage ?? 0;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm"
    >
      <div className="rounded-lg bg-emerald-100 p-2">
        <BookOpen className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
        <p className="text-xs text-gray-500">
          {assignment.content_ids.length} item
          {assignment.content_ids.length !== 1 ? 's' : ''} •{' '}
          {assignment.content_type.replace('_', ' ')}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-medium text-gray-700">
          {formatCompletionPercentage(percentage)}
        </span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full ${getCompletionBgClass(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </button>
  );
}
