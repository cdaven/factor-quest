# Problem-Picking Algorithm

This section replaces the "Spaced Repetition (Problem Weighting)" section in the main spec. The score tracking rules and commutativity rule are unchanged; only the selection algorithm is defined here in full.

---

## Design Goals

The algorithm has two responsibilities that must be balanced against each other:

- **Repetition** — problems the player has struggled with should surface frequently so they get genuine practice
- **Discovery** — problems the player has never seen must still appear, even late in a run when most of the pool has been encountered

A purely score-based weighting fails at discovery: once most problems have positive scores, the few never-seen ones get a negligible slice of probability and may never appear at all. The fix is not to give unseen problems special guaranteed slots — that would suppress repetition early on when the player needs it most — but to assign them a weight that competes fairly within the normal selection.

The algorithm is always **per-tier**. A bronze card draws from the bronze pool only; a silver card from the silver pool only. Discovery and repetition pressure operate independently within each tier, so a player who has seen all bronze problems but few gold problems will still encounter fresh gold problems as soon as gold cards appear in their hand.

---

## Score Tracking

One integer score is stored per problem in `localStorage`, keyed by canonical form (see Commutativity below). Scores persist across runs.

| Event | Score change |
|-------|-------------|
| Correct answer, first attempt | +1 |
| Correct answer, second attempt | +0 |
| Wrong answer, either attempt | −1 |

Scores are unbounded in both directions. There is no floor or ceiling — a problem answered correctly many times accumulates a high positive score; a problem answered wrong repeatedly accumulates a large negative score. Problems absent from `localStorage` have never been seen and have no score.

---

## Weight Function

Every problem in a tier pool is assigned a selection weight before each draw. The weight is derived solely from the stored score:

| Condition | Weight |
|-----------|--------|
| Never seen (no score in localStorage) | 3 |
| Score ≤ −2 (struggling badly) | 6 |
| Score = −1 (struggling) | 5 |
| Score = 0 (neutral) | 3 |
| Score = 1 (some practice) | 2 |
| Score ≥ 2 (well practised) | 1 |

**No problem ever has a weight of zero.** A well-practised problem still appears occasionally — this is intentional. Mastery should be confirmed through continued play, not assumed permanently after a streak of correct answers.

The unseen weight (3) deliberately sits between neutral (3) and struggling (5). Unseen problems are not treated as urgent — the player has not yet demonstrated any difficulty with them — but they are weighted above well-practised problems so they surface naturally over the course of a run rather than being crowded out.

---

## Selection Process

When a card of a given tier is drawn, the stamping function runs once:

1. **Build the candidate pool** — all problems in the tier's pool, minus any already stamped on another card in the current hand (no duplicate problems in the same hand).
2. **Assign weights** — apply the weight function to each candidate using the current `masteryScores`.
3. **Weighted random draw** — select one problem with probability proportional to its weight.
4. **Stamp the problem** onto the card. The problem is not shown to the player until they select the card.

Steps 1–4 run independently for each card drawn. Because the hand exclusion list grows as cards are stamped, later cards in the same hand draw from a slightly smaller pool — this is intentional and ensures variety within a hand.

```javascript
function stampProblem(tier, currentHandProblems, masteryScores) {
  const pool = PROBLEM_POOL[tier];
  const candidates = pool.filter(p => !currentHandProblems.includes(p.key));

  const weights = candidates.map(p => getWeight(p.key, masteryScores));
  const total = weights.reduce((sum, w) => sum + w, 0);

  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1]; // fallback for floating point
}

function getWeight(key, masteryScores) {
  if (!(key in masteryScores)) return 3; // unseen
  const score = masteryScores[key];
  if (score <= -2) return 6;
  if (score === -1) return 5;
  if (score === 0)  return 3;
  if (score === 1)  return 2;
  return 1;                               // score ≥ 2
}
```

---

## Commutativity

6×7 and 7×6 are the same mathematical fact. They share a single score entry in `localStorage`, stored under the canonical key where the smaller number comes first — so both are stored as `"6x7"`. When a problem is displayed on a card, either order may be shown; both are valid and the display form is chosen randomly at stamp time. Both forms are answered the same way and update the same score.

---

## Tuning Notes

The weight table above is a starting point. The values that are most likely to need adjustment after playtesting:

- **Unseen weight (3)** — raising this causes the game to rush through the problem pool faster, showing new problems before older ones are well reinforced. Lowering it risks the late-run starvation problem this algorithm was designed to solve. The right value depends on how many fights a typical run contains and how many cards are drawn per fight.
- **Struggling weights (5–6)** — if children find the game fixates too heavily on problems they find hard, flattening these values toward 4 reduces the repetition pressure without eliminating it.
- **Well-practised floor (1)** — keeping this at 1 rather than 0 is a deliberate choice. Setting it to 0 would permanently retire mastered problems, which removes valuable confirmation that mastery is retained. The floor should not be lowered below 1.

The simulation script (`scripts/simulate.js`) can be used to check the effect of any weight changes across thousands of simulated runs before touching the game itself.