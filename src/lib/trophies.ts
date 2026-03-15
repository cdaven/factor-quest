// ─── Types ────────────────────────────────────────────────────────────────────

export type TrophyCategory = 'dragon' | 'skill' | 'firstkill' | 'mastery' | 'streak';

export interface TrophyDefinition {
  id: string;
  emoji: string;
  name: string;
  description: string;
  hint: string;
  category: TrophyCategory;
}

// ─── Trophy Definitions ───────────────────────────────────────────────────────
// Order here is fixed — determines grid position in the Trophy Case.

export const TROPHY_DEFINITIONS: TrophyDefinition[] = [
  // ── Category 1: Dragon Slayer (run completion) ────────────────────────────
  {
    id: 'dragon_1',
    emoji: '🐉',
    name: 'Dragon Slayer',
    description: 'Beat the dragon for the first time.',
    hint: 'The fortress awaits...',
    category: 'dragon',
  },
  {
    id: 'dragon_3',
    emoji: '🐉🐉',
    name: 'Dragon Hunter',
    description: 'Beat the dragon 3 times.',
    hint: 'One victory is not enough...',
    category: 'dragon',
  },
  {
    id: 'dragon_10',
    emoji: '🐉🐉🐉',
    name: 'Dragon Lord',
    description: 'Beat the dragon 10 times.',
    hint: 'A true legend is forged in fire...',
    category: 'dragon',
  },

  // ── Category 2: Speed & Skill (single-run challenges) ─────────────────────
  {
    id: 'iron_wizard',
    emoji: '🧙',
    name: 'Iron Wizard',
    description: 'Beat the dragon with 45 or more HP remaining.',
    hint: 'Hardly a scratch...',
    category: 'skill',
  },
  {
    id: 'flawless_forest',
    emoji: '🌲',
    name: 'Forest Walker',
    description: 'Complete fights 1–3 without taking any damage.',
    hint: 'Something lurks in the trees...',
    category: 'skill',
  },
  {
    id: 'no_heal',
    emoji: '💔',
    name: 'No Mercy',
    description: 'Beat the dragon without playing a single Heal Potion card.',
    hint: 'Who needs potions anyway?',
    category: 'skill',
  },
  {
    id: 'one_shot',
    emoji: '⚡',
    name: 'One Shot',
    description: 'Defeat any enemy in a single turn.',
    hint: 'Swift and decisive...',
    category: 'skill',
  },
  {
    id: 'perfect_run',
    emoji: '✨',
    name: 'Unbreakable',
    description: 'Beat the dragon without ever dropping to 20 HP or below.',
    hint: 'They never even touched you...',
    category: 'skill',
  },

  // ── Category 3: First Kills (enemy-specific) ──────────────────────────────
  {
    id: 'kill_snail',
    emoji: '🐌',
    name: 'Snail Crusher',
    description: 'Defeat the Giant Snail.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_wolf',
    emoji: '🐺',
    name: 'Wolf Tamer',
    description: 'Defeat the Wolf.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_spider',
    emoji: '🕷️',
    name: 'Web Cutter',
    description: 'Defeat the Giant Spider.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_troll',
    emoji: '👺',
    name: 'Troll Toppler',
    description: 'Defeat the Cave Troll.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_bat',
    emoji: '🦇',
    name: 'Bat Buster',
    description: 'Defeat the Giant Bat.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_golem',
    emoji: '🗿',
    name: 'Stone Breaker',
    description: 'Defeat the Stone Golem.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_knight',
    emoji: '🤺',
    name: "Knight's End",
    description: 'Defeat the Dark Knight.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_necromancer',
    emoji: '💀',
    name: 'Exorcist',
    description: 'Defeat the Necromancer.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },
  {
    id: 'kill_dragon',
    emoji: '🐉',
    name: 'Here Be Dragons',
    description: 'Defeat the Dragon.',
    hint: 'Somewhere in the dungeon...',
    category: 'firstkill',
  },

  // ── Category 4: Mastery Milestones ────────────────────────────────────────
  {
    id: 'master_2s',
    emoji: '✌️',
    name: 'Times Two',
    description: 'Score all ×2 problems green.',
    hint: 'The simplest tables hold secrets...',
    category: 'mastery',
  },
  {
    id: 'master_5s',
    emoji: '🖐️',
    name: 'High Five',
    description: 'Score all ×5 problems green.',
    hint: 'Count your fingers...',
    category: 'mastery',
  },
  {
    id: 'master_10s',
    emoji: '🔟',
    name: 'Perfect Ten',
    description: 'Score all ×10 problems green.',
    hint: 'A round number...',
    category: 'mastery',
  },
  {
    id: 'master_bronze',
    emoji: '🥉',
    name: 'Bronze Mind',
    description: 'Score all bronze-tier problems green (×2, ×3, ×4, ×5, ×10).',
    hint: 'The foundation of all things...',
    category: 'mastery',
  },
  {
    id: 'master_silver',
    emoji: '🥈',
    name: 'Silver Tongue',
    description: 'Score all silver-tier problems green (×3, ×4, ×6, ×7).',
    hint: 'The middle path is hardest...',
    category: 'mastery',
  },
  {
    id: 'master_gold',
    emoji: '🥇',
    name: 'Golden Brain',
    description: 'Score all gold-tier problems green (×6, ×7, ×8, ×9).',
    hint: 'True mastery is rare...',
    category: 'mastery',
  },
  {
    id: 'master_all',
    emoji: '🌟',
    name: 'Mathemagician',
    description: 'Score all 55 unique problems green.',
    hint: '55 stars await...',
    category: 'mastery',
  },

  // ── Category 5: Streak Milestones ─────────────────────────────────────────
  {
    id: 'streak_3',
    emoji: '🔥',
    name: 'Spark',
    description: 'Reach a 3-day streak.',
    hint: 'Three days in a row...',
    category: 'streak',
  },
  {
    id: 'streak_7',
    emoji: '🔥🔥',
    name: 'Flame',
    description: 'Reach a 7-day streak.',
    hint: 'A full week of practice...',
    category: 'streak',
  },
  {
    id: 'streak_30',
    emoji: '🔥🔥🔥',
    name: 'Inferno',
    description: 'Reach a 30-day streak.',
    hint: 'A month without stopping...',
    category: 'streak',
  },
];

export const TROPHY_MAP = new Map<string, TrophyDefinition>(
  TROPHY_DEFINITIONS.map(t => [t.id, t]),
);

// ─── Player Titles ────────────────────────────────────────────────────────────
// Listed in descending rank order so getActiveTitle returns the highest-rank
// title the player has earned.

interface TitleEntry {
  rank: number;
  title: string;
  check: (trophies: Record<string, boolean>) => boolean;
}

const TITLE_UNLOCK_TABLE: TitleEntry[] = [
  { rank: 9, title: 'Mathemagician',  check: t => !!t['master_all'] },
  { rank: 8, title: 'Dragon Lord',    check: t => !!t['dragon_10'] },
  { rank: 7, title: 'Golden Brain',   check: t => !!t['master_gold'] },
  { rank: 6, title: 'Iron Wizard',    check: t => !!t['iron_wizard'] },
  { rank: 5, title: 'Dragon Hunter',  check: t => !!t['dragon_3'] },
  { rank: 4, title: 'Dragon Slayer',  check: t => !!t['dragon_1'] },
  { rank: 3, title: 'Cave Crawler',   check: t => !!(t['kill_troll'] && t['kill_bat'] && t['kill_golem']) },
  { rank: 2, title: 'Forest Runner',  check: t => !!(t['kill_snail'] && t['kill_wolf'] && t['kill_spider']) },
  { rank: 1, title: 'Apprentice',     check: t => Object.values(t).some(v => v) },
];

/**
 * Returns the highest-rank title the player has earned, or null if none.
 */
export function getActiveTitle(trophies: Record<string, boolean>): string | null {
  for (const { title, check } of TITLE_UNLOCK_TABLE) {
    if (check(trophies)) return title;
  }
  return null;
}
