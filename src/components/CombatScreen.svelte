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

  // Pending attack display: each Attack's hits joined by "+", attacks separated by "+"
  let pendingAttackStr = $derived(
    $gameStore.player.queuedAttacks.flatMap(a => a.hits).join('+')
  );

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

  // Intent display with timing label
  let intentDisplay = $derived(() => {
    const intent = $gameStore.enemy.intent;
    if (!intent) return { text: '', color: '#8A9BB5', timing: '' };
    const { type, value } = intent;
    // block is applied at turn start; heal also treated as already resolved per design
    const timing = (type === 'block' || type === 'heal') ? 'Already done' : 'On end turn';
    if (type === 'attack') return { text: `${INTENT_ICONS.attack} Attack ${value}`, color: INTENT_COLORS.attack, timing };
    if (type === 'block')  return { text: `🛡️ Block ${value}`,                      color: INTENT_COLORS.block,  timing };
    if (type === 'buff')   return { text: `${INTENT_ICONS.buff} Buff`,               color: INTENT_COLORS.buff,   timing };
    if (type === 'heal')   return { text: `${INTENT_ICONS.heal} Heal ${value}`,      color: INTENT_COLORS.heal,   timing };
    return { text: '', color: '#8A9BB5', timing: '' };
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

  // ── Flying card token ────────────────────────────────────────────────────────
  // When a card is answered correctly, a token flies from the hand toward either
  // the player's HP bar (defence/heal) or the pending-attack counter (attack).
  // cardType is carried directly on answerFeedback to avoid timing issues.

  interface FlyToken { id: number; type: string; }
  let flyToken = $state<FlyToken | null>(null);
  let _flyKey = 0;
  let _lastFb: object | null = null; // plain let — ref guard so each feedback fires exactly once
  $effect(() => {
    const fb = $gameStore.answerFeedback;
    if (fb?.correct && fb.cardType && fb.cardType != 'utility' && fb !== _lastFb) {
      _lastFb = fb;
      flyToken = { id: ++_flyKey, type: fb.cardType };
      setTimeout(() => { flyToken = null; }, 600);
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
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
  <div class="mt-6" onclick={(e) => e.stopPropagation()}>
    <ProgressBar fightNumber={$gameStore.fightNumber} />
  </div>

  <!-- Character area -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="flex items-start gap-4 px-6 pt-12 pb-4"
    onclick={(e) => e.stopPropagation()}
    role="region"
    aria-label="Combat area"
  >
    <!-- Player column -->
    <div class="flex flex-col items-center gap-2 flex-1">
      <PlayerStats player={$gameStore.player} />
      <div class="text-6xl leading-none select-none mt-2">🧙</div>
      <div class="text-sm text-[#8A9BB5] font-semibold">You</div>
      <!-- Queued actions box -->
      {#if $gameStore.player.pendingAttackTotal > 0 || $gameStore.player.counterActive}
        <div class="action-box w-full" style="border-color: rgba(231,76,60,0.4);">
          <div class="action-box-label">On end turn</div>
          {#if $gameStore.player.queuedAttacks.length > 0}
            <span class="text-sm font-bold" style="color: {INTENT_COLORS.attack}">
              ⚔️ Attack {pendingAttackStr}
            </span>
          {/if}
          {#if $gameStore.player.counterActive}
            <span class="text-xs font-semibold" style="color: #E67E22;">🔄 Counter armed</span>
          {/if}
        </div>
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
      <div class="text-sm text-[#8A9BB5] font-semibold">{$gameStore.enemy.name}</div>
      <!-- Enemy intent box -->
      {#if intentDisplay().text}
        {@const id = intentDisplay()}
        <div class="action-box w-full" style="border-color: {id.color}55;">
          <div class="action-box-label">{id.timing}</div>
          <span class="text-sm font-bold" style="color: {id.color}">{id.text}</span>
        </div>
      {/if}
    </div>
  </div>

  <!--<div class="mx-6 h-px bg-[#232E4A] my-5"></div>-->

  <!-- Card hand + hint area -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="flex flex-col items-center gap-3 px-4 pt-12 pb-6"
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
        <div transition:fly={{ y: 40, duration: 250 }}>
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

    <!-- Flying card token (animates toward player on correct play) -->
    {#if flyToken}
      {#key flyToken.id}
        <div
          aria-hidden="true"
          class="fly-token"
          class:fly-attack={flyToken.type === 'attack'}
          class:fly-player={flyToken.type !== 'attack'}
        >
          {flyToken.type === 'attack' ? '⚔️' : flyToken.type === 'defence' ? '🛡️' : flyToken.type === 'heal' ? '❤️' : '✨'}
        </div>
      {/key}
    {/if}

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

    <!-- Deck / Discard counts
    <div class="text-xs text-[#8A9BB5] flex gap-4">
      <span>Deck: {$gameStore.player.drawPile.length}</span>
      <span>Discard: {$gameStore.player.discardPile.length}</span>
    </div>
     -->
  </div>
</div>

<style>
  .action-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid;
    background: rgba(255, 255, 255, 0.02);
  }

  .action-box-label {
    font-size: 0.58rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6B82A8;
    margin-bottom: 1px;
  }

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

  /* Flying card token */
  .fly-token {
    position: fixed;
    top: 50%;
    left: 50%;
    font-size: 2rem;
    pointer-events: none;
    z-index: 100;
  }

  /* Attack/counter → fly toward pending-attack counter (lower on player side) */
  .fly-attack {
    animation: fly-to-attack 0.52s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Defence/heal/utility → fly toward HP bar (higher on player side) */
  .fly-player {
    animation: fly-to-player 0.52s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes fly-to-attack {
    0%   { transform: translate(-50%, 0) scale(1);                    opacity: 1; }
    100% { transform: translate(calc(-50% - 10vw), -35vh) scale(0.2); opacity: 0; }
  }

  @keyframes fly-to-player {
    0%   { transform: translate(-50%, 0) scale(1);                    opacity: 1; }
    100% { transform: translate(calc(50% - 10vw), -35vh) scale(0.2); opacity: 0; }
  }
</style>
