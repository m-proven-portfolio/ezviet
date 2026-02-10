'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import CohortUsersDrawer from './CohortUsersDrawer';

interface CohortData {
  cohort_week: string;
  total_users: number;
  week_0: number;
  week_1: number;
  week_2: number;
  week_3: number;
  week_4: number;
  rates: {
    week_0: number;
    week_1: number;
    week_2: number;
    week_3: number;
    week_4: number;
  };
}

interface CohortResponse {
  cohorts: CohortData[];
  summary: {
    totalCohorts: number;
    totalUsers: number;
    avgWeek1Retention: number;
  };
}

interface DrawerState {
  isOpen: boolean;
  cohortWeek: string;
  weekOffset: number;
  rate: number;
}

export default function CohortRetentionTable() {
  const [data, setData] = useState<CohortResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeksBack, setWeeksBack] = useState(12);
  const [drawer, setDrawer] = useState<DrawerState>({
    isOpen: false,
    cohortWeek: '',
    weekOffset: 0,
    rate: 0,
  });

  function openDrawer(cohortWeek: string, weekOffset: number, rate: number) {
    setDrawer({ isOpen: true, cohortWeek, weekOffset, rate });
  }

  function closeDrawer() {
    setDrawer((prev) => ({ ...prev, isOpen: false }));
  }

  useEffect(() => {
    fetchCohorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeksBack]);

  async function fetchCohorts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/cohorts?weeks=${weeksBack}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to load cohort data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getRetentionColor(rate: number): string {
    if (rate >= 80) return 'bg-emerald-500 text-white';
    if (rate >= 60) return 'bg-emerald-400 text-white';
    if (rate >= 40) return 'bg-emerald-300 text-emerald-900';
    if (rate >= 20) return 'bg-emerald-200 text-emerald-800';
    if (rate > 0) return 'bg-emerald-100 text-emerald-700';
    return 'bg-gray-50 text-gray-400';
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  const weeks = ['Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Retention by Cohort</h3>
          <p className="text-sm text-gray-500 mt-1">
            Weekly retention rates grouped by signup week
          </p>
        </div>
        <select
          value={weeksBack}
          onChange={(e) => setWeeksBack(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        >
          <option value={4}>Last 4 weeks</option>
          <option value={8}>Last 8 weeks</option>
          <option value={12}>Last 12 weeks</option>
          <option value={24}>Last 24 weeks</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{data.summary.totalUsers}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-emerald-600">{data.summary.avgWeek1Retention}%</div>
          <div className="text-sm text-gray-500">Avg Week 1 Retention</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{data.cohorts.length}</div>
          <div className="text-sm text-gray-500">Cohorts Tracked</div>
        </div>
      </div>

      {/* Cohort Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cohort
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Users
                </th>
                {weeks.map((week) => (
                  <th
                    key={week}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    {week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.cohorts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No cohort data yet. Users need to sign up and be active to see retention data.
                  </td>
                </tr>
              ) : (
                data.cohorts.map((cohort) => (
                  <tr key={cohort.cohort_week} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {formatDate(cohort.cohort_week)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-600">{cohort.total_users}</span>
                    </td>
                    {[0, 1, 2, 3, 4].map((weekNum) => {
                      const key = `week_${weekNum}` as keyof typeof cohort.rates;
                      const rate = cohort.rates[key];
                      const count = cohort[key as keyof CohortData] as number;
                      return (
                        <td key={weekNum} className="px-2 py-2">
                          <button
                            onClick={() => openDrawer(cohort.cohort_week, weekNum, rate)}
                            className={`w-full rounded-lg px-3 py-2 text-center transition-all hover:scale-105 hover:shadow-md cursor-pointer ${getRetentionColor(rate)}`}
                            title={`Click to see ${count} users (${rate}%)`}
                          >
                            <div className="font-semibold text-sm">{rate}%</div>
                            <div className="text-xs opacity-75">{count}</div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <span className="text-gray-500">Retention Rate:</span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-emerald-100" />
          <span className="text-gray-600">1-20%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-emerald-300" />
          <span className="text-gray-600">40-60%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-gray-600">80%+</span>
        </div>
      </div>

      {/* User Details Drawer */}
      <CohortUsersDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        cohortWeek={drawer.cohortWeek}
        weekOffset={drawer.weekOffset}
        rate={drawer.rate}
      />
    </div>
  );
}
