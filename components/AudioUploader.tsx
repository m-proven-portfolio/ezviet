'use client';

import { useState, useRef, useCallback } from 'react';
import { AudioPlayer } from './AudioPlayer';
import AudioRecorder from './AudioRecorder';

type AudioSource = 'auto' | 'admin' | 'community' | null;
type Region = 'south' | 'north' | null;

interface AudioUploaderProps {
  audioPath: string | null;
  audioSource: AudioSource;
  region: Region;
  termText: string;
  onAudioChange: (audioPath: string | null, audioSource: AudioSource) => void;
  onRegionChange?: (region: Region) => void;
  showRegionSelector?: boolean;
  disabled?: boolean;
  colorScheme?: 'emerald' | 'blue';
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/webm', 'audio/mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AudioUploader({
  audioPath,
  audioSource,
  region,
  termText,
  onAudioChange,
  onRegionChange,
  showRegionSelector = true,
  disabled = false,
  colorScheme = 'emerald',
}: AudioUploaderProps) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = colorScheme === 'emerald'
    ? {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700',
        button: 'bg-emerald-600 hover:bg-emerald-700',
        buttonOutline: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
      }
    : {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700',
        buttonOutline: 'border-blue-300 text-blue-600 hover:bg-blue-50',
      };

  // Upload audio file to API
  const uploadAudio = useCallback(async (file: File | Blob, filename?: string) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      if (file instanceof File) {
        formData.append('file', file);
      } else {
        // Blob from recording - create a File
        const ext = file.type.includes('webm') ? 'webm' : file.type.includes('mp4') ? 'm4a' : 'mp3';
        const recordedFile = new File([file], filename || `recording-${Date.now()}.${ext}`, {
          type: file.type,
        });
        formData.append('file', recordedFile);
      }
      formData.append('bucket', 'cards-audio');
      formData.append('region', region || 'south');

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onAudioChange(data.path, 'admin');
      setMode('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload audio';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, [region, onAudioChange]);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Please use MP3, WAV, or M4A.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 10MB.');
      return;
    }

    await uploadAudio(file);
  }, [uploadAudio]);

  // Handle recording complete
  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    const sanitizedText = termText
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    const filename = `${sanitizedText}-${region || 'south'}-${Date.now()}.webm`;
    await uploadAudio(blob, filename);
  }, [termText, region, uploadAudio]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to remove this audio?')) {
      onAudioChange(null, null);
    }
  }, [onAudioChange]);

  // Regenerate TTS audio from current text
  const handleRegenerateTTS = useCallback(async () => {
    if (!termText.trim()) {
      setUploadError('No Vietnamese text to generate audio from');
      return;
    }

    setIsRegenerating(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: termText,
          languageCode: 'vi-VN',
          voiceName: 'vi-VN-Wavenet-A',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      const data = await response.json();
      onAudioChange(data.path, 'auto');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate audio';
      setUploadError(message);
    } finally {
      setIsRegenerating(false);
    }
  }, [termText, onAudioChange]);

  // Source badge
  const SourceBadge = () => {
    if (!audioSource) return null;
    if (audioSource === 'auto') {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
          TTS
        </span>
      );
    }
    if (audioSource === 'admin') {
      return (
        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.badge} font-medium`}>
          Custom
        </span>
      );
    }
    return null;
  };

  // Recording mode
  if (mode === 'recording') {
    return (
      <div className={`p-4 ${colors.bg} rounded-lg border ${colors.border}`}>
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setMode('idle')}
          maxDuration={30}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Audio</span>
          <SourceBadge />
        </div>
      </div>

      {/* Current audio preview */}
      {audioPath && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <AudioPlayer audioPath={audioPath} text={termText} />
          </div>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="p-2 bg-red-50 rounded text-red-700 text-sm">{uploadError}</div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${colors.buttonOutline} disabled:opacity-50`}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Record button */}
        <button
          type="button"
          onClick={() => setMode('recording')}
          disabled={disabled || isUploading}
          className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${colors.buttonOutline} disabled:opacity-50 flex items-center gap-1`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          Record
        </button>

        {/* Delete button */}
        {audioPath && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled || isUploading || isRegenerating}
            className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        )}

        {/* Regenerate TTS button */}
        <button
          type="button"
          onClick={handleRegenerateTTS}
          disabled={disabled || isUploading || isRegenerating || !termText.trim()}
          className="px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRegenerating ? 'Generating...' : 'Regenerate TTS'}
        </button>
      </div>

      {/* Region selector */}
      {showRegionSelector && onRegionChange && (
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500 block mb-2">Region for this audio:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onRegionChange('south')}
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                region === 'south'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Southern
            </button>
            <button
              type="button"
              onClick={() => onRegionChange('north')}
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                region === 'north'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Northern
            </button>
            <button
              type="button"
              onClick={() => onRegionChange(null)}
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                region === null
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              N/A
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
