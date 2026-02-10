'use client';

import { useState } from 'react';
import { ImagePlus, Trash2, Plus, Loader2 } from 'lucide-react';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import type { LessonPage, VocabCard } from '@/lib/studio/types';
import { generateId } from '@/lib/studio/types';
import { GRID_LAYOUTS, getGridColsClass } from '@/lib/studio/grid-layouts';
import type { GridLayoutPreset } from '@/lib/studio/grid-layouts';
import { GridLayoutSelector } from '../shared/GridLayoutSelector';
import { ImageSourcePicker } from '../../ImageSourcePicker';

interface VocabSectionEditorProps {
  vocabulary: LessonPage['vocabulary'];
  stylePrompt: string;
  onUpdate: (vocabulary: LessonPage['vocabulary']) => void;
}

export function VocabSectionEditor({
  vocabulary,
  stylePrompt,
  onUpdate,
}: VocabSectionEditorProps) {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [loadingCardIndex, setLoadingCardIndex] = useState<number | null>(null);
  const { translate } = useVocabAutoComplete();

  // Initialize vocabulary if needed
  const currentVocab = vocabulary || {
    sectionTitle: 'Key Words',
    layout: '2x3' as GridLayoutPreset,
    cards: [],
  };

  const layoutConfig = GRID_LAYOUTS[currentVocab.layout];
  const maxCards = layoutConfig.maxCards;

  const handleLayoutChange = (layout: GridLayoutPreset) => {
    const newMaxCards = GRID_LAYOUTS[layout].maxCards;
    let newCards = [...currentVocab.cards];
    if (newCards.length > newMaxCards) {
      newCards = newCards.slice(0, newMaxCards);
    }
    onUpdate({ ...currentVocab, layout, cards: newCards });
  };

  const handleCardChange = (index: number, field: keyof VocabCard, value: string | boolean) => {
    const newCards = [...currentVocab.cards];
    newCards[index] = { ...newCards[index], [field]: value };
    onUpdate({ ...currentVocab, cards: newCards });
  };

  const handleAddCard = () => {
    if (currentVocab.cards.length >= maxCards) return;
    const newCard: VocabCard = {
      id: generateId(),
      vietnamese: '',
      english: '',
      showQRCode: false,
    };
    onUpdate({ ...currentVocab, cards: [...currentVocab.cards, newCard] });
  };

  const handleRemoveCard = (index: number) => {
    const newCards = currentVocab.cards.filter((_, i) => i !== index);
    onUpdate({ ...currentVocab, cards: newCards });
  };

  const handleImageSelect = (imageUrl: string) => {
    if (activeCardIndex !== null) {
      handleCardChange(activeCardIndex, 'image', imageUrl);
      setActiveCardIndex(null);
    }
  };

  const handleBlur = async (index: number, field: 'vietnamese' | 'english', value: string) => {
    if (!value.trim()) return;

    const card = currentVocab.cards[index];
    const needsEnglish = field === 'vietnamese' && !card.english?.trim();
    const needsVietnamese = field === 'english' && !card.vietnamese?.trim();

    if (!needsEnglish && !needsVietnamese) return;

    setLoadingCardIndex(index);
    const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
    const result = await translate(value, direction);

    if (result) {
      const newCards = [...currentVocab.cards];
      newCards[index] = {
        ...newCards[index],
        ...(needsVietnamese && { vietnamese: result.vietnamese }),
        ...(needsEnglish && { english: result.english }),
        ...(!newCards[index].pronunciation && { pronunciation: result.pronunciation }),
      };
      onUpdate({ ...currentVocab, cards: newCards });
    }
    setLoadingCardIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Section Title
        </label>
        <input
          type="text"
          value={currentVocab.sectionTitle || ''}
          onChange={(e) => onUpdate({ ...currentVocab, sectionTitle: e.target.value })}
          placeholder="e.g., Key Words"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Grid Layout Selector */}
      <GridLayoutSelector value={currentVocab.layout} onChange={handleLayoutChange} />

      {/* Cards Grid */}
      <div className={`grid gap-3 ${getGridColsClass(layoutConfig.cols)}`}>
        {currentVocab.cards.map((card, index) => (
          <div key={card.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            {/* Card Image */}
            <div
              onClick={() => setActiveCardIndex(index)}
              className="relative mb-2 flex h-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-emerald-500"
            >
              {card.image ? (
                <img src={card.image} alt="" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Vietnamese */}
            <div className="relative mb-1">
              <input
                type="text"
                value={card.vietnamese}
                onChange={(e) => handleCardChange(index, 'vietnamese', e.target.value)}
                onBlur={(e) => handleBlur(index, 'vietnamese', e.target.value)}
                placeholder="Vietnamese"
                className={`w-full rounded border px-2 py-1 text-sm font-medium ${
                  loadingCardIndex === index ? 'animate-pulse bg-emerald-50' : ''
                }`}
              />
              {loadingCardIndex === index && (
                <Loader2 className="absolute right-2 top-1.5 h-3 w-3 animate-spin text-emerald-500" />
              )}
            </div>

            {/* English */}
            <input
              type="text"
              value={card.english}
              onChange={(e) => handleCardChange(index, 'english', e.target.value)}
              onBlur={(e) => handleBlur(index, 'english', e.target.value)}
              placeholder="English"
              className="mb-1 w-full rounded border px-2 py-1 text-xs text-gray-600"
            />

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleRemoveCard(index)}
              className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Card */}
      {currentVocab.cards.length < maxCards && (
        <button
          type="button"
          onClick={handleAddCard}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Card ({currentVocab.cards.length}/{maxCards})
        </button>
      )}

      {/* Image Picker Modal */}
      {activeCardIndex !== null && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion={
            currentVocab.cards[activeCardIndex]?.english ||
            currentVocab.cards[activeCardIndex]?.vietnamese ||
            'vocabulary item'
          }
          imageContext="vocab"
          onSelect={handleImageSelect}
          onClose={() => setActiveCardIndex(null)}
        />
      )}
    </div>
  );
}
