'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CardSong } from '@/lib/supabase/types';
import { isLrcFormat, extractPlainFromLrc } from '@/lib/lrc-parser';
import { LrcEditor } from './LrcEditor';

interface SongEditorProps {
  song: CardSong;
  onSave: (updatedSong: CardSong) => void;
  onCancel: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function SongEditor({ song, onSave, onCancel }: SongEditorProps) {
  const [form, setForm] = useState({
    title: song.title || '',
    artist: song.artist || '',
    album: song.album || '',
    year: song.year?.toString() || '',
    level: song.level?.toString() || '1',
    purpose: song.purpose || '',
    learning_goal: song.learning_goal || '',
    lyrics_plain: song.lyrics_plain || '',
    lyrics_lrc: song.lyrics_lrc || '',
    timing_offset: (song as CardSong & { timing_offset?: number | null }).timing_offset?.toString() || '',
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const [showLrcEditor, setShowLrcEditor] = useState(false);
  const lrcInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangedRef = useRef(false);
  const lastSavedRef = useRef(JSON.stringify(form));

  // Auto-save function
  const saveChanges = useCallback(async () => {
    // Don't save if nothing changed
    const currentFormStr = JSON.stringify(form);
    if (currentFormStr === lastSavedRef.current) {
      return;
    }

    setSaveStatus('saving');
    setError('');

    try {
      const res = await fetch(`/api/songs/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim() || null,
          artist: form.artist.trim() || null,
          album: form.album.trim() || null,
          year: form.year ? parseInt(form.year) : null,
          level: form.level ? parseInt(form.level) : null,
          purpose: form.purpose.trim() || null,
          learning_goal: form.learning_goal.trim() || null,
          lyrics_plain: form.lyrics_plain.trim() || null,
          lyrics_lrc: form.lyrics_lrc.trim() || null,
          timing_offset: form.timing_offset ? parseFloat(form.timing_offset) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update song');
      }

      const updatedSong = await res.json();
      lastSavedRef.current = currentFormStr;
      setSaveStatus('saved');
      onSave(updatedSong);

      // Clear "saved" status after 3 seconds
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update song';
      setError(message);
      setSaveStatus('error');
    }
  }, [form, song.id, onSave]);

  // Debounced auto-save effect
  useEffect(() => {
    // Skip on initial mount
    if (!hasChangedRef.current) {
      return;
    }

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 3 seconds
    debounceTimerRef.current = setTimeout(() => {
      saveChanges();
    }, 3000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [form, saveChanges]);

  // Track that changes have been made
  const updateForm = (updates: Partial<typeof form>) => {
    hasChangedRef.current = true;
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // Handle LRC file upload
  function handleLrcFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && isLrcFormat(content)) {
        updateForm({
          lyrics_lrc: content,
          lyrics_plain: extractPlainFromLrc(content),
        });
      } else {
        updateForm({
          lyrics_plain: content || '',
          lyrics_lrc: '',
        });
      }
    };
    reader.readAsText(file);
  }

  // Handle paste in lyrics textarea - detect LRC format
  function handleLyricsPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text');
    if (text && isLrcFormat(text)) {
      e.preventDefault();
      updateForm({
        lyrics_lrc: text,
        lyrics_plain: extractPlainFromLrc(text),
      });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Edit Song</h3>
          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-500 animate-pulse">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="text-sm">✓</span> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-600">Save failed</span>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Close editor"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* Artist & Album */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artist
            </label>
            <input
              type="text"
              value={form.artist}
              onChange={(e) => updateForm({ artist: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Album
            </label>
            <input
              type="text"
              value={form.album}
              onChange={(e) => updateForm({ album: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Year & Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => updateForm({ year: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level (1-5)
            </label>
            <select
              value={form.level}
              onChange={(e) => updateForm({ level: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              {[1, 2, 3, 4, 5].map(l => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Purpose
          </label>
          <input
            type="text"
            value={form.purpose}
            onChange={(e) => updateForm({ purpose: e.target.value })}
            placeholder="e.g., Learn the word Rambutan in Vietnamese"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* Timing Offset - only show when LRC exists */}
        {form.lyrics_lrc && (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Lyrics Timing Offset
              </label>
              <span className="text-sm font-mono text-purple-700">
                {form.timing_offset
                  ? `${parseFloat(form.timing_offset) >= 0 ? '+' : ''}${parseFloat(form.timing_offset).toFixed(1)}s`
                  : 'Using global'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const current = parseFloat(form.timing_offset) || 0.8;
                  updateForm({ timing_offset: Math.max(-2, current - 0.1).toFixed(1) });
                }}
                className="w-8 h-8 flex items-center justify-center bg-purple-200 hover:bg-purple-300 rounded-lg text-purple-700 font-bold transition-colors"
              >
                −
              </button>
              <input
                type="range"
                min={-2}
                max={3}
                step={0.1}
                value={form.timing_offset || '0.8'}
                onChange={(e) => updateForm({ timing_offset: e.target.value })}
                className="flex-1 h-2 bg-purple-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full"
              />
              <button
                type="button"
                onClick={() => {
                  const current = parseFloat(form.timing_offset) || 0.8;
                  updateForm({ timing_offset: Math.min(3, current + 0.1).toFixed(1) });
                }}
                className="w-8 h-8 flex items-center justify-center bg-purple-200 hover:bg-purple-300 rounded-lg text-purple-700 font-bold transition-colors"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => updateForm({ timing_offset: '' })}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
              >
                Use global
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Positive = lyrics appear earlier • Negative = later • Leave empty to use global setting
            </p>
          </div>
        )}

        {/* Lyrics with LRC Support */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Lyrics
            </label>
            <div className="flex items-center gap-2">
              {form.lyrics_lrc && (
                <>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    🎤 Karaoke ready
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLrcEditor(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Edit LRC
                  </button>
                </>
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
            onChange={(e) => updateForm({ lyrics_plain: e.target.value })}
            onPaste={handleLyricsPaste}
            placeholder="Paste LRC or plain lyrics here..."
            rows={8}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 font-mono text-sm"
          />
          {form.lyrics_lrc ? (
            <p className="text-xs text-green-600 mt-1">
              ✓ LRC timing preserved • Edit text freely for display tweaks
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Tip: Paste LRC format for karaoke sync, or upload .lrc file
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => saveChanges()}
              className="text-red-700 hover:text-red-900 text-sm font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Done button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Changes auto-save after you stop typing
          </p>
        </div>
      </div>

      {/* LRC Editor Modal */}
      {showLrcEditor && form.lyrics_lrc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl">
            <LrcEditor
              lrcContent={form.lyrics_lrc}
              audioStoragePath={song.storage_path}
              onSave={(newLrc) => {
                updateForm({
                  lyrics_lrc: newLrc,
                  lyrics_plain: extractPlainFromLrc(newLrc),
                });
                setShowLrcEditor(false);
              }}
              onCancel={() => setShowLrcEditor(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}