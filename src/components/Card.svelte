<script lang="ts">
  import { TIER_COLORS, TIER_ICONS, TYPE_COLORS, TYPE_ICONS, effectText } from '../lib/ui.js';
  import { gameStore, selectCard, cancelCard, submitAnswer, type AnswerFeedback } from '../stores/gameStore.js';
  import type { CardInstance } from '../lib/cards.js';

  let {
    card,
    selected = false,
    inSwapMode = false,
    swapSelected = false,
    onclick = undefined,
  }: {
    card: CardInstance;
    selected?: boolean;
    inSwapMode?: boolean;
    swapSelected?: boolean;
    onclick?: (() => void) | undefined;
  } = $props();

  let answerInput = $state<number>(NaN);
  let inputEl = $state<HTMLInputElement | null>(null);
  let showFeedback = $state(false);
  let feedbackData = $state<AnswerFeedback | null>(null);
  let shaking = $state(false);
  let discarding = $state(false);

  // Watch for answer feedback from the store
  $effect(() => {
    const fb = $gameStore.answerFeedback;
    if (fb && !fb.correct && selected) {
      feedbackData = fb;
      showFeedback = true;
      answerInput = NaN;

      // Shake animation on wrong answer
      shaking = true;
      setTimeout(() => { shaking = false; }, 500);

      // On second wrong answer, card is about to be discarded — dim + slide out
      if (fb.attempt === 2) {
        setTimeout(() => { discarding = true; }, 400);
      }

      const timer = setTimeout(() => {
        showFeedback = false;
        feedbackData = null;
      }, 1500);
      return () => clearTimeout(timer);
    }
  });

  // Auto-focus input when card becomes selected
  $effect(() => {
    if (selected && inputEl) {
      setTimeout(() => inputEl?.focus(), 50);
    }
  });

  // Reset input when card is deselected
  $effect(() => {
    if (!selected) {
      answerInput = NaN;
      showFeedback = false;
      feedbackData = null;
    }
  });

  function handleSubmit() {
    if (!Number.isFinite(answerInput)) return;
    submitAnswer(answerInput);
    answerInput = NaN;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelCard(); }
  }

  function handleCardClick() {
    if (onclick) { onclick(); return; }
    if (!selected && !inSwapMode) selectCard(card.id);
  }

  let tierColor = $derived(TIER_COLORS[card.tier]);
  let typeColor = $derived(TYPE_COLORS[card.type]);
  let typeIcon  = $derived(TYPE_ICONS[card.type]);
  let tierIcon  = $derived(TIER_ICONS[card.tier]);
  let cardEffect = $derived(effectText(card));

  // Is this card's effect boosted by Double Down?
  let doubleDownBoosted = $derived(
    $gameStore.player.doubleDownActive &&
    (card.effect.type === 'damage' || card.effect.type === 'damage_twice') &&
    !selected
  );
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="relative rounded-xl cursor-pointer select-none flex flex-col"
  class:shake={shaking}
  class:card-discard={discarding}
  style="
    background: #232E4A;
    border: 2px solid {selected ? '#ffffff' : swapSelected ? '#F4C542' : tierColor};
    box-shadow: {selected
      ? '0 0 0 2px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.5)'
      : doubleDownBoosted
        ? `0 0 12px ${TIER_COLORS['gold']}`
        : '0 2px 8px rgba(0,0,0,0.4)'};
    min-width: 110px;
    max-width: 140px;
    min-height: {selected ? '220px' : '150px'};
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.3s ease, min-height 0.15s ease;
    transform: {discarding
      ? 'translateY(60px) scale(0.8)'
      : selected
        ? 'translateY(-8px) scale(1.05)'
        : swapSelected
          ? 'translateY(-4px)'
          : 'none'};
    opacity: {discarding ? '0' : '1'};
  "
  onclick={handleCardClick}
  role="button"
  tabindex="0"
  onkeydown={selected ? handleKeydown : (e) => { if (e.key === 'Enter') handleCardClick(); }}
  aria-label="{card.name} card"
