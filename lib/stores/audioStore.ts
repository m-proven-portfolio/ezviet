import { create } from 'zustand';
import type { CardSong } from '@/lib/supabase/types';
import type { TimingEntry, EditType } from '@/lib/lrc-sync';

/** Pre-computed edit entry for submission */
export interface DraftEditEntry {
  editType: EditType;
  lineIndex: number;
  originalTimestamp?: number;
  newTimestamp?: number;
  originalText?: string;
  newText?: string;
  deltaMagnitude?: number;
}

export type KaraokeMode = 'hidden' | 'sheet' | 'immersive';

// Karaoke Level System:
// 3 = Hero (Full screen Karaoke Hero game)
// 2 = Theater (One-third sheet view with lyrics)
// 1 = Footer (Mini player bar)
// 0 = Closed (No player visible)
export type KaraokeLevel = 0 | 1 | 2 | 3;

// Editor Mode System:
// 'none' = Normal playback mode
// 'feedback' = Showing feedback prompt
// 'sandbox' = Editing LRC in sandbox mode
// 'preview' = Previewing draft timings
export type EditorMode = 'none' | 'feedback' | 'sandbox' | 'preview';

interface AudioState {
  // Current playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioError: string | null; // Error message when audio fails to load

  // Current song/card info
  currentSong: CardSong | null;
  currentCardSlug: string | null;
  playlist: CardSong[];
  playlistIndex: number;

  // UI state - NEW: karaokeLevel controls the entire UI hierarchy
  karaokeLevel: KaraokeLevel;
  showLyrics: boolean;
  showMiniPlayer: boolean;
  miniPlayerDismissed: boolean; // User explicitly closed the mini-player
  karaokeMode: KaraokeMode; // Legacy - derived from karaokeLevel
  lyricsOffset: number; // Global timing offset in seconds (positive = earlier)
  showSyncMode: boolean; // Legacy - derived from karaokeLevel (true when level=3)

  // Source tracking (for handoff logic)
  source: 'flashcard' | 'fullpage' | null;

  // Community Editor State
  editorMode: EditorMode;
  draftTimings: TimingEntry[] | null;
  draftEdits: DraftEditEntry[] | null; // Pre-computed edits from SandboxLrcEditor
  feedbackPending: boolean;
  reportedLineIndices: number[];

