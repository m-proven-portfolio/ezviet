'use client';

import { useState, useRef } from 'react';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { isLrcFormat, extractPlainFromLrc } from '@/lib/lrc-parser';

interface UploadedSongData {
  storage_path: string;
  publicUrl: string;
  file_size: number;
  mime_type: string;
  title: string;
  artist: string | null;
  album: string | null;
  year: number | null;
  duration_seconds: number | null;
  cover_image_path: string | null;
  cover_public_url: string | null;
}

interface SongFormData {
  storage_path: string;
  file_size: number;
  mime_type: string;
  duration_seconds: number | null;
  title: string;
  artist: string;
  album: string;
  year: string;
  cover_image_path: string | null;
  level: string;
  genre: string;
  purpose: string;
  learning_goal: string;
  lyrics_plain: string;
  lyrics_lrc: string;
}

// Default music genres for Vietnamese learning songs
const DEFAULT_GENRES = [
  'Lo-Fi',
  'Hip-Hop',
  'Vina House',
  'Pop',
  'Ballad',
  'EDM',
  'R&B',
  'Acoustic',
];

interface SongUploaderProps {
  cardId: string;
  cardTheme?: string; // English term for SEO title generation
  onSongCreated: () => void;
  onCancel: () => void;
}

// Generate SEO-optimized purpose from theme
function generatePurpose(theme: string): string {
  if (!theme.trim()) return '';
  return `Learn the word ${theme.trim()} in Vietnamese`;
}

