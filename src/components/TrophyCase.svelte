<script lang="ts">
  import { trophyStore } from '../stores/trophyStore.js';
  import { TROPHY_DEFINITIONS } from '../lib/trophies.js';

  let { onBack }: { onBack: () => void } = $props();

  let trophies        = $derived($trophyStore.trophies);
  let allEarned       = $derived($trophyStore.allTrophiesEarned);
  let earnedCount     = $derived(Object.values(trophies).filter(Boolean).length);
  let totalCount      = TROPHY_DEFINITIONS.length; // 27

  // Detect first-time completion this session for the fade-in animation.
  // wasAlreadyComplete tracks whether allTrophiesEarned was true when this
  // component first mounted — if so, no animation needed.
  let wasAlreadyComplete = $state(false);
  let completedJustNow   = $state(false);

  $effect(() => {
    if (allEarned && !wasAlreadyComplete) {
      completedJustNow = true;
    }
  });

  // Initialise wasAlreadyComplete on first render
  $effect.pre(() => {
    wasAlreadyComplete = allEarned;
  });

  // Hover state map for locked tiles (keyed by trophy id)
  let hoveredId = $state<string | null>(null);
</script>

<div
  class="flex-1 flex flex-col min-h-screen px-4 py-6"
  style={allEarned ? 'border: 2px solid #D4A017; border-radius: 0.75rem;' : ''}
>
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button
      class="text-sm font-semibold transition-colors duration-150"
      style="color: #8A9BB5;"
      onmouseenter={(e) => (e.currentTarget.style.color = '#E8EAF0')}
      onmouseleave={(e) => (e.currentTarget.style.color = '#8A9BB5')}
      onclick={onBack}
    >
      ← Back
    </button>
  </div>

  <h2 class="text-2xl font-bold text-center text-[#E8EAF0] mb-6">🏆 Trophy Case</h2>

  <!-- Trophy grid -->
  <div class="grid grid-cols-3 gap-3 mb-6">
    {#each TROPHY_DEFINITIONS as trophy (trophy.id)}
      {@const earned = !!trophies[trophy.id]}
      {@const isHovered = hoveredId === trophy.id}

      <div
        class="flex flex-col items-center justify-start rounded-xl p-3 cursor-default select-none transition-all duration-150"
        style={earned
          ? 'border: 2px solid #D4A017; background: #1E2535; box-shadow: 0 0 8px rgba(212,160,23,0.25);'
          : 'border: 1px solid #2A3550; background: #3A4560;'}
        onmouseenter={() => { if (!earned) hoveredId = trophy.id; }}
        onmouseleave={() => { hoveredId = null; }}
        role="img"
        aria-label={earned ? trophy.name : 'Locked trophy'}
      >
        <!-- Emoji -->
        <div
          class="text-3xl leading-none mb-2"
          style={earned ? '' : 'filter: grayscale(100%) opacity(0.35);'}
        >
          {trophy.emoji}
        </div>

        <!-- Name -->
        <p
          class="text-xs font-bold text-center leading-tight mb-1"
          style={earned ? 'color: #D4A017;' : 'color: #5A6A8A;'}
        >
          {earned ? trophy.name : '???'}
        </p>

        <!-- Description / hint -->
        <p class="text-xs text-center leading-snug" style="color: #8A9BB5;">
          {#if earned}
            {trophy.description}
          {:else if isHovered}
            <em>{trophy.hint}</em>
          {/if}
        </p>
      </div>
    {/each}
  </div>

  <!-- Footer -->
  <div class="mt-auto text-center pb-4">
    {#if allEarned}
      <p
        class="text-base font-semibold"
        class:animate-fadein={completedJustNow}
        style="color: #D4A017;"
      >
        You've collected every trophy. You are a true Mathemagician!
      </p>
    {:else}
      <p class="text-sm" style="color: #8A9BB5;">
        Trophies earned: <span class="font-semibold text-[#E8EAF0]">{earnedCount}</span> / {totalCount}
      </p>
    {/if}
  </div>
</div>

<style>
  @keyframes fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fadein {
    animation: fadein 0.6s ease forwards;
  }
</style>
