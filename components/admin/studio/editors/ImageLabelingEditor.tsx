'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ImagePlus,
  Trash2,
  MousePointerClick,
  Loader2,
  GripVertical,
  Settings,
  Gamepad2,
  ExternalLink,
  Rocket,
  CheckCircle,
  Link2,
  Search,
  X,
} from 'lucide-react';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import { slugify } from '@/lib/utils';
import type { ImageLabelingPage, ImageLabel, GameMode } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { ImageSourcePicker } from '../ImageSourcePicker';

// Simple card type for search results
interface SearchCard {
  id: string;
  slug: string;
  vietnamese: string;
  english: string;
}

// Inline Card Picker Component
function InlineCardPicker({
  currentCardId,
  currentCardName,
  onSelect,
  onClear,
}: {
  currentCardId?: string;
  currentCardName?: string;
  onSelect: (cardId: string, cardName: string) => void;
  onClear: () => void;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCard[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search for cards when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, page: '0' });
        const response = await fetch(`/api/studio/search-cards?${params}`);
        if (response.ok) {
          const data = await response.json();
          // Transform cards to our simple format
          const cards: SearchCard[] = (data.cards || []).map(
            (card: { id: string; slug: string; card_terms: Array<{ lang: string; text: string }> }) => {
              const viTerm = card.card_terms.find((t) => t.lang === 'vi');
              const enTerm = card.card_terms.find((t) => t.lang === 'en');
              return {
                id: card.id,
                slug: card.slug,
                vietnamese: viTerm?.text || card.slug,
                english: enTerm?.text || '',
              };
            }
          );
          setResults(cards.slice(0, 5)); // Limit to 5 results
        }
      } catch (error) {
        console.error('Card search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when searching starts
  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  // If card is already linked, show the linked card
  if (currentCardId && currentCardName) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-2 py-1.5">
        <Link2 className="h-3.5 w-3.5 text-blue-500" />
        <span className="flex-1 truncate text-xs text-blue-700">{currentCardName}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="rounded p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
          title="Remove link"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // If searching, show search input and results
  if (isSearching) {
    return (
      <div className="relative mt-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flashcards..."
            className="w-full rounded border border-gray-300 py-1.5 pl-7 pr-8 text-xs focus:border-blue-500 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gray-400" />
          )}
          {!loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSearching(false);
                setQuery('');
                setResults([]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((card) => (
              <button
                key={card.id}
                onClick={(e) => {
                  e.stopPropagation();
                  const displayName = `${card.vietnamese} (${card.english})`;
                  onSelect(card.id, displayName);
                  setIsSearching(false);
                  setQuery('');
                  setResults([]);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-blue-50"
              >
                <span className="font-medium text-gray-800">{card.vietnamese}</span>
                <span className="text-gray-500">({card.english})</span>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-center text-xs text-gray-500 shadow-lg">
            No flashcards found
          </div>
        )}
      </div>
    );
  }

  // Default: show "Link to Flashcard" button
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsSearching(true);
      }}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-gray-300 py-1.5 text-xs text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
    >
      <Link2 className="h-3.5 w-3.5" />
      Link to Flashcard
    </button>
  );
}

