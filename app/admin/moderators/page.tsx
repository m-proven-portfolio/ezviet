'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  User,
  Star,
  Music,
  Trophy,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface Moderator {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_moderator: boolean;
  is_admin: boolean;
  trust_score: number | null;
  total_points: number | null;
}

interface EligibleCandidate {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  trust_score: number;
  total_points: number;
  songs_synced: number;
  eligibility: {
    isEligible: boolean;
    reason: string;
  };
}

interface ModeratorsResponse {
  moderators: Moderator[];
  eligible: EligibleCandidate[];
}

export default function AdminModeratorsPage() {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [eligible, setEligible] = useState<EligibleCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/moderators?includeEligible=true');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch moderators');
      }
      const data: ModeratorsResponse = await res.json();
      setModerators(data.moderators);
      setEligible(data.eligible);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGrant = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/moderators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to grant moderator');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke moderator status?')) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/moderators', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke moderator');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Moderator Management
                  </h1>
                  <p className="text-sm text-gray-500">
                    Grant and revoke moderator privileges
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Current Moderators */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Current Moderators ({moderators.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : moderators.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No moderators yet</p>
              <p className="text-sm text-gray-400">
                Grant moderator status to eligible users below
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {moderators.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                      {mod.avatar_url ? (
                        <img
                          src={mod.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {mod.display_name || mod.username || 'User'}
                        </span>
                        {mod.is_admin && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      {mod.username && (
                        <p className="text-sm text-gray-500">@{mod.username}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {((mod.trust_score || 0) * 100).toFixed(0)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {mod.total_points?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                    {!mod.is_admin && (
                      <button
                        onClick={() => handleRevoke(mod.id)}
                        disabled={actionLoading === mod.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Revoke moderator"
                      >
                        {actionLoading === mod.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldOff className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Eligible Candidates */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Eligible Candidates ({eligible.length})
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Users who meet the requirements: trust score ≥ 50%, 500+ points, 10+ songs
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : eligible.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No eligible candidates yet</p>
              <p className="text-sm text-gray-400">
                Users need to contribute more to become eligible
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligible.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden">
                      {candidate.avatar_url ? (
                        <img
                          src={candidate.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 truncate block">
                        {candidate.display_name || candidate.username || 'User'}
                      </span>
                      {candidate.username && (
                        <p className="text-sm text-gray-500">@{candidate.username}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {(candidate.trust_score * 100).toFixed(0)}% trust
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-purple-500" />
                          {candidate.total_points.toLocaleString()} pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3 text-blue-500" />
                          {candidate.songs_synced} songs
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGrant(candidate.id)}
                      disabled={actionLoading === candidate.id}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === candidate.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Grant
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
