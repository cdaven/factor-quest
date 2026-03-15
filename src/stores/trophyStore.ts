import { writable } from 'svelte/store';
import { masteryStore } from './masteryStore.js';
import { TROPHY_DEFINITIONS, getActiveTitle } from '../lib/trophies.js';
import { checkAndUpdateStreak, isStreakBroken, type StreakState } from '../lib/streak.js';
import type { MasteryScores } from '../lib/problems.js';
import { log } from '../lib/logger.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrophyStoreState {
  trophies: Record<string, boolean>;
  streak: StreakState;
  dragonKills: number;
  allTrophiesEarned: boolean;
  pendingTrophyToasts: string[];   // trophy IDs queued for display
  pendingTitleToast: string | null; // new title name, or null
  showBrokenStreakMessage: boolean;
  activeTitle: string | null;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEY_TROPHIES     = 'factorquest_trophies';
const KEY_STREAK       = 'factorquest_streak';
const KEY_DRAGON_KILLS = 'factorquest_dragonKills';
const KEY_ALL_EARNED   = 'factorquest_allTrophiesEarned';

// ─── Mastery Key Sets ─────────────────────────────────────────────────────────
// Pre-computed once at module load — avoids re-deriving on every trophy check.

const ALL_55_KEYS: string[] = [];
for (let a = 1; a <= 10; a++) {
  for (let b = a; b <= 10; b++) {
    ALL_55_KEYS.push(`${a}x${b}`);
  }
}

function hasFactorIn(key: string, factors: ReadonlySet<number>): boolean {
  const sep = key.indexOf('x');
  return factors.has(Number(key.slice(0, sep))) || factors.has(Number(key.slice(sep + 1)));
}

const BRONZE_F      = new Set([2, 3, 4, 5, 10]);
const SILVER_F      = new Set([3, 4, 6, 7]);
const GOLD_F        = new Set([6, 7, 8, 9]);
const ALWAYS_BRONZE = new Set([1, 10]);

const MASTERY_KEY_SETS: Readonly<Record<string, string[]>> = {
  master_2s:     ALL_55_KEYS.filter(k => hasFactorIn(k, new Set([2]))),
  master_5s:     ALL_55_KEYS.filter(k => hasFactorIn(k, new Set([5]))),
  master_10s:    ALL_55_KEYS.filter(k => hasFactorIn(k, new Set([10]))),
  master_bronze: ALL_55_KEYS.filter(k => hasFactorIn(k, BRONZE_F)),
  master_silver: ALL_55_KEYS.filter(k => {
    const sep = k.indexOf('x');
    const a = Number(k.slice(0, sep));
    const b = Number(k.slice(sep + 1));
    return (SILVER_F.has(a) || SILVER_F.has(b)) && !ALWAYS_BRONZE.has(a) && !ALWAYS_BRONZE.has(b);
  }),
  master_gold: ALL_55_KEYS.filter(k => {
    const sep = k.indexOf('x');
    const a = Number(k.slice(0, sep));
    const b = Number(k.slice(sep + 1));
    return (GOLD_F.has(a) || GOLD_F.has(b)) && !ALWAYS_BRONZE.has(a) && !ALWAYS_BRONZE.has(b);
  }),
  master_all: [...ALL_55_KEYS],
};

const MASTERY_TROPHY_IDS = [
  'master_2s', 'master_5s', 'master_10s',
  'master_bronze', 'master_silver', 'master_gold', 'master_all',
] as const;

const TROPHY_COUNT = TROPHY_DEFINITIONS.length; // 27

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadTrophies(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY_TROPHIES);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch { return {}; }
}

function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(KEY_STREAK);
    return raw
      ? (JSON.parse(raw) as StreakState)
      : { current: 0, longest: 0, lastActiveDate: '' };
  } catch { return { current: 0, longest: 0, lastActiveDate: '' }; }
}

function loadDragonKills(): number {
  try {
    const raw = localStorage.getItem(KEY_DRAGON_KILLS);
    return raw ? (JSON.parse(raw) as number) : 0;
  } catch { return 0; }
}

function loadAllEarned(): boolean {
  try {
    const raw = localStorage.getItem(KEY_ALL_EARNED);
    return raw ? (JSON.parse(raw) as boolean) : false;
  } catch { return false; }
}

function saveTrophies(t: Record<string, boolean>): void {
  try { localStorage.setItem(KEY_TROPHIES, JSON.stringify(t)); } catch { /* quota / private mode */ }
}

