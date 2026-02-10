'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { parseLrc, type LrcLine } from '@/lib/lrc-parser';
import { getStorageUrl } from '@/lib/utils';

interface LrcEditorProps {
  lrcContent: string;
  audioStoragePath: string;
  onSave: (newLrcContent: string) => void;
  onCancel: () => void;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.round((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
}

function parseTimestamp(str: string): number {
  const match = str.match(/^(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?$/);
  if (!match) return 0;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  const centis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
  return mins * 60 + secs + centis / 1000;
}

interface EditableLine extends LrcLine {
  id: string;
}

export function LrcEditor({ lrcContent, audioStoragePath, onSave, onCancel }: LrcEditorProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);

  // Parse LRC into editable lines with unique IDs
  const [lines, setLines] = useState<EditableLine[]>(() => {
    const parsed = parseLrc(lrcContent);
    return parsed.map((line, idx) => ({
      ...line,
      id: `line-${idx}-${Date.now()}`,
    }));
  });

  const audioUrl = useMemo(() => getStorageUrl('cards-songs', audioStoragePath), [audioStoragePath]);

  // Handle audio time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Play from specific line
  const playFromLine = useCallback((lineId: string, time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
      setIsPlaying(true);
      setPlayingLineId(lineId);
    }
  }, []);

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlayingLineId(null);
  }, []);

  // Update line timestamp
  const updateLineTime = useCallback((id: string, newTime: number) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, time: newTime } : line))
    );
  }, []);

  // Update line text
  const updateLineText = useCallback((id: string, newText: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, text: newText } : line))
    );
  }, []);

  // Set line to current audio time
  const setLineToCurrentTime = useCallback((id: string) => {
    if (audioRef.current) {
      updateLineTime(id, audioRef.current.currentTime);
    }
  }, [updateLineTime]);

  // Delete line
  const deleteLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  // Add new line
  const addLine = useCallback((afterId: string | null) => {
    const newLine: EditableLine = {
      id: `line-new-${Date.now()}`,
      time: currentTime,
      text: '',
    };

    if (afterId === null) {
      setLines((prev) => [...prev, newLine]);
    } else {
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.id === afterId);
        if (idx === -1) return [...prev, newLine];
        const copy = [...prev];
        copy.splice(idx + 1, 0, newLine);
        return copy;
      });
    }
  }, [currentTime]);

  // Move line up/down
  const moveLine = useCallback((id: string, direction: 'up' | 'down') => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const copy = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [copy[idx], copy[swapIdx]] = [copy[swapIdx], copy[idx]];
      return copy;
    });
  }, []);

  // Generate LRC output
  const generateLrc = useCallback((): string => {
    // Sort by time
    const sorted = [...lines].sort((a, b) => a.time - b.time);
    return sorted
      .map((line) => `[${formatTimestamp(line.time)}]${line.text}`)
      .join('\n');
  }, [lines]);

  // Handle save
  const handleSave = useCallback(() => {
    onSave(generateLrc());
  }, [generateLrc, onSave]);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-[80vh] flex flex-col">
      {/* Header with audio controls */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">LRC Line Editor</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-white text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Audio player */}
        <div className="flex items-center gap-3">
          <button
            onClick={isPlaying ? stopPlayback : () => audioRef.current?.play()}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={audioRef.current?.duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          <span className="text-sm font-mono">
            {formatTimestamp(currentTime)}
          </span>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setPlayingLineId(null);
          }}
        />
      </div>

      {/* Line editor list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {lines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No lyrics lines found.</p>
            <button
              onClick={() => addLine(null)}
              className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add first line
            </button>
          </div>
        ) : (
          lines.map((line, index) => {
            const isCurrentlyPlaying = playingLineId === line.id;
            return (
              <div
                key={line.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isCurrentlyPlaying ? 'bg-purple-100 border border-purple-300' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Line number */}
                <span className="text-xs text-gray-400 w-6 text-right">{index + 1}</span>

                {/* Timestamp input */}
                <input
                  type="text"
                  value={formatTimestamp(line.time)}
                  onChange={(e) => {
                    const parsed = parseTimestamp(e.target.value);
                    if (!isNaN(parsed)) {
                      updateLineTime(line.id, parsed);
                    }
                  }}
                  className="w-24 px-2 py-1 text-sm font-mono bg-white border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                {/* Set to current time button */}
                <button
                  onClick={() => setLineToCurrentTime(line.id)}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  title="Set to current audio time"
                >
                  ⏱️
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLineText(line.id, e.target.value)}
                  placeholder="Lyric text..."
                  className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                {/* Play from here */}
                <button
                  onClick={() =>
                    isCurrentlyPlaying ? stopPlayback() : playFromLine(line.id, line.time)
                  }
                  className={`p-1.5 rounded transition-colors ${
                    isCurrentlyPlaying
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                  title="Play from here"
                >
                  {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Move up/down */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveLine(line.id, 'up')}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveLine(line.id, 'down')}
                    disabled={index === lines.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Add line after */}
                <button
                  onClick={() => addLine(line.id)}
                  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Add line after"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Delete line */}
                <button
                  onClick={() => deleteLine(line.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete line"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer with line count */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {lines.length} line{lines.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => addLine(lines.length > 0 ? lines[lines.length - 1].id : null)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add line
        </button>
      </div>
    </div>
  );
}
