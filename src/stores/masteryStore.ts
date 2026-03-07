import { writable, get, type Readable } from 'svelte/store';
import { log } from '../lib/logger.js';
import type { MasteryScores } from '../lib/problems.js';

const STORAGE_KEY = 'factorquest_mastery';

function loadFromStorage(): MasteryScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MasteryScores) : {};
  } catch {
    return {};
  }
}

function saveToStorage(scores: MasteryScores): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // localStorage unavailable (e.g. private browsing quota exceeded) — silently ignore
  }
}

interface MasteryStore extends Readable<MasteryScores> {
  updateScore(key: string, delta: number): void;
  getScores(): MasteryScores;
  reset(): void;
}

function createMasteryStore(): MasteryStore {
  const { subscribe, update, set } = writable<MasteryScores>(loadFromStorage());

  return {
    subscribe,

    /**
     * Update the mastery score for a problem key by delta (+1, 0, or -1).
     * The key should be in canonical form, e.g. "6x7".
     */
    updateScore(key: string, delta: number): void {
      update(scores => {
        const prev = scores[key] ?? 0;
        const next = prev + delta;
        const updated = { ...scores, [key]: next };
        saveToStorage(updated);
        log('PROBLEM', `Mastery update: ${key}  score ${prev} → ${next}${delta < 0 ? ' (wrong answer)' : ''}`);
        return updated;
      });
    },

    /** Return the current scores object synchronously. */
    getScores(): MasteryScores {
      return get(this);
    },

    /** Wipe all scores (not used in normal gameplay, but useful for testing). */
    reset(): void {
      set({});
      saveToStorage({});
    },
  };
}

export const masteryStore = createMasteryStore();
