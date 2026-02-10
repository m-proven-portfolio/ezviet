'use client';

import { useEffect, useState } from 'react';

interface SummaryData {
  users: {
    total: number;
    activeToday: number;
    active7Days: number;
    active30Days: number;
    newThisWeek: number;
    avgCardsViewed: number;
  };
  content: {
    totalCards: number;
    totalViews: number;
  };
  distribution: {
    learningGoals: Record<string, number>;
    experienceLevels: Record<string, number>;
  };
}

const GOAL_LABELS: Record<string, string> = {
  travel: '✈️ Travel',
  heritage: '🏠 Heritage',
  business: '💼 Business',
  fun: '🎉 Fun',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: '🌱 Beginner',
  intermediate: '🌿 Intermediate',
  advanced: '🌳 Advanced',
};

export default function UserAnalyticsSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    try {
      const res = await fetch('/api/admin/analytics/summary');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  const stats = [
    { label: 'Total Users', value: data.users.total, color: 'text-gray-900' },
    { label: 'Active Today', value: data.users.activeToday, color: 'text-emerald-600' },
    { label: 'Active (7d)', value: data.users.active7Days, color: 'text-blue-600' },
    { label: 'Active (30d)', value: data.users.active30Days, color: 'text-purple-600' },
    { label: 'New This Week', value: data.users.newThisWeek, color: 'text-amber-600' },
    { label: 'Avg Cards/User', value: data.users.avgCardsViewed, color: 'text-pink-600' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Learning Goals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
          <div className="space-y-3">
            {Object.entries(data.distribution.learningGoals).map(([goal, count]) => {
              const total = Object.values(data.distribution.learningGoals).reduce((a, b) => a + b, 0);
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={goal}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{GOAL_LABELS[goal] || goal}</span>
                    <span className="text-gray-500">{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(data.distribution.learningGoals).length === 0 && (
              <p className="text-gray-400 text-sm">No data yet</p>
            )}
          </div>
        </div>

        {/* Experience Levels */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Levels</h3>
          <div className="space-y-3">
            {Object.entries(data.distribution.experienceLevels).map(([level, count]) => {
              const total = Object.values(data.distribution.experienceLevels).reduce((a, b) => a + b, 0);
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{LEVEL_LABELS[level] || level}</span>
                    <span className="text-gray-500">{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(data.distribution.experienceLevels).length === 0 && (
              <p className="text-gray-400 text-sm">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-3xl font-bold text-emerald-600">{data.content.totalCards}</div>
            <div className="text-sm text-gray-600">Total Cards</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {data.content.totalViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Card Views</div>
          </div>
        </div>
      </div>
    </div>
  );
}
