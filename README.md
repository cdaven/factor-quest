# Factor Quest

A browser-based card game for children (~age 10) that teaches multiplication tables through strategic card combat. Inspired by Slay the Spire, greatly simplified. Players progress through a dungeon — forest, caves, fortress — by defeating enemies using a hand of cards, where each card requires correctly answering a multiplication problem to play.

## Gameplay

- Play cards from your hand to attack, block, or heal
- Each card (except free utility cards) shows its tier but hides its multiplication problem until selected
- Answer correctly to use the card; a wrong first answer gives you one more chance with a new problem
- Defeat all 9 enemies across 3 areas to slay the Dragon
- Your multiplication progress is tracked across runs — problems you struggle with appear more often

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

## Authorship

This project was built as a collaboration between a human and AI. The game concept, design, specification, and code are approximately 99% the work of [Claude Code](https://claude.ai/code) (Anthropic's AI coding assistant), including the game mechanics, card system, enemy design, spaced-repetition logic, UI, and animations. The human contributor provided direction, feedback, and testing throughout.

## A note on use

This project is released under the MIT License — you're free to use, modify, and share it however you like. That said, I'd ask that you use it in the spirit it was made: as something that helps rather than harms. I'd prefer it not be used in ways that hurt people or contribute to things most of us would consider wrong.

This isn't a legal restriction — just a request from someone who made a little game for kids and hopes it does some good in the world.
