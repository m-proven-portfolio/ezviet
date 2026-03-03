'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import ImageCropper from '@/components/ImageCropper';
import { Volume2, Shuffle } from 'lucide-react';

type Step = 'welcome' | 'phrase' | 'experience';

// Phrases that teach something useful AND infer learning goal
const PHRASES = [
  {
    id: 'social',
    vietnamese: 'Xin chào',
    romanization: 'sin chow',
    english: 'Hello',
    emoji: '👋',
  },
  {
    id: 'daily_life',
    vietnamese: 'Một cà phê',
    romanization: 'moht kah feh',
    english: 'One coffee',
    emoji: '☕',
  },
  {
    id: 'transport',
    vietnamese: 'Bao nhiêu?',
    romanization: 'bow nyew',
    english: 'How much?',
    emoji: '💰',
  },
  {
    id: 'exploring',
    vietnamese: null, // Will pick random
    romanization: null,
    english: 'Surprise me',
    emoji: '🎲',
  },
];

// Random phrases for "Surprise me"
const SURPRISE_PHRASES = [
  { vietnamese: 'Cảm ơn', romanization: 'kahm uhn', english: 'Thank you' },
  { vietnamese: 'Ngon quá!', romanization: 'ngon kwah', english: 'Delicious!' },
  { vietnamese: 'Tạm biệt', romanization: 'tahm bee-et', english: 'Goodbye' },
];

