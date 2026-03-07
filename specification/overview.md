## Overview

A browser-based, client-side card game for children (~age 10) that teaches multiplication tables through strategic card combat. Inspired by Slay the Spire but greatly simplified. The player progresses through a dungeon by defeating enemies using a hand of cards, where each card requires correctly answering a multiplication problem to play.

**Target platform:** Client-side web app (no backend required)  
**Tech stack:** Svelte + Vite, Tailwind CSS  
**Target age:** ~10 years old  
**Session length:** ~20–25 minutes per run

---

## Tech Stack

- **Framework:** Svelte 5 with Vite
- **Styling:** Tailwind CSS
- **State management:** Svelte stores (a single `gameStore` is sufficient)
- **Animations:** Svelte's built-in `transition`/`animate` directives for card movement
- **No game engine** — this is UI state management, not a sprite-based game

---

## Animations (Nice to Have, Not Blocking)

- Cards slide in from the draw pile when drawn
- Selecting a card causes it to rise/expand and reveal the problem
- Played cards fly toward the enemy (attack) or player (defence/heal) then go to discard
- Enemy flashes red when hit; player avatar flashes when taking damage
- Player and enemy HP bars animate smoothly
- Wrong answer: card shakes, correct answer shown briefly, new problem fades in
- Second wrong answer: card dims and slides to discard pile
- Boss immunity: attack bounces off with a spark effect, no shield animation (the Dragon has no shield — it simply negates weak attacks)

---

## Out of Scope (for initial version)

- Multiple character classes or starting decks
- Persistent progression between runs (unlocks, achievements)
- Sound effects or music
- Mobile touch optimisation (desktop-first is fine)
- Saving a run in progress

---

## File Structure Suggestion

```
src/
  stores/
    gameStore.js        — all game state and actions (draw, select, answer, endTurn, etc.)
    masteryStore.js     — problem scoring, persisted to localStorage
  lib/
    cards.js            — card definitions (id, name, type, tier, effect)
    enemies.js          — enemy definitions and action patterns
    problems.js         — problem pool per tier, weighting logic, stamping function
  components/
    Card.svelte         — handles both unselected and selected states
    Enemy.svelte
    PlayerStats.svelte
    CombatScreen.svelte
    RestSite.svelte
    MasteryMap.svelte
    MainMenu.svelte
  App.svelte
```

---

## Notes for Implementation

- Keep problem-stamping logic cleanly separated from card definitions. Cards define effects; `problems.js` assigns problems at draw time based on tier.
- The mastery scores in `localStorage` persist across browser sessions — this is important for the spaced repetition to improve over many play sessions.
- The selected card state (`selectedCardId`) should live in the store so that only one card can be in the selected/problem-revealed state at a time.
- Start with a single enemy type and 5 cards to get the core loop working end-to-end, then expand.
- Wrong-answer feedback (showing the correct answer before moving on) is pedagogically important — don't skip it.
- Enemy HP and damage values in this spec are starting points. Playtesting with the target age group will likely require tuning, especially the bronze/silver/gold tier breakpoints.
