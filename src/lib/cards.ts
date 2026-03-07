/**
 * Canonical card definitions. Each entry describes one unique card type.
 * Card instances (with unique IDs and runtime problem state) are created in gameStore.
 *
 * Effect types:
 *   'damage'       — deal fixed damage (single hit)
 *   'damage_twice' — deal value damage twice; each hit checked independently vs Dragon immunity
 *   'block'        — gain value shield immediately
 *   'block_draw'   — gain value shield + draw 1 card immediately
 *   'heal'         — restore value HP immediately (capped at maxHp)
 *   'counter'      — set counterActive; reflects enemy attack damage in step 4 of resolution
 *   'double_down'  — set player.doubleDownActive; next attack card damage ×2
 *   'draw'         — draw value cards immediately
 */

import type { Problem } from './problems.js';

export type CardEffectType =
  | 'damage'
  | 'damage_twice'
  | 'block'
  | 'block_draw'
  | 'heal'
  | 'counter'
  | 'double_down'
  | 'draw';

export type CardType = 'attack' | 'defence' | 'heal' | 'utility';

export type CardTier = 'bronze' | 'silver' | 'gold' | 'free';

export interface CardEffect {
  type: CardEffectType;
  value: number;
}

export interface CardDefinition {
  definitionId: string;
  name: string;
  type: CardType;
  tier: CardTier;
  effect: CardEffect;
}

/** A runtime card instance in the player's deck/hand/discard. */
export interface CardInstance extends CardDefinition {
  id: string;
  problem: Problem | null;
  attempts: number;
}

export const CARD_DEFINITIONS: CardDefinition[] = [
  // ── Bronze ─────────────────────────────────────────────────────────────────
  { definitionId: 'slash',       name: 'Slash',       type: 'attack',  tier: 'bronze', effect: { type: 'damage',       value: 15 } },
  { definitionId: 'twin-blades', name: 'Twin Blades', type: 'attack',  tier: 'bronze', effect: { type: 'damage_twice', value: 15 } },
  { definitionId: 'shield-up',   name: 'Shield Up',   type: 'defence', tier: 'bronze', effect: { type: 'block',        value: 20 } },
  { definitionId: 'heal-potion', name: 'Heal Potion', type: 'heal',    tier: 'bronze', effect: { type: 'heal',         value: 10 } },
  { definitionId: 'counter',     name: 'Counter',     type: 'attack',  tier: 'bronze', effect: { type: 'counter',      value: 0  } },

  // ── Silver ─────────────────────────────────────────────────────────────────
  { definitionId: 'heavy-strike',   name: 'Heavy Strike',   type: 'attack',  tier: 'silver', effect: { type: 'damage',    value: 35 } },
  { definitionId: 'piercing-arrow', name: 'Piercing Arrow', type: 'attack',  tier: 'silver', effect: { type: 'damage',    value: 30 } },
  { definitionId: 'dodge',          name: 'Dodge',          type: 'defence', tier: 'silver', effect: { type: 'block_draw', value: 28 } },

  // ── Gold ───────────────────────────────────────────────────────────────────
  { definitionId: 'fireball',       name: 'Fireball',       type: 'attack',  tier: 'gold', effect: { type: 'damage', value: 63 } },
  { definitionId: 'lightning-bolt', name: 'Lightning Bolt', type: 'attack',  tier: 'gold', effect: { type: 'damage', value: 45 } },
  { definitionId: 'stone-skin',     name: 'Stone Skin',     type: 'defence', tier: 'gold', effect: { type: 'block',  value: 54 } },

  // ── Free (no problem required) ─────────────────────────────────────────────
  { definitionId: 'double-down', name: 'Double Down', type: 'utility', tier: 'free', effect: { type: 'double_down', value: 0 } },
  { definitionId: 'study',       name: 'Study',       type: 'utility', tier: 'free', effect: { type: 'draw',        value: 2 } },
];

/**
 * The 16-card starter deck, expressed as an ordered list of definitionIds.
 * Two copies of Slash, Shield Up, and Heal Potion; one of everything else.
 */
export const STARTER_DECK_IDS: string[] = [
  'slash', 'slash',
  'twin-blades',
  'shield-up', 'shield-up',
  'heal-potion', 'heal-potion',
  'counter',
  'heavy-strike',
  'piercing-arrow',
  'dodge',
  'fireball',
  'lightning-bolt',
  'stone-skin',
  'double-down',
  'study',
];
