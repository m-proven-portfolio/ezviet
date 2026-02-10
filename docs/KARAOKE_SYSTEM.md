# EZViet Karaoke System - Technical Documentation

> Last updated: January 2025
>
> This document provides a comprehensive overview of the karaoke system for developers and AI assistants continuing work on this feature.

## Project Overview

EZViet is a Vietnamese language learning platform that uses **karaoke as the engagement hook**. Users learn Vietnamese vocabulary through flashcards, but the karaoke system ("Karaoke Hero") drives engagement and creates a community of contributors who improve timing accuracy.

## Core Philosophy

**"Human-first timing, community-powered quality"** - Users play karaoke, rate timing accuracy, and can fix issues themselves. This creates a flywheel:

```
Better timing → Better scores → More engagement → More contributors → Better timing
```

---

## Architecture Overview

### Karaoke Hero Game Flow

```
User plays song → Taps in sync with lyrics → Gets graded (S/A/B/C/D/F)
    ↓
Rating gate: "How was the timing?" → Great / Could be better / Fix it
    ↓
If "Fix it" → Opens SandboxLrcEditor (the lyrics timing editor)
    ↓
Edit submitted → Goes to moderation queue (or auto-approved if trust > 0.85)
    ↓
Moderator approves → Merged into live lyrics → Version history saved
```

### Component Hierarchy

```
GlobalKaraokeOverlay.tsx
├── SyncMode.tsx (game mode)
│   ├── SyncLyrics.tsx (lyrics display during gameplay)
│   └── SyncResults.tsx (post-game score + rating gate)
│       └── InlineRatingPrompt.tsx (Great/Off/Fix it buttons)
├── SandboxLrcEditor.tsx (timing editor)
└── PreviewMode.tsx (preview before submit)
```

---

## Key Files Reference

### Core Components

| File | Purpose | LOC |
|------|---------|-----|
| `components/karaoke/SyncMode.tsx` | Main karaoke game - countdown, tap detection, scoring, auto-sync | ~400 |
| `components/karaoke/SyncResults.tsx` | Post-game score display with rating gate | ~220 |
| `components/karaoke/SandboxLrcEditor.tsx` | LRC timing editor with drag-drop, insert above/below | ~580 |
| `components/karaoke/SyncLyrics.tsx` | Lyrics display during gameplay | ~150 |
| `components/karaoke/InlineRatingPrompt.tsx` | "How was timing?" prompt | ~140 |
| `components/GlobalKaraokeOverlay.tsx` | Orchestrates all karaoke modes | ~540 |

### State Management

| File | Purpose |
|------|---------|
| `lib/stores/audioStore.ts` | Zustand store for audio state, karaoke level, editor mode |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/lrc-edits/route.ts` | Edit submission API with trust scoring |
| `app/api/lrc-sync/submit/route.ts` | Sync session submission |
| `app/api/lrc-sync/merge/route.ts` | Moderator merge API with version history |
| `app/api/lrc-votes/route.ts` | User votes on timing accuracy |
| `app/api/leaderboard/route.ts` | Weekly contributor leaderboard |
| `app/api/songs/[songId]/contributors/route.ts` | Fetch merged contributors for a song |

### Libraries

| File | Purpose |
|------|---------|
| `lib/lrc-parser.ts` | Parse LRC format lyrics |
| `lib/lrc-sync.ts` | Tap evaluation, stats calculation, edit types |
| `lib/lrc-voting.ts` | Vote types and helpers |
| `lib/notifications.ts` | Server-side notification creation |
| `lib/notifications-types.ts` | Client-safe notification types |

---

## Database Schema (Supabase)

### Tables

```sql
-- All submissions (sync plays + edits)
lrc_submissions
├── id, song_id, user_id
├── submission_type: 'sync' | 'edit' | 'full_replace'
├── status: 'pending' | 'approved' | 'merged' | 'rejected'
├── points_earned, lines_count, best_streak
├── auto_approved: boolean
└── created_at

-- Individual line-level edits with diffs
lrc_edits
├── id, song_id, user_id, submission_id
├── edit_type: 'timing' | 'text' | 'add_line' | 'remove_line'
├── line_index
├── original_timestamp, new_timestamp
├── original_text, new_text
├── delta_magnitude
└── context_before, context_after (JSONB)

-- User votes on timing accuracy
lrc_votes
├── id, song_id, user_id
├── vote_type: 'accurate' | 'inaccurate' | 'edit'
├── accuracy_score_at_vote
└── vote_date (unique per user/song/day)

-- Full LRC content at each version for rollback
lrc_version_history
├── id, song_id
├── lyrics_lrc (full content)
├── change_type: 'initial' | 'merge' | 'rollback' | 'admin_edit'
├── version_number
├── changed_by, change_summary
└── submission_id

