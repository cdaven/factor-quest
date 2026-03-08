<script lang="ts">
  import { fly } from 'svelte/transition';
  import { gameStore, selectCard, cancelCard, useSwap, endTurn } from '../stores/gameStore.js';
  import { INTENT_COLORS, INTENT_ICONS, AREA_COLORS, areaForFight } from '../lib/ui.js';
  import ProgressBar from './ProgressBar.svelte';
  import PlayerStats from './PlayerStats.svelte';
  import EnemyDisplay from './EnemyDisplay.svelte';
  import Card from './Card.svelte';
  import HintDisplay from './HintDisplay.svelte';

  // Local swap mode state
  let swapMode = $state(false);
  let swapSelected = $state(new Set<string>());

  function toggleSwapSelect(cardId: string) {
    const next = new Set(swapSelected);
    if (next.has(cardId)) next.delete(cardId);
    else next.add(cardId);
    swapSelected = next;
  }

  function enterSwapMode() {
    cancelCard();
    swapMode = true;
    swapSelected = new Set();
  }

  function confirmSwap() {
    if (swapSelected.size === 0) { cancelSwap(); return; }
    useSwap([...swapSelected]);
    swapMode = false;
    swapSelected = new Set();
  }

  function cancelSwap() {
    swapMode = false;
    swapSelected = new Set();
  }

  // Ghost HP projection for enemy bar
  let ghostHp = $derived(() => {
    const s = $gameStore;
    if (s.player.pendingAttackTotal === 0) return null;
    const absorbed = Math.min(s.enemy.shield, s.player.pendingAttackTotal);
    const dmg = s.player.pendingAttackTotal - absorbed;
    return Math.max(0, s.enemy.hp - dmg);
  });

  let area = $derived(areaForFight($gameStore.fightNumber));
  let areaColor = $derived(AREA_COLORS[area]);

  // Dragon immunity bounce visual
  let lastBounced = $derived($gameStore.lastBounced);
  let bouncing = $state(false);
  let prevBounced = false;
  $effect(() => {
    const b = lastBounced;
    if (b && !prevBounced) {
      bouncing = true;
      setTimeout(() => { bouncing = false; }, 800);
    }
    prevBounced = b;
  });

  // Near-death: HP <= 15
  let nearDeath = $derived($gameStore.player.hp > 0 && $gameStore.player.hp <= 15);

  // Intent display (after block applied, label changes)
  let intentDisplay = $derived(() => {
    const intent = $gameStore.enemy.intent;
    if (!intent) return { text: '', color: '#8A9BB5' };
    const { type, value } = intent;
    if (type === 'attack') return { text: `${INTENT_ICONS.attack} Attack ${value}`, color: INTENT_COLORS.attack };
    if (type === 'block')  return { text: `🛡️ Block ${value}`, color: INTENT_COLORS.block };
    if (type === 'buff')   return { text: `${INTENT_ICONS.buff} Buff`, color: INTENT_COLORS.buff };
    if (type === 'heal')   return { text: `${INTENT_ICONS.heal} Heal ${value}`, color: INTENT_COLORS.heal };
    return { text: '', color: '#8A9BB5' };
  });

  // Escape key handling to deselect card
  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && $gameStore.selectedCardId) cancelCard();
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });

  // Reset swap mode when turn ends.
  // $derived isolates the turn number so this effect only re-runs when turn
  // actually increments, not on every store update (e.g. cancelCard changing selectedCardId).
  let currentTurn = $derived($gameStore.turn);
  $effect(() => {
    void currentTurn;
    swapMode = false;
    swapSelected = new Set();
  });

  function handleBgClick() {
    if ($gameStore.selectedCardId) cancelCard();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="flex flex-col flex-1"
  style="position: relative;"
  onclick={handleBgClick}
>
  <!-- Near-death overlay -->
  {#if nearDeath}
    <div class="near-death-overlay pointer-events-none"></div>
  {/if}

  <!-- Progress bar -->
  <div style="border-bottom: 1px solid #232E4A;" onclick={(e) => e.stopPropagation()}>
    <ProgressBar fightNumber={$gameStore.fightNumber} />
  </div>

  <!-- Character area -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="flex items-start gap-4 px-6 pt-4 pb-2"
    onclick={(e) => e.stopPropagation()}
    role="region"
    aria-label="Combat area"
  >
    <!-- Player column -->
    <div class="flex flex-col items-center gap-2 flex-1">
      <PlayerStats player={$gameStore.player} />
      <div class="text-6xl leading-none select-none mt-2">🧙</div>
      <div class="text-xs text-[#8A9BB5] font-semibold">You</div>
      <!-- Pending attack total -->
      {#if $gameStore.player.pendingAttackTotal > 0}
        <div class="text-sm font-bold" style="color: {INTENT_COLORS.attack}">
          ⚔️ Attack {$gameStore.player.pendingAttackTotal}
        </div>
      {/if}
      <!-- Counter armed indicator -->
      {#if $gameStore.player.counterActive}
        <div class="text-xs text-[#E67E22]">🔄 Counter armed</div>
      {/if}
    </div>

    <!-- VS divider -->
    <div class="self-center text-[#3A4560] font-bold text-lg pt-8">VS</div>

    <!-- Enemy column -->
    <div class="flex flex-col items-center gap-2 flex-1">
      <EnemyDisplay enemy={$gameStore.enemy} ghostHp={ghostHp()} />
      <div
        class="text-6xl leading-none select-none mt-2 transition-all duration-200"
        class:buffed={$gameStore.enemy.buffActive}
        class:bounce-deflect={bouncing}
      >
        {$gameStore.enemy.emoji}
      </div>
      {#if bouncing}
        <div class="text-sm font-bold deflect-label">⚡ Immune!</div>
      {/if}
      <div class="text-xs text-[#8A9BB5] font-semibold">{$gameStore.enemy.name}</div>
      <!-- Enemy intent -->
      {#if intentDisplay().text}
        <div class="text-sm font-bold" style="color: {intentDisplay().color}">
          {intentDisplay().text}
        </div>
      {/if}
    </div>
  </div>

  <div class="mx-6 h-px bg-[#232E4A] my-1"></div>

  <!-- Card hand + hint area -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="flex flex-col items-center gap-3 px-4 pt-3 pb-2 flex-1"
    onclick={(e) => e.stopPropagation()}
    role="region"
    aria-label="Card hand"
  >
    <!-- Swap mode banner -->
    {#if swapMode}
      <div class="swap-mode text-sm text-[#F4C542] font-semibold">
        Select cards to swap, then confirm
        {#if swapSelected.size > 0}({swapSelected.size} selected){/if}
      </div>
    {/if}

    <!-- Cards -->
    <div class="flex gap-3 justify-center flex-wrap">
      {#each $gameStore.player.hand as card (card.id)}
        <div transition:fly={{ y: 40, duration: 250, opacity: 0 }}>
          <Card
            {card}
            selected={!swapMode && $gameStore.selectedCardId === card.id}
            inSwapMode={swapMode}
            swapSelected={swapMode && swapSelected.has(card.id)}
            onclick={() => {
              if (swapMode) toggleSwapSelect(card.id);
              else selectCard(card.id);
            }}
          />
        </div>
      {/each}
      {#if $gameStore.player.hand.length === 0}
        <div class="text-[#3A4560] italic text-sm py-8">No cards in hand</div>
      {/if}
    </div>

    <!-- Hints -->
    <HintDisplay />

    <!-- Controls -->
    <div class="flex gap-3 items-center mt-1">
      {#if swapMode}
        <button
          class="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors duration-150"
          style="background: {swapSelected.size > 0 ? '#4A90D9' : '#3A4F6A'};"
          onclick={confirmSwap}
          disabled={swapSelected.size === 0}
        >Confirm Swap ({swapSelected.size})</button>
        <button
          class="px-4 py-2 rounded-lg text-sm font-semibold text-[#8A9BB5] border border-[#3A4560] transition-colors duration-150"
          onclick={cancelSwap}
        >Cancel</button>
      {:else}
        <!-- Swap cards button -->
        <button
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
          style="background: {$gameStore.swapUsed ? '#232E4A' : '#232E4A'}; color: {$gameStore.swapUsed ? '#3A4560' : '#E8EAF0'}; border: 1px solid {$gameStore.swapUsed ? '#2A3550' : '#3A4560'};"
          onclick={enterSwapMode}
          disabled={$gameStore.swapUsed}
          title={$gameStore.swapUsed ? 'Swap already used this turn' : 'Swap cards'}
        >🔄 Swap cards</button>

        <!-- End Turn & Attack button -->
        <button
          class="px-6 py-2 rounded-lg text-sm font-bold text-white transition-colors duration-150 end-turn-btn"
          style="background: #4A90D9;"
          onmouseenter={(e) => e.currentTarget.style.background = '#5BA3E8'}
          onmouseleave={(e) => e.currentTarget.style.background = '#4A90D9'}
          onclick={endTurn}
        >End Turn & Attack</button>
      {/if}
    </div>

    <!-- Deck / Discard counts -->
    <div class="text-xs text-[#8A9BB5] flex gap-4">
      <span>Deck: {$gameStore.player.drawPile.length}</span>
      <span>Discard: {$gameStore.player.discardPile.length}</span>
    </div>
  </div>
</div>

<style>
  .near-death-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    box-shadow: inset 0 0 80px 20px rgba(231, 76, 60, 0.45);
    animation: heartbeat 2s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { box-shadow: inset 0 0 60px 10px rgba(231, 76, 60, 0.3); }
    50%       { box-shadow: inset 0 0 100px 30px rgba(231, 76, 60, 0.55); }
  }

  .buffed {
    filter: drop-shadow(0 0 8px #8E44AD);
  }

  .bounce-deflect {
    animation: deflect-flash 0.8s ease-out;
  }

  @keyframes deflect-flash {
    0%   { filter: drop-shadow(0 0 0 transparent); }
    20%  { filter: drop-shadow(0 0 16px #F4C542) brightness(1.4); transform: scale(1.15) rotate(-5deg); }
    40%  { filter: drop-shadow(0 0 10px #F4C542); transform: scale(1.05) rotate(3deg); }
    60%  { filter: drop-shadow(0 0 14px #F4C542); transform: scale(1.1) rotate(-3deg); }
    100% { filter: drop-shadow(0 0 0 transparent); transform: scale(1) rotate(0); }
  }

  .deflect-label {
    color: #F4C542;
    animation: label-fade 0.8s ease-out forwards;
  }

  @keyframes label-fade {
    0%   { opacity: 0; transform: translateY(0); }
    20%  { opacity: 1; transform: translateY(-4px); }
    70%  { opacity: 1; transform: translateY(-4px); }
    100% { opacity: 0; transform: translateY(-8px); }
  }

</style>
