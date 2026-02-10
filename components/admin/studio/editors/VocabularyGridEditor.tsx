'use client';

import { useState } from 'react';
import { ImagePlus, Trash2, QrCode, Plus, Loader2, Library, Wand2 } from 'lucide-react';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import type { VocabularyGridPage, VocabCard } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { GRID_LAYOUTS, getGridColsClass } from '@/lib/studio/grid-layouts';
import type { GridLayoutPreset } from '@/lib/studio/grid-layouts';
import { ImageSourcePicker } from '../ImageSourcePicker';
import { CardLibraryModal, type ImportedCard } from './CardLibraryModal';
import { GridLayoutSelector } from './shared/GridLayoutSelector';

interface VocabularyGridEditorProps {
  page: VocabularyGridPage;
  stylePrompt: string;
  onUpdate: (page: VocabularyGridPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function VocabularyGridEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: VocabularyGridEditorProps) {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [loadingCardIndex, setLoadingCardIndex] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const { translate } = useVocabAutoComplete();

  const handleTitleChange = (title: string) => {
    onUpdate({ ...page, title });
  };

  // Get current layout config (default to 2x3 for backward compatibility)
  const currentLayout = page.layout || '2x3';
  const layoutConfig = GRID_LAYOUTS[currentLayout];
  const maxCards = layoutConfig.maxCards;

  const handleLayoutChange = (layout: GridLayoutPreset) => {
    // When changing layout, adjust card count
    const newMaxCards = GRID_LAYOUTS[layout].maxCards;
    let newCards = [...page.cards];

    // If new layout has fewer slots, trim cards
    if (newCards.length > newMaxCards) {
      newCards = newCards.slice(0, newMaxCards);
    }

    onUpdate({ ...page, layout, cards: newCards });
  };

  const handleCardChange = (index: number, field: keyof VocabCard, value: string | boolean) => {
    const newCards = [...page.cards];
    newCards[index] = { ...newCards[index], [field]: value };
    onUpdate({ ...page, cards: newCards });
  };

  const handleImageSelect = (imageUrl: string) => {
    if (activeCardIndex !== null) {
      handleCardChange(activeCardIndex, 'image', imageUrl);
      setActiveCardIndex(null);
    }
  };

  const handleAddCard = () => {
    if (page.cards.length >= maxCards) return;
    const newCard: VocabCard = {
      id: generateId(),
      vietnamese: '',
      english: '',
      showQRCode: true,
    };
    onUpdate({ ...page, cards: [...page.cards, newCard] });
  };

  const handleRemoveCard = (index: number) => {
    const newCards = page.cards.filter((_, i) => i !== index);
    onUpdate({ ...page, cards: newCards });
  };

  const handleImportCards = (imported: ImportedCard[]) => {
    // Convert ImportedCard to VocabCard format
    const newCards: VocabCard[] = imported.map((card) => ({
      id: generateId(),
      vietnamese: card.vietnamese,
      english: card.english,
      pronunciation: card.pronunciation,
      image: card.imageUrl || undefined, // Convert null to undefined
      audioSlug: card.audioSlug,
      showQRCode: true,
    }));

    // Merge with existing cards, respecting layout card limit
    const merged = [...page.cards, ...newCards].slice(0, maxCards);
    onUpdate({ ...page, cards: merged });
    setShowLibrary(false);
  };

  // Batch generate images for cards that have text but no image
  const handleBatchGenerateImages = async () => {
    // Find cards that need images (have text but no image)
    const cardsNeedingImages = page.cards
      .map((card, index) => ({ card, index }))
      .filter(
        ({ card }) =>
          !card.image && (card.english?.trim() || card.vietnamese?.trim())
      );

    if (cardsNeedingImages.length === 0) {
      alert('All cards either have images or need text first.');
      return;
    }

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: cardsNeedingImages.length });

    const updatedCards = [...page.cards];
    let successCount = 0;

