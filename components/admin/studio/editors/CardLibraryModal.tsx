'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Check, Library, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CardTerm {
  text: string;
  lang: string;
  romanization?: string;
}

interface ExistingCard {
  id: string;
  slug: string;
  image_path: string | null;
  category_id: string | null;
  card_terms: CardTerm[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ImportedCard {
  vietnamese: string;
  english: string;
  pronunciation: string;
  imageUrl: string | null;
  audioSlug: string;
}

interface CardLibraryModalProps {
  onImport: (cards: ImportedCard[]) => void;
  onClose: () => void;
  maxCards?: number;
}

export function CardLibraryModal({
  onImport,
  onClose,
  maxCards = 6,
}: CardLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<ExistingCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    loadCards(0, true);
  }, []);

  // Reload cards when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadCards(0, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');
    setCategories(data || []);
  };

  const loadCards = useCallback(
    async (pageNum: number, reset: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          category: selectedCategory,
          sort: 'az',
        });
        if (searchQuery) params.set('q', searchQuery);

        const response = await fetch(`/api/studio/search-cards?${params}`);
        if (!response.ok) throw new Error('Failed to load cards');

        const data = await response.json();
        setHasMore(data.hasMore);
        if (reset) {
          setCards(data.cards || []);
        } else {
          setCards((prev) => [...prev, ...(data.cards || [])]);
        }
      } catch (err) {
        console.error('Failed to load cards:', err);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory]
  );

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCards(nextPage, false);
  };

  const toggleCard = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else if (newSelected.size < maxCards) {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const getCardText = (card: ExistingCard) => {
    const enTerm = card.card_terms.find((t) => t.lang === 'en');
    const viTerm = card.card_terms.find((t) => t.lang === 'vi');
    return {
      english: enTerm?.text || card.slug,
      vietnamese: viTerm?.text || '',
      pronunciation: viTerm?.romanization || '',
    };
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    const supabase = createClient();
    const { data } = supabase.storage.from('cards-images').getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const handleImport = () => {
    const importedCards: ImportedCard[] = [];
    for (const cardId of selectedCards) {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        const text = getCardText(card);
        importedCards.push({
          vietnamese: text.vietnamese,
          english: text.english,
          pronunciation: text.pronunciation,
          imageUrl: getImageUrl(card.image_path),
          audioSlug: card.slug,
        });
      }
    }
    onImport(importedCards);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Library className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Import from Card Library</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 border-b border-gray-100 px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selection info */}
        <div className="bg-gray-50 px-6 py-2 text-sm text-gray-600">
          {selectedCards.size} of {maxCards} cards selected
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && cards.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : cards.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-500">
              No cards found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {cards.map((card) => {
                  const isSelected = selectedCards.has(card.id);
                  const text = getCardText(card);
                  const imageUrl = getImageUrl(card.image_path);
                  const canSelect = isSelected || selectedCards.size < maxCards;

                  return (
                    <button
                      key={card.id}
                      onClick={() => toggleCard(card.id)}
                      disabled={!canSelect}
                      className={`relative overflow-hidden rounded-xl border-2 p-2 text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : canSelect
                            ? 'border-gray-200 hover:border-emerald-300'
                            : 'cursor-not-allowed border-gray-100 opacity-50'
                      }`}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}

                      {/* Card image */}
                      <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={text.english}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-2xl">
                            📷
                          </div>
                        )}
                      </div>

                      {/* Card text */}
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {text.vietnamese || '—'}
                      </p>
                      <p className="truncate text-xs text-gray-500">{text.english}</p>
                    </button>
                  );
                })}
              </div>

              {/* Load more */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selectedCards.size === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Library className="h-4 w-4" />
            Import {selectedCards.size} Card{selectedCards.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
