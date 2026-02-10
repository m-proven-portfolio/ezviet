# 🏪 Street Market Simulator — Handover

> **Status**: Built but not production-ready
> **Blocker**: Missing navigation, discoverability, admin UX confusion

---

## 📦 What Was Built

### Game Overview
Vietnamese market haggling simulator at `/market`. Players learn negotiation phrases by using them in realistic Bến Thành Market scenarios.

### Architecture
```
app/market/
└── page.tsx                    # Route → <MarketGame />

components/market/
├── MarketGame.tsx              # Main orchestrator (~290 LOC)
├── VendorDialogue.tsx          # Chat-style conversation UI
├── PhraseSelector.tsx          # Phrase buttons + counter-offer input
├── VendorCard.tsx              # Vendor/item display cards
└── index.ts                    # Barrel exports

lib/market/
├── types.ts                    # TypeScript interfaces
├── phrases.ts                  # 27 negotiation phrases w/ effects
├── vendors.ts                  # 5 vendors + items + personalities
└── index.ts                    # Barrel exports

lib/stores/
└── marketStore.ts              # Zustand + localStorage persistence
```

### Game Flow
```
Market Overview → Select Vendor → Select Item → Negotiate → Deal/Walk Away
                                                    ↓
                                         Use phrases / Make offers
                                                    ↓
                                         Vendor callback on walk-away
```

### Content (Hardcoded)

| Vendors | Specialty | Personality |
|---------|-----------|-------------|
| Bà Hai | Fruits | Patient, chatty, flexible |
| Chị Lan | Clothing | Moderate patience |
| Anh Tuấn | Electronics | Impatient, less flexible |
| Cô Mai | Coffee/Tea | Very patient, generous |
| Chú Nam | Souvenirs | Tough negotiator |

| Phrase Categories | Count | Examples |
|-------------------|-------|----------|
| Price complaints | 5 | "Đắt quá!", "Giảm giá đi!" |
| Rapport building | 5 | "Đẹp quá!", "Cảm ơn!" |
| Strategy | 5 | "Tôi mua nhiều!", "Tôi là sinh viên!" |
| Walk-away | 3 | "Thôi, tôi đi!" |
| Deal closers | 3 | "Được rồi!", "Lấy đi!" |
| Info/Bonus | 6 | "Cái này là gì?", "Thêm gì không?" |

---

## ❌ Current Issues

| # | Issue | Why It Matters |
|---|-------|----------------|
| 1 | **No header/nav** on `/market` | Users trapped — no way back to main app |
| 2 | **Admin link misleading** | Points to game, not editor — confusing UX |
| 3 | **No user discoverability** | Regular users can't find market anywhere |
| 4 | **No admin editor** | Content in TS files, not Supabase — can't edit |

---

## ✅ Recommended Fix

### Phase 1: Navigation (Required for Launch)

**1. Add header to market page**
- Check `/tone-gym` for pattern — likely uses shared header
- Add EZViet logo + back link at minimum
- File: `app/market/page.tsx`

**2. Remove misleading admin link**
- Delete market entry from `AdminSidebar.tsx` (lines ~126-139)
- Or rename to "Market (Preview)" if keeping for testing
- File: `components/admin/AdminSidebar.tsx`

**3. Add to main user navigation**
- Find main nav (check `app/layout.tsx` or header component)
- Add "Market" or "Chợ Bến Thành" link
- Consider: home page card, nav menu, or dedicated section

### Phase 2: Admin Editor (Optional/Future)

- Create `/admin/market` with vendor/phrase CRUD
- Migrate data from TS → Supabase tables
- Bigger scope — skip for MVP

---

## 🔍 Key Files

| Purpose | Path |
|---------|------|
| Market page | `app/market/page.tsx` |
| Main game component | `components/market/MarketGame.tsx` |
| Admin sidebar | `components/admin/AdminSidebar.tsx` |
| Pattern reference | `app/tone-gym/` |
| Main layout | `app/layout.tsx` |
| Vendor data | `lib/market/vendors.ts` |
| Phrase data | `lib/market/phrases.ts` |
| Game state | `lib/stores/marketStore.ts` |

---

## ✔️ Verification Checklist

```bash
npm run typecheck    # Must pass
npm run build        # Must pass
```

- [ ] `/market` has working back navigation
- [ ] Regular user can find market from main site
- [ ] Admin sidebar no longer has misleading link
- [ ] Mobile responsive (375px width)

---

## 🎯 Goal State

> Users discover market from main nav → Play and learn Vietnamese haggling → Can always navigate back → Progress persists in localStorage

---

*Xin cảm ơn! 🙏*
