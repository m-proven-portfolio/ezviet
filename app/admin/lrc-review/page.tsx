'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Merge, Music, User, ChevronDown, PlayCircle } from 'lucide-react';
import { KaraokePreviewModal } from '@/components/admin/KaraokePreviewModal';

interface Submission {
  id: string;
  song_id: string;
  user_id: string;
  timing_data: Array<{ lineIndex: number; timestamp: number; text: string }>;
  accuracy_score: number;
  points_earned: number;
  lines_count: number;
  best_streak: number;
  status: string;
  created_at: string;
  song?: {
    id: string;
    title: string;
    lyrics_lrc: string | null;
    storage_path: string;
  };
  user?: {
    id: string;
    display_name: string;
    username: string | null;
  };
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'merged';

type TimingEntry = { lineIndex: number; timestamp: number; text: string };

export default function LrcReviewPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);
  // Track edited timings per submission (key = submission ID)
  const [editedTimings, setEditedTimings] = useState<Record<string, TimingEntry[]>>({});

  // Handle saving edits from the modal
  const handleSaveEdits = useCallback((submissionId: string, timings: TimingEntry[]) => {
    setEditedTimings(prev => ({
      ...prev,
      [submissionId]: timings,
    }));
  }, []);

  // Check if a submission has been edited
  const hasEdits = useCallback((submissionId: string) => {
    return !!editedTimings[submissionId];
  }, [editedTimings]);

  // Get the current timings (edited or original)
  const getTimings = useCallback((submission: Submission) => {
    return editedTimings[submission.id] || submission.timing_data;
  }, [editedTimings]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lrc-submissions?status=${statusFilter}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = async (submissionId: string, status: 'approved' | 'rejected' | 'merged') => {
    setProcessing(submissionId);
    try {
      // Include edited timings if they exist and we're merging
      const body: Record<string, unknown> = { submissionId, status };
      if (status === 'merged' && editedTimings[submissionId]) {
        body.editedTimings = editedTimings[submissionId];
      }

      const res = await fetch('/api/admin/lrc-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Remove from list and clear any edited timings
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        setEditedTimings(prev => {
          const next = { ...prev };
          delete next[submissionId];
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to update submission:', error);
    } finally {
      setProcessing(null);
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <main className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LRC Review Queue</h1>
            <p className="text-gray-600 mt-1">Review and approve community timing submissions</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected', 'merged'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              No {statusFilter} submissions found
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {sub.song?.title || 'Unknown Song'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{sub.user?.display_name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{sub.lines_count} lines</span>
                        <span>•</span>
                        <span>{sub.accuracy_score?.toFixed(1)}% accuracy</span>
                        {hasEdits(sub.id) && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-medium">Edited</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedId === sub.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === sub.id && (
                  <div className="border-t border-gray-100">
                    {/* Test Preview Button - Most Important! */}
                    {sub.song?.storage_path && (
                      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600">
                        <button
                          onClick={() => setPreviewSubmission(sub)}
                          className="w-full flex items-center justify-center gap-3 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
                        >
                          <PlayCircle className="w-6 h-6" />
                          Test Karaoke Preview
                          <span className="text-sm font-normal text-purple-500">
                            (listen before approving)
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="p-4 bg-gray-50 grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Points</div>
                        <div className="font-bold text-purple-600">{sub.points_earned}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Best Streak</div>
                        <div className="font-bold text-orange-600">{sub.best_streak}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Accuracy</div>
                        <div className="font-bold text-green-600">{sub.accuracy_score?.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Lines</div>
                        <div className="font-bold text-blue-600">{sub.lines_count}</div>
                      </div>
                    </div>

                    {/* Timing Comparison */}
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Timing Data</h4>
                      <div className="space-y-2 font-mono text-sm">
                        {sub.timing_data.map((timing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                          >
                            <span className="text-gray-400 w-8">#{timing.lineIndex + 1}</span>
                            <span className="text-purple-600 w-20">
                              [{formatTimestamp(timing.timestamp)}]
                            </span>
                            <span className="text-gray-700 flex-1 truncate">
                              {timing.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {sub.status === 'pending' && (
                      <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                          onClick={() => handleAction(sub.id, 'rejected')}
                          disabled={processing === sub.id}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(sub.id, 'approved')}
                          disabled={processing === sub.id}
                          className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(sub.id, 'merged')}
                          disabled={processing === sub.id}
                          className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                            hasEdits(sub.id)
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          <Merge className="w-4 h-4" />
                          {hasEdits(sub.id) ? 'Merge with Edits' : 'Merge to Song'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Karaoke Preview Modal */}
      {previewSubmission && previewSubmission.song?.storage_path && (
        <KaraokePreviewModal
          isOpen={!!previewSubmission}
          onClose={() => setPreviewSubmission(null)}
          songTitle={previewSubmission.song?.title || 'Unknown Song'}
          storagePath={previewSubmission.song.storage_path}
          timingData={getTimings(previewSubmission)}
          submitterName={previewSubmission.user?.display_name || 'Anonymous'}
          editable={true}
          onSave={(edited) => handleSaveEdits(previewSubmission.id, edited)}
        />
      )}
    </main>
  );
}
