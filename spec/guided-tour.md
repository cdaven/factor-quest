# Combat Screen — Guided Tour Spec

## Overview

A one-time guided tooltip tour that runs the first time a player enters the combat screen. It spotlights each UI zone in sequence with a darkened overlay, a highlight cutout, and a tooltip explaining that zone. The player can step through it or skip it entirely.

The tour runs **only once, ever** — on the very first fight of a player's very first run. It must never repeat on subsequent fights or runs.

---

## When to Show

- Check `localStorage` for the key `tourComplete`.
- If `tourComplete` is absent or `false`, show the tour when the combat screen mounts for fight 1.
- After the tour finishes or is skipped, set `localStorage.setItem('tourComplete', 'true')`.
- On all subsequent fights and runs, skip directly to the normal in-game hint system described in the main spec.

---

## Visual Structure

### Overlay

When the tour is active, a semi-transparent dark overlay (`rgba(10, 14, 30, 0.78)`) covers the entire combat screen. The currently highlighted zone is cut out of this overlay using a `box-shadow` trick, making it appear lit while everything else is dimmed.

The highlighted zone has:
- A rounded border (8px radius)
- A 3px solid outline in the action colour (`#4A90D9`)
- 4px of padding around the target element's bounding box

The highlight animates smoothly between zones (CSS transition, ~350ms, ease-in-out).

### Tooltip

A floating panel that appears near the highlighted zone. It contains:
- A directional arrow pointing toward the highlighted zone
- A short title (action colour, ~13px, semi-bold)
- A body paragraph (off-white, ~12px, line-height 1.5)
- A navigation row at the bottom with: **Skip tour** (left, muted text button), **step dots** (centre), **Next → / Done ✓** (right, action-colour button)

The tooltip panel:
- Background: dark navy (`#1A2340`)
- Border: 1.5px solid action colour (`#4A90D9`)
- Border radius: 10px
- Max width: 210px
- Animates position smoothly between steps (same transition as highlight)

### Arrow directions

The arrow is a small rotated square (10px) inheriting the tooltip border and background. Its direction is set per step:
- `up` — arrow points upward from top edge of tooltip (tooltip is below the target)
- `down` — arrow points downward from bottom edge (tooltip is above the target)
- `left` — arrow points left from left edge (tooltip is to the right of the target)
- `right` — arrow points right from right edge (tooltip is to the left of the target)

---

## Tour Steps

Six steps in order. The "zone" column refers to the element to highlight; positioning of the tooltip is relative to that element's bounding box.

### Step 1 — Progress bar

| Field | Value |
|-------|-------|
| Zone | The run progress bar at the top of the screen (the nine dots grouped into three areas) |
| Tooltip position | Below the progress bar, horizontally centred |
| Arrow direction | `up` |
| Title | Your journey |
| Body | Nine fights across three areas — Forest, Caves, and Fortress. The glowing dot shows where you are now. Complete all 9 to reach the dragon! |

---

### Step 2 — Player character

| Field | Value |
|-------|-------|
| Zone | The player column (wizard emoji + HP bar + "You" label) |
| Tooltip position | To the right of the player column, vertically centred |
| Arrow direction | `right` (arrow on right edge of tooltip, pointing left toward player) |
| Title | This is you |
| Body | The Young Wizard — that's you! The green bar is your health (HP). If it hits zero, the run is over. HP carries across all nine fights. |

---

### Step 3 — Enemy character

| Field | Value |
|-------|-------|
| Zone | The enemy column (enemy emoji + HP bar + enemy name label, not including the intent box) |
| Tooltip position | To the left of the enemy column, vertically centred |
| Arrow direction | `left` (arrow on left edge of tooltip, pointing right toward enemy) |
| Title | Your enemy |
| Body | The enemy you're fighting right now, with their own health bar. Reduce their HP to zero to win the fight and move on. |

---

### Step 4 — Enemy intent box

| Field | Value |
|-------|-------|
| Zone | The enemy intent box only (the "On end turn / ⚔️ Attack N" panel beneath the enemy) |
| Tooltip position | To the left of the intent box, vertically centred |
| Arrow direction | `left` |
| Title | Enemy's next move |
| Body | The enemy always shows what it'll do next turn. ⚔️ means it will attack you. Plan your defence before pressing End Turn! |

---

### Step 5 — Hand

| Field | Value |
|-------|-------|
| Zone | The entire hand area (all four cards) |
| Tooltip position | Above the hand, horizontally centred |
| Arrow direction | `down` (arrow on bottom edge of tooltip, pointing down toward cards) |
| Title | Your cards |
| Body | These are your actions. Tap a card to select it — a multiplication problem appears. Answer correctly to play the card! |

---

### Step 6 — Buttons

