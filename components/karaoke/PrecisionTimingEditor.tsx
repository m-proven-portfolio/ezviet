'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Save, Eye, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audioStore';
import { useAuth } from '@/hooks/useAuth';
import { isModeratorOrAbove } from '@/lib/permissions';
import {
  parseLrc,
  standardToEnhanced,
  formatEnhancedLrc,
  getCurrentSyllableIndex,
  type SyllableTiming,
  type EnhancedLrcLine,
} from '@/lib/lrc-parser';
import { WaveformEditor } from './WaveformEditor';
import { SyllableTimeline } from './SyllableTimeline';

interface PrecisionTimingEditorProps {
  onClose: () => void;
  onSave?: (enhancedLrc: string) => void;
}

/**
 * PrecisionTimingEditor - Advanced syllable-level timing editor
 *
 * Features:
 * - Waveform visualization with draggable markers
 * - Per-syllable timing adjustment
 * - Split/merge syllables
 * - Preview mode with word-by-word highlighting
 * - Moderator-only access
 */
export function PrecisionTimingEditor({
  onClose,
  onSave,
}: PrecisionTimingEditorProps) {
  const { profile } = useAuth();
  const {
    currentSong,
    currentTime,
    isPlaying,
    pause,
    resume,
    seek,
  } = useAudioStore();

  const [lines, setLines] = useState<EnhancedLrcLine[]>([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [selectedSyllableIndex, setSelectedSyllableIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check permissions
  const hasAccess = profile && isModeratorOrAbove(profile);

  // Initialize lines from current song
  useEffect(() => {
    if (!currentSong?.lyrics_lrc) return;

    const basicLines = parseLrc(currentSong.lyrics_lrc);
    const enhanced = standardToEnhanced(basicLines);
    setLines(enhanced);
  }, [currentSong?.lyrics_lrc]);

  // Get current line's syllables
  const currentLineSyllables = useMemo(() => {
    return lines[selectedLineIndex]?.syllables || [];
  }, [lines, selectedLineIndex]);

  // Get current syllable based on playback
  const currentSyllableIndex = useMemo(() => {
    return getCurrentSyllableIndex(currentLineSyllables, currentTime);
  }, [currentLineSyllables, currentTime]);

  // Handle syllable time change (from waveform drag or timeline input)
  const handleSyllableTimeChange = useCallback((syllableIndex: number, newTime: number) => {
    setLines(prev => {
      const updated = [...prev];
      const line = { ...updated[selectedLineIndex] };
      const syllables = [...(line.syllables || [])];

      syllables[syllableIndex] = { ...syllables[syllableIndex], startTime: newTime };

      // Recalculate end times
      for (let i = 0; i < syllables.length - 1; i++) {
        syllables[i].endTime = syllables[i + 1].startTime;
      }

      line.syllables = syllables;
      updated[selectedLineIndex] = line;
      return updated;
    });
    setHasChanges(true);
  }, [selectedLineIndex]);

  // Handle split syllable
  const handleSplit = useCallback((index: number) => {
    setLines(prev => {
      const updated = [...prev];
      const line = { ...updated[selectedLineIndex] };
      const syllables = [...(line.syllables || [])];

      const syllable = syllables[index];
      const text = syllable.text;

      // Split text in half (by character, respecting Vietnamese)
      const midPoint = Math.ceil(text.length / 2);
      const firstPart = text.slice(0, midPoint);
      const secondPart = text.slice(midPoint);

      if (!secondPart) return prev; // Can't split single char

      // Calculate midpoint time
      const endTime = syllable.endTime || syllables[index + 1]?.startTime || syllable.startTime + 0.5;
      const midTime = syllable.startTime + (endTime - syllable.startTime) / 2;

      // Replace with two syllables
      syllables.splice(index, 1,
        { text: firstPart, startTime: syllable.startTime, endTime: midTime },
        { text: secondPart, startTime: midTime, endTime }
      );

      line.syllables = syllables;
      updated[selectedLineIndex] = line;
      return updated;
    });
    setHasChanges(true);
  }, [selectedLineIndex]);

  // Handle merge syllables
  const handleMerge = useCallback((startIndex: number) => {
    setLines(prev => {
      const updated = [...prev];
      const line = { ...updated[selectedLineIndex] };
      const syllables = [...(line.syllables || [])];

      if (startIndex >= syllables.length - 1) return prev;

      const first = syllables[startIndex];
      const second = syllables[startIndex + 1];

      // Merge into one
      syllables.splice(startIndex, 2, {
        text: `${first.text}${second.text}`,
        startTime: first.startTime,
        endTime: second.endTime,
      });

      line.syllables = syllables;
      updated[selectedLineIndex] = line;
      return updated;
    });
    setSelectedSyllableIndex(null);
    setHasChanges(true);
  }, [selectedLineIndex]);

  // Handle save
  const handleSave = async () => {
    if (!currentSong?.id) return;

    setIsSaving(true);
    try {
      const enhancedLrc = formatEnhancedLrc(lines);
      onSave?.(enhancedLrc);

      // Save to API
      await fetch(`/api/songs/${currentSong.id}/enhanced-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics_enhanced: { version: 1, lines } }),
      });

      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (!currentSong?.lyrics_lrc) return;
    const basicLines = parseLrc(currentSong.lyrics_lrc);
    setLines(standardToEnhanced(basicLines));
    setSelectedSyllableIndex(null);
    setHasChanges(false);
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  // Access denied view
  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md text-center">
          <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Moderator Access Required</h2>
          <p className="text-white/60 mb-6">
            The precision timing editor is only available to moderators and admins.
            Become a Core Champion to unlock moderator access!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // No song view
  if (!currentSong) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Song Selected</h2>
          <p className="text-white/60 mb-6">
            Please select a song to edit its timing.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const audioUrl = currentSong.storage_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/songs/${currentSong.storage_path}`
    : '';

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-semibold">Precision Timing Editor</h2>
              <p className="text-white/50 text-sm truncate max-w-[200px]">{currentSong.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 disabled:opacity-40 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Line selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {lines.map((line, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedLineIndex(index);
                setSelectedSyllableIndex(null);
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                index === selectedLineIndex
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Line {index + 1}
            </button>
          ))}
        </div>

        {/* Current line text */}
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-white text-lg">{lines[selectedLineIndex]?.text || ''}</p>
        </div>

        {/* Waveform editor */}
        <WaveformEditor
          audioUrl={audioUrl}
          markers={currentLineSyllables}
          selectedMarkerIndex={selectedSyllableIndex}
          currentTime={currentTime}
          duration={currentSong.duration_seconds || 0}
          isPlaying={isPlaying}
          onMarkerChange={handleSyllableTimeChange}
          onMarkerSelect={setSelectedSyllableIndex}
          onSeek={seek}
          onPlayPause={handlePlayPause}
        />

        {/* Syllable timeline */}
        <SyllableTimeline
          syllables={currentLineSyllables}
          selectedIndex={selectedSyllableIndex}
          currentSyllableIndex={currentSyllableIndex}
          onSelect={setSelectedSyllableIndex}
          onSplit={handleSplit}
          onMerge={handleMerge}
          onTimeChange={handleSyllableTimeChange}
        />
      </div>
    </div>
  );
}