interface ImageLabelingEditorProps {
  page: ImageLabelingPage;
  stylePrompt: string;
  onUpdate: (page: ImageLabelingPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function ImageLabelingEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: ImageLabelingEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);
  const [loadingLabelId, setLoadingLabelId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { translate } = useVocabAutoComplete();

  // Publish to interactive label set
  const handlePublishToInteractive = async () => {
    if (!page.backgroundImage || page.labels.length === 0) return;

    setIsPublishing(true);
    try {
      // Create the label set
      const labelSetResponse = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title || 'Untitled Label Set',
          slug: slugify(page.title || 'untitled'),
          image_url: page.backgroundImage,
          difficulty: page.difficulty || 'medium',
          is_published: true,
        }),
      });

      if (!labelSetResponse.ok) {
        const error = await labelSetResponse.json();
        throw new Error(error.error || 'Failed to create label set');
      }

      const labelSet = await labelSetResponse.json();

      // Add labels to the set
      const labelsResponse = await fetch(`/api/labels/${labelSet.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labels: page.labels.map((label, index) => ({
            x: label.x,
            y: label.y,
            vietnamese: label.vietnamese,
            english: label.english,
            pronunciation: label.pronunciation,
            card_id: label.card_id || null, // Link to flashcard for "Learn More"
            sort_order: index,
          })),
        }),
      });

      if (!labelsResponse.ok) {
        const error = await labelsResponse.json();
        throw new Error(error.error || 'Failed to add labels');
      }

      setPublishedSlug(labelSet.slug);
    } catch (error) {
      console.error('Publish error:', error);
      alert(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle click on image to add new label
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!page.backgroundImage || draggingLabelId) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newLabel: ImageLabel = {
      id: generateId(),
      x,
      y,
      vietnamese: '',
      english: '',
    };

    onUpdate({ ...page, labels: [...page.labels, newLabel] });
    setSelectedLabelId(newLabel.id);
  };

  // Handle drag to reposition label
  const handleLabelDragStart = (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    setDraggingLabelId(labelId);
    setSelectedLabelId(labelId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = imageContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      onUpdate({
        ...page,
        labels: page.labels.map((l) => (l.id === labelId ? { ...l, x, y } : l)),
      });
    };

    const handleMouseUp = () => {
      setDraggingLabelId(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Update label text
  const handleLabelChange = (id: string, field: keyof ImageLabel, value: string) => {
    onUpdate({
      ...page,
      labels: page.labels.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    });
  };

  // Auto-translate on blur
  const handleAutoTranslate = async (id: string, field: 'vietnamese' | 'english', value: string) => {
    const label = page.labels.find((l) => l.id === id);
    if (!label || !value.trim()) return;

    const otherField = field === 'vietnamese' ? 'english' : 'vietnamese';
    if (label[otherField]) return;

    setLoadingLabelId(id);
    const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
    const result = await translate(value, direction);

    if (result) {
      onUpdate({
        ...page,
        labels: page.labels.map((l) =>
          l.id === id
            ? {
                ...l,
                vietnamese: result.vietnamese,
                english: result.english,
                pronunciation: result.pronunciation,
              }
            : l
        ),
      });
    }
    setLoadingLabelId(null);
  };

  // Delete label
  const handleDeleteLabel = (id: string) => {
    onUpdate({ ...page, labels: page.labels.filter((l) => l.id !== id) });
    if (selectedLabelId === id) setSelectedLabelId(null);
  };

  // Set or clear linked card for a label
  const handleLabelCardLink = (id: string, cardId: string | undefined, cardName: string | undefined) => {
    onUpdate({
      ...page,
      labels: page.labels.map((l) =>
        l.id === id ? { ...l, card_id: cardId, cardName: cardName } : l
      ),
    });
  };

  // Toggle game mode
  const handleGameModeToggle = (mode: GameMode) => {
    const current = page.gameModes || [];
    const updated = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode];
    onUpdate({ ...page, gameModes: updated });
  };

  const GAME_MODE_LABELS: Record<GameMode, { label: string; emoji: string }> = {
    'tap-identify': { label: 'Tap to Identify', emoji: '👆' },
    'speed-challenge': { label: 'Speed Challenge', emoji: '⚡' },
    'memory-explorer': { label: 'Memory Explorer', emoji: '🧠' },
  };

  return (
    <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MousePointerClick className="h-5 w-5 text-emerald-600" />
          Image Labeling Editor
        </h2>
        <div className="flex items-center gap-2">
          {/* Publish to Interactive button */}
          {publishedSlug ? (
            <a
              href={`/label/${publishedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-200"
            >
              <CheckCircle className="h-4 w-4" />
              View Interactive
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <button
              onClick={handlePublishToInteractive}
              disabled={isPublishing || !page.backgroundImage || page.labels.length === 0}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isPublishing || !page.backgroundImage || page.labels.length === 0
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={
                !page.backgroundImage
                  ? 'Add an image first'
                  : page.labels.length === 0
                    ? 'Add some labels first'
                    : 'Publish as interactive quiz'
              }
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {isPublishing ? 'Publishing...' : 'Publish Interactive'}
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              showSettings
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Page Title</label>
        <input
          type="text"
          value={page.title}
          onChange={(e) => onUpdate({ ...page, title: e.target.value })}
          placeholder="e.g., Kitchen Vocabulary"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Settings Panel (collapsible) */}
      {showSettings && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Gamepad2 className="h-4 w-4" />
            Interactive Game Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={page.interactiveEnabled}
                onChange={(e) => onUpdate({ ...page, interactiveEnabled: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span className="text-sm text-gray-700">Enable interactive mode (QR → online games)</span>
            </label>

            {page.interactiveEnabled && (
              <>
                <div className="ml-6 space-y-2">
                  <p className="text-xs font-medium text-gray-600">Game Modes:</p>
                  {(Object.keys(GAME_MODE_LABELS) as GameMode[]).map((mode) => (
                    <label key={mode} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={page.gameModes?.includes(mode)}
                        onChange={() => handleGameModeToggle(mode)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-sm text-gray-700">
                        {GAME_MODE_LABELS[mode].emoji} {GAME_MODE_LABELS[mode].label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="ml-6">
                  <label className="text-xs font-medium text-gray-600">Difficulty:</label>
                  <select
                    value={page.difficulty}
                    onChange={(e) =>
                      onUpdate({ ...page, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
                    }
                    className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </>
            )}

            <div className="border-t border-emerald-200 pt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={page.showLegend}
                  onChange={(e) => onUpdate({ ...page, showLegend: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-sm text-gray-700">Show legend on printed worksheet</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Image Canvas (2/3 width) */}
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Background Image
            {page.backgroundImage && (
              <span className="ml-2 text-xs text-gray-400">(Click to add labels)</span>
            )}
          </label>

          <div
            ref={imageContainerRef}
            className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-dashed bg-gray-50 ${
              page.backgroundImage
                ? 'cursor-crosshair border-gray-300'
                : 'cursor-pointer border-gray-300 hover:border-emerald-500'
            }`}
            onClick={page.backgroundImage ? handleImageClick : () => setShowImagePicker(true)}
          >
            {page.backgroundImage ? (
              <>
                <img
                  src={page.backgroundImage}
                  alt="Background"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
                {/* Render label markers */}
                {page.labels.map((label, index) => (
                  <div
                    key={label.id}
                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg transition-all ${
                      selectedLabelId === label.id
                        ? 'scale-125 border-emerald-400 bg-emerald-500 text-white ring-4 ring-emerald-500/30'
                        : 'border-white bg-blue-500 text-white hover:scale-110'
                    } ${draggingLabelId === label.id ? 'scale-125' : ''}`}
                    style={{ left: `${label.x}%`, top: `${label.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLabelId(label.id);
                    }}
                    onMouseDown={(e) => handleLabelDragStart(e, label.id)}
                  >
                    {index + 1}
                  </div>
                ))}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Click to add background image</p>
                <p className="mt-1 text-xs text-gray-400">Then click on image to place labels</p>
              </div>
            )}
          </div>

          {/* Image Actions */}
          {page.backgroundImage && (
            <button
              onClick={() => setShowImagePicker(true)}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              Change image
            </button>
          )}
        </div>

        {/* Labels Sidebar (1/3 width) */}
        <div className="lg:col-span-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Labels ({page.labels.length})
          </label>

          <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {page.labels.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {page.backgroundImage
                  ? 'Click on the image to add labels'
                  : 'Add an image first'}
              </p>
            ) : (
              page.labels.map((label, index) => (
                <div
                  key={label.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedLabelId === label.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLabelId(label.id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-300" />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLabel(label.id);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Vietnamese input */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={label.vietnamese}
                      onChange={(e) => handleLabelChange(label.id, 'vietnamese', e.target.value)}
                      onBlur={(e) => handleAutoTranslate(label.id, 'vietnamese', e.target.value)}
                      placeholder="Vietnamese"
                      className={`w-full rounded border px-3 py-1.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none ${
                        loadingLabelId === label.id ? 'animate-pulse bg-emerald-50' : 'border-gray-300'
                      }`}
                    />
                    {loadingLabelId === label.id && (
                      <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
                    )}
                  </div>

                  {/* English input */}
                  <input
                    type="text"
                    value={label.english}
                    onChange={(e) => handleLabelChange(label.id, 'english', e.target.value)}
                    onBlur={(e) => handleAutoTranslate(label.id, 'english', e.target.value)}
                    placeholder="English"
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 focus:border-emerald-500 focus:outline-none"
                  />

                  {/* Card link picker */}
                  <InlineCardPicker
                    currentCardId={label.card_id}
                    currentCardName={label.cardName}
                    onSelect={(cardId, cardName) => handleLabelCardLink(label.id, cardId, cardName)}
                    onClear={() => handleLabelCardLink(label.id, undefined, undefined)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Quick tip */}
          {page.labels.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              💡 Tip: Drag markers on the image to reposition
            </p>
          )}
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion="scene for vocabulary labeling exercise"
          imageContext="scene"
          onSelect={(url) => {
            onUpdate({ ...page, backgroundImage: url });
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
          onStylePromptSave={onStylePromptSave}
        />
      )}
    </div>
  );
}
