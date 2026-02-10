# EZViet

> Vietnamese language learning platform - where learning Vietnamese is actually fun.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint and format
npm run lint
npm run format
npm run typecheck
```

## For AI Agents

**Start here:** Read [CLAUDE.md](CLAUDE.md) before making any changes. It contains:
- Multi-AI coordination rules (critical when multiple agents work simultaneously)
- The 15 DO NOT rules
- Code patterns and conventions
- Database and file organization

**System architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) for how the system works.

**Feature documentation:**
- [docs/KARAOKE_SYSTEM.md](docs/KARAOKE_SYSTEM.md) - Karaoke Hero game, LRC timing editor
- [docs/VIETQUEST.md](docs/VIETQUEST.md) - VietQuest embodied language game

---

## Tech Stack

| Tech | Version | Purpose |
|------|---------|---------|
| Next.js | 16 | App Router, SSR/SSG |
| React | 19 | UI library |
| TypeScript | 5 | Strict mode enabled |
| Tailwind CSS | 4 | Utility-first styling |
| Supabase | 2.89 | Auth + PostgreSQL + Storage |
| Zustand | 5 | Global state (audio player) |

---

## Project Structure

```
ezviet/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home (flashcard deck)
│   ├── learn/[slug]/       # Individual card pages
│   ├── admin/              # Admin dashboard (protected)
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout with providers
├── components/             # React components (max 300 LOC each!)
├── lib/                    # Core logic & utilities
│   ├── supabase/           # Database types & clients
│   ├── stores/             # Zustand stores
│   └── utils.ts            # General helpers
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts
├── providers/              # Provider components
└── middleware.ts           # Auth, routing, session
```

---

## Database

### Migrations

```bash
# Apply new migrations
npx supabase db push

# If migrations were added out of order
npx supabase db push --include-all

# Check migration status
npx supabase migration list

# Create new migration
npx supabase migration new my_migration_name

# Regenerate types after schema changes
npx supabase gen types typescript --local > lib/supabase/types.ts
```

**Never edit `lib/supabase/types.ts` manually** - it's auto-generated.

### Main Tables

| Table | Purpose |
|-------|---------|
| `cards` | Flashcard items (slug, category, image, difficulty) |
| `card_terms` | Translations (vi/en, north/south, audio path) |
| `card_songs` | Music linked to cards (lyrics, metadata) |
| `categories` | Card categories with icons |
| `profiles` | User profiles (tier, admin flag, streak) |

---

## Key Systems

### Tier System (`lib/tiers.ts`)

```typescript
type UserTier = 'guest' | 'free' | 'plus' | 'pro' | 'admin';

// Cards per 6-hour cycle:
// guest: 6 | free: 12 | plus: 30 | pro: unlimited | admin: unlimited
```

### Learning Progression (`lib/progression.ts`)

- Cards refresh every **6 hours** (midnight, 6am, noon, 6pm)
- Seen cards = always accessible (review mode)
- New cards = subject to tier limit
- Data stored in `localStorage`

### Audio State (`lib/stores/audioStore.ts`)

- Global Zustand store for music player
- Single audio element across entire app
- Handles playlist, play/pause, seek

---

## Git Workflow

### Branch Cleanup Policy

**After merging a PR to main, delete the branch immediately.**

```bash
# Delete local and remote branch after merge
git branch -d feature-branch
git push origin --delete feature-branch

# Clean up stale remote tracking branches
git fetch --prune
```

### Multi-AI Coordination

When multiple AI agents work on the same branch:
1. Always `git fetch origin && git status` before editing files
2. `git pull origin main` before pushing
3. If you see uncommitted changes you didn't make, ASK before proceeding

---

## Testing Checklist

Before submitting changes:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Tested on mobile viewport (375px width)
- [ ] Audio playback works (if touching audio code)
- [ ] Admin routes still protected
