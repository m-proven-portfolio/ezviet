'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import type { Category, CardWithTerms, CardSong } from '@/lib/supabase/types';
import { useAIGeneration, type FieldDirtyState, type TranslationDirection } from '@/hooks/useAIGeneration';
import AudioUploader from '@/components/AudioUploader';
import SongUploader from '@/components/admin/SongUploader';
import BulkSongUploader from '@/components/admin/BulkSongUploader';
import SongList from '@/components/admin/SongList';
import { getIconForSelect } from '@/components/CategoryIcon';

type AudioSource = 'auto' | 'admin' | 'community' | null;
type Region = 'south' | 'north' | null;

// localStorage key for source language preference (shared with create page)
const SOURCE_LANGUAGE_KEY = 'ezviet_admin_source_language';

// Success toast component
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
      <span className="text-xl">✓</span>
      <span>{message}</span>
    </div>
  );
}

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
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCardPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [originalSlug, setOriginalSlug] = useState('');
  const [originalEnglish, setOriginalEnglish] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [songs, setSongs] = useState<CardSong[]>([]);
  const [showSongUploader, setShowSongUploader] = useState(false);
  const [showBulkUploader, setShowBulkUploader] = useState(false);

  const [form, setForm] = useState<CardFormData>({
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
  });

  // Source language toggle (sticky preference, shared with create page)
  const [sourceLanguage, setSourceLanguage] = useState<TranslationDirection>('en-to-vi');

  // Load source language preference from localStorage
  useEffect(() => {
    const savedSourceLang = localStorage.getItem(SOURCE_LANGUAGE_KEY);
    if (savedSourceLang === 'en-to-vi' || savedSourceLang === 'vi-to-en') {
      setSourceLanguage(savedSourceLang);
    }
  }, []);

  // Handle source language toggle
  function handleSourceLanguageChange(newDirection: TranslationDirection) {
    if (newDirection === sourceLanguage) return;
    setSourceLanguage(newDirection);
    localStorage.setItem(SOURCE_LANGUAGE_KEY, newDirection);
    // Note: Unlike create page, we don't reset form on edit since data is already loaded
  }

  // AI Generation hook
  const {
    generate,
    isGenerating,
    error: aiError,
    dirtyFields,
    markFieldDirty,
    shouldUpdateField,
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

  // Fetch card, categories, and songs on mount
  useEffect(() => {
    Promise.all([fetchCard(), fetchCategories(), fetchSongs()]).finally(() => {
      setIsLoading(false);
    });
  }, [id]);

  async function fetchSongs() {
    try {
      const res = await fetch(`/api/cards/${id}/songs`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  }

  async function handleSongReorder(songIds: string[]) {
    try {
      await fetch(`/api/cards/${id}/songs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: songIds }),
      });
      fetchSongs();
    } catch (error) {
      console.error('Failed to reorder songs:', error);
    }
  }

  function handleSongDelete(songId: string) {
    setSongs(prev => prev.filter(s => s.id !== songId));
  }

  function handleSongUpdate(updatedSong: CardSong) {
    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
  }

  async function fetchCard() {
    try {
      const res = await fetch(`/api/cards/${id}`);
      if (!res.ok) {
        throw new Error('Card not found');
      }
      const card: CardWithTerms = await res.json();

      // Extract terms
      const viSouthTerm = card.terms?.find(t => t.lang === 'vi' && t.region === 'south');
      const viNorthTerm = card.terms?.find(t => t.lang === 'vi' && t.region === 'north');
      const enTerm = card.terms?.find(t => t.lang === 'en');

      // Build image preview URL
      const imagePreviewUrl = card.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-images/${card.image_path}`
        : '';

      setForm({
        category_id: card.category_id || '',
        image_path: card.image_path || '',
        imagePreviewUrl,
        difficulty: card.difficulty || 1,
        vietnamese_south: viSouthTerm?.text || '',
        vietnamese_south_romanization: viSouthTerm?.romanization || '',
        vietnamese_south_audio: viSouthTerm?.audio_path || null,
        vietnamese_south_audio_source: (viSouthTerm?.audio_source as AudioSource) || null,
        vietnamese_south_region: 'south',
        vietnamese_north: viNorthTerm?.text || '',
        vietnamese_north_romanization: viNorthTerm?.romanization || '',
        vietnamese_north_audio: viNorthTerm?.audio_path || null,
        vietnamese_north_audio_source: (viNorthTerm?.audio_source as AudioSource) || null,
        vietnamese_north_region: 'north',
        english: enTerm?.text || '',
        meta_description: card.meta_description || '',
        generated_by_ai: viSouthTerm?.generated_by_ai || false,
        prompt_version: viSouthTerm?.prompt_version || null,
      });
      setOriginalSlug(card.slug);
      setOriginalEnglish(enTerm?.text || '');
    } catch (error) {
      console.error('Failed to fetch card:', error);
      setError('Card not found');
    }
  }

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

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setForm(prev => ({
        ...prev,
        image_path: data.path,
        imagePreviewUrl: data.publicUrl,
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
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

      const payload = {
        slug: slugify(form.english),
        category_id: form.category_id || null,
        image_path: form.image_path,
        difficulty: form.difficulty,
        meta_description: form.meta_description || null,
        terms,
      };

      const res = await fetch(`/api/cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update card');
      }

      const card = await res.json();
      setSuccessMessage('Card saved successfully!');
      setOriginalSlug(card.slug);

      // Brief delay to show success before redirect
      setTimeout(() => {
        router.push(`/learn/${card.slug}`);
      }, 1500);
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to update card');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete card');
      }

      router.push('/admin');
    } catch (error: any) {
      console.error('Delete error:', error);
      setError(error.message || 'Failed to delete card');
      setIsDeleting(false);
    }
  }

  // Handle English word change - only trigger AI if word actually changed
  function handleEnglishChange(value: string) {
    setForm(prev => ({ ...prev, english: value }));
    // Only trigger AI generation if in en-to-vi mode and word changed from original
    if (sourceLanguage === 'en-to-vi' && value.trim() !== originalEnglish.trim() && value.trim().length > 0) {
      generate(value);
    }
  }

  function handleVietnameseChange(value: string) {
    setForm(prev => ({ ...prev, vietnamese_south: value }));
    // Only trigger AI generation if in vi-to-en mode
    if (sourceLanguage === 'vi-to-en' && value.trim().length > 0) {
      generate(value);
    }
  }

  const isValid = form.image_path && form.english && form.vietnamese_south;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-emerald-200 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-gray-500">Loading card...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error === 'Card not found') {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">404</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Card Not Found</h1>
            <p className="text-gray-600 mb-6">The card you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Success Toast */}
      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Card</h1>
          <p className="text-gray-600 mt-1">Update flashcard details</p>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
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

              {/* English - Input for en-to-vi, AI-generated for vi-to-en */}
              <div>
                {sourceLanguage === 'en-to-vi' ? (
                  <>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      English Word *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.english}
                        onChange={(e) => handleEnglishChange(e.target.value)}
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
                    {form.english.trim() !== originalEnglish.trim() && form.english.trim() && (
                      <p className="text-xs text-amber-600 mt-1">
                        Word changed - Vietnamese translations will be regenerated.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <FieldLabel
                      label="English Translation"
                      isDirty={dirtyFields.english}
                      isAIGenerated={form.generated_by_ai}
                      required
                    />
                    <input
                      type="text"
                      value={form.english}
                      onChange={(e) => {
                        markFieldDirty('english');
                        setForm(prev => ({ ...prev, english: e.target.value }));
                      }}
                      placeholder="AI will generate English translation..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                    />
                  </>
                )}
              </div>

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

              {/* Vietnamese South */}
              <div className={`bg-emerald-50 rounded-lg p-4 space-y-4 transition-all duration-300 ${
                isGenerating && sourceLanguage === 'en-to-vi' ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-800">
                    Vietnamese (South) *
                  </h3>
                  {isGenerating && sourceLanguage === 'en-to-vi' && (
                    <span className="flex items-center gap-2 text-emerald-600 text-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Generating...
                    </span>
                  )}
                </div>

                {/* Text - Input for vi-to-en, AI-generated for en-to-vi */}
                <div>
                  {sourceLanguage === 'vi-to-en' ? (
                    <>
                      <label className="block text-sm text-gray-700 mb-1">
                        Vietnamese Word *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.vietnamese_south}
                          onChange={(e) => handleVietnameseChange(e.target.value)}
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
                    </>
                  ) : (
                    <>
                      <FieldLabel
                        label="Text"
                        isDirty={dirtyFields.vietnamese_south}
                        isAIGenerated={form.generated_by_ai}
                        required
                      />
                      <input
                        type="text"
                        value={form.vietnamese_south}
                        onChange={(e) => {
                          markFieldDirty('vietnamese_south');
                          setForm(prev => ({ ...prev, vietnamese_south: e.target.value }));
                        }}
                        placeholder="e.g., chuối"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg text-gray-900"
                      />
                    </>
                  )}
                </div>

                {/* Romanization */}
                <div>
                  <FieldLabel
                    label="Pronunciation (romanized)"
                    isDirty={dirtyFields.vietnamese_south_romanization}
                    isAIGenerated={form.generated_by_ai}
                  />
                  <input
                    type="text"
                    value={form.vietnamese_south_romanization}
                    onChange={(e) => {
                      markFieldDirty('vietnamese_south_romanization');
                      setForm(prev => ({ ...prev, vietnamese_south_romanization: e.target.value }));
                    }}
                    placeholder="e.g., chwoy"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  />
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

              {/* Vietnamese North (Optional) */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-blue-800">
                  Vietnamese (North) - Optional
                </h3>
                <p className="text-xs text-blue-600">
                  Only fill if different from Southern Vietnamese
                </p>

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

              {/* Learning Songs Section */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-purple-800">
                    Learning Songs
                  </h3>
                  {!showSongUploader && !showBulkUploader && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSongUploader(true)}
                        className="text-sm px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                      >
                        + Add Song
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBulkUploader(true)}
                        className="text-sm px-3 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        Bulk Upload
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-purple-600">
                  Add songs that teach this vocabulary in context
                </p>

                {showSongUploader && (
                  <SongUploader
                    cardId={id}
                    cardTheme={form.english}
                    onSongCreated={() => {
                      setShowSongUploader(false);
                      fetchSongs();
                    }}
                    onCancel={() => setShowSongUploader(false)}
                  />
                )}

                {showBulkUploader && (
                  <BulkSongUploader
                    cardId={id}
                    existingSongs={songs.filter(s => !s.parent_song_id).map(s => ({
                      id: s.id,
                      title: s.title,
                      artist: s.artist,
                      hasLrc: !!s.lyrics_lrc,
                    }))}
                    onComplete={() => {
                      setShowBulkUploader(false);
                      fetchSongs();
                    }}
                    onCancel={() => setShowBulkUploader(false)}
                  />
                )}

                <SongList
                  songs={songs}
                  onDelete={handleSongDelete}
                  onReorder={handleSongReorder}
                  onUpdate={handleSongUpdate}
                />
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
              {error && error !== 'Card not found' && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting || !!successMessage}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all btn-press ${
                    successMessage
                      ? 'bg-emerald-500 text-white'
                      : isValid && !isSubmitting
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {successMessage ? '✓ Saved!' : isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>

                {/* Delete Button */}
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 rounded-lg font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Delete Card
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm mb-3">
                      Are you sure you want to delete this card? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto card-hover">
              {/* Card Preview */}
              <div className="aspect-square bg-gradient-to-br from-emerald-50 to-blue-50 p-6 flex flex-col items-center justify-center">
                {/* Vietnamese */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-black">
                    {form.vietnamese_south || 'chuối'}
                  </div>
                  {form.vietnamese_south_romanization && (
                    <div className="text-lg text-gray-600 mt-1">
                      /{form.vietnamese_south_romanization}/
                    </div>
                  )}
                </div>

                {/* Image */}
                <div className="w-40 h-40 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                  {form.imagePreviewUrl ? (
                    <img
                      src={form.imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl">🍌</span>
                  )}
                </div>

                {/* English */}
                <div className="text-xl text-black mt-4">
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

            {/* Quick Links */}
            <div className="mt-6 space-y-2">
              <Link
                href={`/learn/${originalSlug}`}
                className="block text-center text-blue-600 hover:text-blue-700 text-sm"
              >
                View Live Card →
              </Link>
              <Link
                href={`/api/print/${originalSlug}`}
                className="block text-center text-gray-600 hover:text-gray-700 text-sm"
              >
                Download Print Version
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
