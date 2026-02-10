# VietQuest

> Embodied Vietnamese language learning game. Players don't study vocab - they survive Vietnam.

## Core Concept

- **Two currencies**: Vietnamese đồng (money) + Energy (cognitive effort)
- **Translator costs energy**, not money (realistic - using phone translator is exhausting)
- **Multiple choice v1** (no speech recognition yet)
- **Level-as-JSON** architecture stored in Supabase JSONB

## File Map

```
Database
├── supabase/migrations/029_vietquest.sql    # Tables + seed data (Đà Lạt Level 1)

Types & Store
├── lib/vietquest/types.ts                   # All interfaces, type guards, NPC profiles
├── lib/stores/vietquestStore.ts             # Zustand store (game state, actions)

Components (all <300 LOC)
├── components/vietquest/
│   ├── GameCanvas.tsx      # Main orchestrator - renders current node type
│   ├── DialogueBox.tsx     # NPC/narration with typewriter effect
│   ├── ChoiceMenu.tsx      # Story branch selection (always shows EN translation)
│   ├── ResponsePicker.tsx  # Vietnamese phrase picker + TTS audio
│   ├── WalletDisplay.tsx   # HUD: đồng + energy + translator toggle
│   ├── RewardScreen.tsx    # Animated reward display
│   └── LevelComplete.tsx   # End screen with grade + confetti

Pages
├── app/vietquest/page.tsx                      # Hub (world/level selection)
├── app/vietquest/[world]/[level]/page.tsx      # Server component - fetches level
├── app/vietquest/[world]/[level]/GamePlayer.tsx # Client - initializes store

APIs
├── app/api/vietquest/levels/route.ts    # GET levels (for hub listing)
├── app/api/vietquest/progress/route.ts  # GET/POST player progress
├── app/api/tts/route.ts                 # Google Cloud TTS (used by ResponsePicker)
```

## Node Types (Discriminated Union)

```typescript
type GameNode =
  | NarrationNode       // Story text, tap to continue
  | NpcSaysNode         # NPC dialogue with emotion
  | PlayerChoiceNode    // Branch choices (taxi vs Grab)
  | ResponsePickerNode  // Vietnamese phrase selection (core learning)
  | RewardNode          // Give đồng/energy/achievements
  | GoToSceneNode       // Scene transition
```

Type guards: `isNarrationNode()`, `isNpcSaysNode()`, etc.

## Zustand Store Pattern

**CRITICAL**: Use individual selectors, NOT object destructuring:
```typescript
// CORRECT
const dong = useVietQuestStore((state) => state.dong);

// WRONG - causes infinite re-render
const { dong } = useVietQuestStore();
```

Key actions: `loadLevel()`, `startLevel()`, `advanceToNode()`, `makeChoice()`, `selectResponse()`, `useTranslator()`, `completeLevel()`

## Level Data Structure

```json
{
  "startScene": "airport_exit",
  "scenes": [{
    "id": "airport_exit",
    "type": "dialogue",
    "background": "dalat_airport.jpg",
    "nodes": [
      { "id": "...", "type": "narration", "text_vi": "...", "text_en": "...", "next": "..." },
      { "id": "...", "type": "player_choice", "choices": [...] },
      { "id": "...", "type": "response_picker", "options": [...] }
    ]
  }],
  "endCondition": { "type": "reach_node", "nodeId": "end_level" }
}
```

## TTS Audio

ResponsePicker generates audio on-demand via `/api/tts`:
- Uses Google Cloud TTS (`GOOGLE_CLOUD_API_KEY` required)
- Uploads to Supabase Storage (`cards-audio` bucket)
- Caches URLs in component-level Map

Filename sanitization removes Vietnamese diacritics (Supabase storage requirement).

## Current State (v1 Shipped)

Working:
- [x] Hub page with Đà Lạt world
- [x] Level 1: Airport Taxi (3 scenes, ~10 nodes)
- [x] Narration with typewriter effect
- [x] Choice menu with Vietnamese + English
- [x] Scene transitions (advanceToNode handles both node IDs and scene IDs)
- [x] Response picker with tap-to-confirm
- [x] TTS audio generation on speaker tap
- [x] Wallet display (đồng/energy)
- [x] Translator toggle (costs 10 energy)

Not implemented yet:
- [ ] Grab app scene (level data exists but incomplete)
- [ ] Level completion flow (reward screen, grade calculation)
- [ ] Progress persistence to database
- [ ] Multiple worlds
- [ ] Admin level editor

## Key Fixes Applied

1. **Zustand infinite loop**: Changed all components from `useStore(selectObject)` to individual `useStore(s => s.value)` selectors
2. **Nested button error**: ResponsePicker outer element changed from `<button>` to `<div role="button">`
3. **Scene navigation**: `advanceToNode()` now tries scene ID if node ID not found
4. **TTS upload fail**: Filename sanitization strips Vietnamese diacritics

## Run & Test

```bash
npm run dev                    # Start server
npm run typecheck              # Verify types
npx supabase db push           # Apply migrations

# Test URLs
http://localhost:3000/vietquest                      # Hub
http://localhost:3000/vietquest/dalat/airport-taxi   # Level 1
```

## Extending

**Add new level**: Insert into `vq_levels` with JSON matching `LevelData` interface.

**Add new node type**:
1. Add interface to `types.ts`
2. Add to `GameNode` union
3. Create type guard `isXxxNode()`
4. Handle in `GameCanvas.tsx` render switch

**Add new world**: Insert into `vq_worlds`, set `unlock_requirements` JSON.

## Architecture Decisions

- Pure React (no Phaser/game engine) - simpler, uses existing stack
- Server component fetches level, client component runs game
- Energy regenerates on 6-hour cycles (matches EZViet's existing system)
- Choices always show English (UX: players need to understand options)
- NPC dialogue translation controlled by translator toggle
