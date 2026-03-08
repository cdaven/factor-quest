/**
 * Problem pool definitions, spaced-repetition weighting, and problem stamping.
 *
 * All 55 unique multiplication problems are represented as { a, b, answer, key }
 * where a <= b (canonical form). The key is "${a}x${b}".
 *
 * Tier pools include any problem where at least one factor belongs to the tier's table set.
 * ×1 and ×10 are always bronze — they are excluded from silver and gold regardless of the other factor.
 *   Bronze: ×1, ×2, ×3, ×4, ×5, ×10
 *   Silver: ×3, ×4, ×6, ×7  (never ×1 or ×10)
 *   Gold:   ×6, ×7, ×8, ×9  (never ×1 or ×10)
 */

export interface Problem {
  key: string;
  a: number;
  b: number;
  answer: number;
}

export type MasteryScores = Record<string, number>;

export type CardTierForPool = 'bronze' | 'silver' | 'gold';

const BRONZE_FACTORS  = new Set([1, 2, 3, 4, 5, 10]);
const SILVER_FACTORS  = new Set([3, 4, 6, 7]);
const GOLD_FACTORS    = new Set([6, 7, 8, 9]);
const ALWAYS_BRONZE   = new Set([1, 10]); // excluded from silver/gold regardless of other factor

/** All 55 unique problems (a <= b). */
const ALL_PROBLEMS: Problem[] = [];
for (let a = 1; a <= 10; a++) {
  for (let b = a; b <= 10; b++) {
    ALL_PROBLEMS.push({ a, b, answer: a * b, key: `${a}x${b}` });
  }
}

const notAlwaysBronze = (p: Problem) => !ALWAYS_BRONZE.has(p.a) && !ALWAYS_BRONZE.has(p.b);

export const TIER_POOLS: Record<CardTierForPool, Problem[]> = {
  bronze: ALL_PROBLEMS.filter(p => BRONZE_FACTORS.has(p.a) || BRONZE_FACTORS.has(p.b)),
  silver: ALL_PROBLEMS.filter(p => (SILVER_FACTORS.has(p.a) || SILVER_FACTORS.has(p.b)) && notAlwaysBronze(p)),
  gold:   ALL_PROBLEMS.filter(p => (GOLD_FACTORS.has(p.a)   || GOLD_FACTORS.has(p.b))   && notAlwaysBronze(p)),
};

/**
 * Compute the selection weight for a problem given its mastery score.
 * Lower (or negative) scores → higher weight → appears more often.
 */
function weight(score: number): number {
  return Math.max(1, 5 - score);
}

/**
 * Weighted random selection from a pool array.
 */
function pickWeighted(pool: Problem[], masteryScores: MasteryScores): Problem {
  const weights = pool.map(p => weight(masteryScores[p.key] ?? 0));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Stamp a problem onto a card being drawn.
 *
 * @param tier       - 'bronze' | 'silver' | 'gold'
 * @param masteryScores - plain object { "6x7": number, … }
 * @param excludeKeys   - canonical keys already stamped in the current hand
 */
export function stampProblem(
  tier: CardTierForPool,
  masteryScores: MasteryScores,
  excludeKeys: string[] = [],
): Problem {
  const pool = TIER_POOLS[tier].filter(p => !excludeKeys.includes(p.key));

  // Fallback: if all problems excluded (e.g. very small pool), use full tier pool
  const source = pool.length > 0 ? pool : TIER_POOLS[tier];

  const picked = pickWeighted(source, masteryScores);

  // Randomly display as a×b or b×a
  const flip = Math.random() < 0.5;
  return {
    key: picked.key,
    a: flip ? picked.b : picked.a,
    b: flip ? picked.a : picked.b,
    answer: picked.answer,
  };
}

/**
 * Normalise a problem key so that 6×7 and 7×6 map to the same entry.
 */
export function canonicalKey(a: number, b: number): string {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}
