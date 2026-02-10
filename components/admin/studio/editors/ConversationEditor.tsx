'use client';

import { useState } from 'react';
import {
  ImagePlus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  User,
  Store,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type {
  ConversationPage,
  DialogueLine,
  ConversationLayoutStyle,
  ConversationPanel,
} from '@/lib/studio/types';
import { generateId, migrateDialoguesToPanels } from '@/lib/studio/types';
import { ImageSourcePicker } from '../ImageSourcePicker';
import { ConversationLayoutSelector } from './ConversationLayoutSelector';
import { GenerateConversationModal } from './GenerateConversationModal';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';

interface ConversationEditorProps {
  page: ConversationPage;
  stylePrompt: string;
  onUpdate: (page: ConversationPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function ConversationEditor({
  page,
  stylePrompt,
  onUpdate,
  onStylePromptSave,
}: ConversationEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [dialogueImageIndex, setDialogueImageIndex] = useState<number | null>(null);
  const [panelImageIndex, setPanelImageIndex] = useState<number | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [loadingLineId, setLoadingLineId] = useState<string | null>(null);
  const { translate } = useVocabAutoComplete();

  // Determine which features are needed based on layout
  const needsSceneImage = page.layoutStyle === 'chat-bubbles' || page.layoutStyle === 'illustrated-scene' || page.layoutStyle === 'picture-book';
  const needsPanels = page.layoutStyle === 'comic-strip' || page.layoutStyle === 'side-by-side';

  // Get panels for panel-based layouts (auto-migrate from dialogues if needed)
  const panels = needsPanels ? migrateDialoguesToPanels(page) : [];

  const handleLayoutChange = (style: ConversationLayoutStyle) => {
    onUpdate({ ...page, layoutStyle: style });
  };

  const handleSceneImageSelect = (imageUrl: string) => {
    onUpdate({ ...page, sceneImage: imageUrl });
    setShowImagePicker(false);
  };

  const handleDialogueImageSelect = (imageUrl: string) => {
    if (dialogueImageIndex !== null) {
      const newDialogues = [...page.dialogues];
      newDialogues[dialogueImageIndex] = {
        ...newDialogues[dialogueImageIndex],
        image: imageUrl,
      };
      onUpdate({ ...page, dialogues: newDialogues });
    }
    setDialogueImageIndex(null);
  };

  // Panel management handlers (for comic-strip/side-by-side layouts)
  const handlePanelImageSelect = (imageUrl: string) => {
    if (panelImageIndex !== null) {
      const newPanels = [...panels];
      newPanels[panelImageIndex] = { ...newPanels[panelImageIndex], image: imageUrl };
      onUpdate({ ...page, panels: newPanels });
    }
    setPanelImageIndex(null);
  };

  const handleAddPanel = () => {
    const newPanel: ConversationPanel = {
      id: generateId(),
      lines: [],
    };
    onUpdate({ ...page, panels: [...panels, newPanel] });
  };

  const handleRemovePanel = (panelIndex: number) => {
    const newPanels = panels.filter((_, i) => i !== panelIndex);
    onUpdate({ ...page, panels: newPanels });
  };

  const handleMovePanel = (panelIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? panelIndex - 1 : panelIndex + 1;
    if (newIndex < 0 || newIndex >= panels.length) return;
    const newPanels = [...panels];
    [newPanels[panelIndex], newPanels[newIndex]] = [newPanels[newIndex], newPanels[panelIndex]];
    onUpdate({ ...page, panels: newPanels });
  };

  const handleAddLineToPanel = (panelIndex: number) => {
    const panel = panels[panelIndex];
    const lastLine = panel.lines[panel.lines.length - 1];
    const nextSpeaker = lastLine?.speaker === 'buyer' ? 'seller' : 'buyer';

    const newLine: DialogueLine = {
      id: generateId(),
      speaker: nextSpeaker,
      vietnamese: '',
      english: '',
      position: nextSpeaker === 'buyer' ? 'left' : 'right',
    };

    const newPanels = [...panels];
    newPanels[panelIndex] = {
      ...panel,
      lines: [...panel.lines, newLine],
    };
    onUpdate({ ...page, panels: newPanels });
  };

  const handleUpdatePanelLine = (
    panelIndex: number,
    lineIndex: number,
    field: keyof DialogueLine,
    value: string
  ) => {
    const newPanels = [...panels];
    const newLines = [...newPanels[panelIndex].lines];
    newLines[lineIndex] = { ...newLines[lineIndex], [field]: value };
    newPanels[panelIndex] = { ...newPanels[panelIndex], lines: newLines };
    onUpdate({ ...page, panels: newPanels });
  };

  const handleRemovePanelLine = (panelIndex: number, lineIndex: number) => {
    const newPanels = [...panels];
    const newLines = newPanels[panelIndex].lines.filter((_, i) => i !== lineIndex);
    newPanels[panelIndex] = { ...newPanels[panelIndex], lines: newLines };
    onUpdate({ ...page, panels: newPanels });
  };

  const handleMovePanelLine = (panelIndex: number, lineIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? lineIndex - 1 : lineIndex + 1;
    const panel = panels[panelIndex];
    if (newIndex < 0 || newIndex >= panel.lines.length) return;

    const newPanels = [...panels];
    const newLines = [...panel.lines];
    [newLines[lineIndex], newLines[newIndex]] = [newLines[newIndex], newLines[lineIndex]];
    newPanels[panelIndex] = { ...newPanels[panelIndex], lines: newLines };
    onUpdate({ ...page, panels: newPanels });
  };

  const handleAutoTranslatePanelLine = async (
    panelIndex: number,
    lineIndex: number,
    lineId: string,
    field: 'vietnamese' | 'english',
    value: string
  ) => {
    const line = panels[panelIndex].lines[lineIndex];
    const otherField = field === 'vietnamese' ? 'english' : 'vietnamese';
    if (line[otherField]) return;

    setLoadingLineId(lineId);
    try {
      const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
      const result = await translate(value, direction);
      if (result) {
        const newPanels = [...panels];
        const newLines = [...newPanels[panelIndex].lines];
        newLines[lineIndex] = {
          ...newLines[lineIndex],
          vietnamese: result.vietnamese,
          english: result.english,
        };
        newPanels[panelIndex] = { ...newPanels[panelIndex], lines: newLines };
        onUpdate({ ...page, panels: newPanels });
      }
    } finally {
      setLoadingLineId(null);
    }
  };

  const handleAddDialogue = () => {
    // Smart alternation: buyer → seller → buyer → seller
    const lastLine = page.dialogues[page.dialogues.length - 1];
    const nextSpeaker = lastLine?.speaker === 'buyer' ? 'seller' : 'buyer';

    const newLine: DialogueLine = {
      id: generateId(),
      speaker: nextSpeaker,
      vietnamese: '',
      english: '',
      position: nextSpeaker === 'buyer' ? 'left' : 'right',
    };
    onUpdate({ ...page, dialogues: [...page.dialogues, newLine] });
  };

  const handleUpdateDialogue = (
    index: number,
    field: keyof DialogueLine,
    value: string
  ) => {
    const newDialogues = [...page.dialogues];
    newDialogues[index] = { ...newDialogues[index], [field]: value };
    onUpdate({ ...page, dialogues: newDialogues });
  };

  const handleRemoveDialogue = (index: number) => {
    const newDialogues = page.dialogues.filter((_, i) => i !== index);
    onUpdate({ ...page, dialogues: newDialogues });
  };

  const handleMoveDialogue = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= page.dialogues.length) return;
    const newDialogues = [...page.dialogues];
    [newDialogues[index], newDialogues[newIndex]] = [
      newDialogues[newIndex],
      newDialogues[index],
    ];
    onUpdate({ ...page, dialogues: newDialogues });
  };

  const handleGenerateConversation = (
    dialogues: DialogueLine[],
    title: string,
    layoutStyle: ConversationLayoutStyle
  ) => {
    onUpdate({
      ...page,
      title: title || page.title,
      layoutStyle,
      dialogues,
    });
    setShowGenerateModal(false);
  };

  // Auto-translate handler for dialogue lines with loading indicator
  const handleAutoTranslate = async (
    index: number,
    lineId: string,
    field: 'vietnamese' | 'english',
    value: string
  ) => {
    const line = page.dialogues[index];
    // Only translate if the other field is empty
    const otherField = field === 'vietnamese' ? 'english' : 'vietnamese';
    if (line[otherField]) return;

    setLoadingLineId(lineId);
    try {
      const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
      const result = await translate(value, direction);
      if (result) {
        const newDialogues = [...page.dialogues];
        newDialogues[index] = {
          ...newDialogues[index],
          vietnamese: result.vietnamese,
          english: result.english,
        };
        onUpdate({ ...page, dialogues: newDialogues });
      }
    } finally {
      setLoadingLineId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Conversation Scene Editor
        </h2>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-purple-500/20 transition-all hover:shadow-lg hover:shadow-purple-500/30"
        >
          <Sparkles className="h-4 w-4" />
          Magic Generate
        </button>
      </div>

      {/* Layout Style Selector - THE KEY FEATURE */}
      <ConversationLayoutSelector
        value={page.layoutStyle || 'comic-strip'}
        onChange={handleLayoutChange}
      />

      {/* Scene Title */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Scene Title (optional)
        </label>
        <input
          type="text"
          value={page.title || ''}
          onChange={(e) => onUpdate({ ...page, title: e.target.value })}
          placeholder="e.g., At the Fruit Market"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Scene Image - Only for chat-bubbles and illustrated-scene layouts */}
      {needsSceneImage && (
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Scene Illustration
          </label>
          <div
            className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-emerald-500"
            onClick={() => setShowImagePicker(true)}
          >
            {page.sceneImage ? (
              <>
                <img
                  src={page.sceneImage}
                  alt="Scene"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium">
                    Change Image
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Add scene illustration</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Tip Banner - shows when no dialogues/panels */}
      {(needsPanels ? panels.length === 0 : page.dialogues.length === 0) && (
        <div className="mb-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
            <div className="text-sm">
              <p className="font-medium text-purple-900">AI-Powered Conversations</p>
              <p className="mt-1 text-purple-700">
                Type Vietnamese → English auto-fills! Lines alternate buyer ↔ seller automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Panel-based editing for comic-strip/side-by-side */}
      {needsPanels ? (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Conversation Panels
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Each panel has one image + multiple dialogue lines)
            </span>
          </label>
          <div className="space-y-4">
            {panels.map((panel, panelIndex) => (
              <PanelEditor
                key={panel.id}
                panel={panel}
                panelIndex={panelIndex}
                totalPanels={panels.length}
                loadingLineId={loadingLineId}
                onImageClick={() => setPanelImageIndex(panelIndex)}
                onMovePanel={(dir) => handleMovePanel(panelIndex, dir)}
                onRemovePanel={() => handleRemovePanel(panelIndex)}
                onAddLine={() => handleAddLineToPanel(panelIndex)}
                onUpdateLine={(lineIndex, field, value) =>
                  handleUpdatePanelLine(panelIndex, lineIndex, field, value)
                }
                onRemoveLine={(lineIndex) => handleRemovePanelLine(panelIndex, lineIndex)}
                onMoveLine={(lineIndex, dir) => handleMovePanelLine(panelIndex, lineIndex, dir)}
                onAutoTranslate={(lineIndex, lineId, field, value) =>
                  handleAutoTranslatePanelLine(panelIndex, lineIndex, lineId, field, value)
                }
              />
            ))}
          </div>

          <button
            onClick={handleAddPanel}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add Panel
          </button>
        </div>
      ) : (
        /* Flat dialogue editing for chat-bubbles/illustrated-scene/picture-book */
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Dialogue Lines
          </label>
          <div className="space-y-3">
            {page.dialogues.map((line, index) => (
              <DialogueLineEditor
                key={line.id}
                line={line}
                index={index}
                total={page.dialogues.length}
                showImagePicker={false}
                onUpdate={(field, value) => handleUpdateDialogue(index, field, value)}
                onRemove={() => handleRemoveDialogue(index)}
                onMove={(dir) => handleMoveDialogue(index, dir)}
                onImageClick={() => setDialogueImageIndex(index)}
                onAutoTranslate={(field, value) => handleAutoTranslate(index, line.id, field, value)}
                isLoading={loadingLineId === line.id}
              />
            ))}
          </div>

          <button
            onClick={handleAddDialogue}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add Dialogue Line
          </button>
        </div>
      )}

      {/* Show Translations Toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={page.showTranslations}
          onChange={(e) => onUpdate({ ...page, showTranslations: e.target.checked })}
          className="rounded text-emerald-600 focus:ring-emerald-500"
        />
        Show English translations in print
      </label>

      {/* Image Picker Modal - Scene Image */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion="buyer and seller at Vietnamese fruit market, conversation scene"
          imageContext="scene"
          onSelect={handleSceneImageSelect}
          onClose={() => setShowImagePicker(false)}
          onStylePromptSave={onStylePromptSave}
        />
      )}

      {/* Image Picker Modal - Dialogue Image (flat mode) */}
      {dialogueImageIndex !== null && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion={`Vietnamese conversation scene: ${page.dialogues[dialogueImageIndex]?.vietnamese || 'dialogue exchange'}`}
          imageContext="vocab"
          onSelect={handleDialogueImageSelect}
          onClose={() => setDialogueImageIndex(null)}
          onStylePromptSave={onStylePromptSave}
        />
      )}

      {/* Image Picker Modal - Panel Image (panel mode) */}
      {panelImageIndex !== null && (
        <ImageSourcePicker
          stylePrompt={stylePrompt}
          contentPromptSuggestion={`Vietnamese conversation scene: ${panels[panelImageIndex]?.lines[0]?.vietnamese || 'dialogue exchange'}`}
          imageContext="vocab"
          onSelect={handlePanelImageSelect}
          onClose={() => setPanelImageIndex(null)}
          onStylePromptSave={onStylePromptSave}
        />
      )}

      {/* Magic Generate Modal */}
      {showGenerateModal && (
        <GenerateConversationModal
          onGenerate={handleGenerateConversation}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}

// Extracted DialogueLine editor component
interface DialogueLineEditorProps {
  line: DialogueLine;
  index: number;
  total: number;
  showImagePicker: boolean;
  isLoading: boolean;
  onUpdate: (field: keyof DialogueLine, value: string) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onImageClick: () => void;
  onAutoTranslate: (field: 'vietnamese' | 'english', value: string) => void;
}

function DialogueLineEditor({
  line,
  index,
  total,
  showImagePicker,
  isLoading,
  onUpdate,
  onRemove,
  onMove,
  onImageClick,
  onAutoTranslate,
}: DialogueLineEditorProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        line.speaker === 'buyer'
          ? 'border-blue-200 bg-blue-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={line.speaker}
            onChange={(e) => onUpdate('speaker', e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="buyer">Buyer (Customer)</option>
            <option value="seller">Seller (Vendor)</option>
            <option value="custom">Custom</option>
          </select>
          {line.speaker === 'buyer' ? (
            <User className="h-4 w-4 text-blue-500" />
          ) : (
            <Store className="h-4 w-4 text-amber-500" />
          )}
          <select
            value={line.position}
            onChange={(e) => onUpdate('position', e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="rounded p-1 text-gray-400 hover:bg-white disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="rounded p-1 text-gray-400 hover:bg-white disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Per-dialogue image picker */}
      {showImagePicker && (
        <div
          className="mb-3 flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/50 transition-colors hover:border-emerald-500"
          onClick={onImageClick}
        >
          {line.image ? (
            <img
              src={line.image}
              alt=""
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Add illustration</span>
            </div>
          )}
        </div>
      )}

      <input
        type="text"
        value={line.vietnamese}
        onChange={(e) => onUpdate('vietnamese', e.target.value)}
        onBlur={(e) => e.target.value && onAutoTranslate('vietnamese', e.target.value)}
        placeholder="Vietnamese text..."
        className="mb-2 w-full rounded border border-gray-300 px-3 py-2 font-medium focus:border-emerald-500 focus:outline-none"
      />
      <div className="relative">
        <input
          type="text"
          value={line.english}
          onChange={(e) => onUpdate('english', e.target.value)}
          onBlur={(e) => e.target.value && onAutoTranslate('english', e.target.value)}
          placeholder={isLoading ? 'AI translating...' : 'English (auto-fills from Vietnamese)'}
          disabled={isLoading}
          className={`w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:border-emerald-500 focus:outline-none ${
            isLoading ? 'animate-pulse bg-purple-50' : ''
          }`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-purple-500" />
        )}
      </div>
    </div>
  );
}

// Panel editor component for comic-strip/side-by-side layouts
interface PanelEditorProps {
  panel: ConversationPanel;
  panelIndex: number;
  totalPanels: number;
  loadingLineId: string | null;
  onImageClick: () => void;
  onMovePanel: (direction: 'up' | 'down') => void;
  onRemovePanel: () => void;
  onAddLine: () => void;
  onUpdateLine: (lineIndex: number, field: keyof DialogueLine, value: string) => void;
  onRemoveLine: (lineIndex: number) => void;
  onMoveLine: (lineIndex: number, direction: 'up' | 'down') => void;
  onAutoTranslate: (lineIndex: number, lineId: string, field: 'vietnamese' | 'english', value: string) => void;
}

function PanelEditor({
  panel,
  panelIndex,
  totalPanels,
  loadingLineId,
  onImageClick,
  onMovePanel,
  onRemovePanel,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onMoveLine,
  onAutoTranslate,
}: PanelEditorProps) {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
      {/* Panel header with controls */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Panel {panelIndex + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMovePanel('up')}
            disabled={panelIndex === 0}
            className="rounded p-1 text-gray-400 hover:bg-white disabled:opacity-30"
            title="Move panel up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMovePanel('down')}
            disabled={panelIndex === totalPanels - 1}
            className="rounded p-1 text-gray-400 hover:bg-white disabled:opacity-30"
            title="Move panel down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onRemovePanel}
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
            title="Remove panel"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel image */}
      <div
        className="mb-4 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-emerald-500"
        onClick={onImageClick}
      >
        {panel.image ? (
          <img
            src={panel.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center text-gray-400">
            <ImagePlus className="mx-auto h-8 w-8" />
            <span className="mt-1 block text-xs">Panel illustration</span>
          </div>
        )}
      </div>

      {/* Dialogue lines in this panel */}
      <div className="space-y-2">
        {panel.lines.map((line, lineIndex) => (
          <div
            key={line.id}
            className={`rounded-lg border p-3 ${
              line.speaker === 'buyer'
                ? 'border-blue-200 bg-blue-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={line.speaker}
                  onChange={(e) => onUpdateLine(lineIndex, 'speaker', e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="custom">Custom</option>
                </select>
                {line.speaker === 'buyer' ? (
                  <User className="h-3 w-3 text-blue-500" />
                ) : (
                  <Store className="h-3 w-3 text-amber-500" />
                )}
                <select
                  value={line.position}
                  onChange={(e) => onUpdateLine(lineIndex, 'position', e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onMoveLine(lineIndex, 'up')}
                  disabled={lineIndex === 0}
                  className="rounded p-0.5 text-gray-400 hover:bg-white disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onMoveLine(lineIndex, 'down')}
                  disabled={lineIndex === panel.lines.length - 1}
                  className="rounded p-0.5 text-gray-400 hover:bg-white disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onRemoveLine(lineIndex)}
                  className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={line.vietnamese}
              onChange={(e) => onUpdateLine(lineIndex, 'vietnamese', e.target.value)}
              onBlur={(e) => e.target.value && onAutoTranslate(lineIndex, line.id, 'vietnamese', e.target.value)}
              placeholder="Vietnamese..."
              className="mb-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
            />
            <div className="relative">
              <input
                type="text"
                value={line.english}
                onChange={(e) => onUpdateLine(lineIndex, 'english', e.target.value)}
                onBlur={(e) => e.target.value && onAutoTranslate(lineIndex, line.id, 'english', e.target.value)}
                placeholder={loadingLineId === line.id ? 'AI translating...' : 'English...'}
                disabled={loadingLineId === line.id}
                className={`w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-600 focus:border-emerald-500 focus:outline-none ${
                  loadingLineId === line.id ? 'animate-pulse bg-purple-50' : ''
                }`}
              />
              {loadingLineId === line.id && (
                <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-purple-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add line button */}
      <button
        onClick={onAddLine}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
      >
        <Plus className="h-3 w-3" />
        Add Line
      </button>
    </div>
  );
}