const LEVELS = [
  { id: 'beginner', label: 'Beginner', emoji: '🌱' },
  { id: 'intermediate', label: 'Some basics', emoji: '🌿' },
  { id: 'advanced', label: 'Conversational', emoji: '🌳' },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [step, setStep] = useState<Step>('welcome');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [learningGoal, setLearningGoal] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);

  // Phrase step state
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [learnedPhrase, setLearnedPhrase] = useState<{ vietnamese: string; romanization: string; english: string } | null>(null);
  const [lastPlayedSlow, setLastPlayedSlow] = useState(false); // Toggle between normal/slow like Google Translate

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Speak Vietnamese text using Web Speech API
  const speakVietnamese = useCallback((text: string, slow = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = slow ? 0.5 : 0.8; // Normal vs slow like Google Translate
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play phrase with speed toggle (tap again for slow)
  const handlePlayPhrase = useCallback(() => {
    if (!learnedPhrase) return;
    const playSlow = !lastPlayedSlow;
    setLastPlayedSlow(playSlow);
    speakVietnamese(learnedPhrase.vietnamese, playSlow);
  }, [learnedPhrase, lastPlayedSlow, speakVietnamese]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Try to get existing profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile exists, use it
    if (profileData) {
      setProfile(profileData as Profile);
      setDisplayName((profileData as Profile).display_name || '');
      setUsername((profileData as Profile).username || '');
      setAvatarUrl((profileData as Profile).avatar_url || null);

      // If already onboarded, redirect
      if ((profileData as Profile).onboarding_completed) {
        router.push(redirectTo);
        return;
      }
      setLoading(false);
      return;
    }

    // Profile doesn't exist - create it (trigger may have failed)
    // Generate username from Google name or email
    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'user';
    const baseUsername = googleName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'user';

    // Try to create profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: baseUsername + Math.floor(Math.random() * 1000), // Add random number to avoid conflicts
        display_name: googleName,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create profile:', insertError);
      setError('Failed to create profile. Please try again.');
      setLoading(false);
      return;
    }

    if (newProfile) {
      setProfile(newProfile as Profile);
      setDisplayName((newProfile as Profile).display_name || '');
      setUsername((newProfile as Profile).username || '');
      setAvatarUrl((newProfile as Profile).avatar_url || null);
    }

    setLoading(false);
  }

  async function checkUsername(newUsername: string) {
    if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-z0-9]+$/.test(newUsername)) {
      setUsernameError('Only lowercase letters and numbers allowed');
      return false;
    }

    if (newUsername === profile?.username) {
      setUsernameError(null);
      return true;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newUsername)
      .single();

    if (data) {
      setUsernameError('Username already taken');
      return false;
    }

    setUsernameError(null);
    return true;
  }

  async function handleAvatarCropped(blob: Blob) {
    setUploadingAvatar(true);
    setShowCropper(false);

    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      formData.append('bucket', 'avatars');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { publicUrl } = await response.json();
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleWelcomeSubmit() {
    const isValid = await checkUsername(username);
    if (!isValid) return;

    setSaving(true);
    const supabase = createClient();

    const updateData: { display_name: string; username: string; avatar_url?: string } = {
      display_name: displayName,
      username: username,
    };

    // Only update avatar_url if it changed
    if (avatarUrl && avatarUrl !== profile?.avatar_url) {
      updateData.avatar_url = avatarUrl;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile?.id);

    setSaving(false);

    if (updateError) {
      console.error('[onboarding] Welcome step failed:', updateError.message, updateError.details);
      setError('Failed to save profile');
      return;
    }

    setStep('phrase');
  }

  function handlePhraseSelect(phraseId: string) {
    const phrase = PHRASES.find(p => p.id === phraseId);
    if (!phrase) return;

    setSelectedPhrase(phraseId);
    setLearningGoal(phraseId);

    // Get the actual phrase to learn (handle "Surprise me")
    let actualPhrase: { vietnamese: string; romanization: string; english: string };
    if (phrase.vietnamese) {
      actualPhrase = {
        vietnamese: phrase.vietnamese,
        romanization: phrase.romanization!,
        english: phrase.english,
      };
    } else {
      // Random phrase for "Surprise me"
      const randomIndex = Math.floor(Math.random() * SURPRISE_PHRASES.length);
      actualPhrase = SURPRISE_PHRASES[randomIndex];
    }

    setLearnedPhrase(actualPhrase);
    speakVietnamese(actualPhrase.vietnamese);

    // Auto-advance after delay
    setTimeout(() => {
      setStep('experience');
    }, 1800);
  }

  async function handleExperienceSubmit() {
    if (!experienceLevel) return;

    setSaving(true);
    const supabase = createClient();

    // Only set experience_level and onboarding_completed so the update always succeeds regardless of
    // learning_goal constraint (old: travel|heritage|business|fun vs new: daily_life|social|...).
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        experience_level: experienceLevel,
        onboarding_completed: true,
      })
      .eq('id', profile?.id);

    setSaving(false);

    if (updateError) {
      console.error('[onboarding] Complete step failed:', updateError.message, updateError.details);
      setError('Failed to complete onboarding');
      return;
    }

    router.push(redirectTo);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress indicator - clickable to go back */}
        <div className="flex justify-center mb-8 gap-2">
          {(['welcome', 'phrase', 'experience'] as Step[]).map((s, i) => {
            const currentIndex = ['welcome', 'phrase', 'experience'].indexOf(step);
            const canNavigate = i < currentIndex; // Can only go back, not forward

            return (
              <button
                key={s}
                onClick={() => canNavigate && setStep(s)}
                disabled={!canNavigate}
                className={`w-3 h-3 rounded-full transition-all ${
                  step === s
                    ? 'bg-emerald-500'
                    : i < currentIndex
                    ? 'bg-emerald-300 hover:bg-emerald-400 cursor-pointer'
                    : 'bg-gray-200 cursor-default'
                }`}
                aria-label={`Go to ${s} step`}
              />
            );
          })}
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to EZViet!
            </h1>
            <p className="text-gray-600 mb-6">
              Ready to start your Vietnamese learning journey?
            </p>

            {/* Clickable Avatar */}
            <button
              onClick={() => setShowCropper(true)}
              disabled={uploadingAvatar}
              className="relative mx-auto mb-6 group"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100 group-hover:border-emerald-300 transition-colors"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-100 group-hover:border-emerald-300 transition-colors">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {/* Edit overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {/* Loading spinner */}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <p className="text-sm text-gray-400 mb-4">Tap to change photo</p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setUsername(val);
                      setUsernameError(null);
                    }}
                    onBlur={() => checkUsername(username)}
                    className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 ${
                      usernameError ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="username"
                  />
                </div>
                {usernameError && (
                  <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  ezviet.org/@{username || 'username'}
                </p>
              </div>
            </div>

            <button
              onClick={handleWelcomeSubmit}
              disabled={saving || !displayName || !username || !!usernameError}
              className="w-full mt-6 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Phrase Step - Learn your first phrase */}
        {step === 'phrase' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Learn your first phrase
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              Tap one to hear it
            </p>

            <div className="space-y-3">
              {PHRASES.map((phrase) => {
                const isSelected = selectedPhrase === phrase.id;
                const showLearned = isSelected && learnedPhrase;

                return (
                  <button
                    key={phrase.id}
                    onClick={() => !selectedPhrase && handlePhraseSelect(phrase.id)}
                    disabled={!!selectedPhrase}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 scale-[1.02]'
                        : selectedPhrase
                        ? 'border-gray-100 bg-gray-50 opacity-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{phrase.emoji}</span>
                      <div className="flex-1 min-w-0">
                        {showLearned ? (
                          <>
                            <div className="font-bold text-xl text-gray-900">
                              {learnedPhrase.vietnamese}
                            </div>
                            <div className="text-sm text-emerald-600 font-medium">
                              /{learnedPhrase.romanization}/
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {learnedPhrase.english}
                            </div>
                          </>
                        ) : phrase.vietnamese ? (
                          <>
                            <div className="font-bold text-xl text-gray-900">
                              {phrase.vietnamese}
                            </div>
                            <div className="text-sm text-gray-400">
                              /{phrase.romanization}/
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {phrase.english}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <Shuffle className="w-4 h-4" />
                              {phrase.english}
                            </div>
                            <div className="text-sm text-gray-400">
                              Random first phrase
                            </div>
                          </>
                        )}
                      </div>
                      {!selectedPhrase && phrase.vietnamese && (
                        <Volume2 className="w-5 h-5 text-gray-300 mt-1" />
                      )}
                      {isSelected && (
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPhrase && (
              <p className="text-center text-sm text-emerald-600 mt-4 animate-pulse">
                Nice! Moving on...
              </p>
            )}
          </div>
        )}

        {/* Experience Step - Simplified */}
        {step === 'experience' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {learnedPhrase && (
              <button
                onClick={handlePlayPhrase}
                className="w-full text-center mb-6 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group"
              >
                <p className="text-sm text-emerald-600 mb-1">You just learned:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-bold text-gray-900">{learnedPhrase.vietnamese}</p>
                  <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-500">{learnedPhrase.english}</p>
              </button>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Vietnamese level?
            </h1>

            <div className="flex justify-center gap-3">
              {LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setExperienceLevel(level.id)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                    experienceLevel === level.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{level.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{level.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleExperienceSubmit}
              disabled={saving || !experienceLevel}
              className="w-full mt-6 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Starting...' : 'Start Learning'}
            </button>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          currentImage={avatarUrl || undefined}
          onImageCropped={handleAvatarCropped}
          onClose={() => setShowCropper(false)}
        />
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
