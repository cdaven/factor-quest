<script lang="ts">
  import { gameStore, resetRun } from './stores/gameStore.js';
  import MainMenu     from './components/MainMenu.svelte';
  import CombatScreen from './components/CombatScreen.svelte';
  import SceneOverlay from './components/SceneOverlay.svelte';
  import MasteryMap   from './components/MasteryMap.svelte';
  import DragonSlain  from './components/DragonSlain.svelte';
  import FinalVictory from './components/FinalVictory.svelte';

  // Mastery map can be shown as a full-screen overlay at any time from the menu
  let showMastery = $state(false);

  let phase = $derived($gameStore.phase);
</script>

<div class="max-w-3xl mx-auto min-h-screen flex flex-col">
  {#if showMastery}
    <MasteryMap onclose={() => showMastery = false} />

  {:else if phase === 'menu'}
    <MainMenu onShowMastery={() => showMastery = true} />

  {:else if phase === 'prefight'}
    <!-- Combat screen already loaded behind the overlay -->
    <CombatScreen />
    <SceneOverlay type="prefight" />

  {:else if phase === 'combat'}
    <CombatScreen />

  {:else if phase === 'victory'}
    <CombatScreen />
    <SceneOverlay type="victory" />

  {:else if phase === 'rest'}
    <SceneOverlay type="rest" />

  {:else if phase === 'dragonSlain'}
    <DragonSlain />

  {:else if phase === 'finalVictory'}
    <FinalVictory />

  {:else if phase === 'defeat'}
    <!-- Defeat screen -->
    <div class="flex-1 flex flex-col items-center justify-center gap-6 px-4">
      <div class="text-6xl">💀</div>
      <h2 class="text-3xl font-bold text-[#E8EAF0]">Defeated!</h2>
      <p class="text-[#8A9BB5] text-center max-w-sm">
        You fell at Fight {$gameStore.fightNumber}. Your multiplication skills grow stronger with every run.
      </p>
      <p class="text-[#8A9BB5] text-sm">
        Player HP: {$gameStore.player.hp}/{$gameStore.player.maxHp}
      </p>
      <button
        class="px-8 py-3 rounded-lg font-bold text-white text-base mt-2 transition-colors duration-150"
        style="background: #4A90D9;"
        onmouseenter={(e) => e.currentTarget.style.background = '#5BA3E8'}
        onmouseleave={(e) => e.currentTarget.style.background = '#4A90D9'}
        onclick={resetRun}
      >Try Again</button>
      <button
        class="text-sm text-[#8A9BB5] underline"
        onclick={() => showMastery = true}
      >View Mastery Map</button>
    </div>
  {/if}
</div>
