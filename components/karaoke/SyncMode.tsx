'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Zap, RotateCcw, ChevronLeft, Pause, Play } from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audioStore';
import { parseLrc, type LrcLine } from '@/lib/lrc-parser';
import {
  evaluateTap,
  calculateSessionStats,
  type TimingEntry,
  type TapRating,
  type SyncSessionStats,
} from '@/lib/lrc-sync';
import type { VoteType } from '@/lib/lrc-voting';
import { SyncLyrics } from './SyncLyrics';
import { SyncResults } from './SyncResults';

interface SyncModeProps {
  onClose: () => void;
  onSubmit: (timings: TimingEntry[], stats: SyncSessionStats, userRating: VoteType) => Promise<void>;
}

type SyncState = 'countdown' | 'playing' | 'paused' | 'finished';

// Fun messages for auto-sync when user falls behind (~45 messages)
const AUTO_SYNC_MESSAGES_SLOW = [
  // Playful rerouting
  '🚀 Rerouting...',
  '⏩ Let me catch you up!',
  '😅 Oops, you dozed off!',
  '🏃 Running to catch up!',
  '⚡ Teleporting ahead...',
  '🎯 Back on track!',
  '🌟 Fast forwarding...',
  '💨 Whoooosh!',
  '🎬 Skipping ahead...',
  '⏭️ Jump cut!',
  // Cheeky comments
  '😴 Wakey wakey!',
  '🫣 Lost you for a sec!',
  '👀 There you are!',
  '🎪 And we\'re back!',
  '🔮 Time warp!',
  '🛸 Beam me up!',
  '🎢 Hold on tight!',
  '🌈 Catching the rainbow!',
  '🦘 Hop skip jump!',
  '🐇 Down the rabbit hole!',
  // Encouraging
  '💪 Let\'s go!',
  '🔥 Back in action!',
  '✨ Magic reset!',
  '🎵 Music waits for no one!',
  '🎤 The show must go on!',
  '🌊 Riding the wave!',
  '🚂 All aboard!',
  '🎠 Round we go!',
  '🎯 Recalibrating...',
  '📍 Repositioning...',
  // Fun Vietnamese-themed
  '🍜 Phở real, let\'s catch up!',
  '🏍️ Xe ôm to the rescue!',
  '☕ Cà phê break over!',
  '🎋 Bamboo bounce!',
  '🐉 Dragon dash!',
  '🌸 Lotus leap!',
  '🏮 Lantern light the way!',
  '🥢 Chopstick quick!',
  '🛵 Scooter zoom!',
  '🌴 Palm tree teleport!',
  // Misc playful
  '🎲 Rolling forward!',
  '🎰 Lucky sync!',
  '🪄 Abracadabra!',
  '🌀 Spinning ahead!',
  '🎪 Ta-da!',
];

// Fun messages for auto-sync when user is too fast (~45 messages)
const AUTO_SYNC_MESSAGES_FAST = [
  // Slow down messages
  '⏪ Whoa, slow down!',
  '🐢 Easy there, speed racer!',
  '😮 Ahead of the beat!',
  '🎵 Rewinding a bit...',
  '🦥 Sloth mode activated!',
  '🐌 Taking it easy...',
  '⏮️ Let\'s rewind!',
  '🔙 Back it up!',
  '🎬 Take two!',
  '🌙 Not so fast!',
  // Cheeky comments
  '😏 Eager beaver!',
  '🏎️ Slow your roll!',
  '🚦 Red light!',
  '✋ Hold up!',
  '🛑 Pit stop!',
  '⚓ Drop anchor!',
  '🪂 Parachute deploy!',
  '🧘 Breathe...',
  '☕ Take a sip!',
  '🎧 Feel the rhythm!',
  // Playful
  '🐰 Too hoppy!',
  '⚡ Too electric!',
  '🌪️ Tornado warning!',
  '🎢 Slow the ride!',
  '🎠 Easy on the carousel!',
  '🌊 Catch the wave!',
  '🏄 Surf\'s not up yet!',
  '🎯 Patience, grasshopper!',
  '🥋 Master says wait!',
  '🧙 The wizard waits!',
  // Time-themed
  '⏰ Time check!',
  '⌛ Hourglass flip!',
  '🕐 Clock reset!',
  '📅 Not yet!',
  '🗓️ Mark the moment!',
  '⏳ Patience pays!',
  '🔄 Sync in progress...',
  '🎵 Wait for the drop!',
  '🎶 Feel the beat first!',
  '🥁 Drum roll coming!',
  // Vietnamese-themed
  '🍜 Phở-cus on timing!',
  '🏍️ Traffic jam!',
  '🌸 Bloom slower!',
  '🎋 Bamboo bends!',
  '🐉 Dragon rests!',
];

