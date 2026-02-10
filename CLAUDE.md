# CLAUDE.md - EZViet AI Assistant Guidelines

> Hey there, AI friend! Welcome to EZViet - where learning Vietnamese is actually fun!
> This doc helps you help us. Let's make some magic together.

## Multi-AI Coordination (IMPORTANT!)

> **The user often runs 10+ AI assistants simultaneously in the same IDE, all working on the same branch.**
> This means you MUST follow these rules to avoid stepping on other AIs' work.

### Before Making Any Changes
1. **Always sync first:** Run `git fetch origin && git status` before editing files
2. **Check for uncommitted changes:** If you see modified files you didn't touch, ASK before proceeding
3. **Announce your intent:** Tell the user which files you're about to modify so they can warn you if another AI is working on them

### When Committing
1. **Pull before push:** Always `git pull origin main` right before pushing to catch race conditions
2. **Use feature branches for big changes:** Create a branch, commit, squash-merge back to main
3. **Keep commits atomic:** Small, focused commits are easier to resolve if conflicts arise

### If You Detect Conflicts
1. **STOP and ask** - Don't try to auto-resolve
2. **Show the user what changed** so they can decide which version to keep
3. **Never force-push** without explicit user approval

### If Your Changes Get Reverted
- Assume it was intentional (another AI or the user made different changes)
- Don't re-apply your changes without asking
- The user will tell you if they want your version back

---

## Quick Start

### Build & Run Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changing
npm run typecheck        # Run TypeScript type checking
```

### Project Snapshot
| Tech | Version | Purpose |
|------|---------|---------|
| Next.js | 16.1.1 | App Router, SSR/SSG |
| React | 19.2.3 | UI library |
| TypeScript | 5 | Strict mode enabled |
| Tailwind CSS | 4 | Utility-first styling |
| Supabase | 2.89.0 | Auth + PostgreSQL + Storage |
| Zustand | 5.0.9 | Global state (audio player) |
| Lucide React | 0.562.0 | Icon library |

---

## The Golden Rules

### 1. Component Size: 300 LOC Maximum
- **Hard limit:** 300 lines of code per component
- **Sweet spot:** 150-200 lines
- **If approaching limit:** Extract sub-components, create hooks, move data to files

### 2. TypeScript: No `any` Allowed
```typescript
// BAD - This is forbidden!
function process(data: any) { ... }

// GOOD - Use unknown + type guards
function process(data: unknown) {
  if (isCard(data)) { /* TypeScript knows it's a Card */ }
}
```

### 3. Styling: Tailwind Only
- No inline styles (`style={{}}`)
- No CSS modules
- No styled-components
- Just Tailwind classes

### 4. Text Contrast: Always Readable (CRITICAL)
**Every piece of text must be readable on its background.** This is a hard requirement.

| Text Type | Light Mode | On Colored BG |
|-----------|------------|---------------|
| **Primary text** (headings, labels, body) | `text-gray-900` | Use `-900` variant (e.g., `text-amber-900`) |
| **Secondary text** (descriptions) | `text-gray-700` | Use `-800` variant |
| **Tertiary text** (hints, metadata) | `text-gray-600` | Use `-700` variant |
| **Interactive elements** (buttons, links) | `text-gray-800` or darker | Explicit dark color |

**NEVER USE:**
- `text-gray-400` or `text-gray-500` for readable text (only for disabled/placeholder)
- Implicit text color inheritance (always set explicit color)
- Light text on light backgrounds

**Example - Button with explicit colors:**
```tsx
// BAD - text color not specified, may inherit light gray
<button className="border-2 border-gray-200">Click me</button>

// GOOD - explicit dark text color
<button className="border-2 border-gray-300 text-gray-800 font-medium">Click me</button>
```

---

## DO NOT (18 Guardrails)

1. **DO NOT** use `any` type - use `unknown` with type guards
2. **DO NOT** create components over 300 LOC - split them!
3. **DO NOT** install new packages without explicit user approval
4. **DO NOT** use dynamic Lucide icon imports - use the hardcoded `LUCIDE_ICONS` list in `IconPicker.tsx`
5. **DO NOT** modify tier limits in `lib/tiers.ts` without understanding the business model
6. **DO NOT** expose admin routes without middleware protection
7. **DO NOT** skip error handling in API routes - always return proper status codes
8. **DO NOT** use inline styles - Tailwind classes only
9. **DO NOT** commit `.env.local` or any secrets
10. **DO NOT** use `useEffect` for data that should be fetched in server components
11. **DO NOT** modify `lib/supabase/types.ts` manually - it's generated from the database schema
12. **DO NOT** break mobile responsiveness - test on iPhone SE width (375px)
13. **DO NOT** remove audio playback functionality without thorough testing
14. **DO NOT** use synchronous operations in `middleware.ts`
15. **DO NOT** hardcode Supabase URLs - use environment variables
16. **DO NOT** ask the user to run Supabase migrations - use the Supabase CLI directly (`npx supabase db push`, `npx supabase migration up`, etc.)
17. **DO NOT** use `text-gray-400` or `text-gray-500` for readable text - minimum is `text-gray-600`
18. **DO NOT** leave text without explicit color classes - always specify `text-gray-900`, `text-gray-800`, etc.

---

## File Organization

```
ezviet/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home (flashcard deck)
│   ├── learn/[slug]/       # Individual card pages
│   ├── admin/              # Admin dashboard (protected)
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout with providers
├── components/             # React components (max 300 LOC each!)
│   ├── Flashcard.tsx       # Main flashcard UI
│   ├── FlashcardDeck.tsx   # Deck controller
│   ├── IconPicker.tsx      # (1,900 LOC - NEEDS REFACTORING!)
│   └── admin/              # Admin-only components
├── lib/                    # Core logic & utilities
│   ├── supabase/           # Database types & clients
│   │   ├── types.ts        # Generated types (DO NOT EDIT)
│   │   ├── client.ts       # Browser client
│   │   └── server.ts       # Server client
│   ├── stores/
│   │   └── audioStore.ts   # Zustand audio state
│   ├── tiers.ts            # User tier system
│   ├── progression.ts      # Learning progress (6-hour cycles)
│   └── utils.ts            # General helpers
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication
│   └── useAudioRecorder.ts # Audio recording
├── contexts/
│   └── AuthContext.tsx     # Auth provider
├── providers/
│   └── AudioProvider.tsx   # Global audio element
└── middleware.ts           # Auth, routing, session
```

---

## Key Systems to Understand

### Tier System (`lib/tiers.ts`)
```typescript
type UserTier = 'guest' | 'free' | 'plus' | 'pro' | 'admin';

