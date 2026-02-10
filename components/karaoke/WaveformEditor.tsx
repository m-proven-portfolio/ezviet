'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';
import type { SyllableTiming } from '@/lib/lrc-parser';

interface WaveformEditorProps {
  audioUrl: string;
  markers: SyllableTiming[];
  selectedMarkerIndex: number | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onMarkerChange: (index: number, newTime: number) => void;
  onMarkerSelect: (index: number) => void;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  /** Snap interval in seconds (default 0.1s). Set to 0 to disable. */
  snapInterval?: number;
  /** Whether to show grid lines at snap intervals */
  showGrid?: boolean;
}

// Snap time to nearest grid interval
function snapToGrid(time: number, interval: number): number {
  if (interval <= 0) return time;
  return Math.round(time / interval) * interval;
}

/**
 * WaveformEditor - Visual audio waveform with draggable timing markers
 *
 * Features:
 * - Canvas-based waveform visualization
 * - Draggable markers at syllable boundaries
 * - Click to seek, drag to adjust timing
 * - Zoom controls for precision
 */
export function WaveformEditor({
  audioUrl,
  markers,
  selectedMarkerIndex,
  currentTime,
  duration,
  isPlaying,
  onMarkerChange,
  onMarkerSelect,
  onSeek,
  onPlayPause,
  snapInterval = 0.1,
  showGrid = true,
}: WaveformEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftHeld, setShiftHeld] = useState(false);

  // Track shift key for disabling snap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Load and analyze audio
  useEffect(() => {
    if (!audioUrl) return;

    const loadAudio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Extract waveform data (downsampled for performance)
        const channelData = audioBuffer.getChannelData(0);
        const samples = 1000; // Number of samples to display
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j] || 0);
          }
          waveform.push(sum / blockSize);
        }

        // Normalize
        const max = Math.max(...waveform) || 1;
        setWaveformData(waveform.map(v => v / max));
      } catch (error) {
        console.error('Failed to load audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [audioUrl]);

  // Draw waveform and markers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const visibleDuration = duration / zoom;
    const startTime = scrollOffset;
    const endTime = startTime + visibleDuration;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines at snap intervals
    if (showGrid && snapInterval > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      // Calculate grid spacing based on zoom level
      // Use larger intervals when zoomed out for readability
      let gridInterval = snapInterval;
      const pixelsPerSecond = width / visibleDuration;
      while (pixelsPerSecond * gridInterval < 15) {
        gridInterval *= 2; // Double interval if lines would be too close
      }

      const firstGridTime = Math.ceil(startTime / gridInterval) * gridInterval;
      for (let t = firstGridTime; t <= endTime; t += gridInterval) {
        const x = ((t - startTime) / visibleDuration) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Draw time label every 0.5s or 1s depending on zoom
        if (gridInterval >= 0.5 || t % 0.5 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '9px monospace';
          ctx.fillText(t.toFixed(1) + 's', x + 2, height - 3);
        }
      }
    }

    // Draw waveform
    ctx.fillStyle = '#6366f1';
    const centerY = height / 2;
    const barWidth = width / waveformData.length * zoom;

    waveformData.forEach((value, i) => {
      const sampleTime = (i / waveformData.length) * duration;
      if (sampleTime < startTime || sampleTime > endTime) return;

      const x = ((sampleTime - startTime) / visibleDuration) * width;
      const barHeight = value * (height * 0.8);

      ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    });

    // Draw markers
    markers.forEach((marker, index) => {
      if (marker.startTime < startTime || marker.startTime > endTime) return;

      const x = ((marker.startTime - startTime) / visibleDuration) * width;
      const isSelected = index === selectedMarkerIndex;

      ctx.strokeStyle = isSelected ? '#f59e0b' : '#10b981';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw marker handle
      ctx.fillStyle = isSelected ? '#f59e0b' : '#10b981';
      ctx.beginPath();
      ctx.arc(x, 10, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw playhead
    if (currentTime >= startTime && currentTime <= endTime) {
      const playheadX = ((currentTime - startTime) / visibleDuration) * width;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [waveformData, markers, selectedMarkerIndex, currentTime, duration, zoom, scrollOffset, showGrid, snapInterval]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const visibleDuration = duration / zoom;
    const clickTime = scrollOffset + (x / canvas.width) * visibleDuration;

    // Check if clicking on a marker
    const markerIndex = markers.findIndex(m => {
      const markerX = ((m.startTime - scrollOffset) / visibleDuration) * canvas.width;
      return Math.abs(x - markerX) < 10;
    });

    if (markerIndex >= 0) {
      setIsDragging(markerIndex);
      onMarkerSelect(markerIndex);
    } else {
      onSeek(clickTime);
    }
  }, [duration, zoom, scrollOffset, markers, onMarkerSelect, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const visibleDuration = duration / zoom;
    let newTime = Math.max(0, Math.min(duration, scrollOffset + (x / canvas.width) * visibleDuration));

    // Apply magnetic snapping (hold Shift to disable)
    if (snapInterval > 0 && !shiftHeld) {
      newTime = snapToGrid(newTime, snapInterval);
    }

    onMarkerChange(isDragging, newTime);
  }, [isDragging, duration, zoom, scrollOffset, onMarkerChange, snapInterval, shiftHeld]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.5, 10));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.5, 1));

  // Handle scroll (for zoomed view)
  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (zoom > 1) {
      const maxScroll = duration - duration / zoom;
      setScrollOffset(o => Math.max(0, Math.min(maxScroll, o + e.deltaX * 0.01)));
    }
  }, [zoom, duration]);

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPlayPause}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="text-sm">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Snap indicator */}
          {snapInterval > 0 && (
            <div
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                shiftHeld
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-emerald-600/80 text-emerald-100'
              }`}
              title={shiftHeld ? 'Snap disabled (Shift held)' : `Snapping to ${snapInterval}s grid`}
            >
              {shiftHeld ? 'Free' : `Snap ${snapInterval}s`}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <span className="text-white/60 text-sm w-12 text-center">{zoom.toFixed(1)}x</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 10}
              className="p-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Waveform canvas */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden"
        onWheel={handleScroll}
      >
        {isLoading ? (
          <div className="h-24 flex items-center justify-center bg-gray-800 rounded-lg">
            <span className="text-white/60 text-sm">Loading waveform...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={800}
            height={100}
            className="w-full h-24 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        )}
      </div>

      {/* Time display */}
      <div className="flex justify-between mt-2 text-xs text-white/50">
        <span>{formatTime(scrollOffset)}</span>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        <span>{formatTime(scrollOffset + duration / zoom)}</span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
