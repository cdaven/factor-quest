# Factor Quest — Implementation Todo

## 1. Project Setup

- [x] Scaffold project with `npm create vite@latest` using Svelte template
- [x] Install and configure Tailwind CSS v4 for Svelte/Vite
- [x] Set up base `index.html` with dark navy background (`#1A2340`)
- [x] Configure Tailwind with the custom colour palette from the spec (area colours, tier colours, type colours, feedback colours, mastery map colours, action button colour)
- [x] Create the suggested file/folder structure (`src/stores/`, `src/lib/`, `src/components/`)

---

## 2. Data Layer (`src/lib/`)

### `cards.js` — Card definitions
- [ ] Define all 16 starter deck card definitions (id, name, type, tier, effect)
  - Bronze (8 cards): Slash x2 (15 dmg each), Twin Blades x1 (15 dmg twice), Shield Up x2 (block 20), Heal Potion x2 (restore 10 HP), Counter x1 (reflect enemy attack damage)
  - Silver (3 cards): Heavy Strike (35 dmg), Piercing Arrow (30 dmg), Dodge (block 28 + draw 1)
  - Gold (3 cards): Fireball (63 dmg), Lightning Bolt (45 dmg), Stone Skin (block 54)
  - Free (2 cards): Double Down (next attack x2), Study (draw 2)
- [ ] Define `CardEffect` shape `{ type, value }` and document special effects:
  - Counter: reflects the enemy's actual attack damage back (not a fixed value); bypasses Dragon immunity threshold
  - Twin Blades: two separate hits of 15 — each checked independently against Dragon's 30-damage immunity
  - Double Down: multiplies next attack card's damage by 2 (Double Down + Slash = 30, which just clears Dragon immunity)
  - Dodge: defence card that also draws 1 card immediately on play

### `enemies.js` — Enemy definitions
- [ ] Define all 9 enemies with: id, name, emoji, hp, maxHp, action patterns (ordered arrays)
  - Fight 1: Snail (25 HP, Attack 6 loop)
  - Fight 2: Wolf (40 HP, Buff → Attack 20 → Attack 10 → Attack 10 → repeat)
  - Fight 3: Giant Spider (50 HP, Block 15 → Attack 14 → repeat)
  - Fight 4: Cave Troll (70 HP, Attack 16 → Attack 16 → Heal 12 → repeat; heal cap: 3x)
  - Fight 5: Giant Bat (65 HP, Attack 18 → Attack 18 → Block 25 → Attack 18 → repeat)
  - Fight 6: Stone Golem (110 HP, Block 20 → Attack 22 → Block 20 → Heal 15 → Attack 22 → repeat; heal cap: 4x)
  - Fight 7: Dark Knight (100 HP, Attack 20 → Block 30 → Buff → Attack 40 → repeat)
  - Fight 8: Necromancer (85 HP, Heal 20 → Attack 28 → Buff → Attack 28 → Heal 20 → repeat; heal cap: 3x)
  - Fight 9: Dragon (150 HP, Attack 20 → Block 30 → Buff → Attack 45 → Heal 30 → repeat; heal cap: 4x; immune to single attacks <30 damage)
- [ ] Define `EnemyIntent` shape `{ type: 'attack'|'block'|'buff'|'heal', value: number }`

### `problems.js` — Problem pool and stamping
- [ ] Define all 55 unique multiplication problems (1x1 through 10x10, deduplicated by commutativity)
- [ ] Assign each problem to its correct tier pool(s):
  - Bronze: x2, x3, x4, x5, x10
  - Silver: x3, x4, x6, x7
  - Gold: x6, x7, x8, x9
  - (overlapping tables appear in multiple pools)
- [ ] Implement `stampProblem(tier, masteryScores, excludeProblems)` — picks a problem weighted by mastery score (lower score = higher weight), never duplicating within a hand
- [ ] Implement problem key normalisation (treat `6x7` and `7x6` as the same key; display interchangeably)

### `logger.js` — Logging utility
- [ ] Create a single `LOGGING_ENABLED` flag
- [ ] Implement `log(category, message)` using the `[ACTION]`, `[STATE]`, `[PROBLEM]`, `[SCENE]`, `[RUN]` prefix format
- [ ] Implement `logState(character)` helper that reads directly from the store
- [ ] Use `console.group` for collapsible state snapshots