-- Prioritized moderation queue
lrc_review_queue
├── id, submission_id
├── priority_score
├── vote_count, negative_vote_ratio
├── submitter_trust_score, lines_changed
├── assigned_to, queue_status
└── escalation tracking

-- User contribution stats
lrc_contributors
├── user_id
├── total_points, trust_score
├── submissions_count, approved_count
└── last_submission_at
```

---

## Trust System

### Auto-Approval Logic

```typescript
// In app/api/lrc-edits/route.ts
const trustScore = contributor?.trust_score ?? 0;
const editCount = edits.length;

// Auto-approve if high trust and small edit
const autoApproved = trustScore > 0.85 && editCount < 5;

if (autoApproved) {
  status = 'approved';
} else {
  status = 'pending'; // Goes to moderation queue
}
```

### Trust Score Adjustment

```typescript
// After moderator reviews edit
if (status === 'approved' || status === 'merged') {
  trustScore = Math.min(1.0, trustScore + 0.05);
} else if (status === 'rejected') {
  trustScore = Math.max(0.0, trustScore - 0.10);
}
```

---

## Editor Features (SandboxLrcEditor)

### Current Features
- **Playhead indicator** - Emerald highlight shows current audio position
- **Better contrast** - `bg-white/15` with `border-2 border-white/25`
- **Larger inputs on mobile** - `text-base`, `py-2.5`, `w-24`
- **Double-click to select all** - Standard text editing behavior
- **Insert menu** - Choose "Insert above" or "Insert below"
- **Drag-and-drop reordering** - Grip handle on desktop
- **Visual states** - Dragging, playing, playhead, modified indicators

### Usage Flow
1. Play song, hear where timing is off
2. Click ⏱️ (clock) button to set line to current playhead time
3. Or manually edit timestamp/text
4. Preview changes
5. Submit (goes to queue or auto-approved)

---

## Karaoke Game Features (SyncMode)

### Gameplay
- **Countdown** - 3-2-1 with tips
- **Tap timing** - Evaluates Perfect/Good/OK/Miss
- **Scoring** - Points + streak multipliers (5x+)
- **Grades** - S (95%+), A (85%+), B (70%+), C (55%+), D (40%+), F (<40%)

### Auto-Sync
If user is idle 12s AND >8s out of sync:
- Catches them up automatically
- Shows fun message (Vietnamese-themed puns included!)
- Resets streak

### Subliminal Messages
Every 5 taps, shows positive affirmations:
- "Your brain is absorbing every word!"
- "Vietnamese flows through you naturally!"
- "Phở-nomenal progress!"

---

## Sprint 1 Deliverables (Completed)

### 1. Contributor Credits on Songs
- `components/karaoke/ContributorCredits.tsx`
- `app/api/songs/[songId]/contributors/route.ts`
- Shows who improved timing with tier badges

### 2. Notification System
- `lib/notifications.ts` - Server-side creation
- `lib/notifications-types.ts` - Client-safe types
- `components/NotificationBell.tsx` - Header bell with unread badge
- Push notifications with service worker (`public/sw.js`)

### 3. Weekly Leaderboard
- `app/community/leaderboard/page.tsx`
- `app/api/leaderboard/route.ts`
- Weekly point aggregation with user rank

### 4. Editor UX Improvements
- All features listed in Editor Features section above

---

## Future Roadmap

### Sprint 2: Mobile Quick Edit (High Priority)
The full editor is desktop-focused. Mobile needs simpler "tap-to-time":
- Play song, lyrics scroll vertically
- User taps when each LINE starts (not syllable)
- System interpolates syllable timing
- Much lower barrier to entry

### Future Phases
- **Vote Transparency** - "You and 47 others rated this accurate"
- **Song Health Dashboard** - Songs ranked by urgency, "adopt a song"
- **Achievement Badges** - Visual showcase on profiles
- **Version History UI** - Moderator rollback interface
- **AI-Assisted Timing** - Use Whisper for suggested timing

---

## Technical Notes

### Code Standards
- **No `any` types** - Use `unknown` with type guards
- **Max 300 LOC per component** - Split if approaching
- **Tailwind only** - No inline styles
- **Vietnamese-aware** - Use `slugify()` from `lib/utils.ts` for URLs

### Learning Cycles
- Cards refresh every 6 hours (midnight/6am/noon/6pm)
- Seen cards always accessible (review mode)
- New cards subject to tier limits

---

## Known Gaps

1. **No rollback UI** - Data exists in `lrc_version_history` but no moderator interface yet
2. **Mobile editing** - Full editor works but not optimized for tap-to-time
3. **Push notification backend** - `web-push` npm package not installed yet

---

## Quick Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # TypeScript check

# Database
npx supabase db push # Push migrations
```

---

*Cảm ơn bạn! (Thank you!) The Vietnamese learners are counting on you!* 🇻🇳🎤
