<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { PlayerState } from '../stores/gameStore.js';

  let { player }: { player: PlayerState } = $props();

  let hpPct = $derived(Math.max(0, (player.hp / player.maxHp) * 100));
  let hpColor = $derived(player.hp <= 15 ? '#E74C3C' : '#27AE60');

  // Flash wizard avatar when taking damage
  let flashing = $state(false);
  let prevHp = player.hp; // plain let — not reactive, just tracks previous value
  $effect(() => {
    const hp = player.hp;
    if (hp < prevHp) {
      flashing = true;
      setTimeout(() => { flashing = false; }, 350);
    }
    prevHp = hp;
  });
</script>

<div class="flex flex-col items-start gap-1 w-full">
  <!-- HP bar -->
  <div class="flex items-center gap-2 w-full">
    <span class="text-sm" class:damage-pulse={flashing}>❤️</span>
    <div
      class="flex-1 h-3 bg-[#1A2340] rounded-full overflow-hidden border border-[#3A4560] transition-all duration-150"
      class:hit-flash={flashing}
    >
      <div
        class="h-full rounded-full transition-all duration-300"
        style="width: {hpPct}%; background: {hpColor};"
      ></div>
    </div>
    <span class="text-xs text-[#8A9BB5] w-14 text-right">{player.hp}/{player.maxHp}</span>
  </div>

  <!-- Shield indicator (only when shield > 0) -->
  {#if player.shield > 0}
    <div class="text-sm text-[#2980B9] font-semibold" transition:fade={{ duration: 200 }}>
      🛡️ {player.shield} shield
    </div>
  {/if}
</div>

<style>
  .hit-flash {
    border-color: #E74C3C;
    box-shadow: 0 0 8px rgba(231, 76, 60, 0.5);
  }

  .damage-pulse {
    animation: pulse-red 0.35s ease-out;
  }

  @keyframes pulse-red {
    0%   { filter: brightness(1) drop-shadow(0 0 0 transparent); }
    30%  { filter: brightness(1.5) drop-shadow(0 0 6px rgba(231, 76, 60, 0.9)); }
    100% { filter: brightness(1) drop-shadow(0 0 0 transparent); }
  }
</style>
