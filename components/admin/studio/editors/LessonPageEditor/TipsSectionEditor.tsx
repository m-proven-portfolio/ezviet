'use client';

import { Plus, Trash2, Lightbulb } from 'lucide-react';
import type { LessonPage } from '@/lib/studio/types';

interface TipsSectionEditorProps {
  culturalTips: LessonPage['culturalTips'];
  onUpdate: (culturalTips: LessonPage['culturalTips']) => void;
}

export function TipsSectionEditor({
  culturalTips,
  onUpdate,
}: TipsSectionEditorProps) {
  // Initialize if needed
  const currentTips = culturalTips || {
    sectionTitle: 'Cultural Tips',
    tips: [],
    footerTip: '',
  };

  const handleAddTip = () => {
    onUpdate({
      ...currentTips,
      tips: [...currentTips.tips, ''],
    });
  };

  const handleTipChange = (index: number, value: string) => {
    const newTips = [...currentTips.tips];
    newTips[index] = value;
    onUpdate({ ...currentTips, tips: newTips });
  };

  const handleRemoveTip = (index: number) => {
    const newTips = currentTips.tips.filter((_, i) => i !== index);
    onUpdate({ ...currentTips, tips: newTips });
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
          value={currentTips.sectionTitle || ''}
          onChange={(e) => onUpdate({ ...currentTips, sectionTitle: e.target.value })}
          placeholder="e.g., Cultural Tips"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Tips List */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tips
        </label>
        <div className="space-y-2">
          {currentTips.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2 text-amber-500">•</span>
              <input
                type="text"
                value={tip}
                onChange={(e) => handleTipChange(index, e.target.value)}
                placeholder={`Tip ${index + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveTip(index)}
                className="mt-1 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddTip}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-amber-500 hover:text-amber-600"
        >
          <Plus className="h-4 w-4" />
          Add Tip
        </button>
      </div>

      {/* Footer Tip */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Footer Tip (optional)
        </label>
        <input
          type="text"
          value={currentTips.footerTip || ''}
          onChange={(e) => onUpdate({ ...currentTips, footerTip: e.target.value })}
          placeholder="A final tip or summary"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          This will appear at the bottom with a lightbulb icon
        </p>
      </div>
    </div>
  );
}
