'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify, getStorageUrl } from '@/lib/utils';
import type { Category } from '@/lib/supabase/types';
import { useAIGeneration, type FieldDirtyState, type TranslationDirection } from '@/hooks/useAIGeneration';
import AudioUploader from '@/components/AudioUploader';
import { getIconForSelect } from '@/components/CategoryIcon';
import { NextQueuedCard } from '@/components/admin/NextQueuedCard';

// Pending song type (before card is created)
interface PendingSong {
  id: string; // temporary ID
  storage_path: string;
  publicUrl: string;
  file_size: number;
  mime_type: string;
  duration_seconds: number | null;
  title: string;
  artist: string;
  album: string;
  year: string;
  cover_image_path: string | null;
  level: string;
  purpose: string;
  learning_goal: string;
  lyrics_plain: string;
}

type AudioSource = 'auto' | 'admin' | 'community' | null;
type Region = 'south' | 'north' | null;

// Confetti celebration (dynamic import to avoid SSR/crash on page load)
function triggerConfetti() {
  if (typeof window === 'undefined') return;
  import('canvas-confetti').then((mod) => {
    const confetti = mod.default;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#fbbf24'],
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#059669', '#34d399'],
      });
    }, 150);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#059669', '#34d399'],
      });
    }, 300);
  }).catch(() => {});
}

// localStorage keys for admin preferences
const STORAGE_KEYS = {
  lastCategory: 'ezviet_admin_last_category',
  postSaveAction: 'ezviet_admin_post_save_action',
  sourceLanguage: 'ezviet_admin_source_language',
};

interface CardFormData {
  category_id: string;
  image_path: string;
  imagePreviewUrl: string;
  difficulty: number;
  // Vietnamese South
  vietnamese_south: string;
  vietnamese_south_romanization: string;
  vietnamese_south_audio: string | null;
  vietnamese_south_audio_source: AudioSource;
  vietnamese_south_region: Region;
  // Vietnamese North
  vietnamese_north: string;
  vietnamese_north_romanization: string;
  vietnamese_north_audio: string | null;
  vietnamese_north_audio_source: AudioSource;
  vietnamese_north_region: Region;
  // English & SEO
  english: string;
  meta_description: string;
  // AI tracking
  generated_by_ai: boolean;
  prompt_version: string | null;
  // Card display options
  show_north: boolean;
}

// Initial form state for easy reset
const initialFormState: CardFormData = {
  category_id: '',
  image_path: '',
  imagePreviewUrl: '',
  difficulty: 1,
  vietnamese_south: '',
  vietnamese_south_romanization: '',
  vietnamese_south_audio: null,
  vietnamese_south_audio_source: null,
  vietnamese_south_region: 'south',
  vietnamese_north: '',
  vietnamese_north_romanization: '',
  vietnamese_north_audio: null,
  vietnamese_north_audio_source: null,
  vietnamese_north_region: 'north',
  english: '',
  meta_description: '',
  generated_by_ai: false,
  prompt_version: null,
  show_north: false,
};

// Field label component with AI/edited badges
function FieldLabel({
  label,
  isDirty,
  isAIGenerated,
  required = false,
}: {
  label: string;
  isDirty: boolean;
  isAIGenerated: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <label className="block text-sm text-gray-700">
        {label}{required && ' *'}
      </label>
      {isAIGenerated && !isDirty && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
          AI
        </span>
      )}
      {isDirty && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
          edited
        </span>
      )}
    </div>
  );
}