// Subliminal learning messages (~90 powerful affirmations)
const SUBLIMINAL_MESSAGES = [
  // Confidence builders
  '✨ You\'re learning Vietnamese beautifully!',
  '🌟 Your brain is absorbing every word!',
  '💫 Vietnamese flows through you naturally!',
  '🎯 Perfect timing = perfect learning!',
  '🧠 Your mind is a Vietnamese sponge!',
  '⚡ Neural pathways forming right now!',
  '🔥 You\'re on fire with Vietnamese!',
  '💪 Stronger in Vietnamese every second!',
  '🚀 Your fluency is skyrocketing!',
  '🌈 Vietnamese colors your world!',
  // Progress acknowledgment
  '📈 Watch your Vietnamese level up!',
  '🎓 Future Vietnamese speaker in action!',
  '🏆 Champion learner detected!',
  '⭐ Star student energy!',
  '🎖️ Medal-worthy Vietnamese skills!',
  '👑 Vietnamese royalty in training!',
  '🥇 Gold-level learning happening!',
  '💎 Diamond-tier dedication!',
  '🌟 Shining bright in Vietnamese!',
  '✅ Vietnamese: unlocked!',
  // Brain & memory
  '🧬 Encoding Vietnamese into your DNA!',
  '💭 Dreams will be in Vietnamese soon!',
  '🔮 Your future self thanks you!',
  '🧩 Another piece of fluency clicked!',
  '📚 Building your Vietnamese library!',
  '🗝️ Unlocking Vietnamese secrets!',
  '💡 Lightbulb moments everywhere!',
  '🎪 Your brain loves this show!',
  '🌊 Riding waves of Vietnamese!',
  '🎨 Painting with Vietnamese words!',
  // Encouragement
  '💖 Vietnamese loves you back!',
  '🤗 Embrace the Vietnamese flow!',
  '😊 Smile - you\'re learning!',
  '🎉 Celebrate every syllable!',
  '🥳 Party in your brain right now!',
  '👏 Give yourself a mental high-five!',
  '🙌 You\'re crushing it!',
  '💯 100% learning mode activated!',
  '🎊 Confetti for your neurons!',
  '🌸 Vietnamese blooming in your mind!',
  // Cultural connection
  '🇻🇳 Vietnam welcomes you!',
  '🍜 Phở-nomenal progress!',
  '☕ Cà phê-powered learning!',
  '🏮 Lanterns light your path!',
  '🐉 Dragon energy in your learning!',
  '🌺 Lotus-level dedication!',
  '🎋 Bamboo-strong Vietnamese!',
  '🛵 Zooming through Vietnamese!',
  '🌴 Tropical fluency vibes!',
  '🏝️ Island of Vietnamese knowledge!',
  // Music & rhythm
  '🎵 Vietnamese is your new song!',
  '🎶 Melody of mastery!',
  '🎤 Karaoke making you fluent!',
  '🎧 Your ears are Vietnamese now!',
  '🥁 Drumming Vietnamese into memory!',
  '🎸 Rocking the Vietnamese language!',
  '🎹 Playing the keys of fluency!',
  '🎺 Trumpeting your success!',
  '🎻 Strings of Vietnamese attached!',
  '🪘 Beat of learning!',
  // Time & journey
  '⏰ Every second counts!',
  '🛤️ Journey to fluency continues!',
  '🚂 Vietnamese express - no stops!',
  '✈️ Flying high in Vietnamese!',
  '🌅 Dawn of your Vietnamese era!',
  '🌄 Mountain of progress climbed!',
  '🏃 Running towards fluency!',
  '🧗 Scaling Vietnamese heights!',
  '🚴 Pedaling to proficiency!',
  '🏊 Swimming in Vietnamese!',
  // Power statements
  '⚡ Supercharged Vietnamese mode!',
  '🦸 Vietnamese superhero unlocked!',
  '🔋 Learning batteries: FULL!',
  '💥 Explosion of knowledge!',
  '🌪️ Tornado of Vietnamese skills!',
  '🌋 Volcanic Vietnamese energy!',
  '☀️ Sunshine of understanding!',
  '🌙 Moonlit mastery!',
  '⭐ Starlight Vietnamese!',
  '🌌 Galaxy brain activated!',
  // Gentle reminders
  '🌱 Growing fluency, one word at a time',
  '🦋 Transforming into a speaker!',
  '🐣 Hatching Vietnamese skills!',
  '🌻 Blooming beautifully!',
  '🍀 Lucky to be learning!',
  '🌿 Organic Vietnamese growth!',
  '🍃 Leaves of language falling into place!',
  '🌸 Cherry blossom Vietnamese!',
  '🌺 Hibiscus-level beautiful!',
  '🌼 Daisy-fresh Vietnamese!',
];