export default function SongUploader({ cardId, cardTheme = '', onSongCreated, onCancel }: SongUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadedData, setUploadedData] = useState<UploadedSongData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom genres added by user (persisted in localStorage)
  const [customGenres, setCustomGenres] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezviet-custom-genres');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showAddGenre, setShowAddGenre] = useState(false);
  const [newGenre, setNewGenre] = useState('');

  const allGenres = [...DEFAULT_GENRES, ...customGenres];

  const [form, setForm] = useState<SongFormData>({
    storage_path: '',
    file_size: 0,
    mime_type: 'audio/mpeg',
    duration_seconds: null,
    title: '', // Will be filled from MP3 metadata
    artist: 'chicoman',
    album: 'EZViet I',
    year: new Date().getFullYear().toString(),
    cover_image_path: null,
    level: '1',
    genre: '', // No default - force user to select
    purpose: generatePurpose(cardTheme),
    learning_goal: '',
    lyrics_plain: '',
    lyrics_lrc: '',
  });

  // Add a new custom genre
  const handleAddGenre = () => {
    const trimmed = newGenre.trim();
    if (trimmed && !allGenres.includes(trimmed)) {
      const updated = [...customGenres, trimmed];
      setCustomGenres(updated);
      localStorage.setItem('ezviet-custom-genres', JSON.stringify(updated));
      setForm(prev => ({ ...prev, genre: trimmed }));
    }
    setNewGenre('');
    setShowAddGenre(false);
  };

  const lrcInputRef = useRef<HTMLInputElement>(null);

  // Ref to access latest form state in async callbacks (avoids stale closures)
  const formRef = useRef(form);
  formRef.current = form;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingLrc, setIsGeneratingLrc] = useState(false);
  const [lrcGenerated, setLrcGenerated] = useState(false);

  // Helper to submit song with explicit form data (avoids stale state issues)
  async function submitSong(formData: SongFormData): Promise<boolean> {
    if (!formData.storage_path || !formData.title.trim()) {
      setError('Please upload a file and enter a title');
      return false;
    }

    if (!formData.genre) {
      setError('Please select a genre');
      return false;
    }

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/cards/${cardId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_path: formData.storage_path,
          file_size: formData.file_size,
          mime_type: formData.mime_type,
          duration_seconds: formData.duration_seconds,
          title: formData.title.trim(),
          artist: formData.artist.trim() || null,
          album: formData.album.trim() || null,
          year: formData.year ? parseInt(formData.year) : null,
          cover_image_path: formData.cover_image_path,
          level: formData.level ? parseInt(formData.level) : null,
          genre: formData.genre.trim() || null,
          purpose: formData.purpose.trim() || null,
          learning_goal: formData.learning_goal.trim() || null,
          lyrics_plain: formData.lyrics_plain.trim() || null,
          lyrics_lrc: formData.lyrics_lrc.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save song');
      }

      onSongCreated();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save song';
      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // AI-powered LRC generation using OpenAI Whisper
  // Pass lyrics directly to avoid stale state; autoSubmit will save automatically when done
  async function handleGenerateLrc(lyricsOverride?: string, autoSubmit = false) {
    if (!form.storage_path) {
      setError('Please upload an audio file first');
      return;
    }

    const lyricsToUse = lyricsOverride ?? form.lyrics_plain;

    setIsGeneratingLrc(true);
    setError('');
    setLrcGenerated(false);

    try {
      const res = await fetch('/api/songs/generate-lrc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storagePath: form.storage_path,
          lyrics: lyricsToUse || undefined, // Send user lyrics if available for alignment
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate LRC');
      }

      const data = await res.json();

      // Build updated form data
      const newLrc = data.lrc;
      const newPlain = lyricsToUse.trim() ? lyricsToUse : (data.plain || '');

      // Only update LRC - preserve user's original lyrics_plain formatting
      setForm(prev => ({
        ...prev,
        lyrics_lrc: newLrc,
        lyrics_plain: newPlain,
      }));

      setLrcGenerated(true);

      // Auto-submit if requested and ready
      // Use formRef.current to get latest state (avoids stale closure from async call)
      const currentForm = formRef.current;
      if (autoSubmit && currentForm.title.trim() && currentForm.genre) {
        await submitSong({
          ...currentForm,
          lyrics_lrc: newLrc,
          lyrics_plain: newPlain,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate karaoke sync';
      setError(message);
    } finally {
      setIsGeneratingLrc(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('audio/mpeg') && !file.type.includes('audio/mp3') && !file.name.endsWith('.mp3')) {
      setError('Only MP3 files are accepted');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Step 1: Get signed upload URL from our API
      const signedUrlRes = await fetch('/api/songs/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'audio/mpeg',
        }),
      });

      if (!signedUrlRes.ok) {
        const data = await signedUrlRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { signedUrl, storagePath } = await signedUrlRes.json();
      setUploadProgress(10);

      // Step 2: Upload directly to Supabase storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'audio/mpeg',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Direct upload failed');
      }

      setUploadProgress(70);

      // Step 3: Extract metadata from the uploaded file
      const metadataRes = await fetch('/api/songs/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath }),
      });

      if (!metadataRes.ok) {
        const data = await metadataRes.json();
        throw new Error(data.error || 'Failed to extract metadata');
      }

      const data: UploadedSongData = await metadataRes.json();
      setUploadProgress(100);
      setUploadedData(data);

      // Pre-fill form with extracted metadata (keep defaults if no metadata)
      setForm(prev => ({
        ...prev,
        storage_path: data.storage_path,
        file_size: data.file_size,
        mime_type: data.mime_type,
        duration_seconds: data.duration_seconds,
        title: data.title || '', // Use metadata title
        artist: prev.artist, // Always use default 'chicoman'
        album: data.album || prev.album,
        year: data.year?.toString() || prev.year,
        cover_image_path: data.cover_image_path,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitSong(form);
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Handle LRC file upload
  function handleLrcFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && isLrcFormat(content)) {
        // Store LRC and auto-extract plain text
        setForm(prev => ({
          ...prev,
          lyrics_lrc: content,
          lyrics_plain: extractPlainFromLrc(content),
        }));
      } else {
        // Not LRC format, treat as plain text
        setForm(prev => ({
          ...prev,
          lyrics_plain: content || '',
          lyrics_lrc: '',
        }));
      }
    };
    reader.readAsText(file);
  }

  // Handle paste in lyrics textarea - auto-trigger AI sync and save
  function handleLyricsPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text');
    if (!text) return;

    e.preventDefault(); // Always prevent default to control the flow

    if (isLrcFormat(text)) {
      // LRC format pasted - already has timing, just auto-submit
      const plainText = extractPlainFromLrc(text);
      setForm(prev => ({
        ...prev,
        lyrics_lrc: text,
        lyrics_plain: plainText,
      }));

      // Auto-submit if ready (title and genre filled)
      if (form.storage_path && form.title.trim() && form.genre) {
        submitSong({
          ...form,
          lyrics_lrc: text,
          lyrics_plain: plainText,
        });
      }
    } else {
      // Plain text - update form and trigger AI sync with auto-submit
      setForm(prev => ({
        ...prev,
        lyrics_plain: text,
        lyrics_lrc: '',
      }));

      // Auto-trigger AI sync if audio is uploaded
      if (form.storage_path) {
        // Pass lyrics directly since state won't be updated yet
        handleGenerateLrc(text, true); // autoSubmit=true
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Add Learning Song</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Upload Area */}
      {!uploadedData && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/mpeg,audio/mp3,.mp3"
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-purple-600 font-medium">
                {uploadProgress < 10 && 'Preparing upload...'}
                {uploadProgress >= 10 && uploadProgress < 70 && 'Uploading to storage...'}
                {uploadProgress >= 70 && uploadProgress < 100 && 'Extracting metadata...'}
                {uploadProgress === 100 && 'Done!'}
              </p>
              <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="space-y-2"
            >
              <div className="text-5xl">🎵</div>
              <p className="text-gray-600">Click to upload MP3</p>
              <p className="text-xs text-gray-400">Max 50MB • Direct upload to storage</p>
            </button>
          )}

          {/* Error display in upload area */}
          {error && !uploadedData && (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Metadata Form */}
      {uploadedData && (
        <div className="space-y-4">
          {/* Preview Row */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {uploadedData.cover_public_url ? (
              <img
                src={uploadedData.cover_public_url}
                alt="Cover"
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center text-2xl">
                🎵
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{form.title || 'Untitled'}</p>
              <p className="text-sm text-gray-500">
                {form.artist || 'Unknown artist'} • {formatDuration(form.duration_seconds)}
              </p>
            </div>
            <audio
              src={uploadedData.publicUrl}
              controls
              className="h-8"
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Song title"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist
              </label>
              <input
                type="text"
                value={form.artist}
                onChange={(e) => setForm(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="Artist name"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Album & Year row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Album
              </label>
              <input
                type="text"
                value={form.album}
                onChange={(e) => setForm(prev => ({ ...prev, album: e.target.value }))}
                placeholder="Album"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm(prev => ({ ...prev, year: e.target.value }))}
                placeholder="2024"
                min="1900"
                max="2100"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Genre & Level row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre *
              </label>
              {showAddGenre ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGenre()}
                    placeholder="New genre..."
                    autoFocus
                    className="flex-1 px-2 py-2 rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddGenre}
                    className="px-2 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddGenre(false); setNewGenre(''); }}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={form.genre}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddGenre(true);
                    } else {
                      setForm(prev => ({ ...prev, genre: e.target.value }));
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    form.genre ? 'border-gray-300 text-gray-900' : 'border-orange-300 text-gray-500'
                  }`}
                >
                  <option value="" disabled>Select genre...</option>
                  {allGenres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="__add_new__" className="text-purple-600">+ Add new genre</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level (1-10)
              </label>
              <select
                value={form.level}
                onChange={(e) => setForm(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              >
                <option value="">No level</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>Level {n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Learning Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="e.g., Learn to describe fruit quality"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Lyrics with LRC Support */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Lyrics
              </label>
              <div className="flex items-center gap-2">
                {form.lyrics_lrc && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    🎤 Karaoke ready
                  </span>
                )}
                <input
                  type="file"
                  ref={lrcInputRef}
                  onChange={handleLrcFileSelect}
                  accept=".lrc,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => lrcInputRef.current?.click()}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  {form.lyrics_lrc ? 'Replace .lrc' : 'Upload .lrc file'}
                </button>
              </div>
            </div>
            <textarea
              value={form.lyrics_plain}
              onChange={(e) => setForm(prev => ({
                ...prev,
                lyrics_plain: e.target.value,
                // Clear LRC when manually editing - user may want to re-generate
                lyrics_lrc: '',
              }))}
              onPaste={handleLyricsPaste}
              placeholder="Paste lyrics here, then click 'AI Sync' to generate karaoke timing..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 font-mono text-sm"
            />

            {/* AI Sync Button */}
            <div className="mt-2 flex items-center justify-between">
              <div>
                {form.lyrics_lrc ? (
                  <p className="text-xs text-green-600">
                    ✓ Karaoke timing ready • Edit lyrics above to re-sync
                  </p>
                ) : lrcGenerated ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI sync complete!
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Paste lyrics, then use AI to auto-sync with the audio
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleGenerateLrc()}
                disabled={isGeneratingLrc || !form.storage_path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isGeneratingLrc
                    ? 'bg-purple-100 text-purple-600 cursor-wait'
                    : form.lyrics_lrc
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isGeneratingLrc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing audio...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    {form.lyrics_lrc ? 'Re-sync with AI' : 'AI Sync'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || !form.title.trim() || !form.genre}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isSaving || !form.title.trim() || !form.genre
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : 'Add Song'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
