export type LogCategory = 'ACTION' | 'STATE' | 'PROBLEM' | 'SCENE' | 'RUN' | 'TROPHY' | 'STREAK';

const LOGGING_ENABLED = true;

/**
 * Log a game event with a category prefix.
 * Categories: ACTION, STATE, PROBLEM, SCENE, RUN
 */
export function log(category: LogCategory, message: string): void {
  if (!LOGGING_ENABLED) return;
  console.log(`[${category}] ${message}`);
}

interface HasHpShield {
  hp: number;
  maxHp: number;
  shield: number;
}

/**
 * Log a character's current HP and shield as a STATE entry.
 */
export function logState(char: HasHpShield, label: string): void {
  if (!LOGGING_ENABLED) return;
  const shield = char.shield > 0 ? `  🛡️ ${char.shield}` : `  🛡️ 0`;
  console.log(`[STATE] ${label}  ❤️ ${char.hp}/${char.maxHp}${shield}`);
}
