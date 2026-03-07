export interface Scene {
  emojis: string;
  text: string;
}

/**
 * Pre-fight scene overlays shown before each fight.
 * Keyed by fight number (1–9).
 */
export const PRE_FIGHT_SCENES: Record<number, Scene> = {
  1: {
    emojis: '🌲🌙',
    text: 'You step into the dark forest. The trees loom tall around you. Suddenly, a giant snail slides out from behind a mossy rock and eyes you suspiciously.',
  },
  2: {
    emojis: '🌲🌙',
    text: 'You press deeper into the forest. Twigs snap beneath your feet. From the shadows, a wolf emerges — teeth bared and eyes gleaming in the moonlight.',
  },
  3: {
    emojis: '🌲🌙',
    text: 'The trees grow closer together and thick webs hang between the branches. Before you can turn back, a giant spider drops silently from above.',
  },
  4: {
    emojis: '⛏️🌑',
    text: 'You leave the forest behind and descend into a damp cave. Your footsteps echo in the darkness. A cave troll lumbers out from the shadows, blocking your path.',
  },
  5: {
    emojis: '⛏️🌑',
    text: 'You venture further into the cave. The air grows cold and stale. High above, something stirs — a giant bat detaches from the ceiling and swoops toward you.',
  },
  6: {
    emojis: '⛏️🌑',
    text: 'Deep in the cave, you discover a vast chamber. At its centre stands a stone golem, ancient and silent. As you approach, its eyes flicker open with a dull orange glow.',
  },
  7: {
    emojis: '🏰🌑',
    text: 'You climb the fortress stairs, your heart pounding. A dark knight steps out of a doorway, armour clanking, blocking the corridor ahead.',
  },
  8: {
    emojis: '🏰🌑',
    text: 'At the top of the fortress tower, candles flicker in a cold wind. A necromancer stands with their back to you — but slowly turns around, as if they knew you were coming.',
  },
  9: {
    emojis: '🏰🔥',
    text: 'You push open the great iron door at the heart of the fortress. The room beyond is vast and hot. Two enormous eyes open in the darkness. The dragon has been waiting.',
  },
};

export const VICTORY_SCENES: Record<number, Scene> = {
  1: {
    emojis: '🌲🌙',
    text: 'The snail retreats into its shell and goes still. You step over it carefully and walk on.',
  },
  2: {
    emojis: '🌲🌙',
    text: 'The wolf slinks back into the shadows, defeated. The forest falls quiet again. You catch your breath and press on.',
  },
  3: {
    emojis: '🌲🌙',
    text: 'The spider curls up and drops from its web. You push through the sticky strands and emerge on the other side of the forest.',
  },
  4: {
    emojis: '⛏️🌑',
    text: 'The troll stumbles backward and crashes to the ground with a thunderous boom. Dust falls from the cave ceiling. You step past it into the dark.',
  },
  5: {
    emojis: '⛏️🌑',
    text: 'The bat lets out a piercing screech and disappears into the darkness above. The cave falls silent. You keep moving.',
  },
  6: {
    emojis: '⛏️🌑',
    text: "Cracks spread across the golem's body. With a deep grinding sound, it crumbles into a pile of rubble. The chamber is yours.",
  },
  7: {
    emojis: '🏰🌑',
    text: "The knight's armour clangs against the stone floor. You step over the fallen warrior and continue up the fortress stairs.",
  },
  8: {
    emojis: '🏰🌑',
    text: 'The necromancer dissolves into shadows with a last whispered curse. The candles go out. Only one door remains.',
  },
  9: {
    emojis: '🏰🔥',
    text: 'The dragon lets out a final roar that shakes the fortress walls — then falls still. Light floods the chamber. You have done it.',
  },
};

export const REST_SITE_SCENES: { rest1: Scene; rest2: Scene } = {
  // After fight 3
  rest1: {
    emojis: '🔥🌲',
    text: 'You find a sheltered clearing and sink to the ground with relief. A small fire crackles warmly as you eat, rest, and tend to your wounds. You feel stronger already.',
  },
  // After fight 6
  rest2: {
    emojis: '💧🪨',
    text: 'You hear a faint trickling sound ahead. A clear stream runs through a crack in the cave wall. You drink deeply, wash your face in the cold water, and feel your strength return.',
  },
};