| Field | Value |
|-------|-------|
| Zone | The button row (Swap cards + End Turn & Attack buttons together) |
| Tooltip position | Above the button row, horizontally centred |
| Arrow direction | `down` |
| Title | End Turn & Attack |
| Body | When you're done playing cards, press this button. Your attacks land, then the enemy takes its turn. The Swap button lets you trade unwanted cards — once per turn. |

---

## Completion Screen

After step 6, when the player presses "Done ✓":
- Remove the overlay and tooltip.
- Show a brief full-screen overlay (same dark background) with:
  - A large ⚔️ icon
  - Heading: **You're ready to fight!**
  - Body: *Pick a card from your hand, answer the multiplication problem, and press End Turn & Attack when you're done.*
  - A single **Let's go!** button (action colour, `#4A90D9`)
- Pressing **Let's go!** dismisses this overlay entirely and leaves the player on the fully visible combat screen, ready to play.
- Set `tourComplete = true` and `fight1HintsComplete = true` in `localStorage` at this point (not before, in case the player refreshes mid-tour).

---

## Relationship to the Existing Hint System

The main spec defines three layers of onboarding hints that normally fire in fight 1:

1. **Fight 1 guided hints** — sequential contextual prompts: *"Tap a card to play it!"* → *"Nice! You can play more cards too."* → End Turn button pulse.
2. **Fights 2–3 persistent reminder** — a dimmed line below the hand: *"Play your cards, then press End Turn to attack."*
3. **Idle nudge** — appears after 12 seconds of inactivity, pointing the player at the cards or the End Turn button.

The tour and the fight 1 guided hints cover the same ground. The tour ends with the completion screen already saying *"Pick a card from your hand, answer the multiplication problem, and press End Turn & Attack when you're done"* — showing the fight 1 hints immediately afterward would repeat that instruction and feel redundant.

### Suppression rule

When `tourComplete` is written to `localStorage`, also write `localStorage.setItem('fight1HintsComplete', 'true')`. The fight 1 guided hint system (hint layer 1 above) must check for this flag on mount and skip entirely if it is set.

The fights 2–3 persistent reminder (layer 2) and the idle nudge (layer 3) are **not suppressed** — they are lightweight enough that they add value rather than feeling like repetition, and they reinforce the loop at the right moments.

### Summary of what fires after the tour

| Hint | Fires after tour? |
|------|------------------|
| Fight 1 guided hints ("Tap a card…") | No — suppressed by `fight1HintsComplete` flag |
| Fights 2–3 persistent reminder | Yes |
| Idle nudge | Yes |

---

## Skip Behaviour

If the player presses **Skip tour** at any step:
- Jump directly to the completion screen ("You're ready to fight!") described above.
- Still set `tourComplete = true` and `fight1HintsComplete = true` in `localStorage` when they press **Let's go!**.

---

## Navigation Controls

| Control | Behaviour |
|---------|-----------|
| Next → | Advance to next step. Label changes to "Done ✓" on the final step. |
| Skip tour | Jump to completion screen immediately. |
| Step dots | One dot per step, filled for the current step. Read-only — not clickable. |

There is no "Back" button. The tour is forward-only.

---

## Interaction During Tour

While the tour is active:
- Cards, buttons, and all other interactive elements are **non-interactive** (pointer events disabled via the overlay).
- The only interactive elements are the tooltip navigation buttons (Next, Skip).
- The combat screen behind the overlay is fully rendered and visible through the highlight cutout — no loading state needed.

---

## Svelte Implementation Notes

- Create a `TourOverlay.svelte` component that accepts a `steps` array prop and emits a `done` event when the tour completes or is skipped.
- Mount `TourOverlay` inside `CombatScreen.svelte`, conditionally rendered based on a `showTour` boolean derived from `localStorage`.
- Use Svelte's `onMount` to read `localStorage` and set `showTour`.
- Use `bind:this` on each target element in `CombatScreen.svelte` and pass the bounding rects into the tour component, or use element IDs and `getBoundingClientRect()` inside the tour component itself.
- The highlight and tooltip positions should be recalculated on each step change and on window resize.
- All transition animations should use Svelte's `tweened` store or a plain CSS transition — whichever is simpler to implement cleanly.
- The tour component should have no knowledge of game state — it only needs element positions and the step definitions.

---

## Logging

When the tour runs, emit the following console log entries (consistent with the game's logging format):

```
[SCENE] Tour started — fight 1, first run
[SCENE] Tour step 1/6 — progress bar
[SCENE] Tour step 2/6 — player character
[SCENE] Tour step 3/6 — enemy character
[SCENE] Tour step 4/6 — enemy intent
[SCENE] Tour step 5/6 — hand
[SCENE] Tour step 6/6 — buttons
[SCENE] Tour completed — tourComplete and fight1HintsComplete flags set
```

If skipped:
```
[SCENE] Tour skipped at step N/6 — tourComplete and fight1HintsComplete flags set
```