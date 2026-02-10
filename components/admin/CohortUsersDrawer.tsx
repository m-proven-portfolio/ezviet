'use client';

import { useEffect, useState } from 'react';
import { X, User, Calendar, Activity, BookOpen, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CohortUser {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cards_viewed: number;
  cards_mastered: number;
  current_streak: number;
  total_sessions: number;
  last_active_at: string | null;
  created_at: string;
  is_active_this_week: boolean;
  activity_this_week: {
    cards_viewed: number;
    sessions: number;
  };
}

interface CohortUsersResponse {
  users: CohortUser[];
  summary: {
    total: number;
    active: number;
    churned: number;
    cohort_week: string;
    target_week_start: string;
    week_offset: number;
  };
}

interface CohortUsersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cohortWeek: string;
  weekOffset: number;
  rate: number;
}

export default function CohortUsersDrawer({
  isOpen,
  onClose,
  cohortWeek,
  weekOffset,
  rate,
}: CohortUsersDrawerProps) {
  const [data, setData] = useState<CohortUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'churned'>('all');

  useEffect(() => {
    if (isOpen && cohortWeek) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cohortWeek, weekOffset]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/analytics/cohorts/users?cohort_week=${cohortWeek}&week_offset=${weekOffset}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to load user details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = data?.users.filter((user) => {
    if (filter === 'active') return user.is_active_this_week;
    if (filter === 'churned') return !user.is_active_this_week;
    return true;
  });

  // Handle escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const weekLabel = weekOffset === 0 ? 'Signup Week' : `Week ${weekOffset}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {weekLabel} Details
              </h2>
              <p className="text-sm text-gray-500">
                Cohort: {formatDate(cohortWeek)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Summary stats */}
          {data && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => setFilter('all')}
                className={`p-3 rounded-lg text-center transition-colors ${
                  filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-xl font-bold">{data.summary.total}</div>
                <div className="text-xs opacity-75">Total</div>
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`p-3 rounded-lg text-center transition-colors ${
                  filter === 'active' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <div className={`text-xl font-bold ${filter !== 'active' && 'text-emerald-600'}`}>
                  {data.summary.active}
                </div>
                <div className={`text-xs ${filter === 'active' ? 'opacity-75' : 'text-emerald-600'}`}>
                  Active ({rate}%)
                </div>
              </button>
              <button
                onClick={() => setFilter('churned')}
                className={`p-3 rounded-lg text-center transition-colors ${
                  filter === 'churned' ? 'bg-red-600 text-white' : 'bg-red-50 hover:bg-red-100'
                }`}
              >
                <div className={`text-xl font-bold ${filter !== 'churned' && 'text-red-600'}`}>
                  {data.summary.churned}
                </div>
                <div className={`text-xs ${filter === 'churned' ? 'opacity-75' : 'text-red-600'}`}>
                  Inactive
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-180px)] px-6 py-4">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
          )}

          {!loading && !error && filteredUsers && (
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users match this filter
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} weekOffset={weekOffset} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function UserCard({ user, weekOffset }: { user: CohortUser; weekOffset: number }) {
  const displayName = user.display_name || user.username || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        user.is_active_this_week
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">{initials}</span>
          </div>
        )}

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{displayName}</span>
            {user.is_active_this_week ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">{user.email || 'No email'}</div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Joined {formatDate(user.created_at)}</span>
            </div>
            {user.last_active_at && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>Last seen {formatDate(user.last_active_at)}</span>
              </div>
            )}
          </div>

          {/* Activity this week */}
          {user.is_active_this_week && weekOffset >= 0 && (
            <div className="flex gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                <BookOpen className="w-3 h-3" />
                <span>{user.activity_this_week.cards_viewed} cards this week</span>
              </div>
              {user.activity_this_week.sessions > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  <User className="w-3 h-3" />
                  <span>{user.activity_this_week.sessions} sessions</span>
                </div>
              )}
            </div>
          )}

          {/* Overall stats */}
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{user.cards_viewed} total cards</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>{user.current_streak} day streak</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}