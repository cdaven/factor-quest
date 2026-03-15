<script lang="ts">
  import { gameStore } from '../stores/gameStore.js';

  const HINTS_DONE_KEY = 'factorquest_hints_done';

  // Whether the player has already seen and completed fight 1 guided hints
  // Also suppressed if the guided tour was completed (covers the same ground)
  let guidedDone = $state(
    localStorage.getItem(HINTS_DONE_KEY) === 'true' ||
    localStorage.getItem('fight1HintsComplete') === 'true'
  );

  // Guided hint phase for fight 1 (first run only)
  // Phases: 'tap_card' → 'play_more' → 'end_turn' → 'done'
  let guidedPhase = $state<'tap_card' | 'play_more' | 'end_turn' | 'done'>('tap_card');

  // Idle nudge state
  let idleMessage = $state('');
  let idleTimer: ReturnType<typeof setTimeout> | null = null; // plain let — timeout handle, not reactive

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleMessage = '';
    idleTimer = setTimeout(() => {
      const s = $gameStore;
      if (s.phase !== 'combat') return;
      if (s.player.pendingAttackTotal > 0 || s.player.discardPile.length > 0) {
        idleMessage = 'Press End Turn & Attack when you\'re ready.';
      } else {
        idleMessage = 'Pick a card from your hand to get started.';
      }
    }, 12000);
  }

  // Advance guided hints when player takes actions
  $effect(() => {
    const s = $gameStore;
    if (s.phase !== 'combat' || guidedDone) return;

    if (guidedPhase === 'tap_card' && s.selectedCardId !== null) {
      guidedPhase = 'play_more';
    }
  });

  $effect(() => {
    const s = $gameStore;
    if (s.phase !== 'combat' || guidedDone) return;

    // Detect second card played: hand has shrunk by at least 2
    if (guidedPhase === 'play_more') {
      // hand.length < 3 means at least 2 cards have been played (started with 4)
      if (s.player.hand.length <= 2 || s.player.pendingAttackTotal > 0) {
        guidedPhase = 'end_turn';
      }
    }
  });

  $effect(() => {
    const s = $gameStore;
    // Once player ends their first turn in fight 1, mark hints done
    if (s.phase === 'combat' && !guidedDone && s.turn > 1 && s.fightNumber === 1) {
      guidedPhase = 'done';
      guidedDone = true;
      localStorage.setItem(HINTS_DONE_KEY, 'true');
    }
  });

  // Reset idle timer on any state change during combat
  $effect(() => {
    const s = $gameStore;
    if (s.phase === 'combat') {
      // Access reactive fields to trigger on change
      void s.selectedCardId;
      void s.player.hand.length;
      void s.player.pendingAttackTotal;
      void s.swapUsed;
      resetIdleTimer();
    } else {
      if (idleTimer) clearTimeout(idleTimer);
      idleMessage = '';
    }
  });

  let fightNumber = $derived($gameStore.fightNumber);
  let phase = $derived($gameStore.phase);

  // What hint text to show, if any
  let hintText = $derived(() => {
    if (phase !== 'combat') return '';

    // Fight 1 guided hints (first run only)
    if (fightNumber === 1 && !guidedDone) {
      if (guidedPhase === 'tap_card') return 'Tap a card to play it!';
      if (guidedPhase === 'play_more') return 'Nice! You can play more cards too.';
      if (guidedPhase === 'end_turn') return ''; // End Turn button pulses instead
    }

    // Fights 2–3 persistent reminder
    if (fightNumber <= 3 && guidedDone) {
      return 'Play your cards, then press End Turn to attack.';
    }

    return '';
  });

  // Whether End Turn button should pulse (fight 1, end_turn hint phase)
  // Used internally to add pulsing hint on the End Turn button via CSS class
  let endTurnShouldPulse = $derived(
    phase === 'combat' && fightNumber === 1 && !guidedDone && guidedPhase === 'end_turn'
  );
</script>

<!-- Hint text below hand -->
{#if hintText()}
  <div class="text-center text-sm text-[#8A9BB5] italic animate-pulse py-1">
    {hintText()}
  </div>
{/if}

<!-- End Turn pulse hint (fight 1 only) -->
{#if endTurnShouldPulse}
  <div class="text-center text-xs text-[#4A90D9] italic animate-pulse py-1">
    Press End Turn &amp; Attack when you're ready.
  </div>
{/if}

<!-- Idle nudge -->
{#if idleMessage && !hintText()}
  <div class="text-center text-sm text-[#8A9BB5] italic py-1">
    {idleMessage}
  </div>
{/if}