  // Actions
  playSong: (song: CardSong, cardSlug: string, playlist?: CardSong[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  stop: () => void;
  dismissMiniPlayer: () => void; // Stop audio AND hide the persistent player
  toggleLyrics: () => void;
  setShowLyrics: (show: boolean) => void;
  setSource: (source: 'flashcard' | 'fullpage') => void;
  setKaraokeMode: (mode: KaraokeMode) => void;
  toggleKaraokeMode: () => void;
  setLyricsOffset: (offset: number) => void;
  setShowSyncMode: (show: boolean) => void;
  launchKaraokeHero: () => void; // Start game in immersive mode
  refreshCurrentSong: () => Promise<void>;

  // NEW: Karaoke Level System
  setKaraokeLevel: (level: KaraokeLevel) => void;
  stepDownKaraoke: () => void; // Reduces level by 1 (Hero→Theater→Footer→Closed)

  // Community Editor Actions
  setEditorMode: (mode: EditorMode) => void;
  setDraftTimings: (timings: TimingEntry[] | null) => void;
  setDraftEdits: (edits: DraftEditEntry[] | null) => void;
  setFeedbackPending: (pending: boolean) => void;
  reportLine: (lineIndex: number) => void;
  clearReports: () => void;
  enterSandboxEditor: () => void;
  exitSandboxEditor: () => void;
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;

  // Internal state updates (called by GlobalAudioPlayer)
  _setCurrentTime: (time: number) => void;
  _setDuration: (duration: number) => void;
  _setIsPlaying: (playing: boolean) => void;
  _setAudioError: (error: string | null) => void;
  clearAudioError: () => void;
  _audioRef: HTMLAudioElement | null;
  _setAudioRef: (ref: HTMLAudioElement | null) => void;
}

// Helper to sync legacy states from karaokeLevel
function getLegacyStates(level: KaraokeLevel) {
  return {
    showSyncMode: level === 3,
    karaokeMode: level === 3 ? 'immersive' as KaraokeMode : level === 2 ? 'sheet' as KaraokeMode : 'hidden' as KaraokeMode,
    showMiniPlayer: level >= 1,
  };
}

export const useAudioStore = create<AudioState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  audioError: null,
  currentSong: null,
  currentCardSlug: null,
  playlist: [],
  playlistIndex: 0,
  karaokeLevel: 0,
  showLyrics: false,
  showMiniPlayer: false,
  miniPlayerDismissed: false,
  karaokeMode: 'hidden',
  lyricsOffset: 0.8, // Default offset, can be adjusted by user
  showSyncMode: false,
  source: null,
  editorMode: 'none',
  draftTimings: null,
  draftEdits: null,
  feedbackPending: false,
  reportedLineIndices: [],
  _audioRef: null,

  // Actions
  playSong: (song, cardSlug, playlist = []) => {
    const state = get();
    const audioRef = state._audioRef;

    // Check if song has LRC lyrics (for Karaoke Hero)
    const hasLrcLyrics = !!song.lyrics_lrc;
    const hasAnyLyrics = hasLrcLyrics || !!song.lyrics_plain;

    // If same song, just resume and go back to Hero if it has LRC
    if (state.currentSong?.id === song.id && audioRef) {
      audioRef.play().catch(console.error);
      // Launch at Hero level if song has LRC, otherwise show mini player
      const targetLevel: KaraokeLevel = hasLrcLyrics ? 3 : 1;
      set({
        isPlaying: true,
        karaokeLevel: targetLevel,
        ...getLegacyStates(targetLevel),
        miniPlayerDismissed: false,
      });
      // Refresh in background to get any updated lyrics
      get().refreshCurrentSong();
      return;
    }

    // Find index in playlist
    const index = playlist.findIndex(s => s.id === song.id);

    // NEW: Auto-launch Karaoke Hero (level 3) if song has LRC lyrics
    // Otherwise, show mini player (level 1)
    const targetLevel: KaraokeLevel = hasLrcLyrics ? 3 : 1;

    set({
      currentSong: song,
      currentCardSlug: cardSlug,
      playlist: playlist.length > 0 ? playlist : [song],
      playlistIndex: index >= 0 ? index : 0,
      isPlaying: true,
      karaokeLevel: targetLevel,
      ...getLegacyStates(targetLevel),
      miniPlayerDismissed: false, // Reset when new song starts
      showLyrics: hasAnyLyrics,
      currentTime: 0,
      duration: song.duration_seconds || 0,
      audioError: null, // Clear any previous error
    });

    // Fetch fresh song data (especially lyrics) in background
    get().refreshCurrentSong();

    // Audio element will pick up the new song via useEffect
  },

  pause: () => {
    const audioRef = get()._audioRef;
    if (audioRef) {
      audioRef.pause();
    }
    set({ isPlaying: false });
  },

  resume: () => {
    const audioRef = get()._audioRef;
    if (audioRef) {
      audioRef.play().catch(console.error);
    }
    set({ isPlaying: true });
  },

  seek: (time) => {
    const audioRef = get()._audioRef;
    if (audioRef) {
      audioRef.currentTime = time;
    }
    set({ currentTime: time });
  },

  nextSong: () => {
    const state = get();
    const nextIndex = state.playlistIndex + 1;

    if (nextIndex < state.playlist.length) {
      const nextSong = state.playlist[nextIndex];
      set({
        currentSong: nextSong,
        playlistIndex: nextIndex,
        currentTime: 0,
        duration: nextSong.duration_seconds || 0,
      });
      // Refresh to get latest lyrics
      get().refreshCurrentSong();
    } else {
      // End of playlist
      set({ isPlaying: false });
    }
  },

  prevSong: () => {
    const state = get();
    const prevIndex = state.playlistIndex - 1;

    if (prevIndex >= 0) {
      const prevSong = state.playlist[prevIndex];
      set({
        currentSong: prevSong,
        playlistIndex: prevIndex,
        currentTime: 0,
        duration: prevSong.duration_seconds || 0,
      });
      // Refresh to get latest lyrics
      get().refreshCurrentSong();
    }
  },

  stop: () => {
    const audioRef = get()._audioRef;
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    set({
      isPlaying: false,
      currentSong: null,
      currentCardSlug: null,
      playlist: [],
      playlistIndex: 0,
      currentTime: 0,
      duration: 0,
      showLyrics: false,
      karaokeLevel: 0,
      ...getLegacyStates(0),
      source: null,
    });
  },

  dismissMiniPlayer: () => {
    const audioRef = get()._audioRef;
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    set({
      isPlaying: false,
      currentSong: null,
      currentCardSlug: null,
      playlist: [],
      playlistIndex: 0,
      currentTime: 0,
      duration: 0,
      showLyrics: false,
      karaokeLevel: 0,
      ...getLegacyStates(0),
      miniPlayerDismissed: true, // Mark as dismissed so persistent player stays hidden
      source: null,
    });
  },

  toggleLyrics: () => {
    set(state => ({ showLyrics: !state.showLyrics }));
  },

  setShowLyrics: (show) => {
    set({ showLyrics: show });
  },

  setSource: (source) => {
    set({ source });
  },

  setKaraokeMode: (mode) => {
    // Map legacy mode to level and sync
    const level: KaraokeLevel = mode === 'immersive' ? 2 : mode === 'sheet' ? 2 : 1;
    set({ karaokeLevel: level, ...getLegacyStates(level) });
  },

  toggleKaraokeMode: () => {
    const state = get();
    // Toggle between level 2 (theater/sheet) and level 3 (hero/immersive with sync)
    const newLevel: KaraokeLevel = state.karaokeLevel === 3 ? 2 : state.karaokeLevel === 2 ? 3 : 2;
    set({ karaokeLevel: newLevel, ...getLegacyStates(newLevel) });
  },

  setLyricsOffset: (offset) => {
    set({ lyricsOffset: offset });
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezviet-lyrics-offset', offset.toString());
    }
  },