// Card limits per 6-hour cycle:
// guest: 6 | free: 12 | plus: 30 | pro: unlimited | admin: unlimited
```

### Learning Progression (`lib/progression.ts`)
- Cards refresh every **6 hours** (not daily!)
- Cycle times: midnight, 6am, noon, 6pm
- Seen cards = always accessible (review mode)
- New cards = subject to tier limit
- Data stored in `localStorage`

### Audio State (`lib/stores/audioStore.ts`)
- Global Zustand store for music player
- Single audio element across entire app
- Handles playlist, play/pause, seek

### Authentication Flow
1. User clicks "Sign in with Google"
2. Redirect to Supabase Auth (OAuth)
3. Returns to `/auth/callback`
4. Middleware validates session on each request
5. `AuthContext` provides user state to components

---

## Current Technical Debt

### High Priority (Fix Soon!)
- [ ] `components/IconPicker.tsx` is **1,900 LOC** - extract emoji data to separate file
- [ ] `components/Flashcard.tsx` is **501 LOC** - extract mini-player component
- [ ] Some `any` types in API routes need proper typing

### Medium Priority
- [ ] Add error boundaries for graceful error handling
- [ ] Create barrel exports (`components/index.ts`)
- [ ] Consolidate hooks: `hooks/` vs `lib/hooks/`

---

## Common Patterns

### Creating a New Component
```tsx
'use client';

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-medium">{title}</h2>
      <button
        onClick={() => { setIsActive(true); onAction(); }}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
      >
        Click me
      </button>
    </div>
  );
}
```

### Using Supabase
```typescript
// Server-side (in page.tsx or route.ts)
import { createAdminClient } from '@/lib/supabase/server';

const supabase = createAdminClient();
const { data, error } = await supabase.from('cards').select('*');

// Client-side
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

### Zustand Store Pattern
```typescript
import { create } from 'zustand';

interface MyState {
  value: string;
  setValue: (v: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    if (!body.slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('cards')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Handling Network Errors in Client Components
When making `fetch` calls in client components, use `isNetworkError()` to silently ignore expected network failures (device sleep, offline, etc.):
```typescript
import { isNetworkError } from '@/lib/utils';

try {
  const res = await fetch('/api/some-endpoint');
  // ... handle response
} catch (error) {
  // Only log unexpected errors, not network hiccups
  if (!isNetworkError(error)) {
    console.error('Failed to fetch:', error);
  }
}
```

This prevents console spam when users step away (device sleeps) or have temporary network issues. The app will retry on the next poll/action anyway.

---

## Testing Checklist

Before submitting changes:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (no TypeScript errors)
- [ ] Tested on mobile viewport (375px width)
- [ ] Audio playback works (if touching audio code)
- [ ] Admin routes still protected
- [ ] No `any` types introduced
- [ ] **All text is readable** - no light gray on white backgrounds

---

## Vietnamese Language Tips

- **Slugs:** Use `slugify()` from `lib/utils.ts` for Vietnamese-aware URL slugs
- **Text encoding:** Always UTF-8, Vietnamese diacritics fully supported
- **TTS:** OpenAI's `tts-1` model with `vi-VN` locale
- **Romanization:** Vietnamese phonetic spelling stored in `card_terms.romanization`

---

## Database Quick Reference

### Main Tables
| Table | Purpose |
|-------|---------|
| `cards` | Flashcard items (slug, category, image, difficulty) |
| `card_terms` | Translations (vi/en, north/south, audio path) |
| `card_songs` | Music linked to cards (lyrics, metadata) |
| `categories` | Card categories with icons |
| `profiles` | User profiles (tier, admin flag, streak) |

### Key Relationships
```
categories 1──N cards
cards      1──N card_terms
cards      1──N card_songs
```

---

## Fun Facts

- The refresh cycle is **6 hours**, not daily - micro-learning for the win!
- Profile URLs use `/@username` format (Twitter-style!)
- The audio store uses a singleton pattern for seamless playback across pages
- Card images live in Supabase Storage, not the repo
- We love confetti (see `canvas-confetti` in package.json)

---

## Need Help?

- Check existing code patterns before inventing new ones
- Read the component you're modifying before changing it
- When in doubt, ask the user!

*Xin cam on ban! (Thank you!)*
