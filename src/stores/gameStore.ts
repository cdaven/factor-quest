import { writable, get } from 'svelte/store';
import { CARD_DEFINITIONS, STARTER_DECK_IDS, type CardInstance } from '../lib/cards.js';
import { ENEMY_DEFINITIONS, FIGHT_ORDER, type EnemyIntent } from '../lib/enemies.js';
import { stampProblem, type CardTierForPool } from '../lib/problems.js';
import { log, logState } from '../lib/logger.js';
import { masteryStore } from './masteryStore.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Phase = 'menu' | 'prefight' | 'combat' | 'victory' | 'rest' | 'defeat' | 'dragonSlain' | 'finalVictory';

export interface Attack {
  hits: number[];
}

export interface AnswerFeedback {
  correct: boolean;
  attempt: number;
  submittedAnswer: number | null;
  correctAnswer: number | null;
}

export interface RunStats {
  totalCardsPlayed: number;
  totalCorrectAnswers: number;
  totalProblemsAttempted: number;
  isFlawless: boolean;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  shield: number;
  doubleDownActive: boolean;
  counterActive: boolean;
  queuedAttacks: Attack[];
  pendingAttackTotal: number;
  deck: CardInstance[];
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
}

export interface EnemyState {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  shield: number;
  intent: EnemyIntent | null;
  actionQueue: EnemyIntent[];
  actionIndex: number;
  buffActive: boolean;
  healCount: number;
  healCap: number | null;
  dragonImmunity: boolean;
  lastAttackValue: number;
}

