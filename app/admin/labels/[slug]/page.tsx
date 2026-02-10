'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  ImagePlus,
  GripVertical,
  MousePointerClick,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { MiniPlayButton } from '@/components/ui/MiniPlayButton';
import { useVocabAutoComplete } from '@/hooks/useVocabAutoComplete';
import { slugify } from '@/lib/utils';
import { ImageSourcePicker } from '@/components/admin/studio/ImageSourcePicker';
import { IntensityConfigEditor } from '@/components/admin/IntensityConfigEditor';
import type { IntensityConfig } from '@/lib/intensity';

type VietAccent = 'south' | 'north';

interface Label {
  id: string;
  x: number;
  y: number;
  vietnamese: string;
  english: string;
  pronunciation: string | null;
  audio_url: string | null;
  sort_order: number;
  accent: VietAccent | null;
  tts_hint: string | null;
  romanization: string | null;
}

interface LabelSet {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  image_url: string;
  /** @deprecated Use intensity_config instead */
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  category_id: string | null;
  default_accent: VietAccent;
  labels: Label[];
  /** Learning intensity configuration (new system) */
  intensity_config: IntensityConfig | null;
}

// Generate unique ID for new labels
function generateId() {
  return `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function LabelSetEditorPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const isNew = slug === 'new';

  const [labelSet, setLabelSet] = useState<LabelSet | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);
  const [loadingLabelId, setLoadingLabelId] = useState<string | null>(null);
  const [generatingTTSLabelId, setGeneratingTTSLabelId] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { translate } = useVocabAutoComplete();

  // Initialize new label set
  useEffect(() => {
    if (isNew) {
      setLabelSet({
        id: '',
        slug: '',
        title: '',
        description: null,
        instructions: null,
        image_url: '',
        difficulty: 'medium',
        is_published: false,
        category_id: null,
        default_accent: 'south',
        labels: [],
        intensity_config: null, // Will use default 'standard' preset
      });
    }
  }, [isNew]);

  // Fetch existing label set
  useEffect(() => {
    if (isNew) return;

    async function fetchLabelSet() {
      try {
        const res = await fetch(`/api/labels/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setLabelSet(data);
      } catch (error) {
        console.error('Failed to fetch label set:', error);
        router.push('/admin/labels');
      } finally {
        setLoading(false);
      }
    }

    fetchLabelSet();
  }, [slug, isNew, router]);

  // Handle save
  async function handleSave() {
    if (!labelSet) return;

    setSaving(true);
    try {
      if (isNew) {
        // Create new label set
        const createRes = await fetch('/api/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: labelSet.title,
            slug: slugify(labelSet.title),
            description: labelSet.description,
            instructions: labelSet.instructions,
            image_url: labelSet.image_url,
            difficulty: labelSet.difficulty,
            is_published: labelSet.is_published,
            default_accent: labelSet.default_accent,
            intensity_config: labelSet.intensity_config,
          }),
        });

        if (!createRes.ok) throw new Error('Failed to create');
        const created = await createRes.json();

        // Add labels
        if (labelSet.labels.length > 0) {
          const labelsRes = await fetch(`/api/labels/${created.slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              labels: labelSet.labels.map((l, i) => ({
                x: l.x,
                y: l.y,
                vietnamese: l.vietnamese,
                english: l.english,
                pronunciation: l.pronunciation,
                accent: l.accent,
                tts_hint: l.tts_hint,
                romanization: l.romanization,
                sort_order: i,
              })),
            }),
          });

          if (!labelsRes.ok) throw new Error('Failed to add labels');
        }

        router.push(`/admin/labels/${created.slug}`);
      } else {
        // Update existing
        const res = await fetch(`/api/labels/${slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: labelSet.title,
            description: labelSet.description,
            instructions: labelSet.instructions,
            image_url: labelSet.image_url,
            difficulty: labelSet.difficulty,
            is_published: labelSet.is_published,
            default_accent: labelSet.default_accent,
            intensity_config: labelSet.intensity_config,
            labels: labelSet.labels.map((l, i) => ({
              x: l.x,
              y: l.y,
              vietnamese: l.vietnamese,
              english: l.english,
              pronunciation: l.pronunciation,
              accent: l.accent,
              tts_hint: l.tts_hint,
              romanization: l.romanization,
              sort_order: i,
            })),
          }),
        });

        if (!res.ok) throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save label set');
    } finally {
      setSaving(false);
    }
  }

  // Handle click on image to add new label
  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!labelSet?.image_url || draggingLabelId) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newLabel: Label = {
      id: generateId(),
      x,
      y,
      vietnamese: '',
      english: '',
      pronunciation: null,
      audio_url: null,
      sort_order: labelSet.labels.length,
      accent: null,
      tts_hint: null,
      romanization: null,
    };

    setLabelSet({ ...labelSet, labels: [...labelSet.labels, newLabel] });
    setSelectedLabelId(newLabel.id);
  }

  // Handle drag to reposition label
  function handleLabelDragStart(e: React.MouseEvent, labelId: string) {
    e.stopPropagation();
    setDraggingLabelId(labelId);
    setSelectedLabelId(labelId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = imageContainerRef.current;
      if (!container || !labelSet) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100)
      );
      const y = Math.max(
        0,
        Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100)
      );

      setLabelSet({
        ...labelSet,
        labels: labelSet.labels.map((l) => (l.id === labelId ? { ...l, x, y } : l)),
      });
    };

    const handleMouseUp = () => {
      setDraggingLabelId(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // Update label text
  function handleLabelChange(id: string, field: keyof Label, value: string) {
    if (!labelSet) return;
    setLabelSet({
      ...labelSet,
      labels: labelSet.labels.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    });
  }

  // Auto-translate on blur
  async function handleAutoTranslate(
    id: string,
    field: 'vietnamese' | 'english',
    value: string
  ) {
    if (!labelSet) return;
    const label = labelSet.labels.find((l) => l.id === id);
    if (!label || !value.trim()) return;

    const otherField = field === 'vietnamese' ? 'english' : 'vietnamese';
    if (label[otherField]) return;

    setLoadingLabelId(id);
    const direction = field === 'vietnamese' ? 'vi-to-en' : 'en-to-vi';
    const result = await translate(value, direction);

    if (result) {
      setLabelSet({
        ...labelSet,
        labels: labelSet.labels.map((l) =>
          l.id === id
            ? {
                ...l,
                vietnamese: result.vietnamese,
                english: result.english,
                pronunciation: result.pronunciation || null,
              }
            : l
        ),
      });
    }
    setLoadingLabelId(null);
  }

  // Delete label
  function handleDeleteLabel(id: string) {
    if (!labelSet) return;
    setLabelSet({ ...labelSet, labels: labelSet.labels.filter((l) => l.id !== id) });
    if (selectedLabelId === id) setSelectedLabelId(null);
  }

  // Generate TTS for a label
  async function handleGenerateTTS(label: Label) {
    if (!label.vietnamese || generatingTTSLabelId) return;

    setGeneratingTTSLabelId(label.id);
    try {
      // Determine accent: label override > set default > 'south'
      const accent = label.accent || labelSet?.default_accent || 'south';

      const res = await fetch('/api/labels/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelId: label.id,
          text: label.tts_hint || label.vietnamese,
          accent,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      const data = await res.json();

      // Update label with new audio URL
      if (labelSet) {
        setLabelSet({
          ...labelSet,
          labels: labelSet.labels.map((l) =>
            l.id === label.id ? { ...l, audio_url: data.audio_url } : l
          ),
        });
      }
    } catch (error) {
      console.error('TTS generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate audio');
    } finally {
      setGeneratingTTSLabelId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-jade-600" />
      </div>
    );
  }

  if (!labelSet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/labels"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {isNew ? 'New Picture Quiz' : 'Edit Picture Quiz'}
              </h1>
              {!isNew && (
                <p className="text-sm text-slate-500">/{labelSet.slug}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isNew && (
              <a
                href={`/label/${labelSet.slug}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Preview
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !labelSet.title || !labelSet.image_url}
              className="flex items-center gap-2 rounded-lg bg-jade-600 px-4 py-2 font-medium text-white transition-colors hover:bg-jade-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Settings */}
          <div className="space-y-4 lg:col-span-1">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Title *
              </label>
              <input
                type="text"
                value={labelSet.title}
                onChange={(e) => setLabelSet({ ...labelSet, title: e.target.value })}
                placeholder="e.g., Kitchen Vocabulary"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-jade-500 focus:outline-none focus:ring-1 focus:ring-jade-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={labelSet.description || ''}
                onChange={(e) =>
                  setLabelSet({ ...labelSet, description: e.target.value || null })
                }
                placeholder="Optional description..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-jade-500 focus:outline-none focus:ring-1 focus:ring-jade-500"
              />
            </div>

            {/* Learning Intensity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Learning Intensity
              </label>
              <IntensityConfigEditor
                value={labelSet.intensity_config}
                onChange={(intensity_config) =>
                  setLabelSet({ ...labelSet, intensity_config })
                }
              />
            </div>

            {/* Default Accent for TTS */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Default Accent
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setLabelSet({ ...labelSet, default_accent: 'south' })
                  }
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    labelSet.default_accent === 'south'
                      ? 'bg-jade-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Southern
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLabelSet({ ...labelSet, default_accent: 'north' })
                  }
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    labelSet.default_accent === 'north'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Northern
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Used for TTS audio generation
              </p>
            </div>

            {/* Published toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                {labelSet.is_published ? (
                  <Eye className="h-5 w-5 text-jade-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {labelSet.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <button
                onClick={() =>
                  setLabelSet({ ...labelSet, is_published: !labelSet.is_published })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  labelSet.is_published ? 'bg-jade-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    labelSet.is_published ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Image Picker */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Quiz Image *
              </label>
              {labelSet.image_url ? (
                <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="relative aspect-video overflow-hidden rounded">
                    <Image
                      src={labelSet.image_url}
                      alt="Quiz image"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-slate-500 transition-colors hover:border-jade-500 hover:bg-jade-50 hover:text-jade-600"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Upload className="h-5 w-5" />
                    <ImageIcon className="h-5 w-5" />
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">Choose an Image</span>
                  <span className="mt-1 text-xs text-slate-400">
                    Upload, select from library, or generate with AI
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Image + Labels */}
          <div className="lg:col-span-2">
            {/* Image Canvas */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <MousePointerClick className="h-4 w-4" />
                Click on image to add labels ({labelSet.labels.length} labels)
              </label>
              <div
                ref={imageContainerRef}
                className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed bg-slate-100 ${
                  labelSet.image_url
                    ? 'cursor-crosshair border-slate-300'
                    : 'border-slate-300'
                }`}
                onClick={labelSet.image_url ? handleImageClick : undefined}
              >
                {labelSet.image_url ? (
                  <>
                    <Image
                      src={labelSet.image_url}
                      alt={labelSet.title || 'Label set image'}
                      fill
                      className="object-contain"
                      draggable={false}
                    />
                    {/* Render label markers */}
                    {labelSet.labels.map((label, index) => (
                      <div
                        key={label.id}
                        className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg transition-all ${
                          selectedLabelId === label.id
                            ? 'scale-125 border-jade-400 bg-jade-500 text-white ring-4 ring-jade-500/30'
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
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <ImagePlus className="h-12 w-12" />
                    <p className="mt-2 text-sm">Choose an image to start</p>
                  </div>
                )}
              </div>
            </div>

            {/* Words List */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="font-medium text-slate-700">Words</h3>
              </div>
              <div className="max-h-[350px] overflow-y-auto p-2">
                {labelSet.labels.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    {labelSet.image_url
                      ? 'Click on the image to add labels'
                      : 'Add an image first'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {labelSet.labels.map((label, index) => (
                      <div
                        key={label.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          selectedLabelId === label.id
                            ? 'border-jade-500 bg-jade-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedLabelId(label.id)}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-slate-300" />
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Audio preview */}
                            <MiniPlayButton
                              audioUrl={label.audio_url}
                              text={label.vietnamese || undefined}
                              accent={(label.accent || labelSet.default_accent) as 'north' | 'south'}
                              size="xs"
                              disabled={!label.vietnamese && !label.audio_url}
                            />
                            {/* Generate TTS button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateTTS(label);
                              }}
                              disabled={!label.vietnamese || generatingTTSLabelId === label.id}
                              className={`rounded p-1 transition-colors ${
                                generatingTTSLabelId === label.id
                                  ? 'text-jade-500'
                                  : label.audio_url
                                    ? 'text-jade-400 hover:bg-jade-50 hover:text-jade-600'
                                    : 'text-slate-400 hover:bg-jade-50 hover:text-jade-500'
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                              title={label.audio_url ? 'Regenerate audio' : 'Generate audio'}
                            >
                              {generatingTTSLabelId === label.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLabel(label.id);
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Vietnamese input */}
                        <div className="relative mb-2">
                          <input
                            type="text"
                            value={label.vietnamese}
                            onChange={(e) =>
                              handleLabelChange(label.id, 'vietnamese', e.target.value)
                            }
                            onBlur={(e) =>
                              handleAutoTranslate(label.id, 'vietnamese', e.target.value)
                            }
                            placeholder="Vietnamese"
                            className={`w-full rounded border px-3 py-1.5 text-sm font-semibold focus:border-jade-500 focus:outline-none ${
                              loadingLabelId === label.id
                                ? 'animate-pulse bg-jade-50'
                                : 'border-slate-300'
                            }`}
                          />
                          {loadingLabelId === label.id && (
                            <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jade-500" />
                          )}
                        </div>

                        {/* English input */}
                        <input
                          type="text"
                          value={label.english}
                          onChange={(e) =>
                            handleLabelChange(label.id, 'english', e.target.value)
                          }
                          onBlur={(e) =>
                            handleAutoTranslate(label.id, 'english', e.target.value)
                          }
                          placeholder="English"
                          className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 focus:border-jade-500 focus:outline-none"
                        />

                        {/* Accent & Romanization (collapsed by default) */}
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {/* Per-label accent override */}
                          <select
                            value={label.accent || ''}
                            onChange={(e) =>
                              handleLabelChange(
                                label.id,
                                'accent',
                                (e.target.value as VietAccent) || null
                              )
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-jade-500 focus:outline-none"
                          >
                            <option value="">Default accent</option>
                            <option value="south">Southern</option>
                            <option value="north">Northern</option>
                          </select>

                          {/* Romanization input */}
                          <input
                            type="text"
                            value={label.romanization || ''}
                            onChange={(e) =>
                              handleLabelChange(label.id, 'romanization', e.target.value)
                            }
                            placeholder="/fuh (falling)/"
                            className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-jade-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Source Picker Modal */}
      {showImagePicker && (
        <ImageSourcePicker
          stylePrompt="Educational illustration for Vietnamese language learning"
          contentPromptSuggestion={labelSet.title || 'vocabulary scene'}
          imageContext="scene"
          onSelect={(imageUrl) => {
            setLabelSet({ ...labelSet, image_url: imageUrl });
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