>
  <!-- Tier badge -->
  <div class="flex items-center justify-between px-2 pt-2 pb-1">
    <span class="text-base leading-none">{tierIcon}</span>
    <span class="text-[10px] font-bold uppercase tracking-wider" style="color: {tierColor}">
      {card.tier}
    </span>
  </div>

  <!-- Card name -->
  <div class="px-2 text-sm font-bold text-[#E8EAF0] leading-tight">{card.name}</div>

  <!-- Type + effect -->
  <div class="px-2 mt-1 flex items-start gap-1">
    <span class="text-xs leading-tight" style="color: {typeColor}">{typeIcon}</span>
    <span class="text-[11px] text-[#8A9BB5] leading-tight">{cardEffect}</span>
  </div>

  <!-- Double Down glow indicator -->
  {#if doubleDownBoosted}
    <div class="px-2 mt-1 text-[10px] font-bold" style="color: {TIER_COLORS['gold']}">✨ ×2 damage</div>
  {/if}

  <!-- Problem area -->
  {#if !selected}
    <div class="mt-auto px-2 pb-2 pt-1">
      {#if card.tier === 'free'}
        <div class="text-[10px] text-[#6B82A8] italic"></div>
      {:else}
        <div class="text-center text-lg text-[#3A4560]">🔒</div>
      {/if}
    </div>
  {:else}
    <!-- Selected state: reveal problem + input -->
    <div class="flex flex-col gap-2 px-2 pb-2 pt-2 mt-1 border-t border-[#3A4560]">
      {#if showFeedback && feedbackData}
        <!-- Wrong answer feedback -->
        <div class="text-center">
          <div class="text-xs font-bold text-[#E74C3C]">✗ {feedbackData.submittedAnswer}</div>
          <div class="text-[10px] text-[#8A9BB5]">Answer: <span class="text-[#27AE60] font-bold">{feedbackData.correctAnswer}</span></div>
          <div class="text-[10px] text-[#8A9BB5] mt-1">New problem coming…</div>
        </div>
      {:else if card.tier === 'free'}
        <!-- Free card: submit immediately -->
        <div class="text-[11px] text-[#6B82A8] text-center italic">Play for free</div>
        <button
          class="w-full text-xs py-1 rounded font-semibold text-white"
          style="background: #4A90D9;"
          onclick={(e) => { e.stopPropagation(); submitAnswer(0); }}
        >Play</button>
        <button
          class="w-full text-[10px] py-0.5 rounded text-[#8A9BB5] border border-[#3A4560]"
          onclick={(e) => { e.stopPropagation(); cancelCard(); }}
        >Cancel</button>
      {:else if card.problem}
        <!-- Problem revealed -->
        <div class="text-center text-base font-bold text-[#E8EAF0]">
          {card.problem.a} × {card.problem.b} = ?
        </div>
        {#if card.attempts > 0}
          <div class="text-[10px] text-center text-[#E67E22]">Last chance!</div>
        {/if}
        <input
          bind:this={inputEl}
          bind:value={answerInput}
          type="number"
          inputmode="numeric"
          placeholder="?"
          class="w-full text-center text-sm font-bold rounded px-1 py-1 outline-none"
          style="background: #1A2340; border: 1px solid #3A4560; color: #E8EAF0;"
          onclick={(e) => e.stopPropagation()}
          onkeydown={handleKeydown}
        />
        <button
          class="w-full text-xs py-1 rounded font-semibold text-white"
          style="background: #4A90D9;"
          onclick={(e) => { e.stopPropagation(); handleSubmit(); }}
        >Confirm</button>
        <button
          class="w-full text-[10px] py-0.5 rounded text-[#8A9BB5] border border-[#3A4560]"
          onclick={(e) => { e.stopPropagation(); cancelCard(); }}
        >Cancel</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .shake {
    animation: card-shake 0.5s ease-in-out;
  }

  @keyframes card-shake {
    0%,  100% { transform: translateX(0); }
    15%        { transform: translateX(-8px) rotate(-2deg); }
    30%        { transform: translateX(8px)  rotate(2deg); }
    45%        { transform: translateX(-6px) rotate(-1deg); }
    60%        { transform: translateX(6px)  rotate(1deg); }
    75%        { transform: translateX(-3px); }
    90%        { transform: translateX(3px); }
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
  }

  /* Firefox */
  input[type=number] {
      -moz-appearance: textfield;
  }
</style>