### `scenes.js` — Scene text data
- [ ] Define all pre-fight scene texts (9 fights + 2 rest sites) with emojis and text strings
- [ ] Define all victory scene texts (9 fights) with emojis and text strings

---

## 3. State Management (`src/stores/`)

### `masteryStore.js`
- [ ] Persist `masteryScores` object (`{ "6x7": number }`) to `localStorage`
- [ ] Implement `updateMastery(key, result)` — two separate updates happen per card play when first attempt is wrong:
  - Correct, first attempt: score +1 for that problem
  - Wrong first attempt: score -1 for that problem, then a new problem is stamped for the second attempt
  - Correct, second attempt: score +0 for the second problem (no change)
  - Wrong, second attempt: score -1 for the second problem
  - (A wrong+correct sequence = two updates: -1 on first problem, +0 on second problem)
- [ ] Load initial scores from `localStorage` on store creation; fall back to empty object

### `gameStore.js`
- [ ] Define the full store shape as specified:
  - Top-level: `phase` (`'menu'|'combat'|'rest'|'victory'|'defeat'`), `fightNumber`, `player`, `enemy`, `masteryScores`, `turn`, `selectedCardId`, `swapUsed`
  - `player`: `{ hp, maxHp, shield, doubleDownActive, deck, drawPile, hand, discardPile }`
  - `enemy`: `{ id, name, hp, maxHp, shield, intent, actionQueue, actionIndex, buffActive }`
  - Note: `buffActive` lives on `enemy`, not at top level; `doubleDownActive` lives on `player`
- [ ] Implement `startRun()` — initialise player (60 HP), shuffle 16-card deck, load fight 1 enemy, set phase to pre-fight scene
- [ ] Implement `startFight(fightNumber)` — load enemy, stamp problems on drawn cards, set enemy intent, log `[RUN]`
- [ ] Implement `drawCards(n)` — draw n cards from draw pile, stamp problems at draw time, reshuffle discard into draw if needed
- [ ] Implement `selectCard(id)` — set `selectedCardId`; only one card selected at a time
- [ ] Implement `cancelCard()` — deselect with no penalty
- [ ] Implement `submitAnswer(answer)`:
  - First attempt: if correct, resolve effect; if wrong, show correct answer briefly then re-stamp new same-tier problem
  - Second attempt: if correct, resolve effect; if wrong, discard card with no effect
  - Update mastery scores after each attempt
  - Log `[ACTION]` and `[PROBLEM]` entries
- [ ] Implement card effects on answer-correct:
  - Attack cards: add damage to queued attack total
  - Block/Shield cards: apply shield to player immediately
  - Heal cards: restore HP immediately (capped at maxHp)
  - Double Down: set a `doubleDownActive` flag affecting next attack card
  - Study: draw 2 cards immediately
  - Dodge (defence + draw 1): apply shield + draw 1 card
  - Counter: set `counterActive` flag; triggers in Step 4 if enemy's Step 2 action was an Attack; reflects the enemy's actual attack damage back at them; bypasses Dragon's immunity threshold
