# Handover: Market Audio & Voice Recording System

**Date:** January 2026
**Commit:** `957eb18` - feat(market): add audio features and voice recording system

---

## What Was Built

### 1. Price Rounding (Complete)
All market prices now round to **10,000 VND increments** for realistic Vietnamese haggling.

**Files:** `lib/stores/marketStore.ts`
**Function:** `roundToNearest10k()` applied at 3 calculation points

---

### 2. Universal Voice Recording System (Complete - Ready for Extension)

A reusable system for recording, storing, and tracking voice progress across the entire app.

#### Database
```
Table: voice_recordings
├── id (UUID)
├── user_id (references auth.users)
├── context ('market' | 'flashcard' | 'tone_gym' | 'practice')
├── phrase_text (Vietnamese text spoken)
├── phrase_id (optional reference)
├── storage_path (Supabase Storage)
├── duration_ms
├── created_at
├── rating_count (for future community rating)
└── rating_sum (for future community rating)

Storage: voice-recordings bucket (5MB limit, WebM/MP4/WAV/OGG)
```

#### Key Files
| File | Purpose |
|------|---------|
| `lib/voice/types.ts` | TypeScript types + row-to-object converter |
| `app/api/voice/upload/route.ts` | Authenticated upload endpoint |
| `hooks/useVoiceRecording.ts` | Universal hook: record → upload → playback |
| `supabase/migrations/039_voice_recordings.sql` | DB + storage + RLS |

#### Usage Pattern
```tsx
const voice = useVoiceRecording({
  context: 'market',        // or 'flashcard', 'tone_gym', 'practice'
  phraseText: 'Đắt quá!',
  phraseId: 'dat-qua',      // optional
  maxDuration: 10,          // seconds
  onComplete: (recording) => { /* saved to DB */ },
});

// Actions
voice.startRecording();
voice.stopRecording();      // auto-uploads on stop
voice.playRecording();      // playback just-recorded audio
voice.reset();              // clear for new recording
```

---

### 3. Market TTS Audio System (Complete)

#### Files
| File | Purpose |
|------|---------|
| `lib/market/audioCache.ts` | Session cache (Map) for TTS URLs |
| `hooks/useMarketAudio.ts` | TTS generation + playback + caching |
| `components/market/AudioButton.tsx` | Reusable tap-to-hear button |

#### How It Works
1. `AudioButton` calls `useMarketAudio.playText(vietnameseText)`
2. Hook checks `audioCache` for cached URL
3. If miss: calls `/api/generate/tts` → gets base64 → creates blob URL → caches
4. Plays via HTMLAudioElement

---

### 4. Practice Prompt Flow (Complete)

After user selects a phrase (except walk-away/deal-closer):
1. **1.5s delay** → `PracticePrompt` overlay appears
2. User sees: Vietnamese + romanization + English
3. **[Listen]** → plays TTS
4. **[Record]** → uses `useVoiceRecording`
5. After recording → playback + encouragement message
6. **Auto-dismiss** after 5s or **[Done]** tap
7. Recording saved to `voice_recordings` table

---

## What's NOT Built Yet (Future Opportunities)

### Priority 1: Voice Progress Timeline
**Goal:** "See how you sounded 1 month ago vs now"

**Needs:**
- API route: `GET /api/voice/progress` - fetch user's recordings over time
- UI component: timeline view with playback
- Consider grouping by phrase/context

**Schema is ready:** `voice_recordings` already has `created_at`, `context`, `phrase_text`

### Priority 2: Community Rating System
**Goal:** Let users rate each other's pronunciation

**Needs:**
- Rating UI component (1-5 stars or thumbs up/down)
- API route: `POST /api/voice/rate` - submit rating
- Queue UI: `/community/rate` - pull recordings needing ratings
- Leaderboard/achievements for top raters

**Schema is ready:** `rating_count`, `rating_sum` columns exist

### Priority 3: AI Speech Analysis
**Goal:** Automated tone/pronunciation feedback

