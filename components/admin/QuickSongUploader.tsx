'use client';

import { useState, useRef } from 'react';
import { X, Loader2, Check, Music, Sparkles } from 'lucide-react';
import { isLrcFormat, extractPlainFromLrc } from '@/lib/lrc-parser';

// Default music genres with emoji icons for visual appeal
const GENRE_CONFIG: { name: string; emoji: string; color: string }[] = [
  { name: 'Lo-Fi', emoji: '🌙', color: 'from-indigo-500 to-purple-500' },
  { name: 'Hip-Hop', emoji: '🎤', color: 'from-amber-500 to-orange-500' },
  { name: 'Vina House', emoji: '🎧', color: 'from-pink-500 to-rose-500' },
  { name: 'Pop', emoji: '✨', color: 'from-cyan-500 to-blue-500' },
  { name: 'Ballad', emoji: '💜', color: 'from-purple-500 to-pink-500' },
  { name: 'EDM', emoji: '⚡', color: 'from-yellow-500 to-red-500' },
  { name: 'R&B', emoji: '🎵', color: 'from-rose-500 to-purple-500' },
  { name: 'Acoustic', emoji: '🎸', color: 'from-emerald-500 to-teal-500' },
];

interface QuickSongUploaderProps {
  cardId: string;
  cardTheme: string; // English term for the card
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'genre' | 'upload' | 'lyrics' | 'processing' | 'done';

export default function QuickSongUploader({
  cardId,
  cardTheme,
  onComplete,
  onCancel,
}: QuickSongUploaderProps) {
  // Load custom genres from localStorage
  const [customGenres] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezviet-custom-genres');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // Combine default genres with custom ones (custom get a generic style)
  const allGenres = [
    ...GENRE_CONFIG,
    ...customGenres.map(name => ({ name, emoji: '🎶', color: 'from-gray-500 to-gray-600' })),
  ];

  const [step, setStep] = useState<Step>('genre');
  const [genre, setGenre] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [title, setTitle] = useState('');
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle genre selection
  function handleGenreSelect(selectedGenre: string) {
    setGenre(selectedGenre);
    setStep('upload');
  }

  // Handle file upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (
      !file.type.includes('audio/mpeg') &&
      !file.type.includes('audio/mp3') &&
      !file.name.endsWith('.mp3')
    ) {
      setError('Only MP3 files are accepted');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }

    setIsUploading(true);
    setError('');
    setStatusMessage('Getting upload URL...');

    try {
      // Step 1: Get signed upload URL
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

      const { signedUrl, storagePath: path } = await signedUrlRes.json();
      setStatusMessage('Uploading to storage...');

      // Step 2: Upload directly to Supabase storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'audio/mpeg' },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      setStatusMessage('Extracting metadata...');

      // Step 3: Extract metadata
      const metadataRes = await fetch('/api/songs/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: path }),
      });

      if (!metadataRes.ok) {
        const data = await metadataRes.json();
        throw new Error(data.error || 'Failed to extract metadata');
      }

