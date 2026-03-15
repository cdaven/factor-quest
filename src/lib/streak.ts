// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakState {
  current: number;
  longest: number;
  lastActiveDate: string; // "YYYY-MM-DD", or "" if never played
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's local date as "YYYY-MM-DD". */
export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Streak logic ─────────────────────────────────────────────────────────────

/**
 * Called after a correct answer. Returns an updated streak object.
 *
 * Rules:
 *   - Same day as lastActiveDate → no change (already counted today)
 *   - One day after lastActiveDate → current += 1, update lastActiveDate
 *   - Two or more days after lastActiveDate → current = 1 (streak broken), update lastActiveDate
 *
 * longest is updated whenever current exceeds it.
 */
export function checkAndUpdateStreak(streak: StreakState): StreakState {
  const today = todayString();

  if (streak.lastActiveDate === today) {
    return streak; // already counted today — no change
  }

  let current: number;

  if (streak.lastActiveDate === '') {
    // First ever correct answer
    current = 1;
  } else {
    const lastMs = new Date(streak.lastActiveDate + 'T00:00:00').getTime();
    const todayMs = new Date(today + 'T00:00:00').getTime();
    const diffDays = Math.round((todayMs - lastMs) / 86_400_000);

    current = diffDays === 1 ? streak.current + 1 : 1;
  }

  const longest = Math.max(streak.longest, current);
  return { current, longest, lastActiveDate: today };
}

/**
 * Returns true if the player had an active streak that is now broken
 * (gap of 2+ days since lastActiveDate). Used to show the "streak ended"
 * message on session load.
 *
 * Returns false if the player has never played, or if the streak is still
 * active (last active today or yesterday).
 */
export function isStreakBroken(streak: StreakState): boolean {
  if (streak.lastActiveDate === '' || streak.current === 0) return false;

  const today = todayString();
  if (streak.lastActiveDate === today) return false;

  const lastMs = new Date(streak.lastActiveDate + 'T00:00:00').getTime();
  const todayMs = new Date(today + 'T00:00:00').getTime();
  const diffDays = Math.round((todayMs - lastMs) / 86_400_000);

  return diffDays >= 2;
}
