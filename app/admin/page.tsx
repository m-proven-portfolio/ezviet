'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Music, ClipboardList, Search, ChevronDown, Plus } from 'lucide-react';
import QuickSongUploader from '@/components/admin/QuickSongUploader';
import { formatDate, getStorageUrl } from '@/lib/utils';
import { getIconForSelect } from '@/components/CategoryIcon';
import type { CardWithTerms, Category, CardQueue } from '@/lib/supabase/types';
import { useAdminStats } from '@/hooks/useAdminStats';
import { AdminStatsGrid } from '@/components/stats/StatsCard';

interface QueueProgress {
  category: Category;
  pending: number;
  completed: number;
  total: number;
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

export default function AdminDashboard() {
  const [cards, setCards] = useState<CardWithTerms[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [queueProgress, setQueueProgress] = useState<QueueProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { stats, loading: statsLoading } = useAdminStats();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Quick song upload state
  const [quickUploadCard, setQuickUploadCard] = useState<CardWithTerms | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [cardsRes, queueRes, categoriesRes] = await Promise.all([
        fetch('/api/cards?all=true'),
        fetch('/api/card-queue'),
        fetch('/api/categories'),
      ]);

      if (!cardsRes.ok || !queueRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [cardsData, queueData, categoriesData] = await Promise.all([
        cardsRes.json(),
        queueRes.json(),
        categoriesRes.json(),
      ]);

      // Ensure cardsData is an array (handle both old and new API response formats)
      const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards || [];
      setCards(cards);
      setCategories(categoriesData);

      // Calculate queue progress per category
      const progressMap = new Map<string, QueueProgress>();
      for (const cat of categoriesData as Category[]) {
        progressMap.set(cat.id, {
          category: cat,
          pending: 0,
          completed: 0,
          total: 0,
        });
      }
      for (const item of queueData as CardQueue[]) {
        const progress = progressMap.get(item.category_id);
        if (progress) {
          progress.total++;
          if (item.status === 'completed') {
            progress.completed++;
          } else {
            progress.pending++;
          }
        }
      }
      // Only show categories with queue items
      setQueueProgress(
        Array.from(progressMap.values()).filter((p) => p.total > 0)
      );
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((card) => {
        const viTerm = card.terms?.find((t) => t.lang === 'vi');
        const enTerm = card.terms?.find((t) => t.lang === 'en');
        return (
          card.slug.toLowerCase().includes(query) ||
          viTerm?.text?.toLowerCase().includes(query) ||
          enTerm?.text?.toLowerCase().includes(query) ||
          viTerm?.romanization?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((card) => card.category_id === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      const aViTerm = a.terms?.find((t) => t.lang === 'vi');
      const bViTerm = b.terms?.find((t) => t.lang === 'vi');

      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'az':
          return (aViTerm?.text || a.slug).localeCompare(bViTerm?.text || b.slug, 'vi');
        case 'za':
          return (bViTerm?.text || b.slug).localeCompare(aViTerm?.text || a.slug, 'vi');
        default:
          return 0;
      }
    });

    return result;
  }, [cards, searchQuery, selectedCategory, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    az: 'A → Z (Vietnamese)',
    za: 'Z → A (Vietnamese)',
  };

  function scrollToFilters() {
    filterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your flashcards</p>
          </div>
          <Link
            href="/admin/cards/new"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Card
          </Link>
        </div>

        {/* Stats */}
        <AdminStatsGrid
          totalCards={stats.totalCards}
          totalCategories={stats.totalCategories}
          totalViews={stats.totalViews}
          totalUsers={stats.totalUsers}
          loading={statsLoading}
        />

        {/* Queue Progress */}
        {queueProgress.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Card Queue Progress</h2>
              </div>
              <Link
                href="/admin/categories"
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Manage Categories →
              </Link>
            </div>
            <div className="p-4 space-y-4">
              {queueProgress.map((progress) => {
                const percent = Math.round((progress.completed / progress.total) * 100);
                return (
                  <div key={progress.category.id} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">
                        {getIconForSelect(progress.category.icon)} {progress.category.name}
                      </span>
                      <span className="text-gray-600">
                        {progress.completed}/{progress.total} ({percent}%)
                      </span>
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
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div ref={filterRef} className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Vietnamese, English, or slug..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 min-w-[180px] justify-between"
              >
                <span className="text-sm">{sortLabels[sortBy]}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        sortBy === option ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                      }`}
                    >
                      {sortLabels[option]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({cards.length})
            </button>
            {categories.map((cat) => {
              const count = cards.filter((c) => c.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getIconForSelect(cat.icon)} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCategory || searchQuery ? 'Filtered Cards' : 'Recent Cards'}
            </h2>
            {(selectedCategory || searchQuery) && (
              <span className="text-sm text-gray-500">
                {filteredCards.length} of {cards.length} cards
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading cards...</div>
          ) : filteredCards.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {cards.length === 0
                  ? 'No cards yet. Create your first one!'
                  : 'No cards match your search.'}
              </p>
              {cards.length === 0 ? (
                <Link
                  href="/admin/cards/new"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Create Card →
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Clear filters →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCards.map((card) => {
                const viTerm = card.terms?.find(t => t.lang === 'vi');
                const enTerm = card.terms?.find(t => t.lang === 'en');

                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 p-4 hover:bg-emerald-50 transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {card.image_path && (
                        <img
                          src={getStorageUrl('cards-images', card.image_path)}
                          alt={enTerm?.text || card.slug}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {viTerm?.text || card.slug}
                        </span>
                        {viTerm?.romanization && (
                          <span className="text-gray-500 text-sm">
                            /{viTerm.romanization}/
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {enTerm?.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {card.category?.name} • {formatDate(card.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      {/* Song count + Add song button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickUploadCard(card);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors"
                        title="Add song"
                      >
                        {card.songs && card.songs.length > 0 ? (
                          <>
                            <Music className="w-4 h-4" />
                            <span className="text-xs font-medium">{card.songs.length}</span>
                          </>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                      <Link
                        href={`/learn/${card.slug}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/cards/${card.id}`}
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-emerald-100"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Quick Song Upload Modal */}
      {quickUploadCard && (
        <QuickSongUploader
          cardId={quickUploadCard.id}
          cardTheme={quickUploadCard.terms?.find(t => t.lang === 'en')?.text || quickUploadCard.slug}
          onComplete={() => {
            setQuickUploadCard(null);
            fetchData(); // Refresh the card list to show updated song count
          }}
          onCancel={() => setQuickUploadCard(null)}
        />
      )}
    </main>
  );
}
