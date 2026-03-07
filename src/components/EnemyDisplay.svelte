<script lang="ts">
  import { fade } from 'svelte/transition';
  import { INTENT_COLORS } from '../lib/ui.js';
  import type { EnemyState } from '../stores/gameStore.js';

  let { enemy, ghostHp = null }: { enemy: EnemyState; ghostHp?: number | null } = $props();

  let hpPct      = $derived(Math.max(0, (enemy.hp / enemy.maxHp) * 100));
  let ghostHpPct = $derived(ghostHp !== null ? Math.max(0, (ghostHp / enemy.maxHp) * 100) : null);

  // Flash red when HP decreases
  let flashing = $state(false);
  let prevHp = enemy.hp; // plain let — not reactive, just tracks previous value
  $effect(() => {
    const hp = enemy.hp;
    if (hp < prevHp) {
      flashing = true;
      setTimeout(() => { flashing = false; }, 350);
    }
    prevHp = hp;
  });
</script>

<div class="flex flex-col items-end gap-1 w-full">
  <!-- HP bar (right-aligned, fills left-to-right) -->
  <div class="flex items-center gap-2 w-full justify-end">
    <span class="text-xs text-[#8A9BB5] w-20 text-left">{enemy.hp}/{enemy.maxHp}</span>
    <div
      class="flex-1 h-3 bg-[#1A2340] rounded-full overflow-hidden border border-[#3A4560] relative transition-all duration-150"
      class:hit-flash={flashing}
    >
      <!-- Ghost marker -->
      {#if ghostHpPct !== null}
        <div
          class="absolute top-0 h-full rounded-full opacity-30"
          style="width: {ghostHpPct}%; background: #E74C3C;"
        ></div>
      {/if}
      <!-- Actual HP -->
      <div
        class="absolute top-0 h-full rounded-full transition-all duration-300"
        style="width: {hpPct}%; background: {flashing ? '#E74C3C' : '#27AE60'};"
      ></div>
    </div>
    <span class="text-sm">❤️</span>
  </div>

  <!-- Shield indicator -->
  {#if enemy.shield > 0}
    <div class="text-sm text-[#2980B9] font-semibold" transition:fade={{ duration: 200 }}>
      🛡️ {enemy.shield} shield
    </div>
  {/if}

  <!-- Buff aura indicator -->
  {#if enemy.buffActive}
    <div class="text-xs font-bold" style="color: {INTENT_COLORS.buff}" transition:fade={{ duration: 200 }}>
      💥 Buffed — next attack ×2
    </div>
  {/if}
</div>

<style>
  .hit-flash {
    border-color: #E74C3C;
    box-shadow: 0 0 8px rgba(231, 76, 60, 0.6);
  }
</style>
