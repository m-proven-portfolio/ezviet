/**
 * VietQuest Audio Manager
 * 
 * Centralized audio system for:
 * - UI sound effects (tap, success, error)
 * - Ambient soundscapes
 * - TTS audio playback
 * - Volume control
 */

type SoundEffect = 'tap' | 'success' | 'error' | 'reward' | 'transition';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<SoundEffect, AudioBuffer> = new Map();
  private currentAmbient: HTMLAudioElement | null = null;
  private volume = 0.7;
  private enabled = true;

  initialize() {
    if (typeof window === 'undefined') return;
    
    // Create audio context on user interaction (browser requirement)
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play UI sound effect
   */
  playSound(effect: SoundEffect) {
    if (!this.enabled || typeof window === 'undefined') return;

    // Generate simple tones for UI feedback (no assets needed)
    this.initialize();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different sounds for different effects
    switch (effect) {
      case 'tap':
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.1 * this.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'success':
        // Happy ascending tone
        oscillator.frequency.setValueAtTime(523, now); // C5
        oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.15 * this.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'error':
        // Low buzz
        oscillator.frequency.value = 150;
        gainNode.gain.setValueAtTime(0.12 * this.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'reward':
        // Bright chime
        oscillator.frequency.setValueAtTime(1047, now); // C6
        oscillator.frequency.setValueAtTime(1319, now + 0.15); // E6
        gainNode.gain.setValueAtTime(0.2 * this.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;

      case 'transition':
        // Gentle whoosh
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        gainNode.gain.setValueAtTime(0.05 * this.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  }

  /**
   * Play TTS audio from URL
   */
  async playTTS(url: string): Promise<void> {
    if (!this.enabled) return;

    const audio = new Audio(url);
    audio.volume = this.volume;
    
    try {
      await audio.play();
    } catch (error) {
      console.warn('Failed to play TTS audio:', error);
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAmbient) {
      this.currentAmbient.volume = this.volume * 0.3; // Ambient quieter
    }
  }

  /**
   * Toggle audio on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.currentAmbient) {
      this.currentAmbient.pause();
    }
    return this.enabled;
  }

  /**
   * Check if audio is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
export const audioManager = new AudioManager();