  setShowSyncMode: (show) => {
    // Map to level system: showSyncMode=true means level 3
    const level: KaraokeLevel = show ? 3 : 2;
    set({ karaokeLevel: level, ...getLegacyStates(level) });
  },

  launchKaraokeHero: () => {
    // Level 3 = Hero mode (full screen with sync game)
    set({
      karaokeLevel: 3,
      ...getLegacyStates(3),
    });
  },

  refreshCurrentSong: async () => {
    const state = get();
    if (!state.currentSong?.id) return;

    try {
      const res = await fetch(`/api/songs/${state.currentSong.id}`);
      if (!res.ok) return;

      const freshSong = await res.json();

      // Recalculate karaoke level if song now has LRC lyrics
      const hasLrcLyrics = !!freshSong.lyrics_lrc;
      const currentLevel = state.karaokeLevel;

      // Only upgrade to level 3 if currently at level 1 and song has LRC
      // Don't downgrade if user manually changed level
      const shouldUpgradeLevel = currentLevel === 1 && hasLrcLyrics;

      // Update current song with fresh data (preserves playback state)
      set(prev => ({
        currentSong: freshSong,
        // Also update in playlist if present
        playlist: prev.playlist.map(s =>
          s.id === freshSong.id ? freshSong : s
        ),
        // Upgrade to hero mode if we now have LRC
        ...(shouldUpgradeLevel ? {
          karaokeLevel: 3 as KaraokeLevel,
          ...getLegacyStates(3),
        } : {}),
      }));
    } catch (error) {
      console.error('Failed to refresh song:', error);
    }
  },

  // NEW: Karaoke Level System
  setKaraokeLevel: (level) => {
    set({ karaokeLevel: level, ...getLegacyStates(level) });
  },

  stepDownKaraoke: () => {
    const state = get();
    const currentLevel = state.karaokeLevel;

    // Step down one level: 3→2→1→0
    if (currentLevel === 0) return; // Already closed

    const newLevel = (currentLevel - 1) as KaraokeLevel;

    if (newLevel === 0) {
      // Closing completely - stop audio
      const audioRef = state._audioRef;
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      set({
        isPlaying: false,
        currentSong: null,
        currentCardSlug: null,
        playlist: [],
        playlistIndex: 0,
        currentTime: 0,
        duration: 0,
        showLyrics: false,
        karaokeLevel: 0,
        ...getLegacyStates(0),
        miniPlayerDismissed: true,
        source: null,
        // Also reset editor state
        editorMode: 'none',
        draftTimings: null,
        draftEdits: null,
        feedbackPending: false,
        reportedLineIndices: [],
      });
    } else {
      // Just step down the UI level, keep playing
      set({ karaokeLevel: newLevel, ...getLegacyStates(newLevel) });
    }
  },

  // Community Editor Actions
  setEditorMode: (mode) => {
    set({ editorMode: mode });
  },

  setDraftTimings: (timings) => {
    set({ draftTimings: timings });
  },

  setDraftEdits: (edits) => {
    set({ draftEdits: edits });
  },

  setFeedbackPending: (pending) => {
    set({ feedbackPending: pending });
  },

  reportLine: (lineIndex) => {
    set((state) => ({
      reportedLineIndices: state.reportedLineIndices.includes(lineIndex)
        ? state.reportedLineIndices // Don't add duplicates
        : [...state.reportedLineIndices, lineIndex],
    }));
  },

  clearReports: () => {
    set({ reportedLineIndices: [] });
  },

  enterSandboxEditor: () => {
    // Enter sandbox mode at level 3 (full screen)
    set({
      editorMode: 'sandbox',
      karaokeLevel: 3,
      ...getLegacyStates(3),
    });
  },

  exitSandboxEditor: () => {
    // Return to normal playback mode
    set({
      editorMode: 'none',
      draftTimings: null,
      draftEdits: null,
    });
  },

  enterPreviewMode: () => {
    // Preview draft timings - keeps audio playing
    set({ editorMode: 'preview' });
  },

  exitPreviewMode: () => {
    // Return to sandbox editor
    set({ editorMode: 'sandbox' });
  },

  // Internal setters
  _setCurrentTime: (time) => set({ currentTime: time }),
  _setDuration: (duration) => set({ duration }),
  _setIsPlaying: (playing) => set({ isPlaying: playing }),
  _setAudioError: (error) => set({ audioError: error }),
  clearAudioError: () => set({ audioError: null }),
  _setAudioRef: (ref) => set({ _audioRef: ref }),
}));
