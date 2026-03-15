# Multiplication Quest — Gamification Addendum

## Overview

This document extends the core Multiplication Quest spec with a gamification layer consisting of:
- **Daily streaks** — rewards consecutive days of practice
- **The Trophy Case** — a collection screen accessible from the main menu showing earned trophies
- **Player titles** — a visible rank shown on the main menu, earned by unlocking specific trophies

---

## Terminology

**Run** — one complete attempt at the dungeon, from Fight 1 to either the dragon's defeat or the player's death. A run begins when the player presses Start Adventure and ends when the run is won or lost. All run-level trophy conditions (e.g. `no_heal`, `perfect_run`, `iron_wizard`) reset at the start of each new run. Mastery scores and trophy state persist across runs.

**Fight** — one combat encounter against a single enemy. A run consists of exactly 9 fights. A fight begins when the pre-fight scene is dismissed and ends when either the enemy's HP reaches 0 (victory) or the player's HP reaches 0 (defeat). Rest sites between areas are not fights.

**Turn** — one cycle of the player phase followed by the end-of-turn resolution sequence. A turn begins when cards are drawn and ends after cleanup (shield reset, discard, new draw). There is no turn limit per fight.

---

## Daily Streaks

### Definition

A streak day is any calendar day (local time) on which the player answers at least one multiplication problem correctly. The streak counter increments once per day regardless of how many problems are answered.

### Persistence

Streak data is stored in `localStorage` alongside the existing mastery scores:

```javascript
{
  streak: {
    current: number,       // current consecutive day count
    longest: number,       // all-time longest streak
    lastActiveDate: string // ISO date string: "2025-03-15"
  }
}
```

### Update Logic

On each correct answer:

1. Get today's date as `YYYY-MM-DD`
2. Compare to `lastActiveDate`:
   - **Same day** — no change (streak already counted today)
   - **Yesterday** — `current += 1`, update `lastActiveDate`
   - **2+ days ago** — `current = 1` (streak broken), update `lastActiveDate`
3. Update `longest` if `current > longest`

### UI: Streak Display on Main Menu

The streak counter appears on the main menu below the Start Adventure button, between the two main action buttons.

```
             [ Start Adventure ]

        🔥 5-day streak! Keep it up!

             [ 🏆 Trophy Case ]
             [ 📊 Mastery Map ]
```

Text states:
- **Streak ≥ 1:** `"🔥 {N}-day streak! Keep it up!"`
- **Streak = 0 (never played):** no streak line shown
- **Streak broken (gap of 2+ days detected on load):** `"Your streak ended. Start a new one today!"` — shown once, then replaced by `"🔥 1-day streak!"` after the first correct answer of the session

Colour: warm amber (`#C4922A`) for the flame and number; secondary text (`#8A9BB5`) for the rest.

### Streak Milestones

Streak milestones are tracked as a sub-category of trophies (see Trophy List below). Reaching a milestone does not require a full run — any correct answer counts.

---

## The Trophy Case

### Accessing the Trophy Case

A **"🏆 Trophy Case"** button is added to the main menu, below Start Adventure and above Mastery Map. It is always visible (not locked behind first run).

The Trophy Case screen replaces the main menu. A back button (`← Back`) in the top-left corner returns the player to the main menu.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ←  Back                                            │
│                                                     │
│               🏆  Trophy Case                       │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │    🐉    │  │    ░░    │  │    ░░    │         │
│   │ Dragon   │  │ Locked   │  │ Locked   │         │
│   │ Slayer   │  │          │  │          │         │
│   └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │    ░░    │  │    ░░    │  │    ░░    │         │
│   │ Locked   │  │ Locked   │  │ Locked   │         │
│   └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│         Trophies earned: 1 / 27                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Earned trophies** show their full emoji, name, and a brief description. They are displayed in full colour with a gold border.

**Locked trophies** show a greyed-out silhouette of the emoji and the name hidden — replaced with `"???"`. On hover/tap, the locked trophy reveals a cryptic hint (not the full description) to encourage curiosity without spoiling the achievement.

**Layout details:**
- 3-column grid, scrollable if needed
- Each trophy tile is roughly square: emoji large at top, name below, short description below that
- Earned tile: gold border (`#D4A017`), slight warm glow, full colour
- Locked tile: dark navy fill (`#3A4560`), muted border, greyscale emoji silhouette
- **Fixed grid positions** — every trophy occupies the same slot every time the Trophy Case is opened, regardless of whether it has been earned. Locked trophies stay in place and the grid never reorders. This means a player always knows where to look for a specific trophy, and the visual pattern of gold vs dark tiles gives an at-a-glance sense of overall progress.

