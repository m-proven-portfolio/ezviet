'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Loader2,
  Plus,
  ExternalLink,
  HelpCircle,
  BookOpen,
  UserPlus,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { formatEnrollmentCount } from '@/lib/classroom/utils';
import { isNetworkError } from '@/lib/utils';
import type { ClassroomWithDetails } from '@/lib/classroom/types';

interface ClassroomStats {
  total: number;
  active: number;
  totalStudents: number;
  totalAssignments: number;
}

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

export default function AdminClassroomsPage() {
  const [classrooms, setClassrooms] = useState<ClassroomWithDetails[]>([]);
  const [stats, setStats] = useState<ClassroomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClassrooms() {
      try {
        const res = await fetch('/api/admin/classrooms');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch classrooms');
        }
        const data = await res.json();
        setClassrooms(data.classrooms || []);
        setStats(data.stats || null);
      } catch (err) {
        if (!isNetworkError(err)) {
          console.error('Fetch classrooms error:', err);
          setError(err instanceof Error ? err.message : 'Failed to load classrooms');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchClassrooms();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Help */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
            <Tooltip content="Classrooms let teachers organize students, assign learning content, and track progress. Teachers create classrooms and share join codes with students.">
              <HelpCircle className="h-5 w-5 text-gray-400 hover:text-emerald-600" />
            </Tooltip>
          </div>
          <p className="text-sm text-gray-500">
            Manage all classrooms in the system
          </p>
        </div>
        <Link
          href="/classroom/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create Classroom
        </Link>
      </div>

      {/* Stats Cards with Tooltips */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">Total Classrooms</p>
              <Tooltip content="Total number of classrooms created by all teachers">
                <HelpCircle className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500" />
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">Active</p>
              <Tooltip content="Classrooms that are currently accepting students and assignments">
                <HelpCircle className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500" />
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">Total Students</p>
              <Tooltip content="Total enrolled students across all classrooms">
                <HelpCircle className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500" />
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">Total Assignments</p>
              <Tooltip content="Total learning assignments created across all classrooms">
                <HelpCircle className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500" />
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {/* Empty State with Helpful Guide */}
      {!error && classrooms.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 text-white">
            <h2 className="text-xl font-bold mb-1">Welcome to Classrooms!</h2>
            <p className="text-emerald-100">
              Create virtual classrooms to teach Vietnamese to your students
            </p>
          </div>

          {/* How It Works */}
          <div className="p-8">
            <h3 className="font-semibold text-gray-900 mb-4">How Classrooms Work</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 rounded-full bg-emerald-100 p-2 h-fit">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">1. Create a Classroom</p>
                  <p className="text-sm text-gray-500">
                    Give it a name and description. You&apos;ll get a unique 6-character join code.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 rounded-full bg-blue-100 p-2 h-fit">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">2. Invite Students</p>
                  <p className="text-sm text-gray-500">
                    Share the join code with your students. They can join at /classroom/join
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 rounded-full bg-purple-100 p-2 h-fit">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">3. Assign Content</p>
                  <p className="text-sm text-gray-500">
                    Create assignments from flashcard categories. Track student progress in real-time.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/classroom/new"
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Create Your First Classroom
              </Link>
              <Link
                href="/classroom"
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go to Classroom Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Classroom Table */
        classrooms.length > 0 && (
          <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Classroom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1">
                      Students
                      <Tooltip content="Number of actively enrolled students">
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </Tooltip>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1">
                      Join Code
                      <Tooltip content="Share this code with students so they can join the classroom">
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </Tooltip>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classrooms.map((classroom) => (
                  <tr key={classroom.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-100 p-2">
                          <GraduationCap className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{classroom.name}</p>
                          {classroom.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {classroom.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {classroom.teacher?.display_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {formatEnrollmentCount(classroom.enrollment_count || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-700">
                        {classroom.join_code}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          classroom.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {classroom.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/classroom/${classroom.id}`}
                        className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