**Needs:**
- Speech-to-text API integration (Whisper, Google Speech, etc.)
- Tone analysis model (or heuristics)
- Scoring algorithm
- Replace encouragement messages with actual feedback

**When:** Wait for better Vietnamese speech models

### Priority 4: Expand to Other Contexts
The `useVoiceRecording` hook is designed to work anywhere:

- **Flashcards:** Add mic button to card detail page
- **Tone Gym:** Record tone practice attempts
- **VietQuest:** Voice-based challenges

Just pass the appropriate `context` to the hook.

---

## Architecture Notes

### Why Session Cache (not localStorage)?
- TTS audio URLs are large (~50KB base64)
- localStorage has 5MB limit
- Session cache auto-clears on refresh (no stale data)
- Same audio rarely needed across sessions

### Why Auto-Upload on Stop?
- Simpler UX (no "save" button needed)
- Data captured even if user dismisses quickly
- Can always delete later via future UI

### Why 10k VND Rounding?
- Matches real Vietnamese market culture
- 5k increments too granular for casual game
- Makes prices memorable (70k not 73.5k)

---

## Files Changed (Quick Reference)

### New Files (8)
```
app/api/voice/upload/route.ts      # Upload API
components/market/AudioButton.tsx   # Tap-to-hear button
components/market/PracticePrompt.tsx # Post-phrase overlay
hooks/useMarketAudio.ts            # TTS playback hook
hooks/useVoiceRecording.ts         # Recording + upload hook
lib/market/audioCache.ts           # Session TTS cache
lib/voice/types.ts                 # Voice recording types
supabase/migrations/039_voice_recordings.sql
```

### Modified Files (4)
```
lib/stores/marketStore.ts          # +roundToNearest10k()
components/market/MarketGame.tsx   # +PracticePrompt integration
components/market/PhraseSelector.tsx # +AudioButton +romanization
components/market/VendorDialogue.tsx # +AudioButton on vendor bubbles
```

---

## Testing Checklist

- [ ] Price changes show as multiples of 10,000đ
- [ ] Vendor message bubbles have speaker icon (top-right)
- [ ] Phrase buttons show romanization + speaker icon (left)
- [ ] Clicking speaker plays Vietnamese TTS
- [ ] After using phrase, practice prompt appears (~1.5s delay)
- [ ] Can listen to phrase in practice prompt
- [ ] Can record voice (mic permission prompt)
- [ ] Recording plays back with encouragement
- [ ] Check `voice_recordings` table for saved recording
- [ ] Works on mobile (375px)
- [ ] Sound effects play (tap on record, success on complete)

---

## Quick Wins for Next Session

1. **Add practice stats to progress display**
   - Show "Phrases practiced: X/27" alongside "Phrases learned"
   - Track in `marketStore.progress.phrasesPracticed`

2. **Add AudioButton to VendorCard**
   - Let users hear vendor greeting before selecting

3. **Persist TTS cache to sessionStorage**
   - Survives page navigation within session
   - Clear on tab close

4. **Add "Hear it again" after deal complete**
   - Replay key phrases from the negotiation

---

## Known Issues

1. **Practice prompt can overlap with walk-away callback**
   - If user walks away while prompt is showing
   - Low priority: rare edge case

2. **No offline support for TTS**
   - Requires network for audio generation
   - Could cache top 10 phrases in localStorage

3. **Recording quality varies by device**
   - Some mobile browsers have poor MediaRecorder support
   - Consider adding quality indicator

---

## Contact Points

- **TTS API:** `/api/generate/tts` (Google Cloud TTS, vi-VN voices)
- **Audio Storage:** Supabase `voice-recordings` bucket
- **Sound Effects:** `lib/vietquest/audioManager.ts` (procedural Web Audio)
- **Base Recorder:** `hooks/useAudioRecorder.ts` (MediaRecorder wrapper)

---

*Good luck making it legendary!* 🚀
