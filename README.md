# Factor Quest

A browser-based card game for children (~age 10) that teaches multiplication tables through strategic card combat. Inspired by Slay the Spire, greatly simplified. Players progress through a dungeon — forest, caves, fortress — by defeating enemies using a hand of cards, where each card requires correctly answering a multiplication problem to play.

## Gameplay

- Play cards from your hand to attack, block, or heal
- Each card (except free utility cards) shows its tier but hides its multiplication problem until selected
- Answer correctly to use the card; a wrong first answer gives you one more chance with a new problem
- Defeat all 9 enemies across 3 areas to slay the Dragon
- Your multiplication progress is tracked across runs — problems you struggle with appear more often

## Structure

```
9 fights across 3 areas, separated by 2 rest sites:

The Forest (fights 1–3)   →   Campfire   →   The Caves (fights 4–6)   →   Stream   →   The Fortress (fights 7–9, boss: The Dragon)
```

Card tiers gate difficulty:
- **Bronze** — easy problems (×2 ×3 ×4 ×5 ×10); sufficient for The Forest
- **Silver** — medium problems (×3 ×4 ×6 ×7); required for The Caves
- **Gold** — hard problems (×6 ×7 ×8 ×9); required for The Fortress

## Tech Stack

| | |
|---|---|
| Framework | Svelte 5 + Vite |
| Styling | Tailwind CSS v4 (Vite plugin) |
| State | Svelte stores (`gameStore`, `masteryStore`) |
| Persistence | `localStorage` (mastery scores survive across runs) |
| Backend | None — fully client-side |

## Development

```bash
npm install
npm run dev
```

```bash
npm run build    # production build
npm run preview  # preview production build
```

## Project Layout

```
src/
  stores/
    gameStore.js      — all game state and actions
    masteryStore.js   — problem scoring, persisted to localStorage
  lib/
    cards.js          — card definitions
    enemies.js        — enemy definitions and action patterns
    problems.js       — problem pools, spaced repetition weighting, stamping
    scenes.js         — pre-fight and victory scene text data
    logger.js         — structured console logging utility
  components/
    MainMenu.svelte
    CombatScreen.svelte
    Card.svelte
    SceneOverlay.svelte
    ProgressBar.svelte
    MasteryMap.svelte
    HintDisplay.svelte
  App.svelte          — top-level phase router
  app.css             — Tailwind import + custom colour theme
```

## Mastery Tracking

A 10×10 grid (accessible from the main menu) shows progress across all 55 multiplication problems. Cells are coloured green / amber / red / dark based on answer history. Scores persist in `localStorage` so progress carries across sessions and runs.

## Authorship

This project was built as a collaboration between a human and AI. The game concept, design, specification, and code are approximately 99% the work of [Claude Code](https://claude.ai/code) (Anthropic's AI coding assistant), including the game mechanics, card system, enemy design, spaced-repetition logic, UI, and animations. The human contributor provided direction, feedback, and testing throughout.