// Auto-sync timeout (12 seconds of being significantly out of sync)
const AUTO_SYNC_TIMEOUT = 12000;

// Subliminal message component - flashes briefly at milestones
function SubliminalMessage({ currentLineIndex, totalLines }: { currentLineIndex: number; totalLines: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastMilestoneRef = useRef<number>(-1);

  useEffect(() => {
    if (totalLines === 0) return;

    const milestones = [0.25, 0.5, 0.75];

    // Find which milestone we just crossed
    for (const milestone of milestones) {
      const milestoneIndex = Math.floor(milestone * totalLines);
      if (currentLineIndex === milestoneIndex && lastMilestoneRef.current !== milestoneIndex) {
        lastMilestoneRef.current = milestoneIndex;

        // Pick a random message
        const randomMessage = SUBLIMINAL_MESSAGES[Math.floor(Math.random() * SUBLIMINAL_MESSAGES.length)];
        setMessage(randomMessage);
        setIsVisible(true);

        // Flash for 300ms, then fade out
        setTimeout(() => setIsVisible(false), 300);
        setTimeout(() => setMessage(null), 800); // Clear after fade
        break;
      }
    }
  }, [currentLineIndex, totalLines]);

  if (!message) return null;

  return (
    <div
      className={`text-center pb-2 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="text-emerald-400/90 text-sm font-medium">
        {message}
      </span>
    </div>
  );
}
// How far off (in seconds) before we consider user out of sync
const SYNC_THRESHOLD = 8;

export function SyncMode({ onClose, onSubmit }: SyncModeProps) {
  const { currentSong, currentTime, duration, isPlaying, seek, pause, resume, playlist, playlistIndex, nextSong } = useAudioStore();
  const enterSandboxEditor = useAudioStore((s) => s.enterSandboxEditor);

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [timings, setTimings] = useState<TimingEntry[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [lastTap, setLastTap] = useState<{ rating: TapRating; points: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSyncMessage, setAutoSyncMessage] = useState<string | null>(null);
  const lastTapTimeRef = useRef<number>(Date.now());

  // Parse lyrics
  const lines = useMemo<LrcLine[]>(() => {
    if (!currentSong?.lyrics_lrc) return [];
    return parseLrc(currentSong.lyrics_lrc);
  }, [currentSong?.lyrics_lrc]);

  // Calculate stats when finished
  const stats = useMemo<SyncSessionStats | null>(() => {
    if (syncState !== 'finished' || !currentSong?.lyrics_lrc) return null;
    return calculateSessionStats(currentSong.lyrics_lrc, timings);
  }, [syncState, currentSong?.lyrics_lrc, timings]);

  // Countdown effect
  useEffect(() => {
    if (syncState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Start playing
    seek(0);
    resume();
    setSyncState('playing');
  }, [syncState, countdown, seek, resume]);

  // Track audio position and detect end
  useEffect(() => {
    if (syncState !== 'playing') return;

    // Check if we've passed all lines OR if song has ended
    // Show results immediately when song finishes!
    const songEnded = duration > 0 && currentTime >= duration - 0.5; // 0.5s buffer
    const allLinesComplete = lines.length > 0 && currentLineIndex >= lines.length;

    if (songEnded || allLinesComplete) {
      setSyncState('finished');
    }
  }, [syncState, currentLineIndex, lines.length, currentTime, duration]);

  // Auto-sync detection - if user is significantly out of sync for too long, help them catch up
  useEffect(() => {
    if (syncState !== 'playing' || lines.length === 0) return;

    const checkAutoSync = setInterval(() => {
      const idleTime = Date.now() - lastTapTimeRef.current;

      // Only auto-sync after extended idle time
      if (idleTime < AUTO_SYNC_TIMEOUT) return;

      const currentLine = lines[currentLineIndex];
      if (!currentLine) return;

      // Calculate how far off the user is
      const timeDiff = currentTime - currentLine.time;

      // If significantly behind (audio is ahead of where user is)
      if (timeDiff > SYNC_THRESHOLD) {
        // Find the line that matches current audio time
        const targetLineIndex = lines.findIndex((line, idx) => {
          const nextLine = lines[idx + 1];
          return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });

        if (targetLineIndex > currentLineIndex && targetLineIndex < lines.length) {
          // Pick a random fun message
          const message = AUTO_SYNC_MESSAGES_SLOW[Math.floor(Math.random() * AUTO_SYNC_MESSAGES_SLOW.length)];
          setAutoSyncMessage(message);
          setCurrentLineIndex(targetLineIndex);
          setCurrentStreak(0); // Reset streak on auto-sync
          lastTapTimeRef.current = Date.now();

          // Clear message after 2 seconds
          setTimeout(() => setAutoSyncMessage(null), 2000);
        }
      }
      // If significantly ahead (user tapped too fast, audio is behind)
      else if (timeDiff < -SYNC_THRESHOLD && currentLineIndex > 0) {
        // Find the line that matches current audio time
        const targetLineIndex = lines.findIndex((line, idx) => {
          const nextLine = lines[idx + 1];
          return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });

        if (targetLineIndex >= 0 && targetLineIndex < currentLineIndex) {
          const message = AUTO_SYNC_MESSAGES_FAST[Math.floor(Math.random() * AUTO_SYNC_MESSAGES_FAST.length)];
          setAutoSyncMessage(message);
          setCurrentLineIndex(targetLineIndex);
          setCurrentStreak(0);
          lastTapTimeRef.current = Date.now();

          setTimeout(() => setAutoSyncMessage(null), 2000);
        }
      }
    }, 1000);

    return () => clearInterval(checkAutoSync);
  }, [syncState, lines, currentLineIndex, currentTime]);

  // Handle tap/spacebar
  const handleTap = useCallback(() => {
    if (syncState !== 'playing' || currentLineIndex >= lines.length) return;

    // Reset auto-sync timer on tap
    lastTapTimeRef.current = Date.now();
    setAutoSyncMessage(null);

    const currentLine = lines[currentLineIndex];
    const result = evaluateTap(currentTime, currentLine.time, currentStreak);

    // Record timing
    setTimings((prev) => [
      ...prev,
      {
        lineIndex: currentLineIndex,
        timestamp: currentTime,
        text: currentLine.text,
      },
    ]);

    // Update score and streak
    setScore((prev) => prev + result.points);
    setLastTap({ rating: result.rating, points: result.points });

    if (result.rating === 'miss') {
      setCurrentStreak(0);
    } else {
      setCurrentStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
    }

    // Move to next line
    const nextLineIndex = currentLineIndex + 1;
    setCurrentLineIndex(nextLineIndex);

    // Check if user is now WAY ahead of the music (tapping too fast)
    // This triggers immediately, not waiting for idle timeout
    const nextLine = lines[nextLineIndex];
    if (nextLine) {
      const aheadBy = nextLine.time - currentTime;
      // If more than 15 seconds ahead, auto-sync them back
      if (aheadBy > 15) {
        // Find the line that matches current audio time
        const targetLineIndex = lines.findIndex((line, idx) => {
          const followingLine = lines[idx + 1];
          return currentTime >= line.time && (!followingLine || currentTime < followingLine.time);
        });

        if (targetLineIndex >= 0 && targetLineIndex < nextLineIndex) {
          setTimeout(() => {
            const message = AUTO_SYNC_MESSAGES_FAST[Math.floor(Math.random() * AUTO_SYNC_MESSAGES_FAST.length)];
            setAutoSyncMessage(message);
            setCurrentLineIndex(targetLineIndex);
            setCurrentStreak(0);
            setTimeout(() => setAutoSyncMessage(null), 2000);
          }, 600); // Delay slightly so user sees their tap feedback first
        }
      }
    }

    // Clear tap feedback after animation
    setTimeout(() => setLastTap(null), 500);
  }, [syncState, currentLineIndex, lines, currentTime, currentStreak]);

  // Handle back (undo last tap)
  const handleBack = useCallback(() => {
    if (currentLineIndex <= 0) return;

    // Remove last timing entry
    setTimings((prev) => prev.slice(0, -1));

    // Go back one line
    setCurrentLineIndex((prev) => prev - 1);

    // Rewind audio to previous line's timestamp
    const prevLine = lines[currentLineIndex - 1];
    if (prevLine) {
      seek(Math.max(0, prevLine.time - 1)); // 1 second before the line
    }

    // Reset streak on undo
    setCurrentStreak(0);
  }, [currentLineIndex, lines, seek]);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (syncState === 'playing') {
      pause();
      setSyncState('paused');
    } else if (syncState === 'paused') {
      resume();
      setSyncState('playing');
    }
  }, [syncState, pause, resume]);

  // Handle reset (start over)
  const handleReset = useCallback(() => {
    setTimings([]);
    setCurrentLineIndex(0);
    setCurrentStreak(0);
    setScore(0);
    setLastTap(null);
    seek(0);
    resume();
  }, [seek, resume]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (syncState === 'playing') {
          handleTap();
        } else if (syncState === 'paused') {
          handlePauseResume();
        }
      } else if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'Backspace' && (syncState === 'playing' || syncState === 'paused')) {
        e.preventDefault();
        handleBack();
      } else if (e.code === 'KeyP' && (syncState === 'playing' || syncState === 'paused')) {
        handlePauseResume();
      } else if (e.code === 'KeyR' && (syncState === 'playing' || syncState === 'paused')) {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap, onClose, syncState, handleBack, handlePauseResume, handleReset]);

  // Handle submit with user rating
  const handleSubmit = async (userRating: VoteType) => {
    if (!stats) return;
    setIsSubmitting(true);
    try {
      await onSubmit(timings, stats, userRating);
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
      setIsSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setTimings([]);
    setCurrentLineIndex(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setScore(0);
    setLastTap(null);
    setCountdown(3);
    setSyncState('countdown');
  };

  // Handle next song
  const handleNextSong = () => {
    // Move to next song in playlist
    nextSong();
    // Reset state for new song
    setTimings([]);
    setCurrentLineIndex(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setScore(0);
    setLastTap(null);
    setCountdown(3);
    setSyncState('countdown');
  };

  // Check if there's a next song
  const hasNextSong = playlist.length > 1 && playlistIndex < playlist.length - 1;

  if (!currentSong || lines.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">No LRC lyrics available for this song</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-purple-900 via-indigo-950 to-black">
      {/* Header with branding, song info, and score */}
      <div className="absolute top-0 left-0 right-0 z-10">
        {/* Top row: EZViet branding + close button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              EZViet
            </span>
            <span className="text-white/40 text-xs">Karaoke Hero</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song info row */}
        <div className="text-center px-4 pb-2">
          <h2 className="text-white font-bold text-xl md:text-2xl truncate">
            {currentSong?.title || 'Unknown Song'}
          </h2>
          {currentSong?.artist && (
            <p className="text-white/60 text-sm">
              by {currentSong.artist}
            </p>
          )}
        </div>

        {/* Score row */}
        <div className="flex items-center justify-center gap-3 px-4 pb-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <span className="text-white font-black text-3xl md:text-4xl tabular-nums drop-shadow-lg">
            {score.toLocaleString()}
          </span>
          {currentStreak >= 5 && (
            <span className="text-orange-400 font-bold text-xl animate-pulse">
              {currentStreak}x
            </span>
          )}
        </div>

        {/* Subliminal learning message - flashes briefly at milestones (25%, 50%, 75%) */}
        <SubliminalMessage
          currentLineIndex={currentLineIndex}
          totalLines={lines.length}
        />
      </div>

      {/* Intro/Countdown overlay */}
      {syncState === 'countdown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900/95 via-indigo-950/95 to-black/95 z-20 px-6">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-2">
              EZViet Karaoke Hero
            </h1>
            <p className="text-purple-200/70 text-lg">Master Vietnamese through music</p>
          </div>

          {/* Big countdown number */}
          <div className="text-9xl font-bold text-white mb-8 animate-pulse tabular-nums">
            {countdown || '🚀'}
          </div>

          {/* Instruction based on countdown */}
          <div className="text-center max-w-md">
            {countdown === 3 && (
              <div className="animate-fade-in">
                <div className="text-3xl mb-2">👆</div>
                <p className="text-xl text-white font-medium">Tap when you hear the phrase starting</p>
              </div>
            )}
            {countdown === 2 && (
              <div className="animate-fade-in">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-xl text-white font-medium">Win points for perfect timing</p>
              </div>
            )}
            {countdown === 1 && (
              <div className="animate-fade-in">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-xl text-white font-medium">Learn fast, let&apos;s go!</p>
              </div>
            )}
            {countdown === 0 && (
              <div className="animate-bounce">
                <p className="text-2xl text-yellow-400 font-bold uppercase tracking-wider">Get ready!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lyrics display - show in both playing and paused states */}
      {(syncState === 'playing' || syncState === 'paused') && (
        <SyncLyrics
          lines={lines}
          currentLineIndex={currentLineIndex}
          currentTime={currentTime}
          lastTap={lastTap}
          onTap={syncState === 'playing' ? handleTap : handlePauseResume}
          onOpenEditor={enterSandboxEditor}
          autoSyncMessage={autoSyncMessage}
        />
      )}

      {/* Paused overlay */}
      {syncState === 'paused' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-4xl font-bold text-white">PAUSED</div>
        </div>
      )}

      {/* Results screen */}
      {syncState === 'finished' && stats && (
        <SyncResults
          stats={stats}
          songId={currentSong.id}
          songTitle={currentSong.title}
          onSubmit={handleSubmit}
          onRetry={handleRetry}
          onClose={onClose}
          onNextSong={handleNextSong}
          onOpenEditor={enterSandboxEditor}
          hasNextSong={hasNextSong}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Progress indicator and controls */}
      {(syncState === 'playing' || syncState === 'paused') && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          {/* Control buttons */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handleBack}
              disabled={currentLineIndex <= 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              title="Back (Backspace)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              onClick={handlePauseResume}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
              title="Pause/Resume (P)"
            >
              {syncState === 'paused' ? (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              title="Reset (R)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Stats line */}
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <span>{currentLineIndex}/{lines.length} lines</span>
            <span className="flex-1" />
            <span>Best streak: {bestStreak}</span>
          </div>

          {/* Dual progress bar - lyrics progress + song position */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Lyrics progress (what user has tapped through) */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all rounded-full"
              style={{ width: `${(currentLineIndex / lines.length) * 100}%` }}
            />
            {/* Song position indicator (where the music is) */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-all rounded-full"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-white/50 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              Your progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Song position
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