function saveStreak(s: StreakState): void {
  try { localStorage.setItem(KEY_STREAK, JSON.stringify(s)); } catch { /* quota / private mode */ }
}

function saveDragonKills(n: number): void {
  try { localStorage.setItem(KEY_DRAGON_KILLS, JSON.stringify(n)); } catch { /* quota / private mode */ }
}

function saveAllEarned(v: boolean): void {
  try { localStorage.setItem(KEY_ALL_EARNED, JSON.stringify(v)); } catch { /* quota / private mode */ }
}

// ─── Store ────────────────────────────────────────────────────────────────────

function createInitialState(): TrophyStoreState {
  return {
    trophies: {},
    streak: { current: 0, longest: 0, lastActiveDate: '' },
    dragonKills: 0,
    allTrophiesEarned: false,
    pendingTrophyToasts: [],
    pendingTitleToast: null,
    showBrokenStreakMessage: false,
    activeTitle: null,
  };
}

export const trophyStore = writable<TrophyStoreState>(createInitialState());

const { update } = trophyStore;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Award a trophy if not already earned. Mutates s in place.
 * Queues a toast and logs the event. Returns true if newly awarded.
 */
function awardTrophyIfNew(s: TrophyStoreState, id: string): boolean {
  if (s.trophies[id]) return false;
  s.trophies = { ...s.trophies, [id]: true };
  s.pendingTrophyToasts = [...s.pendingTrophyToasts, id];
  log('TROPHY', `Trophy earned: ${id}`);
  return true;
}

/**
 * Run after any batch of trophy awards:
 *   - Checks if all 27 trophies are now earned and updates the flag.
 *   - Recomputes activeTitle and queues a title toast if it changed.
 *   - Persists trophies to localStorage.
 *
 * prevTitle must be captured before any awards in the same update() call.
 */
function postAwardChecks(s: TrophyStoreState, prevTitle: string | null): void {
  if (!s.allTrophiesEarned) {
    const earnedCount = Object.values(s.trophies).filter(Boolean).length;
    if (earnedCount >= TROPHY_COUNT) {
      s.allTrophiesEarned = true;
      saveAllEarned(true);
      log('TROPHY', 'All 27 trophies earned — Mathemagician!');
    }
  }

  const newTitle = getActiveTitle(s.trophies);
  s.activeTitle = newTitle;
  if (newTitle !== prevTitle) {
    s.pendingTitleToast = newTitle;
    if (newTitle) log('TROPHY', `New title unlocked: ${newTitle}`);
  }

  saveTrophies(s.trophies);
}

/**
 * Evaluate all mastery milestone trophies against current masteryStore scores.
 * Mutates s in place. Returns true if any new trophies were awarded.
 */