### Progress Summary

A line at the bottom of the screen:
*"Trophies earned: {N} / 27"*

### Completion State

When all 27 trophies are earned, the Trophy Case screen gains a continuous gold border (`#D4A017`, 2px, applied to the outer edge of the screen container) and the progress summary is replaced by a centred completion message:

*"You've collected every trophy. You are a true Mathemagician!"*

The message uses the gold colour (`#D4A017`) and fades in once on first completion, not on every subsequent visit. The category tabs remain functional so the player can still browse by category. The grid stays intact with all tiles showing earned state.

This completion state is stored as a flag in `localStorage` (`allTrophiesEarned: true`) rather than derived dynamically on each load, so the check is instant and does not require iterating all 27 trophy states every time the Trophy Case is opened.

---

## Trophy List

Trophies are grouped into five categories. All are stored in `localStorage` as a flat map of `{ [trophyId]: boolean }`.

**Trophies are awarded once and held permanently.** A trophy whose condition is met again on a subsequent run produces no notification and no state change — `evaluateTrophies()` skips any trophy already marked `true` in `localStorage`. The sole exception is the Dragon Slayer trio, which are checked against an ever-increasing `dragonKills` counter rather than a per-run condition — but each threshold trophy still flips to `true` once and never resets.

---

### Category 1 — Dragon Slayer (Run Completion)

These trophies reward beating the dragon and accumulate over multiple runs. A separate `dragonKills` counter (stored in `localStorage`) increments by 1 each time the dragon is defeated; the three thresholds below are checked against this counter.

| ID | Emoji | Name | Unlock condition | Hint (locked) |
|----|-------|------|-----------------|---------------|
| `dragon_1` | 🐉 | Dragon Slayer | Beat the dragon for the first time | *"The fortress awaits..."* |
| `dragon_3` | 🐉🐉 | Dragon Hunter | Beat the dragon 3 times | *"One victory is not enough..."* |
| `dragon_10` | 🐉🐉🐉 | Dragon Lord | Beat the dragon 10 times | *"A true legend is forged in fire..."* |

---

### Category 2 — Speed & Skill (Single Run Challenges)

These trophies reward finishing a run in exceptional condition. All conditions apply to the **entire run (fights 1–9)** unless otherwise noted. The relevant run-level flags (`healPotionUsedThisRun`, `droppedBelow20HP`, `hpLostInForest`) reset to their default values at the start of each new run — see Store Shape Addition below.

| ID | Emoji | Name | Unlock condition | Hint (locked) |
|----|-------|------|-----------------|---------------|
| `iron_wizard` | 🧙 | Iron Wizard | Beat the dragon with 45+ HP remaining | *"Hardly a scratch..."* |
| `flawless_forest` | 🌲 | Forest Walker | Complete fights 1–3 without taking any damage | *"Something lurks in the trees..."* |
| `no_heal` | 💔 | No Mercy | Beat the dragon without playing a single Heal Potion card during fights 1–9 | *"Who needs potions anyway?"* |
| `one_shot` | ⚡ | One Shot | Defeat any enemy in a single turn | *"Swift and decisive..."* |
| `perfect_run` | ✨ | Unbreakable | Beat the dragon without ever dropping to 20 HP or below during fights 1–9 | *"They never even touched you..."* |

**Implementation notes for run-level flags:**

- `healPotionUsedThisRun` is set to `true` the moment a Heal Potion card resolves successfully (correct answer confirmed, HP updated). A Heal Potion that is discarded after two wrong answers does not set this flag.
- `droppedBelow20HP` is set to `true` any time `player.hp` reaches 20 or below during damage resolution — including mid-sequence hits, not just at end-of-turn cleanup.
- `hpLostInForest` is set to `true` any time `player.hp` decreases during fights 1–3 for any reason, including the enemy counter-attack during resolution. Rest site healing does not affect this flag as it occurs after the Forest fights are complete.

---

### Category 3 — First Kills (Enemy-Specific)

One trophy per enemy, awarded the first time that enemy is defeated. These fill in naturally as the player progresses through runs. All 9 tiles are visible in the locked state from the very first time the Trophy Case is opened, giving a new player a preview of the dungeon's enemies and building anticipation.