export interface GameState {
  phase: Phase;
  fightNumber: number;
  player: PlayerState;
  enemy: EnemyState;
  masteryScores: Record<string, number>;
  turn: number;
  selectedCardId: string | null;
  swapUsed: boolean;
  answerFeedback: AnswerFeedback | null;
  lastBounced: boolean;
  lastRestHpGained: number;
  runStats: RunStats;
  masterySnapshot: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck(): CardInstance[] {
  return STARTER_DECK_IDS.map((defId, idx) => {
    const def = CARD_DEFINITIONS.find(d => d.definitionId === defId)!;
    return {
      id: `${defId}-${idx}`,
      definitionId: def.definitionId,
      name: def.name,
      type: def.type,
      tier: def.tier,
      effect: { ...def.effect },
      problem: null,
      attempts: 0,
    };
  });
}

/**
 * Build enemy runtime state from its definition for a given fight.
 */
function createEnemyState(fightNumber: number): EnemyState {
  const def = ENEMY_DEFINITIONS[FIGHT_ORDER[fightNumber - 1]];
  return {
    id: def.id,
    name: def.name,
    emoji: def.emoji,
    hp: def.hp,
    maxHp: def.maxHp,
    shield: 0,
    intent: null,       // set after creation
    actionQueue: def.actions,
    actionIndex: 0,
    buffActive: false,
    healCount: 0,
    healCap: def.healCap,
    dragonImmunity: def.dragonImmunity,
    lastAttackValue: 0,
  };
}

/**
 * Draw n cards from the draw pile into hand, stamping problems at draw time.
 * Reshuffles discard into draw if the draw pile runs out mid-draw.
 * Mutates state in place.
 */
function drawCardsInto(s: GameState, n: number): void {
  for (let i = 0; i < n; i++) {
    if (s.player.drawPile.length === 0) {
      if (s.player.discardPile.length === 0) break;
      s.player.drawPile = shuffle(s.player.discardPile);
      s.player.discardPile = [];
      log('ACTION', 'Draw pile empty — discard pile reshuffled into draw pile');
    }
    const card = s.player.drawPile.pop()!;
    if (card.tier !== 'free') {
      const existingKeys = s.player.hand.map(c => c.problem?.key).filter((k): k is string => k !== undefined);
      const scores = masteryStore.getScores();
      card.problem = stampProblem(card.tier as CardTierForPool, scores, existingKeys);
      log('PROBLEM', `Stamped: ${card.problem.a}×${card.problem.b} → ${card.name} (${card.tier})`);
    }
    card.attempts = 0;
    s.player.hand.push(card);
  }
}

/**
 * Set up draw pile and hand for the start of a fight.
 * All deck cards are gathered, their problems reset, shuffled into draw pile.
 */
function setupFightDeck(s: GameState): void {
  s.player.drawPile = shuffle(
    s.player.deck.map(c => ({ ...c, problem: null, attempts: 0 }))
  );
  s.player.hand = [];
  s.player.discardPile = [];
}

/**
 * Advance the enemy's action index and set the new intent.
 * If the new intent is 'block', apply shield immediately (start of next turn).
 * If the new intent is 'heal' but healCap is reached, skip and advance again.
 */
function advanceEnemyAction(s: GameState): void {
  const queue = s.enemy.actionQueue;
  let attempts = 0;
  do {
    s.enemy.actionIndex = (s.enemy.actionIndex + 1) % queue.length;
    s.enemy.intent = queue[s.enemy.actionIndex];
    attempts++;
    // Skip heal if cap reached
    if (s.enemy.intent.type === 'heal' && s.enemy.healCap !== null && s.enemy.healCount >= s.enemy.healCap) {
      continue;
    }
    break;
  } while (attempts < queue.length);

  applyBlockIntentIfNeeded(s);
}

/**
 * If current enemy intent is 'block', apply shield immediately and update label state.
 */
function applyBlockIntentIfNeeded(s: GameState): void {
  if (s.enemy.intent?.type === 'block') {
    s.enemy.shield = s.enemy.intent.value;
    log('STATE', `Enemy ${s.enemy.name} gains ${s.enemy.intent.value} shield (block intent applied)`);
    logState(s.enemy, s.enemy.name);
  }
}

/**
 * Set the enemy's initial action for a fresh fight (index 0), handling block and heal cap.
 */
function initEnemyIntent(s: GameState): void {
  const queue = s.enemy.actionQueue;
  s.enemy.actionIndex = 0;
  s.enemy.intent = queue[0];

  // If first action is heal but cap is 0 (edge case), advance
  if (s.enemy.intent.type === 'heal' && s.enemy.healCap !== null && s.enemy.healCount >= s.enemy.healCap) {
    advanceEnemyAction(s);
    return;
  }

  applyBlockIntentIfNeeded(s);
}

/**
 * Apply an attack entry to the enemy, respecting Dragon immunity and shield.
 * attack = { hits: number[] }  — array of individual hit values
 * Mutates s in place. Returns true if enemy died.
 */
function applyAttackToEnemy(s: GameState, attack: Attack): boolean {
  for (const hitDamage of attack.hits) {
    if (s.enemy.dragonImmunity && hitDamage < 30) {
      log('ACTION', `Dragon deflects ${hitDamage} damage — below immunity threshold`);
      s.lastBounced = true;
      continue;
    }

    let dmg = hitDamage;
    if (s.enemy.shield > 0) {
      const absorbed = Math.min(s.enemy.shield, dmg);
      s.enemy.shield -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) {
        log('ACTION', `Enemy shield absorbs ${absorbed} (shield: ${s.enemy.shield + absorbed} → ${s.enemy.shield})`);
      }
    }
    if (dmg > 0) {
      s.enemy.hp = Math.max(0, s.enemy.hp - dmg);
    }
    logState(s.enemy, s.enemy.name);
    if (s.enemy.hp <= 0) return true;
  }
  return s.enemy.hp <= 0;
}

/**
 * Apply damage to the player, absorbing through shield first.
 * Mutates s in place.
 */
function applyDamageToPlayer(s: GameState, damage: number): void {
  let dmg = damage;
  if (s.player.shield > 0) {
    const absorbed = Math.min(s.player.shield, dmg);
    s.player.shield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      log('ACTION', `Player shield absorbs ${absorbed} (shield: ${s.player.shield + absorbed} → ${s.player.shield})`);
    }
  }
  if (dmg > 0) {
    s.player.hp = Math.max(0, s.player.hp - dmg);
  }
  logState(s.player, 'Player');
}

/**
 * Apply a card's effect to state. Mutates s in place.
 * Called after a correct answer is confirmed.
 */