function evaluateMasteryTrophies(s: TrophyStoreState): boolean {
  const scores: MasteryScores = masteryStore.getScores();
  let anyNew = false;
  for (const id of MASTERY_TROPHY_IDS) {
    if (!s.trophies[id]) {
      const keys = MASTERY_KEY_SETS[id];
      if (keys.every(k => (scores[k] ?? 0) >= 3)) {
        awardTrophyIfNew(s, id);
        anyNew = true;
      }
    }
  }
  return anyNew;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load all trophy state from localStorage and initialise the store.
 * Also detects a broken streak and sets showBrokenStreakMessage accordingly.
 * Call once in App.svelte onMount, before onSessionLoad().
 */
export function initTrophyStore(): void {
  const trophies    = loadTrophies();
  const streak      = loadStreak();
  const dragonKills = loadDragonKills();
  const allTrophiesEarned = loadAllEarned();
  const brokenStreak = isStreakBroken(streak);

  update(s => {
    s.trophies          = trophies;
    s.streak            = streak;
    s.dragonKills       = dragonKills;
    s.allTrophiesEarned = allTrophiesEarned;
    s.activeTitle       = getActiveTitle(trophies);
    s.showBrokenStreakMessage = brokenStreak;
    return s;
  });

  if (brokenStreak) {
    log('STREAK', `Streak broken — was ${streak.current} days, last active: ${streak.lastActiveDate}`);
  }
}

/**
 * Re-evaluate mastery milestone trophies.
 * Call after initTrophyStore() in case mastery thresholds were reached in a
 * prior session without being checked at the time.
 */
export function onSessionLoad(): void {
  update(s => {
    const prevTitle = s.activeTitle;
    evaluateMasteryTrophies(s);
    postAwardChecks(s, prevTitle);
    return s;
  });
}

/**
 * Call after every correct multiplication answer (non-free card).
 * Updates the daily streak and evaluates streak + mastery trophies.
 */
export function onCorrectAnswer(): void {
  update(s => {
    const prevTitle = s.activeTitle;

    // Update streak
    const updated = checkAndUpdateStreak(s.streak);
    if (updated !== s.streak) {
      s.streak = updated;
      saveStreak(updated);
      log('STREAK', `Streak updated — current: ${updated.current}, longest: ${updated.longest}`);
    }

    // Clear the one-time broken-streak message once the player answers correctly
    if (s.showBrokenStreakMessage) s.showBrokenStreakMessage = false;

    // Streak milestone trophies — checked against longest (never un-earned)
    const streakMilestones: Array<[string, number]> = [
      ['streak_3', 3], ['streak_7', 7], ['streak_30', 30],
    ];
    for (const [id, threshold] of streakMilestones) {
      if (!s.trophies[id] && s.streak.longest >= threshold) {
        awardTrophyIfNew(s, id);
      }
    }

    // Mastery milestone trophies
    evaluateMasteryTrophies(s);

    postAwardChecks(s, prevTitle);
    return s;
  });
}

/**
 * Call when any non-dragon enemy is defeated (fights 1–8).
 * Evaluates first-kill, one_shot, and flawless_forest trophies.
 *
 * @param enemyId         - enemy definition id (e.g. "wolf")
 * @param fightNumber     - 1–8
 * @param turn            - turn number when the enemy was killed (1 = one_shot)
 * @param hpLostInForest  - true if the player took any damage in fights 1–3
 */
export function onEnemyDefeated(
  enemyId: string,
  fightNumber: number,
  turn: number,
  hpLostInForest: boolean,
): void {
  update(s => {
    const prevTitle = s.activeTitle;

    // First-kill trophy
    awardTrophyIfNew(s, `kill_${enemyId}`);

    // One Shot — killed on the first turn of the fight
    if (turn === 1) awardTrophyIfNew(s, 'one_shot');

    // Flawless Forest — no damage in fights 1–3, evaluated at the end of fight 3
    if (fightNumber === 3 && !hpLostInForest) {
      awardTrophyIfNew(s, 'flawless_forest');
    }

    postAwardChecks(s, prevTitle);
    return s;
  });
}

/**
 * Call when the dragon is defeated (fight 9).
 * Evaluates dragon-kill counters, kill_dragon first-kill, one_shot, and all
 * run-skill trophies (iron_wizard, no_heal, perfect_run).
 *
 * @param playerHp               - player HP at the moment of victory
 * @param healPotionUsedThisRun  - true if any Heal Potion resolved this run
 * @param droppedBelow20HP       - true if player HP ever reached ≤ 20 this run
 * @param turn                   - turn number when the dragon was killed
 */
export function onDragonDefeated(
  playerHp: number,
  healPotionUsedThisRun: boolean,
  droppedBelow20HP: boolean,
  turn: number,
): void {
  update(s => {
    const prevTitle = s.activeTitle;

    // Increment persistent dragon kill counter
    s.dragonKills += 1;
    saveDragonKills(s.dragonKills);

    // First-kill badge for the dragon
    awardTrophyIfNew(s, 'kill_dragon');

    // One Shot on the dragon
    if (turn === 1) awardTrophyIfNew(s, 'one_shot');

    // Dragon-count trophies (each threshold checked on every kill)
    if (s.dragonKills >= 1)  awardTrophyIfNew(s, 'dragon_1');
    if (s.dragonKills >= 3)  awardTrophyIfNew(s, 'dragon_3');
    if (s.dragonKills >= 10) awardTrophyIfNew(s, 'dragon_10');

    // Run-skill trophies
    if (playerHp >= 45)          awardTrophyIfNew(s, 'iron_wizard');
    if (!healPotionUsedThisRun)  awardTrophyIfNew(s, 'no_heal');
    if (!droppedBelow20HP)       awardTrophyIfNew(s, 'perfect_run');

    postAwardChecks(s, prevTitle);
    return s;
  });
}

/**
 * Remove the first pending trophy toast from the queue.
 * Call after a toast finishes displaying.
 */
export function dismissToast(): void {
  update(s => {
    s.pendingTrophyToasts = s.pendingTrophyToasts.slice(1);
    return s;
  });
}

/**
 * Clear the pending title toast.
 * Call after the title toast finishes displaying.
 */
export function dismissTitleToast(): void {
  update(s => {
    s.pendingTitleToast = null;
    return s;
  });
}
