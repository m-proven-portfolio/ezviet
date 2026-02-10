'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Music, Loader2, Check, AlertCircle } from 'lucide-react';

// Default music genres for Vietnamese learning songs
const DEFAULT_GENRES = [
  'Lo-Fi', 'Hip-Hop', 'Vina House', 'Pop', 'Ballad', 'EDM', 'R&B', 'Acoustic',
];

interface UploadFile {
  id: string;
  file: File;
  storagePath?: string;
  genre: string;
  variationLabel: string;
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'error';
  error?: string;
  metadata?: {
    title: string;
    artist: string | null;
    duration_seconds: number | null;
    cover_image_path: string | null;
  };
}

interface ParentSong {
  id: string;
  title: string;
  artist: string | null;
  hasLrc: boolean;
}

interface BulkSongUploaderProps {
  cardId: string;
  existingSongs: ParentSong[];
  onComplete: () => void;
  onCancel: () => void;
}

export default function BulkSongUploader({
  cardId,
  existingSongs,
  onComplete,
  onCancel,
}: BulkSongUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [parentSongId, setParentSongId] = useState<string>('');
  const [cloneLrc, setCloneLrc] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parentSong = existingSongs.find((s) => s.id === parentSongId);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles)
      .filter((f) => f.type.includes('audio/mpeg') || f.name.endsWith('.mp3'))
      .map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        genre: '',
        variationLabel: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        status: 'pending' as const,
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Step 1: Get signed URLs for all files
    const pendingFiles = files.filter((f) => f.status === 'pending');
    const fileData = pendingFiles.map((f) => ({ filename: f.file.name }));

    try {
      const urlRes = await fetch('/api/songs/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData }),
      });

      if (!urlRes.ok) throw new Error('Failed to get upload URLs');
      const { uploads } = await urlRes.json();

      // Step 2: Upload files in parallel and collect results
      // NOTE: We collect results in a local array because React state updates are async
      // and won't be reflected in the `files` state within this function execution
      interface UploadResult {
        storagePath: string;
        variationLabel: string;
        genre: string;
        metadata?: {
          title: string;
          artist: string | null;
          duration_seconds: number | null;
          cover_image_path: string | null;
        };
      }

      const uploadResults: UploadResult[] = [];

      await Promise.all(
        pendingFiles.map(async (uploadFile, index) => {
          const uploadInfo = uploads[index];
          if (!uploadInfo?.signedUrl) {
            updateFile(uploadFile.id, { status: 'error', error: 'No upload URL' });
            return;
          }

          updateFile(uploadFile.id, { status: 'uploading' });

          try {
            // Upload to Supabase
            const uploadRes = await fetch(uploadInfo.signedUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'audio/mpeg' },
              body: uploadFile.file,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            updateFile(uploadFile.id, { status: 'extracting', storagePath: uploadInfo.storagePath });

            // Extract metadata
            const metaRes = await fetch('/api/songs/extract-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storagePath: uploadInfo.storagePath }),
            });

            let metadata: UploadResult['metadata'];
            if (metaRes.ok) {
              const meta = await metaRes.json();
              metadata = {
                title: meta.title,
                artist: meta.artist,
                duration_seconds: meta.duration_seconds,
                cover_image_path: meta.cover_image_path,
              };
              updateFile(uploadFile.id, { status: 'done', metadata });
            } else {
              updateFile(uploadFile.id, { status: 'done' });
            }

            // Collect the result in our local array (not dependent on React state)
            uploadResults.push({
              storagePath: uploadInfo.storagePath,
              variationLabel: uploadFile.variationLabel,
              genre: uploadFile.genre,
              metadata,
            });
          } catch {
            updateFile(uploadFile.id, { status: 'error', error: 'Upload failed' });
          }
        })
      );

      // Step 3: Create variations if parent selected
      // Use uploadResults (local array) instead of files state (stale closure)
      const successfulFiles = uploadResults;

      if (parentSongId && successfulFiles.length > 0) {
        const variations = successfulFiles.map((f) => ({
          storage_path: f.storagePath,
          title: f.metadata?.title || f.variationLabel,
          genre: f.genre || null,
          genres: f.genre ? [f.genre] : null,
          variation_label: f.variationLabel,
          artist: f.metadata?.artist ?? null,
          duration_seconds: f.metadata?.duration_seconds ?? null,
          cover_image_path: f.metadata?.cover_image_path ?? null,
        }));

        await fetch(`/api/songs/${parentSongId}/variations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variations, cloneLrc, userId: 'admin' }),
        });
      } else if (successfulFiles.length > 0) {
        // Create as standalone songs
        for (const f of successfulFiles) {
          await fetch(`/api/cards/${cardId}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storage_path: f.storagePath,
              title: f.metadata?.title || f.variationLabel,
              genre: f.genre || null,
              genres: f.genre ? [f.genre] : null,
              artist: f.metadata?.artist ?? null,
              duration_seconds: f.metadata?.duration_seconds ?? null,
              cover_image_path: f.metadata?.cover_image_path ?? null,
            }),
          });
        }
      }

      onComplete();
    } catch (error) {
      console.error('Bulk upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const readyCount = files.filter((f) => f.status === 'pending' || f.status === 'done').length;
  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Songs</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Parent Song Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Create as variations of:
        </label>
        <select
          value={parentSongId}
          onChange={(e) => setParentSongId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
        >
          <option value="">New standalone songs</option>
          {existingSongs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.title} {song.hasLrc ? '(has LRC)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Clone LRC Checkbox */}
      {parentSongId && parentSong?.hasLrc && (
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={cloneLrc}
            onChange={(e) => setCloneLrc(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-purple-600"
          />
          <span className="text-sm text-gray-700">Clone LRC lyrics from parent</span>
        </label>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer
                   hover:border-purple-400 transition-colors mb-4"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">Drop MP3 files or click to select</p>
        <p className="text-xs text-gray-400 mt-1">Multiple files supported</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Music className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={f.variationLabel}
                onChange={(e) => updateFile(f.id, { variationLabel: e.target.value })}
                className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded text-gray-900"
                disabled={isUploading}
              />
              <select
                value={f.genre}
                onChange={(e) => updateFile(f.id, { genre: e.target.value })}
                className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-700"
                disabled={isUploading}
              >
                <option value="">Genre</option>
                {DEFAULT_GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {f.status === 'pending' && (
                <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
              {f.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
              {f.status === 'extracting' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              {f.status === 'done' && <Check className="w-4 h-4 text-green-600" />}
              {f.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={uploadAll}
          disabled={isUploading || readyCount === 0}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors relative overflow-hidden ${
            isUploading
              ? 'bg-purple-600 text-white cursor-wait'
              : readyCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {/* Animated progress background */}
          {isUploading && (
            <div
              className="absolute inset-0 bg-purple-500"
              style={{
                width: `${files.length > 0 ? (doneCount / files.length) * 100 : 0}%`,
                transition: 'width 0.3s ease-out',
              }}
            />
          )}
          {/* Shimmer effect while uploading */}
          {isUploading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
          {/* Button content */}
          <span className="relative flex items-center justify-center gap-2">
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isUploading ? `Uploading (${doneCount}/${files.length})...` : `Upload ${readyCount} files`}
          </span>
        </button>
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
