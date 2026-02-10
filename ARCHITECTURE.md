# EZViet Architecture

> The blueprint for how EZViet works. Built for speed. Scales to millions.

## Core Principles

| Principle | Implementation |
|-----------|---------------|
| **Speed** | Edge caching, preloading, minimal bundles |
| **Scale** | Serverless, database pooling, CDN delivery |
| **Modular** | Small components, reusable hooks, clean APIs |

---

## System Overview

```
                     ┌─────────────────────┐
                     │    Vercel Edge      │ ← CDN + Edge Functions
                     │    (Middleware)     │    (Global, <50ms latency)
                     └──────────┬──────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   Static    │     │   Next.js   │     │   API       │
    │   Assets    │     │   Pages     │     │   Routes    │
    │   (CDN)     │     │   (SSR)     │     │   (Edge)    │
    └─────────────┘     └──────┬──────┘     └──────┬──────┘
                               │                   │
                               └────────┬──────────┘
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │     Supabase Cloud      │
                          │                         │
                          │  ┌─────────┐ ┌───────┐ │
                          │  │ Postgres│ │ Auth  │ │
                          │  │   +     │ │(OAuth)│ │
                          │  │ Pooling │ └───────┘ │
                          │  └─────────┘           │
                          │  ┌─────────────────┐   │
                          │  │    Storage      │   │
                          │  │  (CDN-backed)   │   │
                          │  └─────────────────┘   │
                          └─────────────────────────┘
```

---

## Speed Optimizations

### 1. Zero-Latency Card Preloading

```typescript
// We preload the NEXT 5 cards before user needs them
// See: lib/hooks/useImagePreloader.ts

const PRELOAD_COUNT = 5;

function preloadNextCards(cards: Card[], currentIndex: number) {
  const toPreload = cards.slice(currentIndex + 1, currentIndex + 1 + PRELOAD_COUNT);

  toPreload.forEach(card => {
    const img = new Image();
    img.src = getCardImageUrl(card.image_path);
  });
}
```

### 2. Server Components by Default

```tsx
// Pages fetch data on the server - NO loading spinners!
// app/learn/[slug]/page.tsx

export default async function LearnPage({ params }: Props) {
  const card = await getCard(params.slug);  // Server-side fetch

  return <Flashcard card={card} />;  // Hydrates instantly
}
```

### 3. Edge Middleware (Global, <50ms)

```typescript
// middleware.ts runs at the edge, closest to user
// - Session validation: <10ms
// - Redirects: instant
// - Admin protection: no round-trip to origin
```

### 4. CDN-First Asset Delivery

| Asset Type | Delivery | Latency |
|------------|----------|---------|
| Images | Supabase Storage CDN | <100ms global |
| Audio | Supabase Storage CDN | <100ms global |
| Static JS/CSS | Vercel Edge | <50ms global |
| Fonts | Self-hosted (public/) | <50ms global |

### 5. Optimistic UI Updates

```typescript
// Don't wait for server - update UI immediately
function handleLike(cardId: string) {
  // 1. Update UI instantly
  setLiked(true);

  // 2. Sync with server in background
  fetch('/api/cards/like', { method: 'POST', body: JSON.stringify({ cardId }) })
    .catch(() => setLiked(false));  // Rollback on error
}
```

---

## Scale Architecture (Millions of Users)

### Database: Connection Pooling

```typescript
// Supabase handles connection pooling automatically
// - PgBouncer in front of Postgres
// - Scales to 10,000+ concurrent connections
// - No code changes needed!

const supabase = createClient(url, key);  // Uses pooled connection
```

### Stateless Everything

```typescript
// NO server-side sessions - everything is stateless
// - Auth tokens in cookies
// - User data in Supabase
// - Progression in localStorage

// This means: ANY server can handle ANY request
// = Infinite horizontal scaling
```

### Rate Limiting (Built-in)

```typescript
// API routes should implement rate limiting for scale
// Supabase has built-in rate limits on auth endpoints

// For custom endpoints:
const RATE_LIMIT = 100;  // requests per minute

export async function POST(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  const requests = await getRequestCount(ip);

  if (requests > RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  // ... handle request
}
```

### Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| Card images | CDN | 1 year | URL versioning |
| Audio files | CDN | 1 year | URL versioning |
| Card data | None | - | Real-time updates |
| User profile | Client | 5 min | On mutation |
| Categories | CDN | 1 hour | Revalidation |

---

## Directory Structure

```
ezviet/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Home (flashcard deck)
│   ├── learn/[slug]/           # Dynamic card pages
│   │   ├── page.tsx            # SSR card content
│   │   └── loading.tsx         # Streaming fallback
│   ├── admin/                  # Protected admin routes
│   ├── api/                    # Edge API routes
│   │   ├── cards/              # Card CRUD
│   │   ├── tts/                # Text-to-speech
│   │   └── audio/              # Audio processing
│   └── layout.tsx              # Root layout (providers)
│
├── components/                 # Reusable UI (max 300 LOC each!)
│   ├── ui/                     # Base components (Button, Card, etc.)
│   ├── Flashcard.tsx           # Main flashcard
│   ├── FlashcardDeck.tsx       # Deck controller
│   └── admin/                  # Admin-only components
│
├── lib/                        # Business Logic & Utilities
│   ├── supabase/
│   │   ├── types.ts            # Generated DB types (DO NOT EDIT)
│   │   ├── client.ts           # Browser client (singleton)
│   │   └── server.ts           # Server client
│   ├── stores/
│   │   └── audioStore.ts       # Zustand (global audio state)
│   ├── tiers.ts                # User tier system
│   ├── progression.ts          # Learning progress tracking
│   └── utils.ts                # General utilities
│
├── hooks/                      # Custom React Hooks
│   ├── useAuth.ts              # Authentication
│   ├── useAudioRecorder.ts     # Audio recording
│   └── useImagePreloader.ts    # Preloading optimization
│
├── contexts/                   # React Contexts
│   └── AuthContext.tsx         # Global auth state
│
├── middleware.ts               # Edge middleware (auth, routing)
└── public/                     # Static assets (fonts, images)
```

---

## Data Models

### Core Entities

```typescript
// Cards - The vocabulary flashcards
interface Card {
  id: string;
  slug: string;           // URL-friendly: "con-meo"
  category_id: string;
  image_path: string;     // Supabase storage path
  difficulty: number;     // 1-5
  view_count: number;
  meta_description: string;
  show_north: boolean;
  created_at: string;
}

// Card Terms - Translations (one card, many translations)
interface CardTerm {
  id: string;
  card_id: string;
  lang: 'vi' | 'en';
  region: 'north' | 'south' | null;
  text: string;           // The word/phrase
  romanization: string;   // Phonetic spelling
  audio_path: string;     // TTS audio file
  audio_source: 'auto' | 'admin' | 'community';
}

// Card Songs - Music linked to cards
interface CardSong {
  id: string;
  card_id: string;
  slug: string;
  title: string;
  artist: string;
  storage_path: string;
  lyrics_lrc: string;     // Synced lyrics
  lyrics_plain: string;
  duration_seconds: number;
}

// User Profiles
interface Profile {
  id: string;
  username: string;
  display_name: string;
  learning_goal: 'travel' | 'heritage' | 'business' | 'fun';
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  cards_viewed: number;
  current_streak: number;
  is_admin: boolean;
  subscription_tier: string | null;
}
```

### Relationships

```
categories 1───────N cards
cards      1───────N card_terms
cards      1───────N card_songs
profiles   1───────N learning_history
```

---

## State Management

### Three Tiers (Keep It Simple!)

```
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
├─────────────────┬─────────────────┬─────────────────────┤
│   Server State  │   Global State  │    Local State      │
├─────────────────┼─────────────────┼─────────────────────┤
│ Supabase        │ Zustand Store   │ useState/useRef     │
│ - Cards         │ - Audio player  │ - Form inputs       │
│ - Profiles      │ - Auth context  │ - UI toggles        │
│ - Categories    │                 │ - Animations        │
├─────────────────┼─────────────────┼─────────────────────┤
│ Fetch on server │ Singleton       │ Per-component       │
│ Real-time subs  │ Persists        │ Ephemeral           │
└─────────────────┴─────────────────┴─────────────────────┘
```

