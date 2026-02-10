'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import type { VoiceContext, VoiceRecording } from '@/lib/voice/types';

export interface UseVoiceRecordingOptions {
  /** Where the recording is being made */
  context: VoiceContext;
  /** The Vietnamese text being spoken */
  phraseText: string;
  /** Optional reference ID (phrase ID, card slug, etc.) */
  phraseId?: string;
  /** Max recording duration in seconds (default: 15) */
  maxDuration?: number;
  /** Called when recording is uploaded successfully */
  onComplete?: (recording: VoiceRecording) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export interface UseVoiceRecordingReturn {
  // Recording state (from useAudioRecorder)
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  isSupported: boolean;
  error: string | null;

  // Recording actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;

  // Playback of just-recorded audio
  playRecording: () => void;
  stopPlayback: () => void;
  isPlaying: boolean;

  // Upload state
  isUploading: boolean;
  uploadError: string | null;

  // Result
  recording: VoiceRecording | null;
  hasRecording: boolean;

  // Reset for new recording
  reset: () => void;
}

export function useVoiceRecording(
  options: UseVoiceRecordingOptions
): UseVoiceRecordingReturn {
  const { context, phraseText, phraseId, maxDuration = 15, onComplete, onError } = options;

  // Base recorder
  const recorder = useAudioRecorder({
    maxDuration,
    onError,
  });

  // Additional state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio playback ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Upload recording to server
  const uploadRecording = useCallback(
    async (blob: Blob, durationMs: number) => {
      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append('audio', blob, `recording.${blob.type.split('/')[1] || 'webm'}`);
        formData.append('context', context);
        formData.append('phraseText', phraseText);
        if (phraseId) {
          formData.append('phraseId', phraseId);
        }
        formData.append('durationMs', durationMs.toString());

        const response = await fetch('/api/voice/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = (await response.json()) as VoiceRecording;
        setRecording(data);
        onComplete?.(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploadError(message);
        onError?.(message);
      } finally {
        setIsUploading(false);
      }
    },
    [context, phraseText, phraseId, onComplete, onError]
  );

  // Wrap stopRecording to auto-upload
  const stopRecording = useCallback(() => {
    recorder.stopRecording();
  }, [recorder]);

  // Watch for recording completion and auto-upload
  useEffect(() => {
    if (recorder.audioBlob && !recorder.isRecording && !isUploading && !recording) {
      // Convert duration from seconds to milliseconds
      const durationMs = recorder.duration * 1000;
      uploadRecording(recorder.audioBlob, durationMs);
    }
  }, [recorder.audioBlob, recorder.isRecording, recorder.duration, isUploading, recording, uploadRecording]);

  // Playback functions
  const playRecording = useCallback(() => {
    const url = recorder.audioUrl;
    if (!url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    audioRef.current.src = url;
    audioRef.current.play();
    setIsPlaying(true);
  }, [recorder.audioUrl]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  // Reset everything for a new recording
  const reset = useCallback(() => {
    recorder.clearRecording();
    setRecording(null);
    setUploadError(null);
    setIsUploading(false);
    stopPlayback();
  }, [recorder, stopPlayback]);

  return {
    // Recording state
    isRecording: recorder.isRecording,
    isPaused: recorder.isPaused,
    duration: recorder.duration,
    permissionStatus: recorder.permissionStatus,
    isSupported: recorder.isSupported,
    error: recorder.error,

    // Recording actions
    startRecording: recorder.startRecording,
    stopRecording,
    pauseRecording: recorder.pauseRecording,
    resumeRecording: recorder.resumeRecording,

    // Playback
    playRecording,
    stopPlayback,
    isPlaying,

    // Upload state
    isUploading,
    uploadError,

    // Result
    recording,
    hasRecording: !!recorder.audioBlob,

    // Reset
    reset,
  };
}