- [ ] Implement `useSwap(cardIds)` — discard selected cards, draw same count; mark `swapUsed = true`
- [ ] Implement `endTurn()` — run the full end-of-turn resolution sequence:
  1. First player attack lands (with enemy shield absorption); check for death → stop if enemy dies
  2. Enemy executes telegraphed action (only if enemy still alive)
  3. Remaining player attacks land in order; check for death after each → stop if enemy dies
  4. Counter resolves (reflects enemy's attack damage; bypasses Dragon immunity; skips if enemy already dead)
  5. Cleanup: reset both shields to 0, discard unplayed hand, update discard pile
  6. Check for player death (trigger defeat)
  7. Draw new hand for next turn; apply enemy shield if next intent is Block; advance enemy action index
  - Log all steps per the spec's resolution sequence format
- [ ] Implement enemy intent application:
  - Block intent: enemy gains shield at **start of player turn** (before player plays cards); once applied, change the intent label from "🛡️ Block N" to "🛡️ N shield" so the player knows it has already resolved
  - Buff intent: set `enemy.buffActive = true`; enemy deals double damage on its next Attack action; clear after it fires
- [ ] Implement Dragon special rule: single attacks dealing <30 damage deal 0 and show bounce effect; Twin Blades' two hits are checked independently (each 15 = both bounce); Double Down + Slash (15×2=30) exactly meets the threshold and lands; Counter bypasses the threshold entirely
- [ ] Implement `advanceFight()` — after each victory: apply +5 HP recovery (capped at maxHp, except after fight 9); move to next fight or rest site or final victory
- [ ] Implement enemy heal cap tracking per fight — Cave Troll (3x), Stone Golem (4x), Necromancer (3x), Dragon (4x); once cap is reached, skip Heal actions
- [ ] Implement rest site healing: restore up to 30 HP (capped at maxHp); log amount healed
- [ ] Implement `resetRun()` — return to main menu state

---

## 4. UI Components (`src/components/`)

### `MainMenu.svelte`
- [ ] Wizard emoji centred at top (large, 4-6rem)
- [ ] Game title "Factor Quest"
- [ ] Description text as specified
- [ ] Journey emoji row: forest, caves, fortress, dragon
- [ ] "Start Adventure" button (action colour `#4A90D9`)
- [ ] "Mastery Map" secondary button

### `ProgressBar.svelte` (fight tracker)
- [ ] Nine dots grouped into three areas of three, separated by vertical lines
- [ ] Area name labels above each group in area primary colour
- [ ] Dot states: completed (filled, dimmed, checkmark), current (filled, bright, slightly larger), upcoming (outlined only)
- [ ] Compact bar (~40-50px height)

### `SceneOverlay.svelte` (pre-fight, victory, rest site)
- [ ] Dark background overlay covering the screen
- [ ] Large emoji pair centred at top
- [ ] Scene text, centred, fades in gently
- [ ] "Continue" button (action colour `#4A90D9`)
- [ ] Victory variant: show `✨ +5 HP` with gold/white sparkle effect on HP bar (not shown after fight 9)
- [ ] Rest site variant: show `❤️ +N HP restored!` (actual amount gained) with HP bar animating upward before Continue becomes available
- [ ] Text content driven by `scenes.js` data and current `fightNumber`/`phase`

### `CombatScreen.svelte`
- [ ] Progress bar at top
- [ ] Player column (left): HP bar, shield indicator (fades in/out, hidden when 0), wizard emoji (large), "You" label, queued attack total (hidden until at least 1 attack card played)
- [ ] Enemy column (right): HP bar + ghost HP preview marker, shield indicator, enemy emoji (large), enemy name, enemy intent display
- [ ] Card hand row below character area
- [ ] "Swap cards" button (disabled/greyed after use)
- [ ] "End Turn & Attack" button (always reads this exact label)
- [ ] Deck count and discard count display
- [ ] Near-death effect: red pulsing screen edges when player HP <= 15

### `Card.svelte`
- [ ] Unselected state: name, tier badge (bronze/silver/gold/free) with matching border colour, type icon, effect description, hidden problem area (locked icon)
- [ ] Selected state: adds revealed problem ("7 x 8 = ?"), answer input field, Cancel button, Confirm button
- [ ] Border colour from tier (copper-brown/silver/gold/blue-white)
- [ ] Interior tint from card type (attack/defence/heal/utility colours)
- [ ] Double Down active: glow/pulse on next attack card in hand
- [ ] Wrong answer: shake animation, show correct answer briefly, new problem fades in
- [ ] Second wrong answer: dim and slide to discard

### `EnemyDisplay.svelte`
- [ ] Enemy emoji (large), name, HP bar with ghost preview marker
- [ ] Shield indicator (appears/disappears based on shield value)
- [ ] Intent display with coloured icon: attack (red-orange), block (steel blue), buff (purple), heal (green)
- [ ] Buff active: coloured aura on enemy
- [ ] Flash red when hit

### `PlayerStats.svelte`
- [ ] HP bar with smooth animation
- [ ] Shield indicator (fades in when >0, fades out when reset)
- [ ] Wizard emoji (large), "You" label
- [ ] Queued attack total ("⚔️ Attack N"), shown only when >0
- [ ] Flash when taking damage

### `MasteryMap.svelte`
- [ ] 10x10 grid; rows = first factor (1-10), columns = second factor (1-10)
- [ ] Each cell shows the answer in small text
- [ ] Cell colour states: green (mastered), amber (neutral), red (struggling), dark navy (not yet seen)
- [ ] Mastery thresholds per spec (green = correct first-attempt count 3+ more than wrong, red = more wrong than correct, dark = score 0 and never seen)
- [ ] Subtle outlined regions for bronze, silver, gold tier groups
- [ ] Legend below grid: bronze, silver, gold labels
- [ ] Explanatory text at top
- [ ] Progress summary line at bottom ("You've mastered X out of 55 problems!")
- [ ] Hover/tap to expand cell showing full problem (e.g. "7 x 8 = 56")
- [ ] Back button to return to main menu

### `HintDisplay.svelte`
- [ ] Fight 1, first run only — sequential guided hints:
  - On first card deal: "Tap a card to play it!" with gentle pulse on cards
  - After first card played: "Nice! You can play more cards too."
  - End Turn pulse with label
- [ ] Fights 2-3: persistent dimmed reminder "Play your cards, then press End Turn to attack." (keyed to `fightNumber <= 3`)
- [ ] Idle nudge: after 12 seconds of inactivity during player turn, show context-sensitive prompt
- [ ] Store guided-hints-completed flag in `localStorage`
- [ ] Only one hint visible at a time; hints fade out softly

---

## 5. Animations

- [ ] Cards slide in from draw pile when drawn (Svelte `transition` directives)
- [ ] Selected card rises/expands; problem fades in
- [ ] Played cards fly toward enemy (attack) or player (defence/heal) then slide to discard
- [ ] HP bars animate smoothly on change
- [ ] Shield indicator fades in/out
- [ ] Enemy flash red on hit; player avatar flash on damage
- [ ] Wrong answer: card shakes
- [ ] Second wrong answer: card dims and slides to discard
- [ ] Dragon immunity: attack bounces with spark effect, no damage
- [ ] Near-death: slow red heartbeat pulse on screen edges

---

## 6. Game Flow Wiring

- [ ] `App.svelte` — top-level phase router: render MainMenu / SceneOverlay / CombatScreen / MasteryMap based on `phase`
- [ ] Pre-fight overlay shown before each fight, dismissed by Continue
- [ ] Victory overlay shown after each fight, dismissed by Continue (leads to rest site overlay if applicable, else next pre-fight)
- [ ] Rest site overlay shown automatically between areas; HP restored on arrival, bar animates before Continue unlocks
- [ ] Defeat screen shown when player HP reaches 0 (simple overlay with "Play Again" button)
- [ ] Final victory screen shown after fight 9 (victory overlay text for The Dragon)
- [ ] "Play Again" / "Start New Run" resets all run state (does NOT reset mastery scores)

---

## 7. Logging Integration

- [ ] Wire `logger.js` calls into every relevant action in `gameStore.js` per the spec's log format
- [ ] Log card selection, answer submission (correct/wrong/both attempts), cancellation
- [ ] Log card play results (shield applied, HP restored, attack queued)
- [ ] Log swap usage
- [ ] Log end-turn resolution sequence step-by-step
- [ ] Log mastery score updates
- [ ] Log scene transitions and rest site healing
- [ ] Log run start/end events

---

## 8. Polish and Edge Cases

- [ ] Reshuffle discard pile into draw pile mid-draw when draw pile runs out (both for normal draw and swap)
- [ ] Ensure same problem never stamped on two different cards in the same hand
- [ ] Enemy block intent applies at start of player turn (not during resolution)
- [ ] Dragon immunity: visually bounce single attacks <30 damage; log as 0 damage; Twin Blades hits each 15 independently (both bounce); Double Down + Slash = 30 lands; Counter bypasses immunity
- [ ] Overkill: enemy death during step 1 or step 3 cancels the rest of the sequence; enemy death during step 1 means step 2 (enemy counter-attack) does not fire; enemy can also die in step 4 from Counter
- [ ] Shield resets to 0 at end-of-turn cleanup (both player and enemy); indicators fade out
- [ ] Buff active: `enemy.buffActive` — enemy deals double damage on its next Attack action only; clear after it fires
- [ ] Counter card: triggers in step 4 only if enemy's step 2 action was an Attack; does not trigger if enemy is already dead; reflects exact enemy attack value
- [ ] Double Down: uses `player.doubleDownActive`; multiplies only the *next* attack card played; clears after that card is played
- [ ] Enemy heal cap: track `enemy.healCount` per fight; skip Heal actions once cap is reached (Troll 3x, Golem 4x, Necromancer 3x, Dragon 4x)
- [ ] Victory +5 HP: apply immediately when advancing from a fight victory; do not apply after fight 9
- [ ] Heal capped at maxHp (60)
- [ ] Confirm button on answer input should also trigger on Enter key press
- [ ] Escape key or clicking away from selected card should cancel selection