### Global Audio State (Zustand)

```typescript
// lib/stores/audioStore.ts
// Singleton - same audio player across ALL pages

interface AudioState {
  currentSong: CardSong | null;
  isPlaying: boolean;
  playlist: CardSong[];
  currentCardSlug: string | null;

  playSong: (song: CardSong, cardSlug: string, playlist?: CardSong[]) => void;
  pause: () => void;
  resume: () => void;
  nextSong: () => void;
  previousSong: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  // ... implementation
}));
```

### Auth Context

```typescript
// contexts/AuthContext.tsx
// Provides user state to entire app

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  tier: UserTier;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
```

---

## Authentication Flow

```
1. User clicks "Sign in with Google"
         │
         ▼
2. Redirect to Supabase Auth (Google OAuth)
         │
         ▼
3. Google authenticates user
         │
         ▼
4. Redirect to /auth/callback
         │
         ▼
5. Callback creates session cookie
         │
         ▼
6. Middleware validates on EVERY request (edge, <10ms)
         │
         ▼
7. AuthContext provides user state to components
```

---

## Tier System

```
┌─────────────────────────────────────────────────────────┐
│                      User Tiers                          │
├──────────┬────────────────┬─────────────────────────────┤
│   Tier   │ Cards/6hr Cycle │          Access             │
├──────────┼────────────────┼─────────────────────────────┤
│  GUEST   │       6        │ Limited, no progress save   │
│  FREE    │      12        │ Basic learning features     │
│  PLUS    │      30        │ Extended learning           │
│  PRO     │   Unlimited    │ Full access                 │
│  ADMIN   │   Unlimited    │ Full access + admin panel   │
└──────────┴────────────────┴─────────────────────────────┘

Note: 6-hour cycles (not daily) for micro-learning rhythm
Cycle times: midnight, 6am, noon, 6pm
```

---

## API Design

### RESTful Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/cards` | List cards | Public |
| GET | `/api/cards/random` | Random cards | Public |
| POST | `/api/cards` | Create card | Admin |
| GET | `/api/cards/[id]` | Get card | Public |
| PUT | `/api/cards/[id]` | Update card | Admin |
| DELETE | `/api/cards/[id]` | Delete card | Admin |
| POST | `/api/tts` | Generate TTS | Authenticated |
| POST | `/api/audio/upload` | Upload audio | Admin |

### Response Format

```typescript
// Success
{ data: {...}, status: 200 }

// Error
{ error: "Human readable message", status: 400|401|403|404|429|500 }
```

---

## Performance Checklist

Before deploying any feature:

- [ ] **Images optimized?** Use WebP, proper sizing
- [ ] **Data fetched server-side?** Avoid client-side loading spinners
- [ ] **Assets preloaded?** Images, audio for next screens
- [ ] **Components lazy-loaded?** Split heavy features
- [ ] **Database queries optimized?** Select only needed columns
- [ ] **No N+1 queries?** Use joins or batch fetching
- [ ] **Rate limiting in place?** Protect expensive endpoints
- [ ] **CDN caching enabled?** For static assets

---

## Security

### Authentication
- Server-side session validation (not just cookies)
- Middleware protection for admin routes
- OAuth only (no password storage)

### Data Access
- Row Level Security (RLS) on all tables
- Admin mutations through protected API routes
- Input validation on all endpoints

### Secrets
- Environment variables only
- `.env.local` never committed
- Vercel encrypted env vars for production

---

## Monitoring (Future)

For millions of users, add:

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database query monitoring (Supabase Dashboard)
- [ ] Real User Monitoring (RUM)
- [ ] Alerting for error spikes

---

## Quick Reference

| Need | Where |
|------|-------|
| Add a page | `app/my-page/page.tsx` |
| Add API route | `app/api/my-route/route.ts` |
| Add component | `components/MyComponent.tsx` |
| Add hook | `hooks/useMyHook.ts` |
| Add utility | `lib/myUtil.ts` |
| Add global state | `lib/stores/myStore.ts` |
| Database types | `lib/supabase/types.ts` (generated) |
| Auth check | `middleware.ts` |
