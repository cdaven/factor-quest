# Multiplication Quest — Game Specification

## Core Game Loop

A run consists of 9 fights arranged in a single linear path — no branching, no map to navigate. The fights are grouped into three named areas, each with a distinct setting and difficulty level. There is no concept of "floors" — just fights grouped by area. Two rest sites sit between the areas, one after The Forest and one after The Caves.

```
The Forest       Rest Site 1    The Caves        Rest Site 2    The Fortress
──────────────   ───────────    ───────────────   ───────────    ──────────────────────
Fight 1                         Fight 4                          Fight 7
Fight 2          Campfire 🔥    Fight 5          Stream 💧      Fight 8
Fight 3                         Fight 6                          Fight 9 (Boss: The Dragon)
```

After completing a run (or dying), the player can start a new run.

### Area Overview

| Area | Fights | Required card tier | Theme |
|------|--------|--------------------|-------|
| The Forest | 1–3 | Bronze | Introductory; bronze cards are sufficient |
| Rest Site 1 | — | — | Campfire; player automatically heals before The Caves |
| The Caves | 4–6 | Bronze + Silver | Silver cards become necessary |
| Rest Site 2 | — | — | Stream; player automatically heals before The Fortress |
| The Fortress | 7–9 | Silver + Gold | Gold cards required; boss is the final fight |

The two rest sites give the player a chance to recover at the two natural difficulty transitions. Healing is automatic — no decision required.

---

## Card Tiers

Every card (except free utility cards) belongs to one of three tiers. **The tier determines both the difficulty of the multiplication problem required to play the card, and the power of the card's effect.** Tier is always clearly visible on the card face so the player knows exactly what they are committing to before selecting a card.

| Tier | Visual treatment | Problem difficulty | Example tables |
|------|-----------------|-------------------|---------------|
| 🥉 Bronze | Brown/copper border and icon | Easy | ×2, ×3, ×4, ×5, ×10 |
| 🥈 Silver | Silver border and icon | Medium | ×3, ×4, ×6, ×7 |
| 🥇 Gold | Gold border and icon | Hard | ×6, ×7, ×8, ×9 |

Bronze cards are reliable but low-powered. Gold cards are high-powered but demand confident knowledge of the harder tables. The player always knows a card's tier — and therefore roughly how hard the problem will be — before selecting it. The specific problem is only revealed after selection.

Note that some tables (×3, ×4, ×6, ×7) span multiple tiers. Within each tier, the spaced repetition system (see Progression) weights problems toward the player's weaker combinations.

---

## Combat Mechanics

### Turn Structure

Each combat turn follows this sequence:

1. **Draw phase** — Player draws 4 cards from their deck into their hand
2. **Enemy telegraph** — The enemy displays its intended action for this turn (e.g. "⚔️ Attack 24" or "🛡️ Block 15")
3. **Player phase** — Player selects and plays cards, and may use the once-per-turn swap (see below)
4. **End turn** — Player clicks "End Turn & Attack"; enemy executes its telegraphed action; both characters' shield resets to 0; next turn begins

The **player always goes first** each turn.

### Playing a Card

Cards in hand show their name, effect, tier, and type — but **not** their multiplication problem. The problem is hidden until the player selects a card.

1. **Player selects a card** — the card expands or highlights; the multiplication problem is now revealed (e.g. "7 × 8 = ?") along with an answer input field. The player may **cancel** at this point (click away or press Escape) to deselect the card with no penalty and choose a different one.
2. **Player types their answer and confirms.**
3. Outcomes:
   - **Correct answer** → card effect resolves immediately
   - **Wrong answer (first attempt)** → the incorrect answer is briefly highlighted and the correct answer is shown for a moment; a **new problem of the same tier** is then stamped onto the card and the player gets a second attempt
   - **Wrong answer (second attempt)** → the correct answer is shown; the card is discarded with no effect

The player is never punished for a single mistake, but must engage genuinely with the problems to benefit from their cards. Both attempts are recorded in the mastery tracking system. There is **no time limit** on answering.

**Attack cards** are queued when played and resolve during the end-of-turn sequence. **Block and heal cards** take effect immediately when played — shield and HP update on screen right away, before the player plays any further cards.

### Swapping Cards

Once per turn, the player may discard any number of cards from their hand and immediately draw the same number from the draw pile. This is shown as a **"🔄 Swap cards"** button in the UI, available throughout the player phase until used.

Rules:
- The player selects which cards to discard before confirming — they can see what they are giving up
- The replacement cards are drawn immediately; the discarded cards go to the discard pile
- The swap uses the normal draw pile; if the draw pile runs out mid-swap, the discard pile is reshuffled first
- The swap is free — it costs no HP or resources
- Only one swap is allowed per turn; the button becomes greyed out after use
- Cards already played this turn cannot be included in the swap

The swap gives the player agency when dealt a useless hand — a fistful of defence cards against a healing enemy, for example — without removing all tension. The replacement cards might be equally unhelpful, which is a signal about deck composition rather than bad luck.

### Terminology: Block and Shield

These two terms have distinct meanings throughout the game and should be used consistently in both the codebase and all UI text:

- **Block** is the *action* — what a card does, and what an enemy telegraphs. Cards say "Block 20 damage." Enemy intent shows "🛡️ Block 15." The verb always refers to the act of gaining protection.
- **Shield** is the *stat* — the current protection value sitting on a character. The UI shows "🛡️ 15 shield." Damage resolution says "absorbed by shield." The noun always refers to the pool of protection.

### Damage and Shield

- **Shield** absorbs incoming damage 1:1 and expires at the end of the turn (does not carry over to the next turn). The shield indicator in the UI only appears when shield is greater than zero — it fades in when gained and fades out when it resets, and is never displayed as "0"
- **Attacks do not reduce enemy shield** — incoming player damage is reduced by the enemy's current shield first, with any remainder hitting HP
- **Overkill damage is wasted** — if the enemy has 8 HP and you deal 72 damage, the enemy simply dies
- **Player HP persists** across all fights within a run

### Enemy Behaviour

Enemies telegraph exactly one action per turn from a fixed pattern. Possible actions:

