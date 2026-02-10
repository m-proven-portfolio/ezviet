'use client';

import { useState } from 'react';
import UserAnalyticsSummary from '@/components/admin/UserAnalyticsSummary';
import CohortRetentionTable from '@/components/admin/CohortRetentionTable';
import UserTable from '@/components/admin/UserTable';

type TabType = 'overview' | 'users' | 'cohorts';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'All Users' },
    { id: 'cohorts', label: 'Retention Cohorts' },
  ];

  return (
    <main className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Analytics</h1>
          <p className="text-gray-600 mt-1">Track user engagement and retention</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <UserAnalyticsSummary />}
        {activeTab === 'users' && <UserTable />}
        {activeTab === 'cohorts' && <CohortRetentionTable />}
      </div>
    </main>
  );
}
