/** Shared UI constants and helpers used across components. */

import type { CardInstance } from './cards.js';

export type Area = 'forest' | 'caves' | 'fortress';
export type CellTier = 'gold' | 'silver' | 'bronze';

export const TIER_COLORS: Record<string, string> = {
  bronze: '#A0522D',
  silver: '#A8B4C0',
  gold:   '#D4A017',
  free:   '#6B82A8',
};

export const TIER_ICONS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold:   '🥇',
  free:   ' ',
};

export const TYPE_COLORS: Record<string, string> = {
  attack:  '#C0392B',
  defence: '#2980B9',
  heal:    '#C0607A',
  utility: '#8E44AD',
};

export const TYPE_ICONS: Record<string, string> = {
  attack:  '⚔️',
  defence: '🛡️',
  heal:    '❤️',
  utility: '✨',
};

export const INTENT_COLORS: Record<string, string> = {
  attack: '#E67E22',
  block:  '#2980B9',
  buff:   '#8E44AD',
  heal:   '#27AE60',
};

export const INTENT_ICONS: Record<string, string> = {
  attack: '⚔️',
  block:  '🛡️',
  buff:   '💥',
  heal:   '💚',
};

/** Primary colour per area, used for area labels and accents. */
export const AREA_COLORS: Record<Area, string> = {
  forest:   '#6B9E6B',
  caves:    '#2E7D7D',
  fortress: '#9E2A2A',
};

export const AREA_NAMES: Record<Area, string> = {
  forest:   'The Forest',
  caves:    'The Caves',
  fortress: 'The Fortress',
};

/** Returns 'forest' | 'caves' | 'fortress' for a fight number 1–9. */
export function areaForFight(fightNumber: number): Area {
  if (fightNumber <= 3) return 'forest';
  if (fightNumber <= 6) return 'caves';
  return 'fortress';
}

/** Human-readable description of a card's effect. */
export function effectText(card: CardInstance): string {
  const v = card.effect.value;
  switch (card.effect.type) {
    case 'damage':       return `Deal ${v} damage`;
    case 'damage_twice': return `Deal ${v} damage twice`;
    case 'block':        return `Block ${v} damage`;
    case 'block_draw':   return `Block ${v} damage, draw 1`;
    case 'heal':         return `Restore ${v} HP`;
    case 'counter':      return 'Reflect enemy attack';
    case 'double_down':  return 'Next attack deals ×2';
    case 'draw':         return `Draw ${v} cards`;
    default:             return '';
  }
}

/** Mastery map cell colour based on score and whether it's been seen. */
export function masteryColor(key: string, masteryScores: Record<string, number>): string {
  if (!(key in masteryScores)) return '#3A4560'; // unseen
  const score = masteryScores[key];
  if (score >= 3)  return '#4CAF50'; // mastered — green
  if (score < 0)   return '#E57373'; // struggling — red
  return '#F4C542';                  // neutral — amber
}

/** Highest tier a cell (a, b) belongs to: 'gold' | 'silver' | 'bronze' | null */
export function cellTier(a: number, b: number): CellTier | null {
  const goldFactors   = new Set([6, 7, 8, 9]);
  const silverFactors = new Set([3, 4, 6, 7]);
  const bronzeFactors = new Set([2, 3, 4, 5, 10]);
  if (goldFactors.has(a)   || goldFactors.has(b))   return 'gold';
  if (silverFactors.has(a) || silverFactors.has(b)) return 'silver';
  if (bronzeFactors.has(a) || bronzeFactors.has(b)) return 'bronze';
  return null;
}

/** Canonical mastery key for a pair: smaller factor first. */
export function canonicalKey(a: number, b: number): string {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}
