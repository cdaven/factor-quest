<script lang="ts">
  import { masteryStore } from '../stores/masteryStore.js';
  import { trophyStore } from '../stores/trophyStore.js';
  import { startRun } from '../stores/gameStore.js';
  import StreakDisplay from './StreakDisplay.svelte';

  let { onShowMastery, onShowTrophyCase }: {
    onShowMastery: () => void;
    onShowTrophyCase: () => void;
  } = $props();

  let masteredCount = $derived(
    Object.values($masteryStore).filter(v => v >= 3).length
  );

  let activeTitle = $derived($trophyStore.activeTitle);

  // Animate the title in when it first appears or changes
  let prevTitle = $state<string | null>(null);
  let titleAnimating = $state(false);

  $effect(() => {
    if (activeTitle !== prevTitle) {
      prevTitle = activeTitle;
      if (activeTitle) {
        titleAnimating = false;
        requestAnimationFrame(() => { titleAnimating = true; });
      }
    }
  });
</script>

<div class="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-12">

  <!-- Wizard avatar -->
  <div class="text-7xl leading-none select-none">🧙</div>

  <!-- Player title (only shown when earned) -->
  {#if activeTitle}
    <p
      class="text-base font-semibold tracking-wide select-none"
      class:title-fadein={titleAnimating}
      style="color: #D4A017;"
    >
      ✨ {activeTitle} ✨
    </p>
  {/if}

  <!-- Title -->
  <h1 class="text-4xl font-bold text-[#E8EAF0] tracking-tight">Factor Quest</h1>

  <!-- Description -->
  <p class="text-center text-[#8A9BB5] text-base max-w-sm leading-relaxed">
    Play cards, answer multiplication problems, and fight your way through forest, caves
    and fortress — all the way to the dragon!
  </p>

  <!-- Journey map emojis -->
  <div class="flex items-center gap-4 text-3xl select-none">
    <span title="The Forest">🌲</span>
    <span class="text-[#3A4560] text-lg">›</span>
    <span title="The Caves">⛏️</span>
    <span class="text-[#3A4560] text-lg">›</span>
    <span title="The Fortress">🏰</span>
    <span class="text-[#3A4560] text-lg">›</span>
    <span title="The Dragon">🐉</span>
  </div>

  <!-- Start Adventure button -->
  <button
    class="px-10 py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-colors duration-150 mt-2"
    style="background: #4A90D9;"
    onmouseenter={(e) => e.currentTarget.style.background = '#5BA3E8'}
    onmouseleave={(e) => e.currentTarget.style.background = '#4A90D9'}
    onclick={startRun}
  >
    Start Adventure
  </button>

  <!-- Streak display (between Start Adventure and Trophy Case) -->
  <StreakDisplay />

  <!-- Trophy Case button -->
  <button
    class="px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
    style="color: #8A9BB5; border: 1px solid #3A4560;"
    onmouseenter={(e) => { e.currentTarget.style.color = '#E8EAF0'; e.currentTarget.style.borderColor = '#8A9BB5'; }}
    onmouseleave={(e) => { e.currentTarget.style.color = '#8A9BB5'; e.currentTarget.style.borderColor = '#3A4560'; }}
    onclick={onShowTrophyCase}
  >
    🏆 Trophy Case
  </button>

  <!-- Mastery Map button -->
  <button
    class="px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
    style="color: #8A9BB5; border: 1px solid #3A4560;"
    onmouseenter={(e) => { e.currentTarget.style.color = '#E8EAF0'; e.currentTarget.style.borderColor = '#8A9BB5'; }}
    onmouseleave={(e) => { e.currentTarget.style.color = '#8A9BB5'; e.currentTarget.style.borderColor = '#3A4560'; }}
    onclick={onShowMastery}
  >
    📊 Mastery Map
    {#if masteredCount > 0}
      <span class="ml-1 text-[#4CAF50]">({masteredCount}/55)</span>
    {/if}
  </button>
</div>

<style>
  @keyframes title-fadein {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .title-fadein {
    animation: title-fadein 0.5s ease forwards;
  }
</style>