      const metadata = await metadataRes.json();
      setStoragePath(metadata.storage_path);
      setTitle(metadata.title || file.name.replace(/\.mp3$/i, ''));
      setDurationSeconds(metadata.duration_seconds);
      setFileSize(metadata.file_size);
      setCoverPath(metadata.cover_image_path);
      setStep('lyrics');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  }

  // Handle lyrics paste - auto-triggers save
  async function handleLyricsPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text');
    if (!text.trim()) return;

    e.preventDefault();
    setStep('processing');
    setIsProcessing(true);
    setError('');

    try {
      let lyricsLrc = '';
      let lyricsPlain = '';

      if (isLrcFormat(text)) {
        // Already has timing - use directly
        lyricsLrc = text;
        lyricsPlain = extractPlainFromLrc(text);
        setStatusMessage('Saving song...');
      } else {
        // Plain text - need AI sync
        lyricsPlain = text;
        setStatusMessage('AI is syncing lyrics with audio...');

        const lrcRes = await fetch('/api/songs/generate-lrc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storagePath,
            lyrics: text,
          }),
        });

        if (!lrcRes.ok) {
          const data = await lrcRes.json();
          throw new Error(data.error || 'Failed to sync lyrics');
        }

        const lrcData = await lrcRes.json();
        lyricsLrc = lrcData.lrc;
        setStatusMessage('Saving song...');
      }

      // Save the song
      const res = await fetch(`/api/cards/${cardId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_path: storagePath,
          file_size: fileSize,
          mime_type: 'audio/mpeg',
          duration_seconds: durationSeconds,
          title: title.trim(),
          artist: 'chicoman',
          album: 'EZViet I',
          year: new Date().getFullYear(),
          cover_image_path: coverPath,
          level: 1,
          genre,
          purpose: `Learn the word ${cardTheme} in Vietnamese`,
          learning_goal: null,
          lyrics_plain: lyricsPlain,
          lyrics_lrc: lyricsLrc,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save song');
      }

      setStep('done');
      setStatusMessage('');

      // Brief success state, then close
      setTimeout(() => {
        onComplete();
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
      setStep('lyrics'); // Go back to lyrics step on error
    } finally {
      setIsProcessing(false);
    }
  }

  // Format duration for display
  function formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Quick Add Song</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator - clickable to go back */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {/* Step 1: Style */}
            <button
              onClick={() => step !== 'processing' && step !== 'done' && setStep('genre')}
              disabled={step === 'processing' || step === 'done'}
              className={`flex flex-col items-center gap-1 transition-all ${
                step !== 'genre' && step !== 'processing' && step !== 'done' ? 'cursor-pointer hover:opacity-80' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'genre'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {step !== 'genre' ? '✓' : '1'}
              </div>
              <span className="text-xs text-gray-500">Style</span>
            </button>

            {/* Connector */}
            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
              step === 'genre' ? 'bg-gray-200' : 'bg-purple-400'
            }`} />

            {/* Step 2: Upload */}
            <button
              onClick={() => step !== 'genre' && step !== 'processing' && step !== 'done' && setStep('upload')}
              disabled={step === 'genre' || step === 'processing' || step === 'done'}
              className={`flex flex-col items-center gap-1 transition-all ${
                step === 'lyrics' ? 'cursor-pointer hover:opacity-80' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'upload'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : step === 'genre'
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {step !== 'genre' && step !== 'upload' ? '✓' : '2'}
              </div>
              <span className="text-xs text-gray-500">Upload</span>
            </button>

            {/* Connector */}
            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
              step === 'genre' || step === 'upload' ? 'bg-gray-200' : 'bg-purple-400'
            }`} />

            {/* Step 3: Lyrics */}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'lyrics' || step === 'processing'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : step === 'done'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {step === 'done' ? '✓' : '3'}
              </div>
              <span className="text-xs text-gray-500">Lyrics</span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
              step === 'done' ? 'bg-emerald-400' : 'bg-gray-200'
            }`} />

            {/* Done */}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                step === 'done'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {step === 'done' ? '🎉' : '✨'}
              </div>
              <span className="text-xs text-gray-500">Done</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {/* Error display */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Step 1: Genre Selection */}
          {step === 'genre' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">What style is this song?</p>
              <div className="grid grid-cols-2 gap-3">
                {allGenres.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => handleGenreSelect(g.name)}
                    className={`group relative px-4 py-4 rounded-xl bg-gradient-to-br ${g.color} text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
                  >
                    <span className="absolute top-2 right-2 text-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                      {g.emoji}
                    </span>
                    <span className="text-sm">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 'upload' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {genre}
                </span>
                <span>selected</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="audio/mpeg,audio/mp3,.mp3"
                className="hidden"
                disabled={isUploading}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isUploading
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
                    <p className="text-purple-600 font-medium text-sm">{statusMessage}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">🎵</div>
                    <p className="text-gray-600 font-medium">Click to upload MP3</p>
                    <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Lyrics Paste */}
          {step === 'lyrics' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {genre}
                </span>
                <span>•</span>
                <span className="truncate">{title}</span>
                <span className="text-gray-400">({formatDuration(durationSeconds)})</span>
              </div>

              <div className="relative">
                <textarea
                  placeholder="Paste lyrics here..."
                  onPaste={handleLyricsPaste}
                  className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  ✨ AI will sync automatically
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Paste lyrics to auto-sync with audio and save!
              </p>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute top-0 right-0 animate-pulse" />
              </div>
              <p className="text-purple-600 font-medium">{statusMessage}</p>
              <p className="text-xs text-gray-500">This usually takes 10-20 seconds</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-emerald-600 font-semibold text-lg">Song Added!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