| ID | Emoji | Name | Unlock condition |
|----|-------|------|-----------------|
| `kill_snail` | 🐌 | Snail Crusher | Defeat the Giant Snail |
| `kill_wolf` | 🐺 | Wolf Tamer | Defeat the Wolf |
| `kill_spider` | 🕷️ | Web Cutter | Defeat the Giant Spider |
| `kill_troll` | 👺 | Troll Toppler | Defeat the Cave Troll |
| `kill_bat` | 🦇 | Bat Buster | Defeat the Giant Bat |
| `kill_golem` | 🗿 | Stone Breaker | Defeat the Stone Golem |
| `kill_knight` | 🤺 | Knight's End | Defeat the Dark Knight |
| `kill_necromancer` | 💀 | Exorcist | Defeat the Necromancer |
| `kill_dragon` | 🐉 | Here Be Dragons | Defeat the Dragon *(same unlock event as `dragon_1` — both awarded simultaneously on the first dragon kill)* |

Locked hint for all first-kill trophies: *"Somewhere in the dungeon..."*

---

### Category 4 — Mastery Milestones (Problem Tracking)

These trophies are awarded when the player's mastery scores meet specific thresholds. They are evaluated at the end of each fight when mastery scores update, and also on every session load in case thresholds were reached in a previous session without being checked.

"Scored green" uses the existing mastery map definition: correct on first attempt 3+ more times than incorrect (net score ≥ 3).

`master_all` checks all 55 unique problem keys (after commutativity — e.g. 6×7 and 7×6 are tracked as one key), not all 100 cells of the 10×10 grid.

Note that `master_bronze`, `master_silver`, and `master_gold` subsume the individual table trophies (`master_2s`, `master_5s`, `master_10s`) — a player earning `master_bronze` has necessarily already earned all three of those. The individual table trophies exist to give earlier, more frequent reward signals as the player works through the bronze tier. The ×3 and ×4 tables have no individual trophy of their own; they are covered by `master_bronze`.

| ID | Emoji | Name | Unlock condition | Hint (locked) |
|----|-------|------|-----------------|---------------|
| `master_2s` | ✌️ | Times Two | All ×2 problems scored green | *"The simplest tables hold secrets..."* |
| `master_5s` | 🖐️ | High Five | All ×5 problems scored green | *"Count your fingers..."* |
| `master_10s` | 🔟 | Perfect Ten | All ×10 problems scored green | *"A round number..."* |
| `master_bronze` | 🥉 | Bronze Mind | All bronze-tier problems scored green (×2, ×3, ×4, ×5, ×10) | *"The foundation of all things..."* |
| `master_silver` | 🥈 | Silver Tongue | All silver-tier problems scored green (×3, ×4, ×6, ×7) | *"The middle path is hardest..."* |
| `master_gold` | 🥇 | Golden Brain | All gold-tier problems scored green (×6, ×7, ×8, ×9) | *"True mastery is rare..."* |
| `master_all` | 🌟 | Mathemagician | All 55 unique problems scored green | *"55 stars await..."* |

---

### Category 5 — Streak Milestones

Streak milestones are checked against `streak.longest` (the all-time longest streak), not `streak.current`. This means a player who reaches a 7-day streak, breaks it, and rebuilds does not need to re-earn `streak_7` — it was already awarded when `longest` first reached 7.

| ID | Emoji | Name | Unlock condition | Hint (locked) |
|----|-------|------|-----------------|---------------|
| `streak_3` | 🔥 | Spark | Reach a 3-day streak | *"Three days in a row..."* |
| `streak_7` | 🔥🔥 | Flame | Reach a 7-day streak | *"A full week of practice..."* |
| `streak_30` | 🔥🔥🔥 | Inferno | Reach a 30-day streak | *"A month without stopping..."* |

---

## Player Titles

A **title** is a short label shown on the main menu directly below the wizard emoji. Only one title is active at a time — the game automatically shows the highest-ranking title the player has earned. If no title has been earned yet, nothing is shown below the wizard emoji and the layout does not leave a blank space.

```
              🧙

         ✨ Mathemagician ✨
```

Title display: centred, slightly smaller than the game title, in a warm gold colour (`#D4A017`). The title fades in smoothly when first unlocked. The title is displayed on the main menu only — it does not appear in combat or on the mastery map.

### Title Unlock Table

