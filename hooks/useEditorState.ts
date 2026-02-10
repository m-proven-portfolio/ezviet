'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { parseLrc, type LrcLine } from '@/lib/lrc-parser';
import { useAudioStore } from '@/lib/stores/audioStore';
import { useEditorGamificationStore } from '@/lib/stores/editorGamificationStore';
import type { EditType } from '@/lib/lrc-sync';

export interface EditableLine extends LrcLine {
  id: string;
  originalTime?: number;
  originalText?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ChangeStats {
  timingChanges: number;
  textChanges: number;
  additions: number;
  deletions: number;
  total: number;
}

interface UseEditorStateOptions {
  onSubmitSuccess?: (pointsEarned: number) => void;
  onClose: () => void;
}

export function useEditorState({ onSubmitSuccess, onClose }: UseEditorStateOptions) {
  const {
    currentSong,
    currentTime,
    isPlaying,
    pause,
    resume,
    seek,
    setDraftTimings,
  } = useAudioStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [insertMenuLineId, setInsertMenuLineId] = useState<string | null>(null);
  const [draggedLineId, setDraggedLineId] = useState<string | null>(null);
  const [waitingForTapLineId, setWaitingForTapLineId] = useState<string | null>(null);

  // Gamification
  const { recordLineTimed, resetSession } = useEditorGamificationStore();

  // Reset gamification session when editor opens
  useEffect(() => {
    resetSession();
  }, [resetSession]);

  // Helper: Sort lines by timestamp (for auto-sort feature)
  const sortLinesByTime = useCallback((linesToSort: EditableLine[]) => {
    return [...linesToSort].sort((a, b) => a.time - b.time);
  }, []);

  // Parse LRC into editable lines with unique IDs (sorted by timestamp)
  const [lines, setLines] = useState<EditableLine[]>(() => {
    const lrcContent = currentSong?.lyrics_lrc || '';
    const parsed = parseLrc(lrcContent);
    return parsed
      .map((line, idx) => ({
        ...line,
        id: `line-${idx}-${Date.now()}`,
        originalTime: line.time,
        originalText: line.text,
      }))
      .sort((a, b) => a.time - b.time); // Ensure initial sort
  });

  // Find the line that matches current playback time (playhead indicator)
  // Note: Lines are always sorted by timestamp, so we can break early once time > currentTime
  const currentPlayheadIndex = useMemo(() => {
    if (!isPlaying && playingLineId === null) return -1;
    const visibleLines = lines.filter((l) => !l.isDeleted);
    let matchIdx = -1;
    for (let i = 0; i < visibleLines.length; i++) {
      if (visibleLines[i].time <= currentTime) {
        matchIdx = i;
      } else {
        break; // Lines are sorted, so all remaining have time > currentTime
      }
    }
    return matchIdx;
  }, [lines, currentTime, isPlaying, playingLineId]);

  // Update draft timings in store whenever lines change
  useEffect(() => {
    const draftTimings = lines
      .filter((l) => !l.isDeleted)
      .map((l, idx) => ({
        lineIndex: idx,
        timestamp: l.time,
        text: l.text,
      }));
    setDraftTimings(draftTimings);
  }, [lines, setDraftTimings]);

  // Count changes for UI
  const changeStats = useMemo<ChangeStats>(() => {
    let timingChanges = 0;
    let textChanges = 0;
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.isNew) {
        additions++;
      } else if (line.isDeleted) {
        deletions++;
      } else {
        if (line.originalTime !== undefined && Math.abs(line.time - line.originalTime) > 0.05) {
          timingChanges++;
        }
        if (line.originalText !== undefined && line.text !== line.originalText) {
          textChanges++;
        }
      }
    }

    return { timingChanges, textChanges, additions, deletions, total: timingChanges + textChanges + additions + deletions };
  }, [lines]);

  // Play from specific line
  const playFromLine = useCallback(
    (lineId: string, time: number) => {
      seek(time);
      resume();
      setPlayingLineId(lineId);
    },
    [seek, resume]
  );

  // Stop playback
  const stopPlayback = useCallback(() => {
    pause();
    setPlayingLineId(null);
  }, [pause]);

  // Quick rewind/forward controls
  const rewindBy = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, currentTime - seconds);
      seek(newTime);
    },
    [currentTime, seek]
  );

  const forwardBy = useCallback(
    (seconds: number) => {
      const maxTime = currentSong?.duration_seconds || 300;
      const newTime = Math.min(maxTime, currentTime + seconds);
      seek(newTime);
    },
    [currentTime, seek, currentSong?.duration_seconds]
  );

  // Update line timestamp (with auto-sort)
  const updateLineTime = useCallback((id: string, newTime: number) => {
    setLines((prev) => {
      const updated = prev.map((line) =>
        line.id === id ? { ...line, time: newTime } : line
      );
      // Auto-sort by timestamp so visual order matches playback order
      return sortLinesByTime(updated);
    });
  }, [sortLinesByTime]);

  // Update line text
  const updateLineText = useCallback((id: string, newText: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, text: newText } : line))
    );
  }, []);

  // Set line to current audio time (TAP TO TIME!)
  const setLineToCurrentTime = useCallback(
    (id: string) => {
      updateLineTime(id, currentTime);

      if (waitingForTapLineId === id) {
        recordLineTimed();
        setWaitingForTapLineId(null);
        resume();
      } else {
        recordLineTimed();
      }
    },
    [updateLineTime, currentTime, waitingForTapLineId, recordLineTimed, resume]
  );

  // Delete line
  const deleteLine = useCallback((id: string) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id
          ? line.isNew
            ? { ...line, isDeleted: true }
            : { ...line, isDeleted: true }
          : line
      )
    );
  }, []);

  // Add new line - AUTO-PAUSES for tap-to-time flow, auto-sorts by timestamp
  const addLine = useCallback(
    (referenceId: string | null, _position: 'above' | 'below' = 'below') => {
      const newLineId = `line-new-${Date.now()}`;
      const newLine: EditableLine = {
        id: newLineId,
        time: currentTime,
        text: '',
        isNew: true,
      };

      // Add line and auto-sort - position is determined by timestamp, not insertion point
      setLines((prev) => sortLinesByTime([...prev, newLine]));
      setInsertMenuLineId(null);

      // AUTO-PAUSE and set waiting state for tap-to-time flow
      pause();
      setWaitingForTapLineId(newLineId);
    },
    [currentTime, pause, sortLinesByTime]
  );

  // Handle drag and drop reordering
  const handleDragStart = useCallback((lineId: string) => {
    setDraggedLineId(lineId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedLineId || draggedLineId === targetId) return;
    },
    [draggedLineId]
  );

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedLineId || draggedLineId === targetId) {
        setDraggedLineId(null);
        return;
      }

      setLines((prev) => {
        const draggedIdx = prev.findIndex((l) => l.id === draggedLineId);
        const targetIdx = prev.findIndex((l) => l.id === targetId);
        if (draggedIdx === -1 || targetIdx === -1) return prev;

        const copy = [...prev];
        const [dragged] = copy.splice(draggedIdx, 1);
        copy.splice(targetIdx, 0, dragged);
        return copy;
      });
      setDraggedLineId(null);
    },
    [draggedLineId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedLineId(null);
  }, []);

  // Close insert menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (insertMenuLineId) {
        setInsertMenuLineId(null);
      }
    };
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [insertMenuLineId]);

  // Reset all changes (sorted by timestamp)
  const handleReset = useCallback(() => {
    const lrcContent = currentSong?.lyrics_lrc || '';
    const parsed = parseLrc(lrcContent);
    setLines(
      parsed
        .map((line, idx) => ({
          ...line,
          id: `line-${idx}-${Date.now()}`,
          originalTime: line.time,
          originalText: line.text,
        }))
        .sort((a, b) => a.time - b.time) // Ensure sorted order
    );
  }, [currentSong?.lyrics_lrc]);

  // Build edit entries for submission
  const buildEditEntries = useCallback(() => {
    const edits: Array<{
      editType: EditType;
      lineIndex: number;
      originalTimestamp?: number;
      newTimestamp?: number;
      originalText?: string;
      newText?: string;
      deltaMagnitude?: number;
    }> = [];

    let visibleIndex = 0;
    for (const line of lines) {
      if (line.isDeleted && !line.isNew) {
        edits.push({
          editType: 'remove_line',
          lineIndex: visibleIndex,
          originalTimestamp: line.originalTime,
          originalText: line.originalText,
        });
        continue;
      }

      if (line.isNew && !line.isDeleted) {
        edits.push({
          editType: 'add_line',
          lineIndex: visibleIndex,
          newTimestamp: line.time,
          newText: line.text,
        });
        visibleIndex++;
        continue;
      }

      if (line.isDeleted) continue;

      if (line.originalTime !== undefined && Math.abs(line.time - line.originalTime) > 0.05) {
        edits.push({
          editType: 'timing',
          lineIndex: visibleIndex,
          originalTimestamp: line.originalTime,
          newTimestamp: line.time,
          originalText: line.originalText,
          deltaMagnitude: Math.abs(line.time - line.originalTime),
        });
      }

      if (line.originalText !== undefined && line.text !== line.originalText) {
        edits.push({
          editType: 'text',
          lineIndex: visibleIndex,
          originalText: line.originalText,
          newText: line.text,
        });
      }

      visibleIndex++;
    }

    return edits;
  }, [lines]);

  // Submit edits
  const handleSubmit = useCallback(async () => {
    if (!currentSong?.id || changeStats.total === 0) return;

    const edits = buildEditEntries();
    if (edits.length === 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/lrc-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: currentSong.id,
          edits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit edits');
      }

      onSubmitSuccess?.(data.pointsEarned);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSong?.id, changeStats.total, buildEditEntries, onSubmitSuccess, onClose]);

  const visibleLines = useMemo(() => lines.filter((l) => !l.isDeleted), [lines]);

  return {
    // State
    lines,
    visibleLines,
    isSubmitting,
    playingLineId,
    insertMenuLineId,
    draggedLineId,
    waitingForTapLineId,
    currentPlayheadIndex,
    changeStats,

    // Audio state (passed through)
    currentSong,
    currentTime,
    isPlaying,

    // Setters
    setInsertMenuLineId,

    // Line operations
    updateLineTime,
    updateLineText,
    setLineToCurrentTime,
    deleteLine,
    addLine,

    // Playback
    playFromLine,
    stopPlayback,
    rewindBy,
    forwardBy,
    resume,
    seek,

    // Drag and drop
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,

    // Actions
    handleReset,
    handleSubmit,
    buildEditEntries,
  };
}