function resolveCardEffect(s: GameState, card: CardInstance): void {
  const { type, value } = card.effect;

  switch (type) {
    case 'damage': {
      const dmg = s.player.doubleDownActive ? value * 2 : value;
      if (s.player.doubleDownActive) {
        log('ACTION', `Double Down active — damage ${value} → ${dmg}`);
        s.player.doubleDownActive = false;
      }
      s.player.queuedAttacks.push({ hits: [dmg] });
      s.player.pendingAttackTotal += dmg;
      log('ACTION', `Card played: ${card.name} (${card.tier}, attack) — ${dmg} damage queued`);
      break;
    }

    case 'damage_twice': {
      const dmg = s.player.doubleDownActive ? value * 2 : value;
      if (s.player.doubleDownActive) {
        log('ACTION', `Double Down active — each hit ${value} → ${dmg}`);
        s.player.doubleDownActive = false;
      }
      s.player.queuedAttacks.push({ hits: [dmg, dmg] });
      s.player.pendingAttackTotal += dmg * 2;
      log('ACTION', `Card played: ${card.name} (${card.tier}, attack) — ${dmg} damage × 2 queued`);
      break;
    }

    case 'block': {
      s.player.shield += value;
      log('ACTION', `Card played: ${card.name} (${card.tier}, defence) — player gains ${value} shield`);
      logState(s.player, 'Player');
      break;
    }

    case 'block_draw': {
      s.player.shield += value;
      log('ACTION', `Card played: ${card.name} (${card.tier}, defence) — player gains ${value} shield, drew 1 card`);
      logState(s.player, 'Player');
      drawCardsInto(s, 1);
      break;
    }

    case 'heal': {
      const before = s.player.hp;
      s.player.hp = Math.min(s.player.hp + value, s.player.maxHp);
      const gained = s.player.hp - before;
      log('ACTION', `Card played: ${card.name} (${card.tier}, heal) — player gains ${gained} HP`);
      logState(s.player, 'Player');
      break;
    }

    case 'counter': {
      s.player.counterActive = true;
      log('ACTION', `Card played: ${card.name} (${card.tier}, attack) — Counter armed`);
      break;
    }

    case 'double_down': {
      s.player.doubleDownActive = true;
      log('ACTION', `Card played: ${card.name} (free, utility) — next attack ×2`);
      break;
    }

    case 'draw': {
      log('ACTION', `Card played: ${card.name} (free, utility) — drew ${value} cards`);
      drawCardsInto(s, value);
      break;
    }
  }
}

/**
 * Move a card from hand to discard. Mutates s in place.
 */
function discardCard(s: GameState, cardId: string): void {
  const idx = s.player.hand.findIndex(c => c.id === cardId);
  if (idx === -1) return;
  const [card] = s.player.hand.splice(idx, 1);
  s.player.discardPile.push(card);
}

/**
 * Apply +5 HP victory recovery (capped at maxHp). Returns amount gained.
 */
function applyVictoryRecovery(s: GameState): number {
  const before = s.player.hp;
  s.player.hp = Math.min(s.player.hp + 5, s.player.maxHp);
  return s.player.hp - before;
}

/**
 * Transition to victory phase after an enemy dies. Mutates s in place.
 */
function handleVictory(s: GameState): void {
  // Clear resolution state
  s.player.queuedAttacks = [];
  s.player.pendingAttackTotal = 0;
  s.player.counterActive = false;
  s.player.doubleDownActive = false;

  log('RUN', `Fight ${s.fightNumber} ended — victory — player HP: ${s.player.hp}/${s.player.maxHp}`);

  const gained = s.fightNumber < 9 ? applyVictoryRecovery(s) : 0;
  const hpNote = gained > 0 ? ` — ✨ +${gained} HP (${s.player.hp - gained} → ${s.player.hp})` : '';
  log('SCENE', `Victory scene: Fight ${s.fightNumber} — ${s.enemy.name} defeated${hpNote}`);
  logState(s.player, 'Player');

  s.phase = s.fightNumber === 9 ? 'dragonSlain' : 'victory';
  s.selectedCardId = null;
  s.swapUsed = false;
}

// ─── Initial state ─────────────────────────────────────────────────────────────