| Rank | Title | Unlock condition |
|------|-------|-----------------|
| 1 | Apprentice | Earn any trophy |
| 2 | Forest Runner | Earn all three Forest first-kill trophies (`kill_snail`, `kill_wolf`, `kill_spider`) |
| 3 | Cave Crawler | Earn all three Caves first-kill trophies (`kill_troll`, `kill_bat`, `kill_golem`) |
| 4 | Dragon Slayer | Earn `dragon_1` |
| 5 | Dragon Hunter | Earn `dragon_3` |
| 6 | Iron Wizard | Earn `iron_wizard` (beat dragon with 45+ HP) |
| 7 | Golden Brain | Earn `master_gold` (all gold-tier problems green) |
| 8 | Dragon Lord | Earn `dragon_10` |
| 9 | Mathemagician | Earn `master_all` (all 55 problems green) |

---

## New Trophy Notification

When a trophy is unlocked mid-run or at the end of a fight, a brief toast notification slides in from the top-right of the screen:

```
  ┌────────────────────────────┐
  │  🏆 Trophy Unlocked!       │
  │  🐺  Wolf Tamer            │
  └────────────────────────────┘
```

- Appears for 3 seconds, then fades out
- Does not interrupt combat or block interaction
- If multiple trophies unlock simultaneously (e.g. first dragon kill unlocks `dragon_1`, `kill_dragon`, and possibly `iron_wizard`), they queue and display one after the other with a short gap
- If a title is also unlocked, a second toast appears after the trophy toasts: `"✨ New title: Dragon Slayer!"`

---

## localStorage Schema Addition

The existing `masteryScores` key is extended with four new sibling keys:

```javascript
// Existing
localStorage.setItem('masteryScores', JSON.stringify({ "6x7": 3, "8x9": -1, ... }))

// New
localStorage.setItem('trophies', JSON.stringify({
  dragon_1: true,
  kill_wolf: true,
  // all other trophy IDs default to false / absent
}))

localStorage.setItem('streak', JSON.stringify({
  current: 5,
  longest: 12,
  lastActiveDate: "2025-03-15"
}))

localStorage.setItem('dragonKills', JSON.stringify(3))

localStorage.setItem('allTrophiesEarned', JSON.stringify(false))
```

---

## Store Shape Addition

The following fields are added to the Svelte game store:

```javascript
{
  // ...existing fields...

  // Trophies (also mirrored in localStorage)
  trophies: {
    [trophyId: string]: boolean
  },

  // Newly unlocked this session (for toast queue)
  pendingTrophyToasts: string[],   // array of trophyIds

  // Streak (also mirrored in localStorage)
  streak: {
    current: number,
    longest: number,
    lastActiveDate: string
  },

  // Dragon kill counter (also mirrored in localStorage)
  dragonKills: number,

  // Run-level trophy flags — reset to default at the start of each new run
  healPotionUsedThisRun: boolean,  // default: false — set true when any Heal Potion resolves successfully
  droppedBelow20HP: boolean,       // default: false — set true if player.hp ever reaches ≤ 20
  hpLostInForest: boolean,         // default: false — set true if player takes any damage in fights 1–3
}
```

---

## File Structure Additions

```
src/
  lib/
    trophies.js         — trophy definitions (id, emoji, name, description, hint, category)
    streak.js           — streak update logic (checkAndUpdateStreak)
  components/
    TrophyCase.svelte   — full trophy grid screen
    TrophyToast.svelte  — non-blocking trophy unlock notification
    StreakDisplay.svelte — streak counter line on main menu
  stores/
    trophyStore.js      — trophy state, unlock logic, localStorage sync
```

---

## Implementation Notes

- **Trophy evaluation** should be called from a central `evaluateTrophies(gameState)` function invoked at natural checkpoints: end of fight, end of run, after any correct answer (for mastery and streak trophies). This avoids scattered trophy-checking logic across the codebase. The function skips any trophy already marked `true` in `localStorage`.
- **Mastery milestone trophies** re-evaluate on every session load (not just after correct answers) in case a mastery score threshold was reached in a previous session without the trophy being checked.
- **The `dragon_1` / `kill_dragon` double-award** is intentional — `kill_dragon` is a first-kill badge and `dragon_1` is a run-completion counter. Both fire on the same event. The toast queue handles the visual sequencing.
- **Streak milestones** are checked against `streak.longest`, not `streak.current`, so a broken streak does not cause a player to lose a milestone they already earned.

---

## Summary: Counts

| Category | Trophy count |
|----------|-------------|
| Dragon Slayer (run completion) | 3 |
| Speed & Skill | 5 |
| First Kills | 9 |
| Mastery Milestones | 7 |
| Streak Milestones | 3 |
| **Total** | **27** |

*(Note: `kill_dragon` and `dragon_1` share an unlock event but are separate trophy entries — total is 27, not 26.)*