export default function NewCardPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [postSaveAction, setPostSaveAction] = useState<'view' | 'create-another'>('view');

  const [form, setForm] = useState<CardFormData>(initialFormState);
  const [showNorthSection, setShowNorthSection] = useState(false);
  const [pendingSongs, setPendingSongs] = useState<PendingSong[]>([]);
  const [isUploadingSong, setIsUploadingSong] = useState(false);
  const [showSongForm, setShowSongForm] = useState(false);
  const [editingSong, setEditingSong] = useState<PendingSong | null>(null);
  const songFileInputRef = useRef<HTMLInputElement>(null);

  // Source language toggle (sticky preference)
  const [sourceLanguage, setSourceLanguage] = useState<TranslationDirection>('en-to-vi');

  // AI Generation hook
  const {
    generate,
    isGenerating,
    error: aiError,
    dirtyFields,
    markFieldDirty,
    shouldUpdateField,
    resetDirtyFields,
    resetAll,
  } = useAIGeneration({
    direction: sourceLanguage,
    debounceMs: 600,
    onGenerated: (fields) => {
      if (sourceLanguage === 'en-to-vi') {
        // English → Vietnamese: update Vietnamese fields
        setForm(prev => ({
          ...prev,
          ...(shouldUpdateField('vietnamese_south') && { vietnamese_south: fields.vietnamese_south }),
          ...(shouldUpdateField('vietnamese_south_romanization') && { vietnamese_south_romanization: fields.vietnamese_south_phonetic }),
          ...(shouldUpdateField('vietnamese_north') && fields.vietnamese_north && { vietnamese_north: fields.vietnamese_north }),
          ...(shouldUpdateField('vietnamese_north_romanization') && fields.vietnamese_north_phonetic && { vietnamese_north_romanization: fields.vietnamese_north_phonetic }),
          ...(shouldUpdateField('meta_description') && { meta_description: fields.meta_description }),
          generated_by_ai: true,
          prompt_version: fields.prompt_version,
        }));
      } else {
        // Vietnamese → English: update English and romanization fields
        setForm(prev => ({
          ...prev,
          ...(shouldUpdateField('english') && fields.english && { english: fields.english }),
          ...(shouldUpdateField('vietnamese_south_romanization') && { vietnamese_south_romanization: fields.vietnamese_south_phonetic }),
          ...(shouldUpdateField('vietnamese_north') && fields.vietnamese_north && { vietnamese_north: fields.vietnamese_north }),
          ...(shouldUpdateField('vietnamese_north_romanization') && fields.vietnamese_north_phonetic && { vietnamese_north_romanization: fields.vietnamese_north_phonetic }),
          ...(shouldUpdateField('meta_description') && { meta_description: fields.meta_description }),
          generated_by_ai: true,
          prompt_version: fields.prompt_version,
        }));
      }
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load saved preferences from localStorage
  useEffect(() => {
    // Restore post-save action preference
    const savedAction = localStorage.getItem(STORAGE_KEYS.postSaveAction);
    if (savedAction === 'view' || savedAction === 'create-another') {
      setPostSaveAction(savedAction);
    }
    // Restore source language preference
    const savedSourceLang = localStorage.getItem(STORAGE_KEYS.sourceLanguage);
    if (savedSourceLang === 'en-to-vi' || savedSourceLang === 'vi-to-en') {
      setSourceLanguage(savedSourceLang);
    }
  }, []);

  // Restore category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !form.category_id) {
      const savedCategory = localStorage.getItem(STORAGE_KEYS.lastCategory);
      if (savedCategory && categories.find(c => c.id === savedCategory)) {
        setForm(prev => ({ ...prev, category_id: savedCategory }));
      }
    }
  }, [categories, form.category_id]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }

  // Handle source language toggle
  function handleSourceLanguageChange(newDirection: TranslationDirection) {
    if (newDirection === sourceLanguage) return;

    setSourceLanguage(newDirection);
    localStorage.setItem(STORAGE_KEYS.sourceLanguage, newDirection);

    // Reset form and AI state when switching directions
    setForm(initialFormState);
    resetAll();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'cards-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      let data: { path?: string; publicUrl?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // ignore non-JSON response
      }

      if (!res.ok) {
        const message = data?.error || res.statusText || 'Upload failed';
        throw new Error(message);
      }

      setForm(prev => ({
        ...prev,
        image_path: data.path ?? '',
        imagePreviewUrl: data.publicUrl ?? '',
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSongFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSong(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/songs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();

      // Create pending song with extracted metadata
      const newSong: PendingSong = {
        id: `pending-${Date.now()}`,
        storage_path: data.storage_path,
        publicUrl: data.publicUrl,
        file_size: data.file_size,
        mime_type: data.mime_type,
        duration_seconds: data.duration_seconds,
        title: data.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: data.artist || '',
        album: data.album || '',
        year: data.year?.toString() || '',
        cover_image_path: data.cover_image_path,
        level: '',
        purpose: '',
        learning_goal: '',
        lyrics_plain: '',
      };

      setEditingSong(newSong);
      setShowSongForm(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploadingSong(false);
      if (songFileInputRef.current) {
        songFileInputRef.current.value = '';
      }
    }
  }

  function handleSavePendingSong() {
    if (!editingSong) return;

    setPendingSongs(prev => {
      const exists = prev.find(s => s.id === editingSong.id);
      if (exists) {
        return prev.map(s => s.id === editingSong.id ? editingSong : s);
      }
      return [...prev, editingSong];
    });

    setEditingSong(null);
    setShowSongForm(false);
  }

  function handleDeletePendingSong(songId: string) {
    setPendingSongs(prev => prev.filter(s => s.id !== songId));
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Build terms array with new AI tracking fields
      const terms = [];

      // English term (required)
      if (form.english) {
        terms.push({
          lang: 'en',
          region: null,
          text: form.english,
          romanization: null,
          phonetic_helper: null,
          ipa: null,
          generated_by_ai: false,
          reviewed_by_admin: true,
          prompt_version: null,
        });
      }

      // Vietnamese South (required)
      if (form.vietnamese_south) {
        terms.push({
          lang: 'vi',
          region: 'south',
          text: form.vietnamese_south,
          romanization: form.vietnamese_south_romanization || null,
          phonetic_helper: form.vietnamese_south_romanization || null,
          ipa: null,
          audio_path: form.vietnamese_south_audio,
          audio_source: form.vietnamese_south_audio_source,
          generated_by_ai: form.generated_by_ai && !dirtyFields.vietnamese_south,
          reviewed_by_admin: true,
          prompt_version: form.prompt_version,
        });
      }

      // Vietnamese North (optional)
      if (form.vietnamese_north) {
        terms.push({
          lang: 'vi',
          region: 'north',
          text: form.vietnamese_north,
          romanization: form.vietnamese_north_romanization || null,
          phonetic_helper: form.vietnamese_north_romanization || null,
          ipa: null,
          audio_path: form.vietnamese_north_audio,
          audio_source: form.vietnamese_north_audio_source,
          generated_by_ai: form.generated_by_ai && !dirtyFields.vietnamese_north,
          reviewed_by_admin: true,
          prompt_version: form.prompt_version,
        });
      }

      // Generate slug from source language
      const slugSource = sourceLanguage === 'en-to-vi' ? form.english : form.vietnamese_south;

      const payload = {
        slug: slugify(slugSource),
        category_id: form.category_id || null,
        image_path: form.image_path,
        difficulty: form.difficulty,
        meta_description: form.meta_description || null,
        // Display option for the card
        show_north: form.show_north,
        terms,
      };

      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create card');
      }

      const card = await res.json();

      // Create songs if any
      if (pendingSongs.length > 0) {
        for (const song of pendingSongs) {
          await fetch(`/api/cards/${card.id}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storage_path: song.storage_path,
              file_size: song.file_size,
              mime_type: song.mime_type,
              duration_seconds: song.duration_seconds,
              title: song.title,
              artist: song.artist || null,
              album: song.album || null,
              year: song.year ? parseInt(song.year) : null,
              cover_image_path: song.cover_image_path,
              level: song.level ? parseInt(song.level) : null,
              purpose: song.purpose || null,
              learning_goal: song.learning_goal || null,
              lyrics_plain: song.lyrics_plain || null,
            }),
          });
        }
      }

      // Celebrate!
      triggerConfetti();

      if (postSaveAction === 'create-another') {
        // Show success message
        setSuccessMessage('Card created! Ready for another.');

        // Reset form but preserve category
        const preservedCategory = form.category_id;
        setForm({
          ...initialFormState,
          category_id: preservedCategory,
        });

        // Reset songs and AI generation state
        setPendingSongs([]);
        resetDirtyFields();

        // Clear success message after delay
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Default: redirect to card
        router.push(`/learn/${card.slug}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to create card');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid = form.image_path && form.english && form.vietnamese_south;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/cards/new" className="text-gray-600 hover:text-gray-900 text-sm">
            ← Back to Card Types
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 flex items-center gap-3">
            <span className="text-4xl">📝</span>
            Vocabulary Flashcard
          </h1>
          <p className="text-gray-600 mt-1">Add a new word or phrase for learners</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  {form.imagePreviewUrl ? (
                    <div className="relative">
                      <img
                        src={form.imagePreviewUrl}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image_path: '', imagePreviewUrl: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer text-gray-500"
                      >
                        {isUploading ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            <span className="text-4xl block mb-2">📷</span>
                            <span className="text-sm">Click to upload image</span>
                          </>
                        )}
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Source Language Toggle */}
              <div className="bg-slate-50 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Source Language
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSourceLanguageChange('en-to-vi')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      sourceLanguage === 'en-to-vi'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <span className="block text-lg mb-1">English</span>
                    <span className={`text-xs ${sourceLanguage === 'en-to-vi' ? 'text-emerald-100' : 'text-gray-400'}`}>
                      English speakers learning Vietnamese
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceLanguageChange('vi-to-en')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      sourceLanguage === 'vi-to-en'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <span className="block text-lg mb-1">Vietnamese</span>
                    <span className={`text-xs ${sourceLanguage === 'vi-to-en' ? 'text-emerald-100' : 'text-gray-400'}`}>
                      Vietnamese speakers learning English
                    </span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm(prev => ({ ...prev, category_id: value }));
                      if (value) {
                        localStorage.setItem(STORAGE_KEYS.lastCategory, value);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {getIconForSelect(cat.icon)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Next queued card suggestion */}
                <NextQueuedCard
                  categoryId={form.category_id || null}
                  onSelect={(vietnamese, english) => {
                    if (sourceLanguage === 'en-to-vi') {
                      // English-first mode: set English and trigger AI generation
                      setForm(prev => ({ ...prev, english }));
                      generate(english);
                    } else {
                      // Vietnamese-first mode: set Vietnamese and trigger AI generation
                      setForm(prev => ({ ...prev, vietnamese_south: vietnamese }));
                      generate(vietnamese);
                    }
                  }}
                />
              </div>

              {/* SOURCE INPUT - Changes based on selected source language */}
              {sourceLanguage === 'en-to-vi' ? (
                /* English → Vietnamese: Show English input first */
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    English Word *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.english}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm(prev => ({ ...prev, english: value }));
                        generate(value); // Trigger AI generation
                      }}
                      placeholder="e.g., banana"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10 text-gray-900"
                    />
                    {isGenerating && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {form.generated_by_ai && !isGenerating && (
                    <p className="text-xs text-purple-600 mt-1">
                      Vietnamese translations auto-generated. Edit any field to override.
                    </p>
                  )}
                </div>
              ) : (
                /* Vietnamese → English: Show Vietnamese input first */
                <div className="bg-emerald-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800">
                      Vietnamese (South) *
                    </h3>
                    {isGenerating && (
                      <span className="flex items-center gap-2 text-emerald-600 text-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Generating...
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Vietnamese Word *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.vietnamese_south}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm(prev => ({ ...prev, vietnamese_south: value }));
                          generate(value); // Trigger AI generation
                        }}
                        placeholder="e.g., chuối"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg text-gray-900 pr-10"
                      />
                      {isGenerating && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {form.generated_by_ai && !isGenerating && (
                      <p className="text-xs text-purple-600 mt-1">
                        English translation auto-generated. Edit any field to override.
                      </p>
                    )}
                  </div>

                  {/* Romanization - auto-generated */}
                  <div>
                    <FieldLabel
                      label="Pronunciation (romanized)"
                      isDirty={dirtyFields.vietnamese_south_romanization}
                      isAIGenerated={form.generated_by_ai}
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={form.vietnamese_south_romanization}
                        onChange={(e) => {
                          markFieldDirty('vietnamese_south_romanization');
                          setForm(prev => ({ ...prev, vietnamese_south_romanization: e.target.value }));
                        }}
                        placeholder="e.g., chwoy"
                        className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 ${
                          isGenerating && !form.vietnamese_south_romanization ? 'animate-pulse bg-emerald-100' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Audio Upload/Recording */}
                  <AudioUploader
                    audioPath={form.vietnamese_south_audio}
                    audioSource={form.vietnamese_south_audio_source}
                    region={form.vietnamese_south_region}
                    termText={form.vietnamese_south}
                    onAudioChange={(audioPath, audioSource) => {
                      setForm(prev => ({
                        ...prev,
                        vietnamese_south_audio: audioPath,
                        vietnamese_south_audio_source: audioSource,
                      }));
                    }}
                    onRegionChange={(region) => {
                      setForm(prev => ({
                        ...prev,
                        vietnamese_south_region: region,
                      }));
                    }}
                    showRegionSelector={false}
                    colorScheme="emerald"
                  />
                </div>
              )}

              {/* AI Error Warning */}
              {aiError && (
                <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>AI generation unavailable. You can enter translations manually.</span>
                </div>
              )}

              {/* URL Preview (auto-generated from source language) */}
              {(sourceLanguage === 'en-to-vi' ? form.english : form.vietnamese_south) && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <span className="text-xs text-gray-500 block mb-1">Card URL (auto-generated)</span>
                  <span className="text-emerald-600 font-medium">
                    ezviet.org/learn/<span className="text-emerald-700">
                      {slugify(sourceLanguage === 'en-to-vi' ? form.english : form.vietnamese_south)}
                    </span>
                  </span>
                </div>
              )}

              {/* AI-GENERATED FIELDS - Show based on source language */}
              {sourceLanguage === 'en-to-vi' ? (
                /* English → Vietnamese: Show Vietnamese section with AI generation */
                <div className={`bg-emerald-50 rounded-lg p-4 space-y-4 transition-all duration-300 ${
                  isGenerating ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800">
                      Vietnamese (South) *
                    </h3>
                    {isGenerating && (
                      <span className="flex items-center gap-2 text-emerald-600 text-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Generating...
                      </span>
                    )}
                  </div>

                  {/* Text - AI-generated */}
                  <div>
                    <FieldLabel
                      label="Text"
                      isDirty={dirtyFields.vietnamese_south}
                      isAIGenerated={form.generated_by_ai}
                      required
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={form.vietnamese_south}
                        onChange={(e) => {
                          markFieldDirty('vietnamese_south');
                          setForm(prev => ({ ...prev, vietnamese_south: e.target.value }));
                        }}
                        placeholder={isGenerating ? '' : 'e.g., chuối'}
                        className={`w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg text-gray-900 ${
                          isGenerating && !form.vietnamese_south ? 'animate-pulse bg-emerald-100' : ''
                        }`}
                      />
                      {isGenerating && !form.vietnamese_south && (
                        <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Romanization - AI-generated */}
                  <div>
                    <FieldLabel
                      label="Pronunciation (romanized)"
                      isDirty={dirtyFields.vietnamese_south_romanization}
                      isAIGenerated={form.generated_by_ai}
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={form.vietnamese_south_romanization}
                        onChange={(e) => {
                          markFieldDirty('vietnamese_south_romanization');
                          setForm(prev => ({ ...prev, vietnamese_south_romanization: e.target.value }));
                        }}
                        placeholder={isGenerating ? '' : 'e.g., chwoy'}
                        className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 ${
                          isGenerating && !form.vietnamese_south_romanization ? 'animate-pulse bg-emerald-100' : ''
                        }`}
                      />
                      {isGenerating && !form.vietnamese_south_romanization && (
                        <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audio Upload/Recording */}
                  <AudioUploader
                    audioPath={form.vietnamese_south_audio}
                    audioSource={form.vietnamese_south_audio_source}
                    region={form.vietnamese_south_region}
                    termText={form.vietnamese_south}
                    onAudioChange={(audioPath, audioSource) => {
                      setForm(prev => ({
                        ...prev,
                        vietnamese_south_audio: audioPath,
                        vietnamese_south_audio_source: audioSource,
                      }));
                    }}
                    onRegionChange={(region) => {
                      setForm(prev => ({
                        ...prev,
                        vietnamese_south_region: region,
                      }));
                    }}
                    showRegionSelector={false}
                    colorScheme="emerald"
                  />
                </div>
              ) : (
                /* Vietnamese → English: Show English translation with AI generation */
                <div className={`transition-all duration-300 ${
                  isGenerating ? 'ring-2 ring-emerald-400 ring-opacity-50 rounded-lg' : ''
                }`}>
                  <FieldLabel
                    label="English Translation"
                    isDirty={dirtyFields.english}
                    isAIGenerated={form.generated_by_ai}
                    required
                  />
                  <div className="relative">
                    <input
                      type="text"
                      value={form.english}
                      onChange={(e) => {
                        markFieldDirty('english');
                        setForm(prev => ({ ...prev, english: e.target.value }));
                      }}
                      placeholder={isGenerating ? '' : 'AI will generate English translation...'}
                      className={`w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 ${
                        isGenerating && !form.english ? 'animate-pulse bg-purple-50' : ''
                      }`}
                    />
                    {isGenerating && !form.english && (
                      <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vietnamese North (Optional) - Collapsible */}
              {!showNorthSection ? (
                <button
                  type="button"
                  onClick={() => setShowNorthSection(true)}
                  className="w-full py-3 px-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Northern Vietnamese (optional)
                </button>
              ) : (
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-800">
                        Vietnamese (North) - Optional
                      </h3>
                      <p className="text-xs text-blue-600">
                        Only fill if different from Southern Vietnamese
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.show_north}
                          onChange={(e) => setForm(prev => ({ ...prev, show_north: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">Show on card</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNorthSection(false);
                          setForm(prev => ({
                            ...prev,
                            vietnamese_north: '',
                            vietnamese_north_romanization: '',
                            show_north: false,
                          }));
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Remove Northern section"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Text */}
                  <div>
                    <FieldLabel
                      label="Text"
                      isDirty={dirtyFields.vietnamese_north}
                      isAIGenerated={form.generated_by_ai && !!form.vietnamese_north}
                    />
                    <input
                      type="text"
                      value={form.vietnamese_north}
                      onChange={(e) => {
                        markFieldDirty('vietnamese_north');
                        setForm(prev => ({ ...prev, vietnamese_north: e.target.value }));
                      }}
                      placeholder="e.g., quả chuối"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  {/* Romanization */}
                  <div>
                    <FieldLabel
                      label="Pronunciation (romanized)"
                      isDirty={dirtyFields.vietnamese_north_romanization}
                      isAIGenerated={form.generated_by_ai && !!form.vietnamese_north_romanization}
                    />
                    <input
                      type="text"
                      value={form.vietnamese_north_romanization}
                      onChange={(e) => {
                        markFieldDirty('vietnamese_north_romanization');
                        setForm(prev => ({ ...prev, vietnamese_north_romanization: e.target.value }));
                      }}
                      placeholder="e.g., kwah chwoy"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  {/* Audio Upload/Recording */}
                  <AudioUploader
                    audioPath={form.vietnamese_north_audio}
                    audioSource={form.vietnamese_north_audio_source}
                    region={form.vietnamese_north_region}
                    termText={form.vietnamese_north}
                    onAudioChange={(audioPath, audioSource) => {
                      setForm(prev => ({
                        ...prev,
                        vietnamese_north_audio: audioPath,
                        vietnamese_north_audio_source: audioSource,
                      }));
                    }}
                    onRegionChange={(region) => {
                      setForm(prev => ({
                        ...prev,
                        vietnamese_north_region: region,
                      }));
                    }}
                    showRegionSelector={false}
                    colorScheme="blue"
                  />
                </div>
              )}

              {/* Learning Songs Section */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-purple-800">
                    Learning Songs
                  </h3>
                  {!showSongForm && (
                    <>
                      <input
                        type="file"
                        ref={songFileInputRef}
                        onChange={handleSongFileSelect}
                        accept="audio/mpeg,audio/mp3,.mp3"
                        className="hidden"
                        disabled={isUploadingSong}
                      />
                      <button
                        type="button"
                        onClick={() => songFileInputRef.current?.click()}
                        disabled={isUploadingSong}
                        className="text-sm px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {isUploadingSong ? 'Uploading...' : '+ Add Song'}
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-purple-600">
                  Add songs that teach this vocabulary in context (optional)
                </p>

                {/* Song Edit Form */}
                {showSongForm && editingSong && (
                  <div className="bg-white rounded-lg p-4 space-y-3 border border-purple-200">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center text-xl">
                        🎵
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editingSong.title}
                          onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                          placeholder="Song title"
                          className="w-full font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500">
                          {formatDuration(editingSong.duration_seconds)}
                        </p>
                      </div>
                      <audio src={editingSong.publicUrl} controls className="h-8 w-32" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editingSong.artist}
                        onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                        placeholder="Artist"
                        className="px-3 py-2 rounded border border-gray-300 text-sm text-gray-900"
                      />
                      <select
                        value={editingSong.level}
                        onChange={(e) => setEditingSong({ ...editingSong, level: e.target.value })}
                        className="px-3 py-2 rounded border border-gray-300 text-sm text-gray-900"
                      >
                        <option value="">Level (optional)</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>Level {n}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={editingSong.purpose}
                      onChange={(e) => setEditingSong({ ...editingSong, purpose: e.target.value })}
                      placeholder="Purpose (e.g., Learn to describe fruit quality)"
                      className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900"
                    />

                    <textarea
                      value={editingSong.lyrics_plain}
                      onChange={(e) => setEditingSong({ ...editingSong, lyrics_plain: e.target.value })}
                      placeholder="Lyrics (optional)"
                      rows={3}
                      className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 font-mono"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSavePendingSong}
                        disabled={!editingSong.title.trim()}
                        className="flex-1 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 text-sm"
                      >
                        Add Song
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSongForm(false); setEditingSong(null); }}
                        className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Songs List */}
                {pendingSongs.length > 0 && !showSongForm && (
                  <div className="space-y-2">
                    {pendingSongs.map((song) => (
                      <div key={song.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center">
                          🎵
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{song.title}</p>
                          <p className="text-xs text-gray-500">
                            {song.artist || 'Unknown'} • {formatDuration(song.duration_seconds)}
                          </p>
                        </div>
                        <audio src={song.publicUrl} controls className="h-8 w-24" />
                        <button
                          type="button"
                          onClick={() => handleDeletePendingSong(song.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {pendingSongs.length === 0 && !showSongForm && (
                  <p className="text-center text-gray-400 text-sm py-2">
                    No songs added yet
                  </p>
                )}
              </div>

              {/* SEO Meta Description */}
              <div>
                <FieldLabel
                  label="SEO Meta Description"
                  isDirty={dirtyFields.meta_description}
                  isAIGenerated={form.generated_by_ai}
                />
                <textarea
                  value={form.meta_description}
                  onChange={(e) => {
                    markFieldDirty('meta_description');
                    setForm(prev => ({ ...prev, meta_description: e.target.value }));
                  }}
                  placeholder="Learn how to say banana in Vietnamese..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.meta_description.length}/160 characters (recommended: 120-160)
                </p>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, difficulty: level }))}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        form.difficulty === level
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>✓</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Post-save Action */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After saving:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="postSaveAction"
                      value="view"
                      checked={postSaveAction === 'view'}
                      onChange={() => {
                        setPostSaveAction('view');
                        localStorage.setItem(STORAGE_KEYS.postSaveAction, 'view');
                      }}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">View the card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="postSaveAction"
                      value="create-another"
                      checked={postSaveAction === 'create-another'}
                      onChange={() => {
                        setPostSaveAction('create-another');
                        localStorage.setItem(STORAGE_KEYS.postSaveAction, 'create-another');
                      }}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Create another card</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
                  isValid && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Card'}
              </button>
            </form>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto">
              {/* Card Preview */}
              <div className="aspect-square bg-gradient-to-br from-emerald-50 to-blue-50 p-6 flex flex-col items-center justify-center">
                {/* Vietnamese South */}
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold text-black">
                    {form.vietnamese_south || 'chuối'}
                  </div>
                  {form.vietnamese_south_romanization && (
                    <div className="text-lg text-gray-600 mt-1">
                      /{form.vietnamese_south_romanization}/
                    </div>
                  )}
                </div>

                {/* Vietnamese North - shown if checkbox is checked and has content */}
                {form.show_north && form.vietnamese_north && (
                  <div className="text-center mb-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-blue-600 uppercase tracking-wide">North</div>
                    <div className="text-xl font-semibold text-black">
                      {form.vietnamese_north}
                    </div>
                    {form.vietnamese_north_romanization && (
                      <div className="text-sm text-gray-600">
                        /{form.vietnamese_north_romanization}/
                      </div>
                    )}
                  </div>
                )}

                {/* Image */}
                <div className="w-32 h-32 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                  {form.imagePreviewUrl ? (
                    <img
                      src={form.imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-5xl">🍌</span>
                  )}
                </div>

                {/* English */}
                <div className="text-xl text-black mt-3">
                  {form.english || 'banana'}
                </div>
              </div>

              {/* URL Preview */}
              <div className="px-4 py-3 bg-gray-50 text-center">
                <span className="text-xs text-gray-500">
                  ezviet.org/learn/{form.english ? slugify(form.english) : 'banana'}
                </span>
              </div>
            </div>

            {/* AI Status */}
            {form.generated_by_ai && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-purple-700">
                  <span>✨</span>
                  <span className="font-medium">AI-assisted</span>
                </div>
                <p className="text-purple-600 text-xs mt-1">
                  Translations generated by AI (prompt {form.prompt_version})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
