'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Clock,
  User,
  Music,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface QueueItem {
  id: string;
  priority_score: number;
  vote_count: number;
  negative_vote_ratio: number;
  submitter_trust_score: number;
  lines_changed: number;
  queue_status: string;
  assigned_to: string | null;
  created_at: string;
  submission: {
    id: string;
    status: string;
    submission_type: string;
    lines_changed: number;
    impact_score: number;
    submitted_lrc: string;
    points_awarded: number;
    created_at: string;
    song: {
      id: string;
      title: string;
      artist: string;
      slug: string;
      lyrics_lrc: string | null;
    };
    submitter: {
      id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
      trust_score: number | null;
    };
  };
  assigned_user?: {
    id: string;
    display_name: string | null;
    username: string | null;
  };
}

interface QueueResponse {
  items: QueueItem[];
  total: number;
  hasMore: boolean;
}

export default function ModeratorQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/moderator/queue?status=${statusFilter}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch queue');
      }
      const data: QueueResponse = await res.json();
      setQueue(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (
    queueId: string,
    action: 'claim' | 'release' | 'start_review' | 'escalate'
  ) => {
    setActionLoading(queueId);
    try {
      const res = await fetch('/api/moderator/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setActionLoading(submissionId);
    try {
      const res = await fetch('/api/lrc-sync/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Approve failed');
      }

      setSelectedItem(null);
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (submissionId: string, reason?: string) => {
    setActionLoading(submissionId);
    try {
      const res = await fetch('/api/lrc-sync/merge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, rejectionReason: reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reject failed');
      }

      setSelectedItem(null);
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10';
    if (score >= 50) return 'text-orange-500 bg-orange-500/10';
    if (score >= 20) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Review Queue</h1>
                <p className="text-sm text-gray-500">
                  Review and approve community LRC submissions
                </p>
              </div>
            </div>
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {['pending', 'assigned', 'in_review', 'escalated', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === status
                    ? 'text-purple-600 border-purple-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {loading ? 'Loading...' : `${queue.length} submissions`}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mb-3 text-green-500" />
                <p className="font-medium">Queue is empty!</p>
                <p className="text-sm">No submissions with status: {statusFilter}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {queue.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedItem?.id === item.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Music className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 truncate">
                            {item.submission.song.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          <span>
                            {item.submission.submitter.display_name || 'Anonymous'}
                          </span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(
                              item.priority_score
                            )}`}
                          >
                            Priority: {item.priority_score}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            {item.lines_changed} lines
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {selectedItem ? (
              <div className="h-full flex flex-col">
                {/* Detail header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedItem.submission.song.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        by {selectedItem.submission.song.artist || 'Unknown'}
                      </p>
                    </div>
                    <Link
                      href={`/learn/${selectedItem.submission.song.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                      View song <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Submission info */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Submitter:</span>
                      <p className="font-medium">
                        {selectedItem.submission.submitter.display_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Trust Score:</span>
                      <p className="font-medium">
                        {((selectedItem.submission.submitter.trust_score || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium capitalize">
                        {selectedItem.submission.submission_type}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Points:</span>
                      <p className="font-medium">
                        {selectedItem.submission.points_awarded || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* LRC preview */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Submitted LRC</h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono max-h-60">
                    {selectedItem.submission.submitted_lrc?.slice(0, 2000)}
                    {(selectedItem.submission.submitted_lrc?.length || 0) > 2000 && '\n...'}
                  </pre>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-3">
                    {statusFilter === 'pending' && (
                      <button
                        onClick={() => handleAction(selectedItem.id, 'claim')}
                        disabled={actionLoading === selectedItem.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selectedItem.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Claim for Review'
                        )}
                      </button>
                    )}

                    {(statusFilter === 'assigned' || statusFilter === 'in_review') && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedItem.submission.id)}
                          disabled={actionLoading === selectedItem.submission.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === selectedItem.submission.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(selectedItem.submission.id)}
                          disabled={actionLoading === selectedItem.submission.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(selectedItem.id, 'escalate')}
                          disabled={actionLoading === selectedItem.id}
                          className="px-4 py-2 bg-orange-100 text-orange-700 font-medium rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
                <Shield className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">Select a submission</p>
                <p className="text-sm">Click on an item to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
