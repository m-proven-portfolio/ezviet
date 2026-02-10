'use client';

import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
  maxDuration?: number;
}

export default function AudioRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 30,
}: AudioRecorderProps) {
  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    isSupported,
    permissionStatus,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder({ maxDuration });

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700 text-sm">
        Audio recording is not supported in this browser. Please use Chrome, Firefox, or Safari.
      </div>
    );
  }

  // Permission denied
  if (permissionStatus === 'denied') {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
        <p className="font-medium">Microphone access denied</p>
        <p className="mt-1">Please enable microphone access in your browser settings to record audio.</p>
      </div>
    );
  }

  // Has recorded audio - show preview
  if (audioBlob && audioUrl && !isRecording) {
    return (
      <div className="space-y-3">
        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <audio src={audioUrl} controls className="flex-1 h-10" />
          <span className="text-sm text-gray-500">{formatDuration(duration)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearRecording}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Re-record
          </button>
          <button
            type="button"
            onClick={() => onRecordingComplete(audioBlob)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Use This
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Recording in progress
  if (isRecording) {
    return (
      <div className="space-y-3">
        {/* Recording indicator */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-3">
            {/* Pulsing dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-red-700 font-medium">Recording...</span>
          </div>
          <span className="text-red-600 font-mono text-lg">{formatDuration(duration)}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-100"
            style={{ width: `${(duration / maxDuration) * 100}%` }}
          />
        </div>

        {/* Stop button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={stopRecording}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop Recording
          </button>
          <button
            type="button"
            onClick={() => {
              stopRecording();
              clearRecording();
              onCancel();
            }}
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Ready to record
  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <button
        type="button"
        onClick={startRecording}
        className="w-full px-4 py-3 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        Start Recording
      </button>

      <p className="text-xs text-gray-500 text-center">
        Max duration: {maxDuration} seconds
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="w-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