function createInitialState(): GameState {
  return {
    phase: 'menu',
    fightNumber: 1,

    player: {
      hp: 60,
      maxHp: 60,
      shield: 0,
      doubleDownActive: false,
      counterActive: false,
      queuedAttacks: [],
      pendingAttackTotal: 0,
      deck: [],
      drawPile: [],
      hand: [],
      discardPile: [],
    },

    enemy: {
      id: '',
      name: '',
      emoji: '',
      hp: 0,
      maxHp: 0,
      shield: 0,
      intent: null,
      actionQueue: [],
      actionIndex: 0,
      buffActive: false,
      healCount: 0,
      healCap: null,
      dragonImmunity: false,
      lastAttackValue: 0,
    },

    masteryScores: {},

    turn: 1,
    selectedCardId: null,
    swapUsed: false,
    answerFeedback: null,
    lastBounced: false,
    lastRestHpGained: 0,
    runStats: { totalCardsPlayed: 0, totalCorrectAnswers: 0, totalProblemsAttempted: 0, isFlawless: true },
    masterySnapshot: {},
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const gameStore = writable<GameState>(createInitialState());
const { update } = gameStore;

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Begin a new run: create deck, load fight 1, show pre-fight scene.
 */
export function startRun(): void {
  update(s => {
    const deck = createDeck();
    const enemy = createEnemyState(1);

    s.phase = 'prefight';
    s.fightNumber = 1;
    s.turn = 1;
    s.selectedCardId = null;
    s.swapUsed = false;
    s.answerFeedback = null;
    s.lastBounced = false;

    s.player = {
      hp: 60,
      maxHp: 60,
      shield: 0,
      doubleDownActive: false,
      counterActive: false,
      queuedAttacks: [],
      pendingAttackTotal: 0,
      deck,
      drawPile: [],
      hand: [],
      discardPile: [],
    };

    s.enemy = enemy;
    s.runStats = { totalCardsPlayed: 0, totalCorrectAnswers: 0, totalProblemsAttempted: 0, isFlawless: true };
    s.masterySnapshot = { ...masteryStore.getScores() };

    log('RUN', `Run started — player HP: 60/60, deck: ${deck.length} cards`);
    log('SCENE', `Pre-fight scene: Fight 1 — ${enemy.name} ${enemy.emoji}`);
    return s;
  });
}

/**
 * Dismiss the pre-fight scene overlay and begin combat.
 * Shuffles deck, draws first hand, sets first enemy intent.
 */
export function dismissPrefight(): void {
  update(s => {
    setupFightDeck(s);
    initEnemyIntent(s);
    drawCardsInto(s, 4);

    s.phase = 'combat';
    s.turn = 1;
    s.swapUsed = false;
    s.selectedCardId = null;
    s.answerFeedback = null;
    s.player.shield = 0;
    s.player.queuedAttacks = [];
    s.player.pendingAttackTotal = 0;
    s.player.counterActive = false;
    s.player.doubleDownActive = false;
    s.enemy.buffActive = false;
    s.enemy.healCount = 0;

    log('RUN', `Fight ${s.fightNumber} started — enemy: ${s.enemy.name}, HP: ${s.enemy.hp}`);
    return s;
  });
}

/**
 * Select a card from hand (reveals its problem).
 * Deselects any previously selected card.
 */
export function selectCard(cardId: string): void {
  update(s => {
    s.selectedCardId = cardId;
    s.answerFeedback = null;
    const card = s.player.hand.find(c => c.id === cardId);
    if (card) {
      const prob = card.problem;
      const probStr = prob ? `${prob.a} × ${prob.b}` : '(free card)';
      log('ACTION', `Card selected: ${card.name} (${card.tier}, ${card.type}) — problem: ${probStr}`);
    }
    return s;
  });
}

/**
 * Deselect the current card with no penalty.
 */
export function cancelCard(): void {
  update(s => {
    const card = s.player.hand.find(c => c.id === s.selectedCardId);
    if (card) log('ACTION', `Card cancelled: ${card.name}`);
    s.selectedCardId = null;
    s.answerFeedback = null;
    return s;
  });
}

/**
 * Submit an answer for the currently selected card.
 * Handles both first and second attempt logic, mastery scoring, and card effects.
 */
export function submitAnswer(answer: number): void {
  update(s => {
    const card = s.player.hand.find(c => c.id === s.selectedCardId);
    if (!card) return s;

    // Free cards have no problem — resolve immediately
    if (card.tier === 'free') {
      log('ACTION', `Card played: ${card.name} (free)`);
      resolveCardEffect(s, card);
      discardCard(s, card.id);
      s.selectedCardId = null;
      s.answerFeedback = { correct: true, attempt: 1, submittedAnswer: null, correctAnswer: null };
      s.runStats.totalCardsPlayed++;
      return s;
    }

    const prob = card.problem!;
    const isCorrect = answer === prob.answer;
    const attempt = card.attempts + 1; // 1 or 2

    s.runStats.totalProblemsAttempted++;

    log('ACTION', `Answer submitted: ${answer} — ${isCorrect ? 'CORRECT' : 'WRONG'} (${attempt === 1 ? 'first' : 'second'} attempt)${!isCorrect ? ` — correct answer: ${prob.answer}` : ''}`);

    if (isCorrect) {
      // Correct — update mastery (+1 for first attempt, +0 for second)
      const delta = attempt === 1 ? 1 : 0;
      if (delta !== 0) masteryStore.updateScore(prob.key, delta);

      resolveCardEffect(s, card);
      discardCard(s, card.id);
      s.selectedCardId = null;
      s.answerFeedback = { correct: true, attempt, submittedAnswer: answer, correctAnswer: prob.answer };
      s.runStats.totalCorrectAnswers++;
      s.runStats.totalCardsPlayed++;

    } else if (attempt === 1) {
      // Wrong first attempt — penalise, re-stamp new problem of same tier
      masteryStore.updateScore(prob.key, -1);

      const existingKeys = s.player.hand
        .filter(c => c.id !== card.id)
        .map(c => c.problem?.key)
        .filter((k): k is string => k !== undefined);
      // Also exclude the current problem so we definitely get a new one
      existingKeys.push(prob.key);

      const scores = masteryStore.getScores();
      const newProblem = stampProblem(card.tier as CardTierForPool, scores, existingKeys);
      card.problem = newProblem;
      card.attempts = 1;

      s.answerFeedback = { correct: false, attempt: 1, submittedAnswer: answer, correctAnswer: prob.answer };
      log('PROBLEM', `Stamped new problem: ${newProblem.a}×${newProblem.b} → ${card.name} (second attempt)`);

    } else {
      // Wrong second attempt — penalise, discard with no effect
      masteryStore.updateScore(prob.key, -1);

      log('ACTION', `Answer submitted: ${answer} — WRONG (second attempt) — card discarded`);
      s.answerFeedback = { correct: false, attempt: 2, submittedAnswer: answer, correctAnswer: prob.answer };
      discardCard(s, card.id);
      s.selectedCardId = null;
    }

    return s;
  });
}

/**
 * Use the once-per-turn swap.
 * @param cardIds - IDs of cards in hand to discard
 */
export function useSwap(cardIds: string[]): void {
  update(s => {
    if (s.swapUsed || cardIds.length === 0) return s;

    const discardedNames = cardIds.map(id => s.player.hand.find(c => c.id === id)?.name).filter(Boolean);

    // Move selected cards to discard
    const toDiscard = s.player.hand.filter(c => cardIds.includes(c.id));
    s.player.hand = s.player.hand.filter(c => !cardIds.includes(c.id));
    s.player.discardPile.push(...toDiscard);

    // Draw same count
    drawCardsInto(s, cardIds.length);

    s.swapUsed = true;
    const drawnNames = s.player.hand.slice(-cardIds.length).map(c => c.name);
    log('ACTION', `Swap used — discarded: [${discardedNames.join(', ')}] — drew: [${drawnNames.join(', ')}]`);
    return s;
  });
}

/** Delay victory phase by 400ms so the enemy death flash animation plays first. */
function scheduleVictory(): void {
  setTimeout(() => update(s => { handleVictory(s); return s; }), 400);
}

/** Delay defeat phase by 400ms so the player death flash animation plays first. */
function scheduleDefeat(fightNumber: number): void {
  setTimeout(() => update(s => {
    s.phase = 'defeat';
    log('RUN', `Run ended — defeat at Fight ${fightNumber} — player HP: 0`);
    return s;
  }), 400);
}

/**
 * End the player's turn and run the full resolution sequence.
 *
 * Step 1 — first player attack lands
 * Step 2 — enemy executes its telegraphed action
 * Step 3 — remaining player attacks land
 * Step 4 — Counter resolves if armed and enemy attacked
 * Step 5 — cleanup (reset shields, discard unplayed hand)
 * Step 6 — check player death
 * Step 7 — advance enemy action, draw new hand
 */
export function endTurn(): void {
  update(s => {
    const totalAttack = s.player.pendingAttackTotal;
    const intentStr = s.enemy.intent ? `${s.enemy.intent.type} ${s.enemy.intent.value}` : 'none';
    log('ACTION', `Resolution begins — player attack total: ${totalAttack}, enemy intent: ${intentStr}`);
    log('ACTION', `End Turn & Attack pressed — attack total: ${totalAttack}`);

    s.selectedCardId = null;
    s.answerFeedback = null;
    s.lastBounced = false;

    const attacks = s.player.queuedAttacks;
    const enemyIntent = s.enemy.intent;

    // ── Step 1: first player attack ──────────────────────────────────────────
    if (attacks.length > 0) {
      const first = attacks[0];
      const hitStr = first.hits.join(' + ');
      log('ACTION', `Player attack 1 lands: ${hitStr} damage`);
      const died = applyAttackToEnemy(s, first);
      if (died) {
        scheduleVictory();
        return s;
      }
    }

    // ── Step 2: enemy acts ───────────────────────────────────────────────────
    let enemyActualAttackValue = 0;
    if (enemyIntent) {
      if (enemyIntent.type === 'attack') {
        const base = enemyIntent.value;
        const dmg = s.enemy.buffActive ? base * 2 : base;
        if (s.enemy.buffActive) log('ACTION', `Enemy Buff active — attack ${base} → ${dmg}`);
        s.enemy.buffActive = false;
        s.enemy.lastAttackValue = dmg;
        enemyActualAttackValue = dmg;
        log('ACTION', `Enemy counter-attacks: ${dmg} damage`);
        applyDamageToPlayer(s, dmg);

      } else if (enemyIntent.type === 'heal') {
        if (s.enemy.healCap === null || s.enemy.healCount < s.enemy.healCap) {
          const before = s.enemy.hp;
          s.enemy.hp = Math.min(s.enemy.hp + enemyIntent.value, s.enemy.maxHp);
          s.enemy.healCount++;
          log('ACTION', `Enemy heals: ${s.enemy.hp - before} HP (${before} → ${s.enemy.hp})`);
          logState(s.enemy, s.enemy.name);
        } else {
          log('ACTION', `Enemy heal skipped — heal cap reached (${s.enemy.healCount}/${s.enemy.healCap})`);
        }

      } else if (enemyIntent.type === 'buff') {
        s.enemy.buffActive = true;
        log('ACTION', `Enemy uses Buff — next attack will deal double damage`);

      } else if (enemyIntent.type === 'block') {
        // Block was already applied at start of turn — nothing to do here
        log('ACTION', `Enemy block was already applied at turn start`);
      }
    }

    // ── Step 3: remaining player attacks ─────────────────────────────────────
    for (let i = 1; i < attacks.length; i++) {
      const atk = attacks[i];
      const hitStr = atk.hits.join(' + ');
      log('ACTION', `Player attack ${i + 1} lands: ${hitStr} damage`);
      const died = applyAttackToEnemy(s, atk);
      if (died) {
        scheduleVictory();
        return s;
      }
    }

    // ── Step 4: Counter ──────────────────────────────────────────────────────
    if (s.player.counterActive && enemyIntent?.type === 'attack' && s.enemy.hp > 0) {
      const counterDmg = enemyActualAttackValue;
      log('ACTION', `Counter triggers: ${counterDmg} damage reflected (bypasses Dragon immunity)`);
      // Counter bypasses Dragon immunity — apply directly to shield then HP
      let dmg = counterDmg;
      if (s.enemy.shield > 0) {
        const absorbed = Math.min(s.enemy.shield, dmg);
        s.enemy.shield -= absorbed;
        dmg -= absorbed;
      }
      s.enemy.hp = Math.max(0, s.enemy.hp - dmg);
      logState(s.enemy, s.enemy.name);
      if (s.enemy.hp <= 0) {
        scheduleVictory();
        return s;
      }
    }

    // ── Step 5: cleanup ──────────────────────────────────────────────────────
    const playerShieldWas = s.player.shield;
    const enemyShieldWas = s.enemy.shield;
    s.player.shield = 0;
    s.enemy.shield = 0;
    log('ACTION', `Cleanup — player shield reset (${playerShieldWas} → 0), enemy shield reset (${enemyShieldWas} → 0)`);

    // Discard remaining unplayed hand
    s.player.discardPile.push(...s.player.hand);
    s.player.hand = [];

    // Reset turn attack state
    s.player.queuedAttacks = [];
    s.player.pendingAttackTotal = 0;
    s.player.counterActive = false;
    s.player.doubleDownActive = false;

    logState(s.player, 'Player');
    logState(s.enemy, s.enemy.name);

    // ── Step 6: check player death ───────────────────────────────────────────
    if (s.player.hp <= 0) {
      scheduleDefeat(s.fightNumber);
      return s;
    }

    // ── Step 7: advance enemy, draw new hand ─────────────────────────────────
    s.turn++;
    s.swapUsed = false;

    advanceEnemyAction(s);
    drawCardsInto(s, 4);

    return s;
  });
}

/**
 * Dismiss the victory scene overlay and move to the next phase.
 * - After fight 3 or 6: show rest site overlay and apply healing.
 * - Otherwise: advance to next fight's pre-fight scene.
 * (Fight 9 victory goes to dragonSlain, not here.)
 */
export function dismissVictory(): void {
  update(s => {
    if (s.fightNumber === 3 || s.fightNumber === 6) {
      // Rest site
      const before = s.player.hp;
      s.player.hp = Math.min(s.player.hp + 30, s.player.maxHp);
      const gained = s.player.hp - before;
      s.lastRestHpGained = gained;
      log('SCENE', `Rest Site ${s.fightNumber === 3 ? 1 : 2} — player healed: ${gained} HP (${before} → ${s.player.hp})`);
      logState(s.player, 'Player');
      s.phase = 'rest';
    } else {
      // Next fight
      s.fightNumber++;
      s.enemy = createEnemyState(s.fightNumber);
      s.phase = 'prefight';
      log('SCENE', `Pre-fight scene: Fight ${s.fightNumber} — ${s.enemy.name} ${s.enemy.emoji}`);
    }

    return s;
  });
}

/**
 * Dismiss the rest site overlay and advance to the next fight.
 */
export function dismissRest(): void {
  update(s => {
    s.fightNumber++;
    s.enemy = createEnemyState(s.fightNumber);
    s.phase = 'prefight';
    log('SCENE', `Pre-fight scene: Fight ${s.fightNumber} — ${s.enemy.name} ${s.enemy.emoji}`);
    return s;
  });
}

/**
 * Advance from the Dragon Slain stage to the Final Victory (quest complete) screen.
 */
export function dismissDragonSlain(): void {
  update(s => {
    s.phase = 'finalVictory';
    return s;
  });
}

/**
 * Dismiss the Final Victory screen and return to the main menu.
 * Logs the run completion stats.
 */
export function dismissFinalVictory(): void {
  update(s => {
    const { totalCardsPlayed, totalCorrectAnswers, totalProblemsAttempted, isFlawless } = s.runStats;
    const pct = totalProblemsAttempted > 0 ? Math.round((totalCorrectAnswers / totalProblemsAttempted) * 100) : 0;
    log('RUN', `Run ended — victory — all 9 fights cleared — spells: ${totalCardsPlayed}, correct: ${totalCorrectAnswers}/${totalProblemsAttempted} (${pct}%), flawless: ${isFlawless ? 'yes' : 'no'}`);
    s.phase = 'menu';
    return s;
  });
}

/**
 * Return to the main menu and reset all run state.
 * Mastery scores are preserved (they live in masteryStore / localStorage).
 */
export function resetRun(): void {
  update(() => createInitialState());
}

// Re-export get for external use
export { get };
