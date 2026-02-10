'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import UserEditModal from './UserEditModal';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  learning_goal: string | null;
  experience_level: string | null;
  cards_viewed: number;
  cards_mastered: number;
  current_streak: number;
  total_sessions: number;
  last_active_at: string | null;
  created_at: string;
  is_admin: boolean;
  is_moderator: boolean;
  subscription_tier: 'plus' | 'pro' | null;
  vip_expires_at: string | null;
  avg_session_minutes: number;
  session_count: number;
}

type SortField = 'created_at' | 'last_active_at' | 'cards_viewed' | 'total_sessions';

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        sortBy,
        sortOrder,
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/analytics/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setUsers(json.users);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  }

  function TierBadge({ user }: { user: User }) {
    if (!user.subscription_tier) return <span className="text-gray-300">-</span>;
    const isExpired = user.vip_expires_at && new Date(user.vip_expires_at) <= new Date();
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">
          <Clock className="w-3 h-3" /> Expired
        </span>
      );
    }
    const isPro = user.subscription_tier === 'pro';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
        <Star className="w-3 h-3" /> {user.subscription_tier.toUpperCase()}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('created_at')}
                >
                  Signup <SortIcon field="created_at" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('last_active_at')}
                >
                  Last Active <SortIcon field="last_active_at" />
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('total_sessions')}
                >
                  Sessions <SortIcon field="total_sessions" />
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('cards_viewed')}
                >
                  Cards <SortIcon field="cards_viewed" />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Avg Session
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Goal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className="animate-pulse bg-gray-100 h-8 rounded" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'No users found matching your search' : 'No users yet'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full bg-gray-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                            {(user.display_name || user.username)[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1">
                            {user.display_name || user.username}
                            {user.is_admin && (
                              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TierBadge user={user} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDistanceToNow(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.last_active_at ? (
                        <span className="text-gray-600">{formatDistanceToNow(user.last_active_at)}</span>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {user.session_count || user.total_sessions || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-medium text-emerald-600">{user.cards_viewed}</span>
                      {user.cards_mastered > 0 && (
                        <span className="text-gray-400 ml-1">({user.cards_mastered} mastered)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {user.avg_session_minutes > 0 ? `${user.avg_session_minutes}m` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GoalBadge goal={user.learning_goal} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}

function GoalBadge({ goal }: { goal: string | null }) {
  if (!goal) return <span className="text-gray-300">-</span>;
  const badges: Record<string, { emoji: string; color: string }> = {
    travel: { emoji: '✈️', color: 'bg-blue-50' },
    heritage: { emoji: '🏠', color: 'bg-amber-50' },
    business: { emoji: '💼', color: 'bg-gray-100' },
    fun: { emoji: '🎉', color: 'bg-pink-50' },
  };
  const badge = badges[goal];
  if (!badge) return <span className="text-gray-400">{goal}</span>;
  return <span className={`inline-flex px-2 py-1 rounded-lg ${badge.color}`}>{badge.emoji}</span>;
}