    // Generate images in parallel (max 3 at a time to avoid rate limits)
    const batchSize = 3;
    for (let i = 0; i < cardsNeedingImages.length; i += batchSize) {
      const batch = cardsNeedingImages.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async ({ card, index }) => {
          const subject = card.english || card.vietnamese;
          const prompt = `${stylePrompt}, ${subject}, centered, simple background, educational illustration`;

          const response = await fetch('/api/studio/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate image');
          }

          const data = await response.json();
          return { index, url: data.url };
        })
      );

      // Update cards with successful results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          updatedCards[result.value.index] = {
            ...updatedCards[result.value.index],
            image: result.value.url,
          };
          successCount++;
        }
        setBatchProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      }

      // Update the page after each batch
      onUpdate({ ...page, cards: updatedCards });
    }

    setBatchGenerating(false);
    setBatchProgress({ current: 0, total: 0 });

    if (successCount < cardsNeedingImages.length) {
      alert(
        `Generated ${successCount}/${cardsNeedingImages.length} images. Some failed.`
      );
    }
  };

  const handleBlur = async (
    index: number,
    field: 'vietnamese' | 'english',
    value: string
  ) => {
    const card = cardSlots[index];
    if (!card || !value.trim()) return;

    // Determine what needs to be filled
    const needsEnglish = field === 'vietnamese' && !card.english?.trim();
    const needsVietnamese = field === 'english' && !card.vietnamese?.trim();

    if (!needsEnglish && !needsVietnamese) return;

    setLoadingCardIndex(index);

    const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
    const result = await translate(value, direction);

    if (result) {
      const newCards = [...page.cards];
      // Ensure the card exists in the actual cards array (not just slots)
      if (index < newCards.length) {
        newCards[index] = {
          ...newCards[index],
          ...(needsVietnamese && { vietnamese: result.vietnamese }),
          ...(needsEnglish && { english: result.english }),
          ...(!newCards[index].pronunciation && { pronunciation: result.pronunciation }),
        };
      } else {
        // Card is a placeholder slot, add it to the array
        newCards.push({
          id: card.id,
          vietnamese: field === 'vietnamese' ? value : result.vietnamese,
          english: field === 'english' ? value : result.english,
          pronunciation: result.pronunciation,
          showQRCode: true,
        });
      }
      onUpdate({ ...page, cards: newCards });
    }

    setLoadingCardIndex(null);
  };

  // Ensure we have card slots up to the layout max
  const cardSlots = [...page.cards];
  while (cardSlots.length < maxCards) {
    cardSlots.push({
      id: generateId(),
      vietnamese: '',
      english: '',
      showQRCode: true,
    });
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Vocabulary Grid Editor
      </h2>

      {/* Page Title */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Page Title
        </label>
        <input
          type="text"
          value={page.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Fruits (Trái Cây)"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Grid Layout Selector */}
      <GridLayoutSelector
        value={currentLayout}
        onChange={handleLayoutChange}
      />

      {/* Card Grid */}
      <div className={`grid gap-4 ${getGridColsClass(layoutConfig.cols)}`}>
        {cardSlots.slice(0, maxCards).map((card, index) => (
          <div
            key={card.id || index}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            {/* Card Image */}
            <div
              className="relative mb-3 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-emerald-500"
              onClick={() => setActiveCardIndex(index)}
            >
              {card.image ? (
                <>
                  <img
                    src={card.image}
                    alt={card.vietnamese || 'Card image'}
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <span className="rounded bg-white px-2 py-1 text-xs font-medium">
                      Change
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <ImagePlus className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-xs text-gray-400">Add image</p>
                </div>
              )}
            </div>

            {/* Vietnamese */}
            <div className="relative mb-2">
              <input
                type="text"
                value={card.vietnamese}
                onChange={(e) => handleCardChange(index, 'vietnamese', e.target.value)}
                onBlur={(e) => handleBlur(index, 'vietnamese', e.target.value)}
                placeholder="Vietnamese"
                className={`w-full rounded border px-3 py-1.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none ${
                  loadingCardIndex === index && !card.vietnamese
                    ? 'animate-pulse border-emerald-300 bg-emerald-50'
                    : 'border-gray-300'
                }`}
              />
              {loadingCardIndex === index && !card.vietnamese && (
                <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
              )}
            </div>

            {/* English */}
            <div className="relative mb-2">
              <input
                type="text"
                value={card.english}
                onChange={(e) => handleCardChange(index, 'english', e.target.value)}
                onBlur={(e) => handleBlur(index, 'english', e.target.value)}
                placeholder="English"
                className={`w-full rounded border px-3 py-1.5 text-sm text-gray-600 focus:border-emerald-500 focus:outline-none ${
                  loadingCardIndex === index && !card.english
                    ? 'animate-pulse border-emerald-300 bg-emerald-50'
                    : 'border-gray-300'
                }`}
              />
              {loadingCardIndex === index && !card.english && (
                <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
              )}
            </div>

            {/* Pronunciation (optional) */}
            <div className="relative mb-2">
              <input
                type="text"
                value={card.pronunciation || ''}
                onChange={(e) => handleCardChange(index, 'pronunciation', e.target.value)}
                placeholder="Pronunciation (optional)"
                className={`w-full rounded border px-3 py-1.5 text-xs text-gray-500 focus:border-emerald-500 focus:outline-none ${
                  loadingCardIndex === index && !card.pronunciation
                    ? 'animate-pulse border-emerald-300 bg-emerald-50'
                    : 'border-gray-300'
                }`}
              />
              {loadingCardIndex === index && !card.pronunciation && (
                <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-emerald-500" />
              )}
            </div>

            {/* QR Code Toggle & Delete */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={card.showQRCode}
                  onChange={(e) => handleCardChange(index, 'showQRCode', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <QrCode className="h-3.5 w-3.5" />
                QR Code
              </label>
              {index >= page.cards.length ? null : (
                <button
                  onClick={() => handleRemoveCard(index)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-3">
        {/* Add/Import row */}
        {page.cards.length < maxCards && (
          <div className="flex gap-3">
            <button
              onClick={handleAddCard}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Add Card ({page.cards.length}/{maxCards})
            </button>
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
            >
              <Library className="h-4 w-4" />
              Import from Library
            </button>
          </div>
        )}

        {/* Batch Generate Images button */}
        {page.cards.some(
          (card) => !card.image && (card.english?.trim() || card.vietnamese?.trim())
        ) && (
          <button
            onClick={handleBatchGenerateImages}
            disabled={batchGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-medium text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-70"
          >
            {batchGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {batchProgress.current}/{batchProgress.total}...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate All Missing Images
              </>
            )}
          </button>
        )}
      </div>

      {/* Preview Section */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Preview</h3>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h4 className="mb-4 text-center text-lg font-bold text-gray-900">
            {page.title || 'Vocabulary'}
          </h4>
          <div className={`grid gap-3 ${getGridColsClass(layoutConfig.cols)}`}>
            {cardSlots.slice(0, maxCards).map((card, index) => (
              <div
                key={card.id || index}
                className="flex flex-col items-center rounded-lg border bg-white p-2 text-center"
              >
                <div className="mb-2 h-16 w-16 rounded bg-gray-100">
                  {card.image && (
                    <img
                      src={card.image}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {card.vietnamese || '—'}
                </p>
                <p className="text-xs text-gray-500">{card.english || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      {activeCardIndex !== null && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion={
            cardSlots[activeCardIndex]?.english ||
            cardSlots[activeCardIndex]?.vietnamese ||
            'vocabulary item'
          }
          imageContext="vocab"
          onSelect={handleImageSelect}
          onClose={() => setActiveCardIndex(null)}
          onStylePromptSave={onStylePromptSave}
        />
      )}

      {/* Card Library Modal */}
      {showLibrary && (
        <CardLibraryModal
          onImport={handleImportCards}
          onClose={() => setShowLibrary(false)}
          maxCards={maxCards - page.cards.length}
        />
      )}
    </div>
  );
}