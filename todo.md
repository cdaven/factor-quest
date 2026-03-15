# Gamification Implementation Plan

Based on `addendum1.md`. No code has been written yet.

---

## Phase 1 — Data Layer (new files, no game logic changes)

### 1.1 `src/lib/trophies.ts`
Define all 27 trophies as a typed array/map. Each entry: `id`, `emoji`, `name`, `description`, `hint`, `category`. Export a `TROPHY_DEFINITIONS` array (fixed order = fixed grid positions in Trophy Case) and a `TROPHY_MAP` keyed by id for fast lookup.

Categories: `dragon` | `skill` | `firstkill` | `mastery` | `streak`

### 1.2 `src/lib/streak.ts`
Export `checkAndUpdateStreak(streak)`: pure function, takes current streak object, returns updated streak object. Encodes the same-day / yesterday / 2+-days logic from the spec. No side effects — caller handles localStorage.

### 1.3 `src/stores/trophyStore.ts`
Writable store mirroring `localStorage` for trophy state. Exports:
- `trophyStore` — reactive store `{ trophies, streak, dragonKills, allTrophiesEarned, pendingTrophyToasts }`
- `initTrophyStore()` — loads all four localStorage keys on startup; detects broken streak to show "Your streak ended" message
- `evaluateTrophies(gameState)` — central evaluation function; skips already-earned trophies; fires `queueToast()` for new unlocks
- `queueToast(trophyId)` — pushes to `pendingTrophyToasts` array
- `dismissToast()` — pops first toast from queue (called by TrophyToast after each display)
- `onCorrectAnswer(key, gameState)` — updates streak, then calls `evaluateTrophies` for mastery+streak categories
- `onEnemyDefeated(enemyId, gameState)` — checks first-kill trophies, then full eval
- `onDragonDefeated(gameState)` — increments `dragonKills`, then full eval
- `onSessionLoad()` — re-evaluates mastery milestone trophies (in case thresholds were met last session)

---

## Phase 2 — Extend Game Store

### 2.1 Add run-level flags and trophy fields to `GameState` in `gameStore.ts`

New fields in `GameState`:
```ts
healPotionUsedThisRun: boolean   // default false
droppedBelow20HP: boolean        // default false
hpLostInForest: boolean          // default false
```

These are reset in `startRun()`.

> Note: `trophies`, `streak`, `dragonKills`, and `pendingTrophyToasts` live in `trophyStore`, not `gameStore`. They are passed as arguments to `evaluateTrophies` rather than merged into `GameState`.

### 2.2 Set run-level flags in existing helper functions

- **`resolveCardEffect`** — in the `'heal'` case, after HP is updated: set `s.healPotionUsedThisRun = true`
- **`applyDamageToPlayer`** — after damage resolves: if `s.player.hp <= 20`, set `s.droppedBelow20HP = true`; if `s.fightNumber <= 3 && dmg > 0`, set `s.hpLostInForest = true`

### 2.3 Track turn number per fight for `one_shot` detection

The existing `s.turn` field already resets at `dismissPrefight()`. Detect `one_shot` in `handleVictory`: if `s.turn === 1`, the enemy was killed on the first turn.

---

## Phase 3 — Wire Trophy Evaluation into Game Events

All calls go through `evaluateTrophies` / the helper functions in `trophyStore`.

| Event | Where in `gameStore.ts` | Trophy categories checked |
|-------|------------------------|--------------------------|
| Correct answer | `submitAnswer` — after `resolveCardEffect` on correct path | streak, mastery milestones |
| Enemy defeated | `handleVictory` — after enemy HP hits 0 | first-kill; `one_shot` (if turn 1); `flawless_forest` (if fight 3 and no forest damage) |
| Dragon defeated | `handleVictory` when `fightNumber === 9` | dragon counters, `iron_wizard`, `no_heal`, `perfect_run` |
| Run started | `startRun` | reset run-level flags only (no trophy check) |
| Session load | `App.svelte` `onMount` | mastery milestones (call `onSessionLoad()`) |

---

## Phase 4 — New UI Components

### 4.1 `src/components/StreakDisplay.svelte`
- Props: none (reads directly from `trophyStore`)
- Shows nothing if `streak.current === 0` and no broken-streak message pending
- Shows "Your streak ended. Start a new one today!" once (cleared after first correct answer of session — tracked via a local reactive flag set by `initTrophyStore`)
- Shows `🔥 {N}-day streak! Keep it up!` when current ≥ 1
- Colours: `#C4922A` for flame+number, `#8A9BB5` for surrounding text

