/**
 * Enemy definitions. Each entry describes one enemy, including:
 *   - id, name, emoji, hp/maxHp
 *   - actions: ordered array of { type, value } objects that cycle repeatedly
 *   - healCap: max number of times the enemy can heal per fight (null = unlimited)
 *   - dragonImmunity: if true, single hits < 30 damage are negated
 *
 * Intent types: 'attack' | 'block' | 'buff' | 'heal'
 * For 'buff': value is 0 (no numeric parameter — just sets buffActive on enemy)
 * For 'block': enemy gains shield at the START of the player's turn (before any cards played)
 * For 'heal': enemy recovers value HP (capped at maxHp and by healCap)
 */

export type IntentType = 'attack' | 'block' | 'buff' | 'heal';

export interface EnemyIntent {
  type: IntentType;
  value: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  actions: EnemyIntent[];
  healCap: number | null;
  dragonImmunity: boolean;
}

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  snail: {
    id: 'snail',
    name: 'Snail',
    emoji: '🐌',
    hp: 25,
    maxHp: 25,
    actions: [
      { type: 'attack', value: 6 },
    ],
    healCap: null,
    dragonImmunity: false,
  },

  wolf: {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    hp: 40,
    maxHp: 40,
    actions: [
      { type: 'buff',   value: 0  },
      { type: 'attack', value: 20 },
      { type: 'attack', value: 10 },
      { type: 'attack', value: 10 },
    ],
    healCap: null,
    dragonImmunity: false,
  },

  spider: {
    id: 'spider',
    name: 'Giant Spider',
    emoji: '🕷️',
    hp: 50,
    maxHp: 50,
    actions: [
      { type: 'block',  value: 15 },
      { type: 'attack', value: 14 },
    ],
    healCap: null,
    dragonImmunity: false,
  },

  troll: {
    id: 'troll',
    name: 'Cave Troll',
    emoji: '👺',
    hp: 70,
    maxHp: 70,
    actions: [
      { type: 'attack', value: 16 },
      { type: 'attack', value: 16 },
      { type: 'heal',   value: 12 },
    ],
    healCap: 3,
    dragonImmunity: false,
  },

  bat: {
    id: 'bat',
    name: 'Giant Bat',
    emoji: '🦇',
    hp: 65,
    maxHp: 65,
    actions: [
      { type: 'attack', value: 18 },
      { type: 'attack', value: 18 },
      { type: 'block',  value: 25 },
      { type: 'attack', value: 18 },
    ],
    healCap: null,
    dragonImmunity: false,
  },

  golem: {
    id: 'golem',
    name: 'Stone Golem',
    emoji: '🗿',
    hp: 110,
    maxHp: 110,
    actions: [
      { type: 'block',  value: 20 },
      { type: 'attack', value: 22 },
      { type: 'block',  value: 20 },
      { type: 'heal',   value: 15 },
      { type: 'attack', value: 22 },
    ],
    healCap: 4,
    dragonImmunity: false,
  },

  knight: {
    id: 'knight',
    name: 'Dark Knight',
    emoji: '🤺',
    hp: 100,
    maxHp: 100,
    actions: [
      { type: 'attack', value: 20 },
      { type: 'block',  value: 30 },
      { type: 'buff',   value: 0  },
      { type: 'attack', value: 40 },
    ],
    healCap: null,
    dragonImmunity: false,
  },

  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    emoji: '💀',
    hp: 85,
    maxHp: 85,
    actions: [
      { type: 'heal',   value: 20 },
      { type: 'attack', value: 28 },
      { type: 'buff',   value: 0  },
      { type: 'attack', value: 28 },
      { type: 'heal',   value: 20 },
    ],
    healCap: 3,
    dragonImmunity: false,
  },

  dragon: {
    id: 'dragon',
    name: 'The Dragon',
    emoji: '🐉',
    hp: 150,
    maxHp: 150,
    actions: [
      { type: 'attack', value: 20 },
      { type: 'block',  value: 30 },
      { type: 'buff',   value: 0  },
      { type: 'attack', value: 45 },
      { type: 'heal',   value: 30 },
    ],
    healCap: 4,
    dragonImmunity: true,
  },
};

/** Ordered list of enemy IDs for each fight (index 0 = fight 1). */
export const FIGHT_ORDER: string[] = [
  'snail', 'wolf', 'spider', 'troll', 'bat', 'golem', 'knight', 'necromancer', 'dragon',
];
