<script lang="ts">
  import { gameStore, dismissFinalVictory } from '../stores/gameStore.js';
  import { masteryStore } from '../stores/masteryStore.js';

  const FIRST_VICTORY_KEY = 'factorquest_first_victory';

  let isFirstVictory = $state(false);
  let visibleLines = $state(0);

  $effect(() => {
    isFirstVictory = localStorage.getItem(FIRST_VICTORY_KEY) !== 'true';
    localStorage.setItem(FIRST_VICTORY_KEY, 'true');

    const timers = [
      setTimeout(() => { visibleLines = 1; }, 400),
      setTimeout(() => { visibleLines = 2; }, 1200),
      setTimeout(() => { visibleLines = 3; }, 2000),
      setTimeout(() => { visibleLines = 4; }, 2800),
      setTimeout(() => { visibleLines = 5; }, 3600),
    ];
    return () => timers.forEach(clearTimeout);
  });

  let stats = $derived($gameStore.runStats);
  let snapshot = $derived($gameStore.masterySnapshot);
  let currentScores = $derived($masteryStore);

  let successRate = $derived(
    stats.totalProblemsAttempted > 0
      ? Math.round((stats.totalCorrectAnswers / stats.totalProblemsAttempted) * 100)
      : 0
  );

  let masteredCount = $derived(
    Object.values(currentScores).filter(v => v >= 3).length
  );

  let masteredAtStart = $derived(
    Object.values(snapshot).filter(v => v >= 3).length
  );

  let masteredGain = $derived(masteredCount - masteredAtStart);

  // Problems that improved during this run
  type ImprovementState = 'unseen' | 'struggling' | 'neutral' | 'mastered';

  function scoreToState(score: number, hasKey: boolean): ImprovementState {
    if (!hasKey) return 'unseen';
    if (score >= 3) return 'mastered';
    if (score > 0) return 'neutral';
    if (score < 0) return 'struggling';
    return 'neutral';
  }

  const STATE_EMOJI: Record<ImprovementState, string> = {
    unseen: '⬛',
    struggling: '🟥',
    neutral: '🟨',
    mastered: '🟩',
  };

  let improvements = $derived((() => {
    const allKeys = new Set([...Object.keys(snapshot), ...Object.keys(currentScores)]);
    const result: { key: string; from: ImprovementState; to: ImprovementState }[] = [];
    for (const key of allKeys) {
      const prevScore = snapshot[key] ?? 0;
      const currScore = currentScores[key] ?? 0;
      const hadKey = key in snapshot;
      if (currScore > prevScore) {
        result.push({
          key,
          from: scoreToState(prevScore, hadKey),
          to: scoreToState(currScore, true),
        });
      }
    }
    return result;
  })());

  let masteryBarPct = $derived(Math.round((masteredCount / 55) * 100));
</script>

<div class="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-10"
     style="background: #1A2340; box-shadow: inset 0 0 80px 20px rgba(212,160,23,0.08);">

  <!-- Adventure stats -->
  <div class="flex flex-col items-center gap-3 w-full max-w-md">
    {#if visibleLines >= 1}
      <p class="text-[#E8EAF0] text-lg font-semibold text-center fade-line">
        "Your quest is complete, young wizard."
      </p>
    {/if}

    {#if visibleLines >= 2}
      <p class="text-[#8A9BB5] text-base text-center fade-line">
        You cast <span class="text-[#E8EAF0] font-bold">{stats.totalCardsPlayed} spells</span> on your journey
      </p>
    {/if}

    {#if visibleLines >= 3}
      <p class="text-[#8A9BB5] text-base text-center fade-line">
        You solved
        <span class="text-[#E8EAF0] font-bold">{stats.totalCorrectAnswers} multiplication problems</span> correctly
        {#if successRate >= 70}
          <span class="text-[#8A9BB5]">({successRate}%)</span>
        {/if}
      </p>
    {/if}

    {#if visibleLines >= 4}
      <p class="text-[#8A9BB5] text-base text-center fade-line">
        You defeated all <span class="text-[#E8EAF0] font-bold">9 monsters</span> — from Snail to Dragon
      </p>
    {/if}

    {#if visibleLines >= 5 && stats.isFlawless}
      <p class="text-[#D4A017] font-semibold text-center fade-line">
        A flawless quest — you defeated every monster on your first try! ✨
      </p>
    {/if}

    {#if visibleLines >= 5 && isFirstVictory}
      <p class="text-[#8A9BB5] text-sm text-center italic fade-line">
        "You've proven yourself, young wizard. But the dungeon resets and the monsters return… can you do it again, even better?"
      </p>
    {/if}
  </div>

  {#if visibleLines >= 5}
    <!-- Divider -->
    <div class="w-full max-w-md h-px bg-[#232E4A]"></div>

    <!-- Mastery progress -->
    <div class="flex flex-col items-center gap-3 w-full max-w-md fade-line">
      <p class="text-[#E8EAF0] font-semibold">Your knowledge grew!</p>

      {#if improvements.length > 0}
        <!-- Improved problem tiles -->
        <div class="flex flex-wrap gap-2 justify-center">
          {#each improvements as imp}
            {@const [a, b] = imp.key.split('x').map(Number)}
            <div class="improvement-tile">
              <span class="tile-problem">{a}×{b}</span>
              <span class="tile-arrow">{STATE_EMOJI[imp.from]}→{STATE_EMOJI[imp.to]}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-[#8A9BB5] text-sm italic text-center">You held steady — no problems lost ground!</p>
      {/if}

      <!-- Mastery count and bar -->
      <p class="text-[#8A9BB5] text-sm text-center">
        You've mastered
        <span class="text-[#E8EAF0] font-bold">{masteredCount} out of 55</span> problems!
        {#if masteredGain > 0}
          <span class="text-[#D4A017]">(+{masteredGain} since last run!) ✨</span>
        {/if}
      </p>

      <!-- Progress bar -->
      <div class="w-full h-3 rounded-full overflow-hidden" style="background: #232E4A;">
        <div
          class="h-full rounded-full transition-all duration-1000"
          style="width: {masteryBarPct}%; background: #4CAF50;"
        ></div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="flex gap-4 items-center mt-2 fade-line">
      <button
        class="px-8 py-3 rounded-lg font-bold text-white text-base transition-colors duration-150"
        style="background: #4A90D9;"
        onmouseenter={(e) => e.currentTarget.style.background = '#5BA3E8'}
        onmouseleave={(e) => e.currentTarget.style.background = '#4A90D9'}
        onclick={dismissFinalVictory}
      >Adventure Again</button>
    </div>
  {/if}
</div>

<style>
  .fade-line {
    animation: fade-up 0.6s ease-out both;
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .improvement-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 10px;
    border-radius: 8px;
    background: #232E4A;
    border: 1px solid #3A4560;
  }

  .tile-problem {
    font-size: 0.8rem;
    font-weight: 700;
    color: #E8EAF0;
  }

  .tile-arrow {
    font-size: 0.65rem;
    color: #8A9BB5;
  }
</style>
