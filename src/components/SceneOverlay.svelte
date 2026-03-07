<script lang="ts">
  import { PRE_FIGHT_SCENES, VICTORY_SCENES, REST_SITE_SCENES } from '../lib/scenes.js';
  import { gameStore, dismissPrefight, dismissVictory, dismissRest } from '../stores/gameStore.js';

  let { type }: { type: 'prefight' | 'victory' | 'rest' } = $props();

  let scene = $derived(() => {
    const fn = $gameStore.fightNumber;
    if (type === 'prefight') return PRE_FIGHT_SCENES[fn];
    if (type === 'victory')  return VICTORY_SCENES[fn];
    if (type === 'rest')     return fn === 3 ? REST_SITE_SCENES.rest1 : REST_SITE_SCENES.rest2;
    return null;
  });

  let victoryHpGained = $derived(
    type === 'victory' && $gameStore.fightNumber < 9 ? 5 : 0
  );

  let restHpGained = $derived($gameStore.lastRestHpGained);

  function handleContinue() {
    if (type === 'prefight') dismissPrefight();
    else if (type === 'victory') dismissVictory();
    else if (type === 'rest') dismissRest();
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
  <div
    class="flex flex-col items-center gap-6 rounded-2xl p-10 max-w-lg w-full mx-4 text-center"
    style="background: #1A2340; border: 1px solid #3A4560;"
  >
    {#if scene()}
      <!-- Emoji pair -->
      <div class="text-5xl">{scene().emojis}</div>

      <!-- Scene text -->
      <p class="text-[#E8EAF0] text-base leading-relaxed italic max-w-sm">
        "{scene().text}"
      </p>

      <!-- Victory HP recovery -->
      {#if type === 'victory' && victoryHpGained > 0}
        <div class="text-[#D4A017] font-bold text-lg">✨ +{victoryHpGained} HP</div>
      {/if}

      <!-- Rest site HP restored -->
      {#if type === 'rest' && restHpGained > 0}
        <div class="text-[#C0607A] font-bold text-lg">❤️ +{restHpGained} HP restored!</div>
      {/if}

      <!-- Continue button -->
      <button
        class="px-8 py-3 rounded-lg font-bold text-white text-base transition-colors duration-150"
        style="background: #4A90D9;"
        onmouseenter={(e) => e.currentTarget.style.background = '#5BA3E8'}
        onmouseleave={(e) => e.currentTarget.style.background = '#4A90D9'}
        onclick={handleContinue}
      >
        Continue
      </button>
    {/if}
  </div>
</div>
