'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GraduationCap, Loader2, Copy, Check, HelpCircle, UserPlus, BookOpen, TrendingUp } from 'lucide-react';
import { formatJoinCode } from '@/lib/classroom/utils';
import type { ClassroomWithDetails } from '@/lib/classroom/types';

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

export default function CreateClassroomPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClassroom, setCreatedClassroom] = useState<ClassroomWithDetails | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create classroom');
      }

      const classroom = await res.json();
      setCreatedClassroom(classroom);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create classroom');
    } finally {
      setCreating(false);
    }
  };

  const copyJoinCode = async () => {
    if (!createdClassroom) return;
    await navigator.clipboard.writeText(createdClassroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success state
  if (createdClassroom) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Classroom Created!
            </h1>
            <p className="mb-6 text-gray-500">
              Share the join code with your students
            </p>
          </div>

          <div className="mb-6 rounded-xl bg-gray-50 p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Join Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-4xl font-bold tracking-widest text-emerald-600">
                {formatJoinCode(createdClassroom.join_code, true)}
              </span>
              <button
                onClick={copyJoinCode}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Students enter this code at /classroom/join
            </p>
          </div>

          {/* What's Next */}
          <div className="mb-6 rounded-lg bg-emerald-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <UserPlus className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>Share the join code with your students</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <span>Create assignments from flashcard categories</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                <span>Track student progress in real-time</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/classroom')}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push(`/classroom/${createdClassroom.id}`)}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Go to Classroom
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            onClick={() => router.push('/classroom')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Create Classroom</h1>
              <Tooltip content="Create a virtual classroom to teach Vietnamese. You'll get a unique join code to share with students.">
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-emerald-600" />
              </Tooltip>
            </div>
            <p className="text-sm text-gray-500">
              Set up a new classroom for your students
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        <form onSubmit={handleCreate} className="rounded-xl bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="name"
              className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              Classroom Name *
              <Tooltip content="Choose a name your students will recognize. Include the course level or semester to help them find it.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vietnamese 101 - Fall 2026"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              This name will be visible to all students
            </p>
          </div>

          <div className="mb-8">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about your class, schedule, or learning goals..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Help students know what to expect from this class
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/classroom')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