### 4.2 `src/components/TrophyCase.svelte`
- Props: `{ onBack: () => void }`
- Reads `trophyStore` reactively
- 3-column CSS grid, fixed order from `TROPHY_DEFINITIONS`
- Earned tile: gold border `#D4A017`, full colour emoji, name, description
- Locked tile: dark navy `#3A4560`, greyed emoji, name shows `"???"`, description reveals cryptic hint on hover
- Footer: `"Trophies earned: {N} / 27"` — or completion message if `allTrophiesEarned`
- Completion: outer gold border (2px `#D4A017`) added to container; fade-in on first completion only (gated by a local flag checking if `allTrophiesEarned` just became true this session)

### 4.3 `src/components/TrophyToast.svelte`
- Reads `pendingTrophyToasts` from `trophyStore`
- When queue is non-empty: slide in from top-right with trophy emoji + name
- Displays for 3 seconds, then fades out, then calls `dismissToast()`
- After all trophy toasts, checks if a new title was earned and shows a title toast: `"✨ New title: {title}!"`
- Never blocks interaction (CSS `pointer-events: none`)

---

## Phase 5 — Update `MainMenu.svelte`

1. Import and render `<StreakDisplay />` between Start Adventure button and Trophy Case button
2. Add `🏆 Trophy Case` button (same style as Mastery Map button, positioned above it per spec layout)
3. Add player title display below the wizard emoji:
   - Derive the active title by iterating the title unlock table in descending rank order, returning the first title whose condition is satisfied by `$trophyStore.trophies`
   - Render with gold colour `#D4A017`, centred, slightly smaller than game title
   - Use a CSS transition (`opacity`, `transform`) for the fade-in on first unlock — track "title seen" state in a local variable to only animate on change
   - Show nothing (no empty space) if no title earned
4. Pass an `onShowTrophyCase` prop and wire it to the Trophy Case button

---

## Phase 6 — Navigation / `App.svelte`

1. Add a `showTrophyCase` boolean reactive variable (or extend the existing `showMastery` pattern)
2. Render `<TrophyCase onBack={() => showTrophyCase = false} />` when `showTrophyCase` is true (replacing the main menu)
3. Pass `onShowTrophyCase={() => showTrophyCase = true}` to `<MainMenu />`
4. Mount `<TrophyToast />` at the app root (always present, overlays everything)
5. Call `initTrophyStore()` and `onSessionLoad()` in `onMount`

---

## Phase 7 — localStorage Schema

Four new keys alongside `factorquest_mastery`:

| Key | Type | Default |
|-----|------|---------|
| `factorquest_trophies` | `Record<string, boolean>` | `{}` |
| `factorquest_streak` | `{ current, longest, lastActiveDate }` | `{ current: 0, longest: 0, lastActiveDate: "" }` |
| `factorquest_dragonKills` | `number` | `0` |
| `factorquest_allTrophiesEarned` | `boolean` | `false` |

> Use the `factorquest_` prefix to stay consistent with the existing `factorquest_mastery` key (the spec uses bare key names, but the codebase uses this prefix).

---

## Implementation Order

1. **Phase 1** — Create the three new files (pure logic, no dependencies on game runtime)
2. **Phase 2.1** — Extend `GameState` type and `createInitialState` / `startRun`
3. **Phase 2.2–2.3** — Add flag-setting calls inside existing helper functions
4. **Phase 3** — Wire `trophyStore` calls into `gameStore` action functions
5. **Phase 4.1** — `StreakDisplay.svelte`
6. **Phase 4.2** — `TrophyCase.svelte`
7. **Phase 4.3** — `TrophyToast.svelte`
8. **Phase 5** — Update `MainMenu.svelte`
9. **Phase 6** — Update `App.svelte`

---

## Edge Cases & Notes

- **`dragon_1` + `kill_dragon` double-award**: both evaluated on the same `onDragonDefeated` call; toast queue naturally sequences them
- **Mastery trophies use canonical keys**: the existing `masteryStore` uses keys like `"6x7"` (always min×max). Mastery milestone checks must enumerate the correct problem keys per tier (bronze: ×2,×3,×4,×5,×10; silver: ×3,×4,×6,×7; gold: ×6,×7,×8,×9; all 55 unique pairs)
- **`master_all` counts 55 unique pairs**: commutativity already collapsed by `masteryStore` key format; just check all 55 canonical keys
- **Streak milestone checks use `longest`, not `current`**: streak trophies never un-earn if streak breaks
- **Broken streak detection at load**: `initTrophyStore` compares `lastActiveDate` to today; if gap ≥ 2 days, sets `streak.current = 0` and a `showBrokenStreakMessage` flag; the flag clears after the first correct answer this session
- **`one_shot` is per-enemy, any fight**: check `s.turn === 1` in `handleVictory` across all 9 fights
- **Title derivation is stateless**: always computed from current trophy state, never stored separately
