'use client';

import { useCallback, useState } from 'react';
import {
  Play,
  Pause,
  Plus,
  X,
  Eye,
  Send,
  RotateCcw,
  Loader2,
  Rewind,
  FastForward,
} from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audioStore';
import { TimingFeedback, EditorPointsDisplay } from './TimingFeedback';
import { EditorLineItem } from './EditorLineItem';
import { PreviewOverlay } from './PreviewOverlay';
import { useEditorState } from '@/hooks/useEditorState';

interface SandboxLrcEditorProps {
  onClose: () => void;
  onPreview: () => void;
  onSubmitSuccess?: (pointsEarned: number) => void;
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

export function SandboxLrcEditor({
  onClose,
  onPreview,
  onSubmitSuccess,
}: SandboxLrcEditorProps) {
  const { setDraftEdits } = useAudioStore();

  const {
    visibleLines,
    isSubmitting,
    playingLineId,
    insertMenuLineId,
    draggedLineId,
    waitingForTapLineId,
    currentPlayheadIndex,
    changeStats,
    currentSong,
    currentTime,
    isPlaying,
    setInsertMenuLineId,
    updateLineTime,
    updateLineText,
    setLineToCurrentTime,
    deleteLine,
    addLine,
    playFromLine,
    stopPlayback,
    rewindBy,
    forwardBy,
    resume,
    seek,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleReset,
    handleSubmit,
    buildEditEntries,
  } = useEditorState({ onSubmitSuccess, onClose });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  }, []);

  // Toggle preview mode - shows karaoke-style playback preview
  const handlePreview = useCallback(() => {
    setDraftEdits(buildEditEntries());
    setIsPreviewMode(true);
    seek(0);
    resume();
  }, [setDraftEdits, buildEditEntries, seek, resume]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewMode(false);
    stopPlayback();
  }, [stopPlayback]);

  const handleRestartPreview = useCallback(() => {
    seek(0);
    resume();
  }, [seek, resume]);

  const handlePreviewPlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      resume();
    }
  }, [isPlaying, stopPlayback, resume]);

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-gray-900 via-purple-950 to-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-semibold">Edit Lyrics Timing</h2>
              <p className="text-white/50 text-sm truncate max-w-[200px]">
                {currentSong?.title || 'Unknown Song'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditorPointsDisplay className="hidden sm:flex" />

            {changeStats.total > 0 && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                {changeStats.total} change{changeStats.total !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSubmit}
              disabled={changeStats.total === 0 || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit
            </button>
          </div>
        </div>

        {/* Quick help bar */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-white/50 border-t border-white/5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400/50"></span>
            Now playing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400/50"></span>
            Modified
          </span>
          <span className="hidden sm:inline text-white/40">•</span>
          <span className="hidden sm:inline">Click ⏱️ to sync line to playhead</span>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-2 sm:gap-3 px-4 pb-4">
          <button
            onClick={() => rewindBy(5)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
            title="Rewind 5 seconds"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={isPlaying ? stopPlayback : resume}
            className="w-11 h-11 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full transition-colors text-white"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => forwardBy(5)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
            title="Forward 5 seconds"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={currentSong?.duration_seconds || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          <span className="text-sm font-mono text-white/70 w-16 text-right">
            {formatTimestamp(currentTime)}
          </span>
        </div>

        {/* Mobile points display */}
        <div className="sm:hidden px-4 pb-3">
          <EditorPointsDisplay />
        </div>
      </div>

      {/* Line editor list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {visibleLines.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <p>No lyrics lines found.</p>
            <button
              onClick={() => addLine(null)}
              className="mt-3 text-purple-400 hover:text-purple-300 font-medium"
            >
              + Add first line
            </button>
          </div>
        ) : (
          visibleLines.map((line, index) => {
            const isCurrentlyPlaying = playingLineId === line.id;
            const isAtPlayhead = index === currentPlayheadIndex;
            const isWaitingForTap = waitingForTapLineId === line.id;
            const hasTimingChange =
              line.originalTime !== undefined && Math.abs(line.time - line.originalTime) > 0.05;
            const hasTextChange =
              line.originalText !== undefined && line.text !== line.originalText;
            const isModified = hasTimingChange || hasTextChange || !!line.isNew;
            const isDragging = draggedLineId === line.id;
            const showInsertMenu = insertMenuLineId === line.id;

            return (
              <EditorLineItem
                key={line.id}
                line={line}
                index={index}
                isCurrentlyPlaying={isCurrentlyPlaying}
                isAtPlayhead={isAtPlayhead}
                isWaitingForTap={isWaitingForTap}
                isModified={isModified}
                isDragging={isDragging}
                showInsertMenu={showInsertMenu}
                formatTimestamp={formatTimestamp}
                parseTimestamp={parseTimestamp}
                updateLineTime={updateLineTime}
                updateLineText={updateLineText}
                setLineToCurrentTime={setLineToCurrentTime}
                deleteLine={deleteLine}
                addLine={addLine}
                playFromLine={playFromLine}
                stopPlayback={stopPlayback}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDoubleClick={handleDoubleClick}
                setInsertMenuLineId={setInsertMenuLineId}
              />
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 bg-black/50 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-white/50">
          <span>{visibleLines.length} lines</span>
          {changeStats.total > 0 && (
            <span className="text-yellow-400/70">
              {changeStats.timingChanges > 0 && `${changeStats.timingChanges} timing`}
              {changeStats.textChanges > 0 &&
                `${changeStats.timingChanges > 0 ? ', ' : ''}${changeStats.textChanges} text`}
              {changeStats.additions > 0 &&
                `${changeStats.timingChanges + changeStats.textChanges > 0 ? ', ' : ''}+${changeStats.additions} new`}
              {changeStats.deletions > 0 &&
                `${changeStats.timingChanges + changeStats.textChanges + changeStats.additions > 0 ? ', ' : ''}-${changeStats.deletions} removed`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={changeStats.total === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => addLine(visibleLines.length > 0 ? visibleLines[visibleLines.length - 1].id : null, 'below')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add line
          </button>
        </div>
      </div>

      {/* Gamification feedback - toasts and confetti */}
      <TimingFeedback bottomOffset={80} />

      {/* Preview Mode Overlay */}
      {isPreviewMode && (
        <PreviewOverlay
          lines={visibleLines}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onClose={handleClosePreview}
          onPlayPause={handlePreviewPlayPause}
          onRestart={handleRestartPreview}
        />
      )}
    </div>
  );
}