'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Play, Pause, SkipBack, Volume2, RotateCcw, Save, Minus, Plus } from 'lucide-react';
import { getStorageUrl } from '@/lib/utils';

interface TimingEntry {
  lineIndex: number;
  timestamp: number;
  text: string;
}

interface KaraokePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  storagePath: string;
  timingData: TimingEntry[];
  submitterName: string;
  /** Allow editing timings (default false) */
  editable?: boolean;
  /** Called when user saves edits */
  onSave?: (editedTimings: TimingEntry[]) => void;
}

export function KaraokePreviewModal({
  isOpen,
  onClose,
  songTitle,
  storagePath,
  timingData,
  submitterName,
  editable = false,
  onSave,
}: KaraokePreviewModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editedTimings, setEditedTimings] = useState<TimingEntry[]>([]);

  // Initialize edited timings when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedTimings([...timingData]);
    }
  }, [isOpen, timingData]);

  // Sort timing data by timestamp (use edited if editable)
  const sortedTimings = useMemo(
    () => [...(editable ? editedTimings : timingData)].sort((a, b) => a.timestamp - b.timestamp),
    [timingData, editedTimings, editable]
  );

  // Check if timings have been modified
  const hasChanges = useMemo(() => {
    if (!editable) return false;
    return JSON.stringify(editedTimings) !== JSON.stringify(timingData);
  }, [editedTimings, timingData, editable]);

  // Nudge a timing by delta seconds (e.g., +0.1 or -0.1)
  const nudgeTiming = useCallback((lineIndex: number, delta: number) => {
    setEditedTimings(prev => {
      return prev.map(t => {
        if (t.lineIndex === lineIndex) {
          // Clamp to >= 0
          const newTime = Math.max(0, t.timestamp + delta);
          return { ...t, timestamp: newTime };
        }
        return t;
      });
    });
  }, []);

  // Reset to original timings
  const handleReset = useCallback(() => {
    setEditedTimings([...timingData]);
  }, [timingData]);

  // Save changes
  const handleSave = useCallback(() => {
    onSave?.(editedTimings);
  }, [editedTimings, onSave]);

  // Find current line index based on playback time
  const currentLineIndex = useMemo(() => {
    for (let i = sortedTimings.length - 1; i >= 0; i--) {
      if (currentTime >= sortedTimings[i].timestamp) {
        return i;
      }
    }
    return -1;
  }, [currentTime, sortedTimings]);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineIndex >= 0 && containerRef.current) {
      const lineElement = containerRef.current.querySelector(
        `[data-line-index="${currentLineIndex}"]`
      );
      lineElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const seekToLine = (timestamp: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timestamp;
    setCurrentTime(timestamp);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const audioUrl = getStorageUrl('cards-songs', storagePath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editable ? 'Review & Edit Timings' : 'Karaoke Preview'}
            </h2>
            <p className="text-sm text-gray-500">
              Submission by {submitterName} for &quot;{songTitle}&quot;
              {hasChanges && <span className="ml-2 text-amber-600 font-medium">(modified)</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Player */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
          <audio ref={audioRef} src={audioUrl} preload="metadata" />

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={restart}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
              title="Restart"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekToLine(Number(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <Volume2 className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        {/* Lyrics Display with optional nudge buttons */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[300px]"
        >
          <p className="text-sm text-gray-400 mb-4 text-center">
            {editable
              ? 'Click any line to jump • Use +/− buttons to adjust timing'
              : 'Click any line to jump to that timestamp'}
          </p>
          {sortedTimings.map((timing, idx) => {
            const isActive = idx === currentLineIndex;
            const isPast = idx < currentLineIndex;

            return (
              <div
                key={idx}
                data-line-index={idx}
                className={`
                  p-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-purple-100 border-l-4 border-purple-600 scale-[1.02]'
                    : isPast
                      ? 'bg-gray-50 text-gray-400'
                      : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Nudge buttons (only when editable) */}
                  {editable && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nudgeTiming(timing.lineIndex, -0.1);
                        }}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                        title="−0.1s"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nudgeTiming(timing.lineIndex, 0.1);
                        }}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                        title="+0.1s"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Timestamp (clickable to seek) */}
                  <button
                    onClick={() => seekToLine(timing.timestamp)}
                    className={`
                      font-mono text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80
                      ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {formatTime(timing.timestamp)}
                  </button>

                  {/* Lyrics text (clickable to seek) */}
                  <button
                    onClick={() => seekToLine(timing.timestamp)}
                    className={`
                      flex-1 text-left text-lg cursor-pointer
                      ${isActive ? 'font-semibold text-purple-900' : 'text-gray-700'}
                    `}
                  >
                    {timing.text}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Save/Reset when editable with changes, or hint text */}
        {editable && hasChanges ? (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border-t border-amber-100 text-center">
            <p className="text-sm text-amber-700">
              {editable
                ? 'Listen and adjust timings with +/− buttons if needed'
                : 'Listen and watch if the highlighted lyrics match the music timing'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
