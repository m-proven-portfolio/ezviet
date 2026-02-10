'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Users, Loader2, CheckCircle, HelpCircle, BookOpen, TrendingUp } from 'lucide-react';
import { normalizeJoinCode, isValidJoinCodeFormat } from '@/lib/classroom/utils';

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

interface ClassroomPreview {
  id: string;
  name: string;
  description: string | null;
  teacher: { id: string; display_name: string | null; avatar_url: string | null } | null;
  student_count: number;
  already_enrolled: boolean;
}

// Wrapper component to handle Suspense for useSearchParams
export default function JoinClassroomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <JoinClassroomContent />
    </Suspense>
  );
}

function JoinClassroomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState<ClassroomPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ classroomId: string; name: string } | null>(null);

  // Auto-fetch preview when code from URL is valid
  useEffect(() => {
    if (initialCode && isValidJoinCodeFormat(initialCode)) {
      fetchPreview(initialCode);
    }
  }, [initialCode]);

  const fetchPreview = async (joinCode: string) => {
    if (!isValidJoinCodeFormat(joinCode)) {
      setError('Please enter a valid 6-character code');
      setPreview(null);
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch(`/api/classroom-join?code=${normalizeJoinCode(joinCode)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Classroom not found');
      }

      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow alphanumeric and auto-uppercase
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setCode(cleaned);
    setError(null);

    // Auto-fetch when 6 characters entered
    if (cleaned.length === 6) {
      fetchPreview(cleaned);
    } else {
      setPreview(null);
    }
  };

  const handleJoin = async () => {
    if (!preview) return;

    setJoining(true);
    setError(null);

    try {
      const res = await fetch('/api/classroom-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join classroom');
      }

      setSuccess({
        classroomId: data.classroom.id,
        name: data.classroom.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              You&apos;re In!
            </h1>
            <p className="mb-6 text-gray-500">
              Successfully joined <strong>{success.name}</strong>
            </p>
          </div>

          {/* What's Next */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>View your assigned lessons in the classroom</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <span>Complete flashcard practice to learn Vietnamese</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                <span>Track your progress and build your streak</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => router.push(`/classroom/${success.classroomId}`)}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Go to Classroom
          </button>
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
              <h1 className="text-xl font-bold text-gray-900">Join Classroom</h1>
              <Tooltip content="Your teacher will give you a 6-character code. Enter it here to join their classroom and start learning.">
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-emerald-600" />
              </Tooltip>
            </div>
            <p className="text-sm text-gray-500">
              Enter the code from your teacher
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {/* Code Input */}
          <div className="mb-6">
            <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
              Enter Join Code
              <Tooltip content="A 6-character code like 'ABC123' that your teacher shares with the class. Ask your teacher if you don't have one.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="ABC123"
              className="w-full rounded-lg border border-gray-300 px-4 py-4 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] text-gray-900 placeholder:tracking-normal placeholder:text-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              maxLength={6}
              autoFocus
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              Your teacher will give you this code
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-sm text-gray-500">
                Finding classroom...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{preview.name}</h3>
                  {preview.teacher && (
                    <p className="text-xs text-gray-500">
                      Teacher: {preview.teacher.display_name || 'Unknown'}
                    </p>
                  )}
                </div>
              </div>
              {preview.description && (
                <p className="mb-3 text-sm text-gray-600">{preview.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {preview.student_count} student{preview.student_count !== 1 ? 's' : ''} enrolled
              </p>
            </div>
          )}

          {/* Join Button */}
          {preview && !preview.already_enrolled && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joining && <Loader2 className="h-4 w-4 animate-spin" />}
              {joining ? 'Joining...' : 'Join This Classroom'}
            </button>
          )}

          {/* Already enrolled */}
          {preview?.already_enrolled && (
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-500">
                You&apos;re already enrolled in this classroom!
              </p>
              <button
                onClick={() => router.push(`/classroom/${preview.id}`)}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Go to Classroom
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
