'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Users,
  Loader2,
  GraduationCap,
  BookOpen,
  HelpCircle,
  UserPlus,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import type { ClassroomWithDetails } from '@/lib/classroom/types';
import { formatEnrollmentCount } from '@/lib/classroom/utils';
import { isNetworkError } from '@/lib/utils';

// Reusable tooltip component
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg z-50">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

export default function ClassroomDashboardPage() {
  const router = useRouter();
  const [teachingClassrooms, setTeachingClassrooms] = useState<ClassroomWithDetails[]>([]);
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<ClassroomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClassrooms() {
      try {
        const res = await fetch('/api/classrooms');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login?redirectTo=/classroom');
            return;
          }
          throw new Error('Failed to fetch classrooms');
        }
        const data = await res.json();
        setTeachingClassrooms(data.teaching || []);
        setEnrolledClassrooms(data.enrolled || []);
      } catch (err) {
        if (!isNetworkError(err)) {
          console.error('Fetch classrooms error:', err);
          setError('Failed to load classrooms');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchClassrooms();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-emerald-600" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
                <Tooltip content="Classrooms connect teachers and students. Teachers create classrooms and assign content. Students join with a code and track their progress.">
                  <HelpCircle className="h-5 w-5 text-gray-400 hover:text-emerald-600" />
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500">
                Teach or learn Vietnamese together
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/classroom/join')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Join Classroom
            </button>
            <button
              onClick={() => router.push('/classroom/new')}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Classroom
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* First-Time User Welcome */}
        {!error && teachingClassrooms.length === 0 && enrolledClassrooms.length === 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 text-white">
              <h2 className="text-xl font-bold mb-1">Welcome to Classrooms!</h2>
              <p className="text-emerald-100">
                Learn Vietnamese with a teacher, or teach others
              </p>
            </div>

            {/* How It Works */}
            <div className="p-8">
              <h3 className="font-semibold text-gray-900 mb-4">Choose Your Path</h3>
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                {/* Teacher Path */}
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <BookOpen className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">I want to teach</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">1.</span>
                      Create a classroom with a name
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">2.</span>
                      Share the 6-character join code with students
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">3.</span>
                      Assign flashcard categories for students to learn
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">4.</span>
                      Track student progress in real-time
                    </li>
                  </ul>
                  <button
                    onClick={() => router.push('/classroom/new')}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Create a Classroom
                  </button>
                </div>

                {/* Student Path */}
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">I want to learn</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">1.</span>
                      Get a join code from your teacher
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">2.</span>
                      Enter the code to join the classroom
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">3.</span>
                      Complete assigned flashcard lessons
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">4.</span>
                      Track your progress and see your streak
                    </li>
                  </ul>
                  <button
                    onClick={() => router.push('/classroom/join')}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Join a Classroom
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teaching Section */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            My Classrooms (Teaching)
            <Tooltip content="Classrooms you created. You can assign content and track student progress here.">
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-emerald-600" />
            </Tooltip>
          </h2>
          {teachingClassrooms.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
              <GraduationCap className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">
                You haven&apos;t created any classrooms yet.
              </p>
              <button
                onClick={() => router.push('/classroom/new')}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Create Your First Classroom
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teachingClassrooms.map((classroom) => (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  role="teacher"
                  onClick={() => router.push(`/classroom/${classroom.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Enrolled Section */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-blue-600" />
            Enrolled Classrooms (Learning)
            <Tooltip content="Classrooms you've joined as a student. Complete assignments to track your progress.">
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-blue-600" />
            </Tooltip>
          </h2>
          {enrolledClassrooms.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">
                You haven&apos;t joined any classrooms yet.
              </p>
              <button
                onClick={() => router.push('/classroom/join')}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Join a Classroom
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {enrolledClassrooms.map((classroom) => (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  role="student"
                  onClick={() => router.push(`/classroom/${classroom.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Inline ClassroomCard component to keep under 300 LOC
interface ClassroomCardProps {
  classroom: ClassroomWithDetails;
  role: 'teacher' | 'student';
  onClick: () => void;
}

function ClassroomCard({ classroom, role, onClick }: ClassroomCardProps) {
  const isTeacher = role === 'teacher';

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`rounded-full p-2 ${
            isTeacher ? 'bg-emerald-100' : 'bg-blue-100'
          }`}
        >
          {isTeacher ? (
            <BookOpen className="h-5 w-5 text-emerald-600" />
          ) : (
            <Users className="h-5 w-5 text-blue-600" />
          )}
        </div>
        {isTeacher && (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
            Teacher
          </span>
        )}
      </div>
      <h3 className="mb-1 font-semibold text-gray-900">{classroom.name}</h3>
      {classroom.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-500">
          {classroom.description}
        </p>
      )}
      <div className="mt-auto flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {formatEnrollmentCount(classroom.enrollment_count || 0)}
        </span>
        {isTeacher && classroom.assignment_count !== undefined && (
          <span>{classroom.assignment_count} assignments</span>
        )}
      </div>
      {!isTeacher && classroom.teacher && (
        <p className="mt-2 text-xs text-gray-400">
          Teacher: {classroom.teacher.display_name || 'Unknown'}
        </p>
      )}
    </button>
  );
}
