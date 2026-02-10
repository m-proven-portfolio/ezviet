'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Plus,
  Clock,
} from 'lucide-react';

interface EditableLine {
  id: string;
  time: number;
  text: string;
  originalTime?: number;
  originalText?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface EditorLineItemProps {
  line: EditableLine;
  index: number;
  // State flags
  isCurrentlyPlaying: boolean;
  isAtPlayhead: boolean;
  isWaitingForTap: boolean;
  isModified: boolean;
  isDragging: boolean;
  showInsertMenu: boolean;
  // Actions
  formatTimestamp: (time: number) => string;
  updateLineTime: (id: string, time: number) => void;
  updateLineText: (id: string, text: string) => void;
  setLineToCurrentTime: (id: string) => void;
  deleteLine: (id: string) => void;
  addLine: (refId: string, position: 'above' | 'below') => void;
  playFromLine: (id: string, time: number) => void;
  stopPlayback: () => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLInputElement>) => void;
  setInsertMenuLineId: (id: string | null) => void;
  parseTimestamp: (str: string) => number;
}

export function EditorLineItem({
  line,
  index,
  isCurrentlyPlaying,
  isAtPlayhead,
  isWaitingForTap,
  isModified,
  isDragging,
  showInsertMenu,
  formatTimestamp,
  updateLineTime,
  updateLineText,
  setLineToCurrentTime,
  deleteLine,
  addLine,
  playFromLine,
  stopPlayback,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDoubleClick,
  setInsertMenuLineId,
  parseTimestamp,
}: EditorLineItemProps) {
  // Local state for timestamp input - only commits on blur/Enter (prevents erratic jumping)
  const [localTimestamp, setLocalTimestamp] = useState(formatTimestamp(line.time));

  // Sync local state when line.time changes from external source (e.g., TAP TO TIME)
  useEffect(() => {
    setLocalTimestamp(formatTimestamp(line.time));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formatTimestamp is a pure function; only sync on line.time changes
  }, [line.time]);

  // Commit timestamp change on blur or Enter
  const commitTimestamp = () => {
    const parsed = parseTimestamp(localTimestamp);
    if (!isNaN(parsed) && parsed !== line.time) {
      updateLineTime(line.id, parsed);
    }
  };

  const handleTimestampKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // This triggers commitTimestamp via onBlur
    }
  };

  // Note: Drag-drop disabled - line position is controlled by timestamp (auto-sort)
  return (
    <div
      className={`group rounded-xl transition-all duration-300 ease-out ${
        isWaitingForTap
            ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20 animate-pulse'
            : isCurrentlyPlaying
              ? 'bg-purple-500/30 border-2 border-purple-400/60'
              : isAtPlayhead
                ? 'bg-emerald-500/25 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/10'
                : isModified
                  ? 'bg-amber-500/15 border-2 border-amber-400/40'
                  : 'bg-white/[0.08] hover:bg-white/[0.12] border-2 border-transparent hover:border-white/10'
      }`}
    >
      {/* MOBILE: Stacked layout */}
      <div className="sm:hidden p-3 space-y-2">
        {/* Row 1: Line number + Text input (full width) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50 w-6 text-right font-medium flex-shrink-0">
            {index + 1}
          </span>
          <input
            type="text"
            value={line.text}
            onChange={(e) => updateLineText(line.id, e.target.value)}
            onDoubleClick={onDoubleClick}
            placeholder="Type lyrics here..."
            className={`flex-1 px-3 py-2.5 text-base border-2 rounded-xl text-white placeholder-white/40 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all ${
              isWaitingForTap
                ? 'bg-cyan-500/20 border-cyan-400/50'
                : 'bg-white/15 border-white/25 focus:bg-white/20'
            }`}
          />
        </div>

        {/* Row 2: Timestamp + Actions */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={localTimestamp}
            onChange={(e) => setLocalTimestamp(e.target.value)}
            onBlur={commitTimestamp}
            onKeyDown={handleTimestampKeyDown}
            onDoubleClick={onDoubleClick}
            className={`w-24 px-2 py-2 text-sm font-mono border-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-purple-500 transition-all ${
              isWaitingForTap
                ? 'bg-cyan-500/20 border-cyan-400/50'
                : 'bg-white/15 border-white/25'
            }`}
          />

          {/* TAP button - BIG on mobile when waiting */}
          {isWaitingForTap ? (
            <button
              onClick={() => setLineToCurrentTime(line.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-cyan-500/40 active:scale-95 transition-transform"
            >
              <Clock className="w-6 h-6" />
              <span>TAP TO TIME!</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setLineToCurrentTime(line.id)}
                className="p-2.5 text-white/50 hover:text-cyan-400 hover:bg-cyan-500/15 rounded-lg transition-all active:scale-95"
                title="Set timing"
              >
                <Clock className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  isCurrentlyPlaying ? stopPlayback() : playFromLine(line.id, line.time)
                }
                className={`p-2.5 rounded-lg transition-all active:scale-95 ${
                  isCurrentlyPlaying
                    ? 'bg-purple-500 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/15'
                }`}
              >
                {isCurrentlyPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => addLine(line.id, 'below')}
                className="p-2.5 text-white/50 hover:text-emerald-400 hover:bg-emerald-500/15 rounded-lg transition-all active:scale-95"
                title="Add line at current time"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => deleteLine(line.id)}
                className="p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Waiting state: Show helpful tip */}
        {isWaitingForTap && (
          <p className="text-cyan-300/80 text-xs text-center">
            Use rewind/forward above to find the right moment, then tap!
          </p>
        )}
      </div>

      {/* DESKTOP: Horizontal layout */}
      <div className="hidden sm:flex items-center gap-3 p-4">
        {/* Line number */}
        <span className="text-sm text-white/50 w-6 text-right font-medium flex-shrink-0">
          {index + 1}
        </span>

        {/* Timestamp input + TAP TO TIME button */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="text"
            value={localTimestamp}
            onChange={(e) => setLocalTimestamp(e.target.value)}
            onBlur={commitTimestamp}
            onKeyDown={handleTimestampKeyDown}
            onDoubleClick={onDoubleClick}
            className={`w-28 px-3 py-2.5 text-sm font-mono border-2 rounded-xl text-white font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all selection:bg-purple-500/50 ${
              isWaitingForTap
                ? 'bg-cyan-500/20 border-cyan-400/50 focus:bg-cyan-500/30'
                : 'bg-white/15 border-white/25 focus:bg-white/20'
            }`}
          />
          {isWaitingForTap ? (
            <button
              onClick={() => setLineToCurrentTime(line.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-teal-400 transition-all active:scale-95 animate-bounce"
              title="Tap to set timing!"
            >
              <Clock className="w-5 h-5" />
              <span>TAP!</span>
            </button>
          ) : (
            <button
              onClick={() => setLineToCurrentTime(line.id)}
              className="p-2.5 text-white/50 hover:text-cyan-400 hover:bg-cyan-500/15 rounded-xl transition-all active:scale-95"
              title="Set to current playhead time"
            >
              <Clock className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Text input */}
        <input
          type="text"
          value={line.text}
          onChange={(e) => updateLineText(line.id, e.target.value)}
          onDoubleClick={onDoubleClick}
          placeholder="Lyric text..."
          className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-white/15 border-2 border-white/25 rounded-xl text-white placeholder-white/40 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white/20 transition-all selection:bg-purple-500/50"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() =>
              isCurrentlyPlaying ? stopPlayback() : playFromLine(line.id, line.time)
            }
            className={`p-2.5 rounded-xl transition-all active:scale-95 ${
              isCurrentlyPlaying
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/15'
            }`}
            title="Play from here"
          >
            {isCurrentlyPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={() => addLine(line.id, 'below')}
            className="p-2.5 text-white/50 hover:text-emerald-400 hover:bg-emerald-500/15 rounded-xl transition-all active:scale-95"
            title="Add line at current time"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={() => deleteLine(line.id)}
            className="p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/15 rounded-xl transition-all active:scale-95"
            title="Delete line"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