- **Attack [N]** — deals N damage to the player (reduced by the player's shield)
- **Block [N]** — enemy gains N shield this turn
- **Buff** — enemy will deal double damage next turn (shown as a warning icon)
- **Heal [N]** — enemy recovers N HP (signals: attack aggressively this turn)

Enemies cycle through a predetermined sequence of actions. This is intentional — players can learn the pattern and plan ahead.

---

## Cards

### Deck Composition

The player starts each run with a fixed starter deck of 16 cards. The deck does not change during a run — no cards are added or removed. Cards are shuffled into a draw pile at the start of each fight.

At the end of each turn, all unplayed cards remaining in the hand are discarded to the discard pile. When the draw pile is exhausted mid-fight, the discard pile is reshuffled into a new draw pile and drawing continues.

### Card Effects and Tiers

Card effects are fixed values — the problem does not change the card's power. The tier determines which problem pool to draw from at stamping time.

**Bronze cards** (easy problems, modest effects):

| Card | Effect |
|------|--------|
| Slash ×2 | Deal 15 damage |
| Twin Blades | Deal 15 damage twice (two separate hits; each is checked independently against the Dragon's immunity threshold) |
| Shield Up ×2 | Block 20 damage (gain 20 shield) |
| Heal Potion ×2 | Restore 10 HP |
| Counter | If the enemy attacks this turn, reflect the enemy's attack damage back at them |

**Silver cards** (medium problems, solid effects):

| Card | Effect |
|------|--------|
| Heavy Strike | Deal 35 damage |
| Piercing Arrow | Deal 30 damage |
| Dodge | Block 28 damage (gain 28 shield) and draw 1 card immediately |

**Gold cards** (hard problems, powerful effects):

| Card | Effect |
|------|--------|
| Fireball | Deal 63 damage |
| Lightning Bolt | Deal 45 damage |
| Stone Skin | Block 54 damage (gain 54 shield) |

**Free cards** (no problem, utility):

| Card | Effect |
|------|--------|
| Double Down | Your next attack card's damage is multiplied by 2 |
| Study | Draw 2 cards immediately |

This gives a starter deck of 14 tiered cards (8 bronze, 3 silver, 3 gold) plus 2 free utility cards — 16 cards total. The exact split can be tuned during playtesting.

### Problem Stamping

When a card is drawn, the game selects a problem from the current problem pool matching the card's tier and stamps it onto the card for this draw. The problem is not visible to the player until they select the card. Rules:

- The same problem is never stamped on two different cards in the same hand
- Within each tier, the spaced repetition weighting applies (weaker problems surface more often)
- "Double Down" and "Study" are never stamped with a problem

---

## HP and Healing

- **Player starts each run with 60 HP**
- Healing sources:
  - **Heal Potion card** (in-combat only) — restores 10 HP immediately when played and answered correctly during a fight, capped at max HP; the HP bar updates on screen right away
  - **Victory recovery** — the player recovers 5 HP (capped at max HP) after winning each fight. This is shown on the victory overlay as "✨ +5 HP" with a brief sparkle on the HP bar. The sparkle uses a gold/white effect rather than the soft rose used for healing — it reads as a reward, not a rest. The final Dragon victory (fight 9) does not award victory recovery since the run is over.
  - **Rest Sites** — automatically restores up to 30 HP when the player arrives, capped at max HP. No decision required. A player who ends The Forest on 12 HP recovers to 42; a player on 45 HP recovers to 60 (full).

---

## Progression and Problem Pool

### Problem Tiers and Tables

| Tier | Tables | Approximate problem count |
|------|--------|--------------------------|
| Bronze | ×2, ×3, ×4, ×5, ×10 | ~25 unique problems |
| Silver | ×3, ×4, ×6, ×7 | ~20 unique problems |
| Gold | ×6, ×7, ×8, ×9 | ~20 unique problems |

The full pool covers all combinations from 1×1 to 10×10 (55 unique problems after accounting for commutativity). Problems in overlapping tables (e.g. ×3, ×4) appear in both bronze and silver pools so they get extra reinforcement.

Problems are not unlocked gradually mid-run — the full pool for all tiers is available from fight 1. Instead, difficulty is gated by which tier of cards the player holds, which in turn is governed by what the enemy requires (see Enemy Progression below).

### Spaced Repetition (Problem Weighting)

Track a score per problem combination in `localStorage` (persists across runs):

- Correct answer, first attempt → score +1
- Correct answer, second attempt → score +0 (for the second problem; the first problem's wrong answer already scored −1)
- Wrong answer → score −1 (applied per problem, per attempt — if both attempts are wrong, that is −1 for each of the two different problems)

Note: a wrong first attempt and a correct second attempt result in two mastery updates — −1 for the first problem and +0 for the second — because the second attempt always presents a new problem (see Playing a Card).

When stamping a problem onto a card, weight the random selection within the tier so lower-scored problems appear more frequently. A player who consistently struggles with 7×8 will encounter it often, spread across different card effects and combat situations, without it feeling like a drill.

Commutativity: treat 6×7 and 7×6 as the same problem in tracking, but display them interchangeably.

### Mastery Map

A 10×10 grid accessible from the main menu or between fights. Each cell represents one multiplication problem — the row is the first number (1–10) and the column is the second number (1–10), so the cell at row 7, column 8 represents 7×8. Each cell shows the answer in small text (e.g. "56") so the child can read the grid directly without mental arithmetic.

**Explanatory text at the top of the screen:**
*"These are all your multiplication problems. Green means you know it well. Yellow means you're still learning. Red means it needs more practice."*

**Cell colour states:**
- 🟩 Green — answered correctly on the first attempt 3+ more times than incorrectly
- 🟨 Yellow — neutral / not yet well practised
- 🟥 Red — answered incorrectly more than correctly
- ⬛ Dark — not yet encountered in the game

**Tier region outlines:**
The grid shows a subtle outlined region for each problem tier — bronze, silver, and gold — so the child can see which section of the grid they are currently working through. A small legend below the grid labels each region: "🥉 Bronze · 🥈 Silver · 🥇 Gold".

**Progress summary line** at the bottom of the screen:
*"You've mastered 23 out of 55 problems!"*

On hover or tap, each cell expands briefly to show the full problem (e.g. "7 × 8 = 56") in case the answer alone is ambiguous.

This gives the child (and parent/teacher) a clear, readable view of progress across all 55 problems.

---

## Player Character

The player is represented by **The Young Wizard**, a child apprentice whose spellbook is the source of their cards. The wizard appears on the left side of the combat screen throughout the entire game.

| Element | Value |
|---------|-------|
| Label | "You" |
| Icon | 🧙 |
| Starting HP | 60 |
| Visual style | Small robed figure with a pointed hat; the same icon is used throughout all areas |

---

## Scene Sequence

Every event in the run is accompanied by a scene overlay. The full sequence of overlays across a complete run is:

```
[Pre-fight 1] → [Victory 1] → [Pre-fight 2] → [Victory 2] → [Pre-fight 3] → [Victory 3]
→ [Rest Site 1] → [Pre-fight 4] → [Victory 4] → [Pre-fight 5] → [Victory 5]
→ [Pre-fight 6] → [Victory 6] → [Rest Site 2] → [Pre-fight 7] → [Victory 7]
→ [Pre-fight 8] → [Victory 8] → [Pre-fight 9] → [Victory 9 / Final Victory]
```

The player always sees: pre-fight scene → combat → victory scene → (rest site if applicable) → pre-fight scene → combat → ...

---

## Victory Scene Texts

After each fight, a victory scene overlay is shown before anything else — before the rest site if one follows, and before the next pre-fight scene. The overlay uses the same format as pre-fight scenes: dark background, emoji pair, scene text, and a Continue button.

Victory scenes reflect the area the player is in and the enemy just defeated. The tone is triumphant but brief — the journey continues.

| Fight | Enemy | Emojis | Victory scene text |
|-------|-------|--------|--------------------|
| 1 | Snail 🐌 | 🌲🌙 | *"The snail retreats into its shell and goes still. You step over it carefully and walk on."* |
| 2 | Wolf 🐺 | 🌲🌙 | *"The wolf slinks back into the shadows, defeated. The forest falls quiet again. You catch your breath and press on."* |
| 3 | Giant Spider 🕷️ | 🌲🌙 | *"The spider curls up and drops from its web. You push through the sticky strands and emerge on the other side of the forest."* |
| 4 | Cave Troll 👺 | ⛏️🌑 | *"The troll stumbles backward and crashes to the ground with a thunderous boom. Dust falls from the cave ceiling. You step past it into the dark."* |
| 5 | Giant Bat 🦇 | ⛏️🌑 | *"The bat lets out a piercing screech and disappears into the darkness above. The cave falls silent. You keep moving."* |
| 6 | Stone Golem 🗿 | ⛏️🌑 | *"Cracks spread across the golem's body. With a deep grinding sound, it crumbles into a pile of rubble. The chamber is yours."* |
| 7 | Dark Knight 🤺 | 🏰🌑 | *"The knight's armour clangs against the stone floor. You step over the fallen warrior and continue up the fortress stairs."* |
| 8 | Necromancer 💀 | 🏰🌑 | *"The necromancer dissolves into shadows with a last whispered curse. The candles go out. Only one door remains."* |
| 9 | The Dragon 🐉 | 🏰🔥 | *"The dragon lets out a final roar that shakes the fortress walls — then falls still. Light floods the chamber. You have done it."* |

### Victory Overlay UI

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    🌲🌙                             │
│                                                     │
│     "The wolf slinks back into the shadows,         │
│      defeated. The forest falls quiet again.        │
│      You catch your breath and press on."           │
│                                                     │
│                  ✨ +5 HP                            │
│                                                     │
│                  [ Continue ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The victory overlay replaces the combat screen. The ✨ +5 HP line appears after the scene text with a brief sparkle effect on the player's HP bar. The Continue button leads to the rest site overlay (if one follows) or directly to the next pre-fight scene. The Dragon victory (fight 9) omits the +5 HP line since the run is complete.

---

## Pre-Fight Scene Texts

Before each fight, a brief scene overlay appears to set the mood and tell a small piece of the story. Rest sites also have their own scene overlay (see Rest Site Overlay UI). All overlays share the same format: dark background, a large emoji pair at the top, scene text centred below, and a Continue button. Text fades in gently rather than appearing instantly.

The emoji pair reflects the area and the time of day. The fortress fight 9 uses 🔥 instead of 🌑 since the dragon's lair is lit by fire. Rest sites use warmer, calmer imagery to signal safety.

| Event | Emojis | Scene text |
|-------|--------|------------|
| Fight 1 — Snail 🐌 | 🌲🌙 | *"You step into the dark forest. The trees loom tall around you. Suddenly, a giant snail slides out from behind a mossy rock and eyes you suspiciously."* |
| Fight 2 — Wolf 🐺 | 🌲🌙 | *"You press deeper into the forest. Twigs snap beneath your feet. From the shadows, a wolf emerges — teeth bared and eyes gleaming in the moonlight."* |
| Fight 3 — Giant Spider 🕷️ | 🌲🌙 | *"The trees grow closer together and thick webs hang between the branches. Before you can turn back, a giant spider drops silently from above."* |
| Rest Site 1 — Campfire | 🔥🌲 | *"You find a sheltered clearing and sink to the ground with relief. A small fire crackles warmly as you eat, rest, and tend to your wounds. You feel stronger already."* |
| Fight 4 — Cave Troll 👺 | ⛏️🌑 | *"You leave the forest behind and descend into a damp cave. Your footsteps echo in the darkness. A cave troll lumbers out from the shadows, blocking your path."* |
| Fight 5 — Giant Bat 🦇 | ⛏️🌑 | *"You venture further into the cave. The air grows cold and stale. High above, something stirs — a giant bat detaches from the ceiling and swoops toward you."* |
| Fight 6 — Stone Golem 🗿 | ⛏️🌑 | *"Deep in the cave, you discover a vast chamber. At its centre stands a stone golem, ancient and silent. As you approach, its eyes flicker open with a dull orange glow."* |
| Rest Site 2 — Stream | 💧🪨 | *"You hear a faint trickling sound ahead. A clear stream runs through a crack in the cave wall. You drink deeply, wash your face in the cold water, and feel your strength return."* |
| Fight 7 — Dark Knight 🤺 | 🏰🌑 | *"You climb the fortress stairs, your heart pounding. A dark knight steps out of a doorway, armour clanking, blocking the corridor ahead."* |
| Fight 8 — Necromancer 💀 | 🏰🌑 | *"At the top of the fortress tower, candles flicker in a cold wind. A necromancer stands with their back to you — but slowly turns around, as if they knew you were coming."* |
| Fight 9 — The Dragon 🐉 | 🏰🔥 | *"You push open the great iron door at the heart of the fortress. The room beyond is vast and hot. Two enormous eyes open in the darkness. The dragon has been waiting."* |

### Fight Scene Overlay UI

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    🌲🌙                             │
│                                                     │
│     "You press deeper into the forest. Twigs        │
│      snap beneath your feet. From the shadows,      │
│      a wolf emerges — teeth bared and eyes          │
│      gleaming in the moonlight."                    │
│                                                     │
│                  [ Continue ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The overlay sits on top of the combat screen, which is already loaded behind it. Dismissing the overlay reveals the combat screen with the enemy already visible — no additional loading or transition needed.

### Rest Site Overlay UI

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    🔥🌲                             │
│                                                     │
│     "You find a sheltered clearing and sink to      │
│      the ground with relief. A small fire           │
│      crackles warmly as you eat, rest, and tend     │
│      to your wounds. You feel stronger already."    │
│                                                     │
│                ❤️ +30 HP restored!                  │
│                                                     │
│                  [ Continue ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The rest site overlay replaces the combat screen entirely — there is no enemy behind it. The HP is restored automatically when the overlay appears, with the HP bar animating upward before the Continue button becomes available. The HP restored line shows the actual amount gained (e.g. "❤️ +18 HP restored!" if the player was already on 42 HP).

---

## Enemy Progression

The core design principle: **The Forest can be cleared with bronze cards alone; The Caves require silver cards; The Fortress requires gold cards.** The math mastery required to progress through the dungeon directly mirrors the multiplication tables the child needs to learn.

Each fight has exactly one unique enemy. There is no random pool — every run faces the same nine enemies in the same order, but the player's hand is different each time so no two fights play out identically.

Enemy HP and damage values are calibrated against realistic card output per tier. Approximate per-turn damage potential:

| Tiers available | Realistic damage per turn (2–3 cards played) |
|----------------|---------------------------------------------|
| Bronze only | 30–60 damage |
| Bronze + Silver | 60–100 damage |
| Bronze + Silver + Gold | 100–170 damage |

Each enemy also introduces exactly one new mechanic or pattern, so the player is never confronted with two unfamiliar things at once.

---

### The Forest (Fights 1–3) — Bronze tier

**Fight 1 — Snail 🐌**
- **HP:** 25
- **Required tier:** Bronze
- **New mechanic:** None — introductory fight for learning the UI
- **Action pattern:** Attack 6 → Attack 6 → ...
- **Notes:** Slow and unthreatening. Exists purely to let the player practice selecting cards, answering problems, and pressing End Turn without any real danger.

**Fight 2 — Wolf 🐺**
- **HP:** 40
- **Required tier:** Bronze
- **New mechanic:** Buff — first enemy to telegraph a damage multiplier
- **Action pattern:** Buff → Attack 20 → Attack 10 → Attack 10 → ...
- **Notes:** The Buff telegraph appears immediately on the first turn, teaching the player to start thinking ahead from the start. A player who ignores the Buff and doesn't build shield on turn 1 takes 20 damage straight away — enough to feel the consequence. After the opening punch, the Wolf settles into lighter attacks.

**Fight 3 — Giant Spider 🕷️**
- **HP:** 50
- **Required tier:** Bronze
- **New mechanic:** Alternating Block/Attack — timing attacks around the enemy's shield
- **Action pattern:** Block 15 → Attack 14 → Block 15 → Attack 14 → ...
- **Notes:** First enemy where saving attack cards for the right turn matters. Attacking on a Block turn wastes a Slash entirely (15 damage absorbed by 15 shield). Twin Blades fares slightly better (first hit absorbed, second lands for 15), but the inefficiency is tangible. A patient player saves attacks for Attack turns.

---

### The Caves (Fights 4–6) — Bronze + Silver tier

**Fight 4 — Cave Troll 👺**
- **HP:** 70
- **Required tier:** Bronze + Silver
- **New mechanic:** Heal — first enemy that recovers HP
- **Action pattern:** Attack 16 → Attack 16 → Heal 12 → ...
- **Heal cap:** 3 times per fight (36 HP total)
- **Notes:** Teaches urgency. Playing slowly and conserving cards lets the Troll heal faster than the player damages it. The player must push damage aggressively and accept some hits rather than turtling behind shield. The heal cap prevents the fight from becoming unwinnable for a struggling player, but using all 3 heals means the player has to chew through 106 effective HP — a steep price for slow play.

**Fight 5 — Giant Bat 🦇**
- **HP:** 65
- **Required tier:** Silver
- **New mechanic:** Reliable sustained pressure with occasional heavy block
- **Action pattern:** Attack 18 → Attack 18 → Block 25 → Attack 18 → ...
- **Notes:** Hits hard and consistently. The Block 25 turn absorbs a single bronze attack and most of Twin Blades (30 total, but 25 absorbed leaving only 5 through), teaching the player to hold attacks when Block is telegraphed and use that turn to build shield or play utility cards instead.

**Fight 6 — Stone Golem 🗿**
- **HP:** 110
- **Required tier:** Silver
- **New mechanic:** Combined Block + Heal attrition
- **Action pattern:** Block 20 → Attack 22 → Block 20 → Heal 15 → Attack 22 → ...
- **Heal cap:** 4 times per fight (60 HP total)
- **Notes:** The first real wall of the run. The Golem's high HP combined with frequent blocking and healing means bronze-only output can never keep pace — Block 20 absorbs a bronze Slash (15 damage) with room to spare. Silver cards are necessary to break through. The heal cap ensures the fight remains winnable even for slower players, but at 170 effective HP at maximum healing it punishes inefficiency heavily.

---

### The Fortress (Fights 7–9) — Silver + Gold tier

**Fight 7 — Dark Knight 🤺**
- **HP:** 100
- **Required tier:** Silver + Gold
- **New mechanic:** Heavy block that neutralises silver attacks, combined with Buff
- **Action pattern:** Attack 20 → Block 30 → Buff → Attack 40 → ...
- **Notes:** Block 30 absorbs even a silver Heavy Strike (35 damage — only 5 gets through). The Buff → Attack 40 sequence punishes players who haven't built enough shield capacity. Gold blocking (Stone Skin: 54 shield) is the reliable answer to the Buff turn.

**Fight 8 — Necromancer 💀**
- **HP:** 85
- **Required tier:** Gold
- **New mechanic:** Opens with Heal — disorienting tempo, high healing frequency
- **Action pattern:** Heal 20 → Attack 28 → Buff → Attack 28 → Heal 20 → ...
- **Heal cap:** 3 times per fight (60 HP total)
- **Notes:** Deliberately starts by healing rather than attacking, which wrong-foots players expecting to take damage first. Frequent healing (every 4 turns) means only gold cards produce enough burst damage to outpace recovery. Lower HP than the Dark Knight but more dangerous due to tempo. The heal cap prevents an infinite stalemate for struggling players, but at 145 effective HP at maximum healing the fight is gruelling without gold-tier mastery.

**Fight 9 — The Dragon 🐉 (Boss)**
- **HP:** 150
- **Required tier:** Gold
- **Special rule:** Immune to any single attack dealing less than 30 damage. Attacks below this threshold bounce off with a visual spark effect and deal 0 damage. Bronze cards are completely useless offensively — Slash (15), Twin Blades (15 per hit), and Shield Up/Heal Potion cannot contribute damage. Counter reflects the Dragon's own attack damage and bypasses the immunity threshold (it is reflected damage, not a player attack).
- **Action pattern:** Attack 20 → Block 30 → Buff → Attack 45 → Heal 30 → repeat
- **Heal cap:** 4 times per fight (120 HP total)
- **Notes:** The culmination of the learning curve. Every mechanic the player has encountered — Buff timing, block turns, healing urgency — appears here simultaneously. Four cards can damage the Dragon directly: Heavy Strike (35), Piercing Arrow (30), Fireball (63), and Lightning Bolt (45). Counter also contributes on attack turns by reflecting the Dragon's own damage back. Double Down + Slash (15×2 = 30) just barely crosses the immunity threshold. A child who has genuinely mastered ×6–×9 tables will find the fight challenging but fair. The heal cap ensures the fight is always winnable — even a struggling player who takes many turns will eventually wear the Dragon down, though the 270 effective HP at maximum healing makes the cost of slow play severe.

---

## Game State (Svelte Store Shape)

```javascript
{
  // Run state
  phase: 'menu' | 'combat' | 'rest' | 'victory' | 'defeat',
  fightNumber: 1,            // 1–9; area is derived from this (1–3 Forest, 4–6 Caves, 7–9 Fortress)

  // Player
  player: {
    hp: 60,
    maxHp: 60,
    shield: 0,               // current shield value; resets to 0 at end of each turn
    doubleDownActive: boolean, // Double Down multiplier pending for next attack card
    deck: Card[],            // full deck (draw + hand + discard)
    drawPile: Card[],
    hand: Card[],            // each Card has { id, name, effect, tier, type, problem?, attempts }
    discardPile: Card[],
  },

  // Enemy
  enemy: {
    id: string,
    name: string,
    hp: number,
    maxHp: number,
    shield: number,
    intent: EnemyIntent,     // { type: 'attack'|'block'|'buff'|'heal', value: number }
    actionQueue: Action[],   // cycles through this list
    actionIndex: number,
    buffActive: boolean,     // enemy buff multiplier pending for next attack
  },

  // Problem tracking (persists across runs via localStorage)
  masteryScores: {
    [key: string]: number    // key = "6x7", value = cumulative score
  },

  // Turn state
  turn: number,
  selectedCardId: string | null,  // card currently selected by player
  swapUsed: boolean,         // whether the once-per-turn swap has been used
}
```

### Card Object Shape

```javascript
{
  id: string,               // unique instance id
  definitionId: string,     // references cards.ts definition
  name: string,
  type: 'attack' | 'defence' | 'heal' | 'utility',
  tier: 'bronze' | 'silver' | 'gold' | 'free',
  effect: CardEffect,       // { type, value }
  problem: Problem | null,  // stamped at draw time; null until drawn; null for free cards
  attempts: 0 | 1,          // how many attempts used this play
}
```

---

## Colour Palette

The game uses a dark blue base throughout, with each area and card tier having its own distinct colour identity. All colours are chosen to be clearly readable and distinguishable against the dark blue background.

### Base

| Role | Colour | Hex |
|------|--------|-----|
| Background | Dark navy blue | `#1A2340` |
| UI panels / card backs | Slightly lighter navy | `#232E4A` |
| Primary text | Off-white | `#E8EAF0` |
| Secondary text / labels | Muted blue-grey | `#8A9BB5` |

### Area Colours

Each area uses a primary colour for borders, headings, and thematic accents (enemy frames, area title banners), and a secondary accent for highlights and icons.

| Area | Primary | Hex | Accent | Hex |
|------|---------|-----|--------|-----|
| The Forest | Muted sage green | `#6B9E6B` | Warm amber | `#C4922A` |
| The Caves | Deep teal | `#2E7D7D` | Soft lavender | `#9B7EC8` |
| The Fortress | Deep crimson | `#9E2A2A` | Dark gold | `#B8960C` |

### Card Tier Colours

Tier colours appear on card borders, badge icons, and the tier label. They must remain clearly distinguishable from the area colours in all three areas.

| Tier | Border / badge colour | Hex | Notes |
|------|-----------------------|-----|-------|
| 🥉 Bronze | Warm copper-brown | `#A0522D` | Earthy, clearly "lowest tier" |
| 🥈 Silver | Cool light grey | `#A8B4C0` | Neutral, readable on all backgrounds |
| 🥇 Gold | Bright gold | `#D4A017` | Vivid, clearly "highest tier" |
| Free | Muted blue-white | `#6B82A8` | Understated; these cards cost nothing |

### Card Type Colours

Card type is shown via a coloured icon and a subtle tint on the card interior (not the border, which is reserved for tier colour).

| Type | Colour | Hex |
|------|--------|-----|
| ⚔️ Attack | Warm red | `#C0392B` |
| 🛡️ Defence | Steel blue | `#2980B9` |
| ❤️ Heal | Soft rose | `#C0607A` |
| ✨ Utility | Purple | `#8E44AD` |

### UI Action Colour

All interactive buttons (End Turn, Swap Cards, Continue, Start Adventure, etc.) use a single dedicated action colour that is distinct from all game mechanic colours — card tiers, area themes, and feedback states. This prevents buttons from being visually confused with game elements.

| Role | Colour | Hex | Notes |
|------|--------|-----|-------|
| Primary action button | Bright blue | `#4A90D9` | Used for all navigation and action buttons |
| Primary action button (hover) | Lighter blue | `#5BA3E8` | Slightly lighter on hover |
| Primary action button (disabled) | Muted grey-blue | `#3A4F6A` | Used for Swap Cards after it has been used |

This blue is deliberately distinct from the steel blue (`#2980B9`) used for defence card type and shield intent — it is brighter and sits in a different part of the blue spectrum.

**Note on the current implementation:** Screenshots show amber (`#F4C542`) used for the Start Adventure button and purple for the Victory Continue button. These should both be updated to `#4A90D9`. Amber is reserved for the mastery map neutral state, and purple is reserved for utility cards and buff intent — neither should double as a navigation colour.

### UI Feedback Colours

| State | Colour | Hex |
|-------|--------|-----|
| Correct answer | Bright green | `#27AE60` |
| Wrong answer | Bright red | `#E74C3C` |
| Card selected / highlighted | Bright white glow | `#FFFFFF` at low opacity as outline |
| Enemy intent — attack | Red-orange | `#E67E22` |
| Enemy intent — block (gains shield) | Steel blue | `#2980B9` |
| Enemy intent — buff | Purple warning | `#8E44AD` |
| Enemy intent — heal | Green | `#27AE60` |

### Mastery Map Colours

| State | Colour | Hex |
|-------|--------|-----|
| 🟩 Mastered | Sage green | `#4CAF50` |
| 🟨 Neutral / still learning | Amber yellow | `#F4C542` |
| 🟥 Struggling | Soft red | `#E57373` |
| ⬛ Not yet encountered | Dark navy | `#3A4560` |

---

## UI Layout

### Landing Page

The landing page is the first screen the player sees. It establishes the player character, the premise, and the journey ahead — without requiring any reading beyond a single short description. The page uses the base dark navy background (`#1A2340`) like the rest of the game.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                      🧙                             │
│                                                     │
│                  Factor Quest                       │
│                                                     │
│      Play cards, answer multiplication problems,    │
│      and fight your way through forest, caves       │
│      and fortress — all the way to the dragon!      │
│                                                     │
│            🌲      ⛏️      🏰      🐉               │
│                                                     │
│             [ Start Adventure ]                     │
│                                                     │
│              [ 📊 Mastery Map ]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Layout notes:**
- The wizard 🧙 sits centred at the top, large (same size as in combat — 4–6rem), as the player's avatar
- The game title sits below in the primary heading style
- The description is two to three short lines, centred, in a readable size — enough to explain the premise without feeling like instructions
- The area emojis (🌲⛏️🏰) and dragon (🐉) sit in a row, left to right, as a visual map of the journey — the dragon is the destination
- The Start Adventure button uses the UI action colour (`#4A90D9`), large and prominent
- A smaller secondary Mastery Map button sits below for returning players who want to check their progress before starting

**Text:** *"Play cards, answer multiplication problems, and fight your way through forest, caves and fortress — all the way to the dragon!"*

This replaces the current subtitle "Defeat monsters by answering multiplication problems!" — it is slightly longer but tells the whole story: what you do (play cards, answer problems), where you go (forest, caves, fortress), and what you're working toward (the dragon).



A thin bar at the very top of the screen showing the player's position in the run. Nine dots represent the nine fights, grouped into three areas separated by a small gap. The current fight dot is filled and highlighted; completed fights are filled and dimmed; upcoming fights are outlined only.

```
The Forest          The Caves           The Fortress
  ●  ●  ●    │    ○  ○  ○    │    ○  ○  ○
  1  2  3         4  5  6         7  8  9
```

Example mid-run (currently on fight 4, fights 1–3 completed):

```
The Forest          The Caves           The Fortress
  ✓  ✓  ✓    │    ●  ○  ○    │    ○  ○  ○
  1  2  3         4  5  6         7  8  9
```

Dot states:
- **Completed** — filled, dimmed (e.g. muted area colour), with a small checkmark or tick inside
- **Current** — filled, bright (full area colour), slightly larger or with a glow
- **Upcoming** — outlined only, dark fill, no label needed

Each group of three dots is labelled with the area name above. The area name uses the area's primary colour. A vertical separator line sits between each group. The whole bar is compact — it should not take up much vertical space, perhaps 40–50px total.

### Combat Screen

```
┌─────────────────────────────────────────────────────┐
│  The Forest  ●  ●  ●  │  ○  ○  ○  │  ○  ○  ○       │
│─────────────────────────────────────────────────────│
│                                                     │
│  ❤️ ████████░░  45/60    ❤️ ████░░░░  32/40         │
│                                                     │
│       🧙                      🐺                    │
│      You                     Wolf                   │
│                                                     │
│  ⚔️ Attack 15             ⚔️ Attack 10              │
│                                                     │
│─────────────────────────────────────────────────────│
│                                                     │
│  [🥉Card]   [🥈Card]   [🥇Card]   [🥉Card]         │
│                                                     │
│       [🔄 Swap cards]     [End Turn & Attack]       │
│  Deck: 8   Discard: 3                               │
└─────────────────────────────────────────────────────┘
```

Example mid-turn after a block card has been played by the player:

```
│  ❤️ ████████░░  45/60    ❤️ ████░░░░  32/40         │
│  🛡️ 20 shield                                       │
│                                                     │
│       🧙                      🐺                    │
│      You                     Wolf                   │
│                                                     │
│  ⚔️ 50 queued            ⚔️ Attack 10               │
```

Layout rules:

- The HP bar (and shield indicator directly below it when active) sits at the top of each character's column, aligned to its side
- The emoji icon is centred in the column below the HP bar, displayed large — large enough to feel like a game character rather than a status icon (suggest 4–6rem / 64–96px)
- The character name label sits centred directly below the emoji in small text
- Below the player's name: the player's total queued attack damage shown as "⚔️ Attack N", only visible when at least one attack card has been played this turn; hidden otherwise. When multiple attack cards have been played the total is shown (e.g. "⚔️ Attack 50"). This mirrors the enemy intent display exactly so both sides feel symmetrical
- Below the enemy's name: the enemy intent ("⚔️ Attack 10"), always visible during the player's turn
- Shield indicator appears directly below the HP bar, above the emoji, only when shield is greater than zero

### Card Component (unselected state)

Visible to player before selection:
- Card name (e.g. "Fireball")
- Tier badge (🥉 / 🥈 / 🥇) with matching border colour
- Card type icon (⚔️ attack / 🛡️ defence / ❤️ heal / ✨ utility)
- Effect description with fixed value (e.g. "Deal 63 damage")
- Problem area shows a locked/hidden icon

### Card Component (selected state)

After player clicks/taps the card:
- All of the above, plus:
- Problem revealed: "7 × 8 = ?" with answer input field
- Cancel button (deselects with no penalty)
- Confirm button (submits answer)

---

## Hints and Onboarding

New players — especially children unfamiliar with card games — may not understand three things that experienced players take for granted: that they act by playing cards, that they can play multiple cards per turn, and that attacks don't happen until End Turn is pressed. The game teaches these through short contextual hints rather than an instruction screen.

**Principles:**
- Hints are triggered by context and behaviour, never shown all at once
- Only one hint is visible at a time — they never stack
- Each hint disappears as soon as the player performs the action it describes
- Hints fade out permanently after the first few fights once the player has demonstrated understanding
- No hint is longer than one short sentence

---

### Fight 1 — Guided Hints (First-Time Only)

Fight 1 against the Snail exists to teach the UI. A special set of sequential hints activates only on the very first run.

| Trigger | Hint text | Disappears when |
|---------|-----------|-----------------|
| Cards are dealt for the first time | *"Tap a card to play it!"* — displayed below the hand with a gentle pulse on the cards | Player selects a card |
| First card played successfully | *"Nice! You can play more cards too."* — displayed below the hand | Player plays a second card or presses End Turn |
| At least one card has been played | End Turn button pulses gently with label *"End Turn & Attack"* | Player presses End Turn |

After the first End Turn press in fight 1, no more guided hints appear. The player has experienced the full loop.

---

### Fights 2–3 — Persistent Reminder

For the next two fights, a small dimmed label sits below the hand at all times:

*"Play your cards, then press End Turn to attack."*

This fades out permanently after fight 3. It is never shown again.

---

### End Turn Button Label

The button always reads **"End Turn & Attack"** rather than just "End Turn". This is a permanent change — not a hint that disappears. It makes the consequence of pressing the button explicit at all times, removing the ambiguity of "end turn but nothing happens yet" for new players.

---

### Idle Nudge

If the player has not interacted for 12 seconds during their turn, a gentle prompt appears:

- If no cards have been played yet: *"Pick a card from your hand to get started."* with a subtle bounce on the cards
- If at least one card has been played: *"Press End Turn & Attack when you're ready."* with a subtle pulse on the End Turn & Attack button

The idle nudge resets each turn and never appears during the enemy's resolution sequence.

---

### Implementation Notes

- All hint text should use the same soft, friendly font style as the rest of the UI — not a tooltip or alert box, just text that fades in gently below the relevant element
- Hint state (whether the player has completed the guided fight 1 sequence) should be stored in `localStorage` so it does not repeat on subsequent runs
- The persistent reminder for fights 2–3 is keyed to `fightNumber`, not to a separate flag — it simply does not render when `fightNumber > 3`

---

## In-Turn Feedback

As the player plays cards during their turn, feedback is immediate and reflects the current game state accurately.

### Block and Heal Cards Apply Immediately

When a block card is played and answered correctly, the player's shield stat updates on screen right away — no queuing. The shield indicator fades in beneath the player's HP bar showing the current value. If the player plays a second block card, the value increases immediately.

When a heal card is played and answered correctly, the player's HP bar ticks upward immediately. If the player is below the near-death threshold (15 HP) and heals above it, the red heartbeat effect fades out straight away.

Both block and heal give the player full control over timing — they can choose to heal or block before, between, or after queuing attack cards, depending on what the situation demands.

This applies symmetrically to the enemy: when the enemy's intent is Block, it gains its shield at the **start of the player's turn**, before the player plays any cards. The enemy's shield is visible on screen the entire time the player is choosing cards, so the player can factor it into their attack decisions. Once the shield is applied, the enemy's intent label changes from "🛡️ Block 20" to "🛡️ 20 shield" to indicate the action has already resolved — preventing confusion about whether the block is still pending.

### Pending Attack Counter

As attack cards are played, the player's attack total is shown below their character as "⚔️ Attack N", updating with each card played. For example, playing Slash then Heavy Strike updates the display from "⚔️ Attack 15" to "⚔️ Attack 50". This mirrors the enemy intent label exactly — both sides show "⚔️ Attack N" in the same position, making the upcoming exchange easy to read at a glance.

### Enemy HP Preview

When attack cards have been played, the enemy HP bar shows a faint ghost marker indicating where HP will land after the first player attack resolves. If the enemy has 50 HP and 12 shield, and the player's attack total is 50, the ghost marker accounts for the shield — showing the projected HP after shield is depleted and overflow damage lands.

### Active Effect Indicators

If Double Down is played, the next attack card in hand glows or pulses to indicate it is buffed. When that buffed card is played, it briefly shows "×2" before being added to the queue. All active effects are visible at all times.

### Passive Enemy Reactions

Before End Turn, the enemy shows subtle idle animations — flinching slightly as damage is queued, becoming more aggressive-looking when buffed. Purely atmospheric, no mechanical effect.

---

## End-of-Turn Resolution Sequence

When the player presses End Turn, queued attack cards resolve in an alternating exchange. Block cards have already been applied during the player's turn and are not part of this sequence.

**Step 1 — First player attack lands.**
The first queued attack card flies toward the enemy. If the enemy has shield, the hit is absorbed wholly or partially — the shield value updates on screen immediately to reflect the remaining shield, then any overflow damage hits the HP bar. The enemy flashes.

**Step 2 — Enemy counter-attacks.**
The enemy executes its telegraphed action immediately after the first player attack. If the intent was Attack, the attack animates toward the player; the player's shield absorbs what it can (updating visibly), and any remaining damage hits the player's HP bar. If the intent was Heal, the enemy HP bar rises. If the intent was Buff, the enemy gains a coloured aura. If the intent was Block — this has already been applied at the start of the turn, so nothing happens here.

**Step 3 — Remaining player attacks land.**
Each remaining queued attack resolves in order, one at a time with brief pauses between. The enemy's shield (if any remains after Step 1) continues to absorb damage and update visibly with each hit. The player does not take further damage from the enemy during this phase.

**Step 4 — Special effects resolve.**
Counter triggers if the enemy's Step 2 action was an attack — it reflects the enemy's attack damage back at them (e.g. if the enemy attacked for 45, Counter deals 45 damage to the enemy). Counter bypasses the Dragon's immunity threshold since it is reflected damage, not a player attack. Counter does not trigger if the enemy is already dead. Heal cards have already resolved during the player phase and do not appear here.

**Step 5 — Cleanup.**
Shield on both sides resets to 0 and the shield indicators fade out. All remaining unplayed cards in the player's hand are discarded to the discard pile. The discard pile updates to reflect all played and discarded cards.

**Step 6 — New turn begins.**
New cards slide in from the draw pile. The enemy gains shield immediately if its next intent is Block (visible before the player plays anything). The enemy reveals its intent for the coming turn.

### Overkill

If the enemy's HP reaches 0 during Step 1, Step 3, or Step 4, the sequence stops immediately. The enemy counter-attack in Step 2 does not fire if the enemy is already dead from Step 1. Remaining queued cards dissolve visibly. The victory animation plays straight away.

### Near-Death

If the player's HP drops to 15 or below at any point, the screen edges pulse with a slow red heartbeat effect. This can happen during the resolution sequence when the enemy attacks, or mid-turn if an earlier attack was countered. If the player plays a Heal Potion and HP rises back above 15, the effect fades out immediately. The effect persists until the player heals above the threshold or the run ends.

---

## Logging

All player actions and all state changes are logged to the browser console. Logging is intended for development and debugging — it provides a complete, readable trace of everything that happened in a session without requiring any external tooling.

### Log Format

Each log entry uses a consistent prefix indicating the category, followed by relevant details. State snapshots use `console.group` to keep them collapsible and readable.

```
[ACTION]   <description of what happened>
[STATE]    <snapshot of affected character(s)>
[PROBLEM]  <description of problem event>
[SCENE]    <description of scene transition>
[RUN]      <description of run-level event>
```

### What to Log

**Player actions:**
```
[ACTION] Card selected: Heavy Strike (silver, attack) — problem: 6 × 7
[ACTION] Answer submitted: 42 — CORRECT (first attempt)
[ACTION] Answer submitted: 40 — WRONG (first attempt) — correct answer: 42
[ACTION] Answer submitted: 42 — CORRECT (second attempt)
[ACTION] Answer submitted: 40 — WRONG (second attempt) — card discarded
[ACTION] Card cancelled: Stone Skin
[ACTION] Card played: Fireball (gold, attack) — 63 damage queued
[ACTION] Card played: Shield Up (bronze, defence) — player gains 20 shield
[ACTION] Card played: Heal Potion (bronze, heal) — player gains 10 HP
[ACTION] Card played: Double Down (free, utility) — next attack ×2
[ACTION] Card played: Study (free, utility) — drew 2 cards
[ACTION] Card played: Dodge (silver, defence) — player gains 28 shield, drew 1 card
[ACTION] Swap used — discarded: [Fireball, Shield Up] — drew: [Slash, Counter]
[ACTION] End Turn & Attack pressed — attack total: 50
```

**State snapshots — logged after every individual HP or shield change:**
```
[STATE] Player  ❤️ 45/60  🛡️ 20
[STATE] Enemy   Wolf  ❤️ 28/40  🛡️ 0
```

State is logged after every individual change — not once per turn. Each of the following triggers its own state log: a block card is played, a heal card is played, the enemy gains shield at turn start, an attack lands and reduces HP or shield, shield resets at cleanup.

**Resolution sequence:**
```
[ACTION] Resolution begins — player attack total: 50, enemy intent: Attack 10
[ACTION] Player attack 1 lands: 15 damage — enemy shield absorbs 15 (shield: 20 → 5)
[STATE]  Enemy  Wolf  ❤️ 28/40  🛡️ 5
[ACTION] Enemy counter-attacks: 10 damage — player shield absorbs 10 (shield: 20 → 10)
[STATE]  Player  ❤️ 45/60  🛡️ 10
[ACTION] Player attack 2 lands: 35 damage — enemy shield absorbs 5, HP takes 30 (HP: 28 → 0)
[STATE]  Enemy  Wolf  ❤️ 0/40  🛡️ 0
[ACTION] Cleanup — player shield reset (20 → 0), enemy shield reset (0 → 0)
[STATE]  Player  ❤️ 45/60  🛡️ 0
[STATE]  Enemy  Wolf  ❤️ 1/40  🛡️ 0
```

**Problem and mastery events:**
```
[PROBLEM] Stamped: 6×7 → Heavy Strike (silver)
[PROBLEM] Mastery update: 6×7  score 2 → 3
[PROBLEM] Mastery update: 8×9  score 1 → 0 (wrong answer)
```

**Scene transitions and run events:**
```
[SCENE] Pre-fight scene: Fight 2 — Wolf 🐺
[SCENE] Victory scene: Fight 2 — Wolf defeated — ✨ +5 HP (33 → 38)
[STATE] Player  ❤️ 38/60  🛡️ 0
[SCENE] Rest Site 1 — Campfire — player healed: 22 HP (38 → 60)
[STATE] Player  ❤️ 60/60  🛡️ 0
[SCENE] Pre-fight scene: Fight 3 — Giant Spider 🕷️
[RUN]   Run started — player HP: 60/60, deck: 16 cards
[RUN]   Fight 3 started — enemy: Giant Spider, HP: 50
[RUN]   Fight 3 ended — victory — player HP: 38/60
[RUN]   Run ended — defeat at Fight 5 — player HP: 0
[RUN]   Run ended — victory — all 9 fights cleared
```

### Implementation Notes

- All logging goes through a single `logger.ts` utility so it can be disabled with one flag (`const LOGGING_ENABLED = true`) for production builds
- State snapshots should read directly from the store rather than being manually constructed at each call site — a `logState(character)` helper keeps this consistent
- The resolution sequence logs each step individually as it animates, not as a batch at the end, so the trace reflects the actual order of events on screen
- Rest site healing logs both the SCENE entry (showing the before/after HP) and a STATE snapshot immediately after