<script lang="ts">
  import { untrack } from 'svelte';
  import { trophyStore, dismissToast, dismissTitleToast } from '../stores/trophyStore.js';
  import { TROPHY_MAP } from '../lib/trophies.js';

  // Current toast being displayed. null = nothing showing.
  let current = $state<{ emoji: string; label: string } | null>(null);
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function showNext() {
    if (timer) { clearTimeout(timer); timer = null; }

    const toasts  = $trophyStore.pendingTrophyToasts;
    const title   = $trophyStore.pendingTitleToast;

    if (toasts.length > 0) {
      const id = toasts[0];
      const def = TROPHY_MAP.get(id);
      current = { emoji: def?.emoji ?? '🏆', label: def?.name ?? id };
      visible = true;
      timer = setTimeout(() => {
        visible = false;
        // Wait for fade-out, then dismiss and show next
        timer = setTimeout(() => {
          dismissToast();
        }, 350);
      }, 3000);
    } else if (title) {
      current = { emoji: '✨', label: `New title: ${title}!` };
      visible = true;
      timer = setTimeout(() => {
        visible = false;
        timer = setTimeout(() => {
          dismissTitleToast();
        }, 350);
      }, 3000);
    } else {
      current = null;
    }
  }

  // Re-run only when the store queues change.
  // The `visible` guard is wrapped in untrack() so that setting visible=false
  // inside a timeout does NOT re-run this effect (which would cancel the
  // dismiss timer and keep the toast on screen forever).
  $effect(() => {
    const toasts = $trophyStore.pendingTrophyToasts;
    const title  = $trophyStore.pendingTitleToast;

    if (toasts.length > 0 || title) {
      if (!untrack(() => visible)) showNext();
    }
  });
</script>

{#if current}
  <div
    class="toast"
    class:toast--visible={visible}
    style="pointer-events: none;"
    aria-live="polite"
    aria-atomic="true"
  >
    <span class="toast__icon">{current.emoji}</span>
    <div class="toast__text">
      <p class="toast__title">🏆 Trophy Unlocked!</p>
      <p class="toast__name">{current.label}</p>
    </div>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: #1E2535;
    border: 1px solid #D4A017;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    z-index: 9999;
    min-width: 200px;
    max-width: 280px;
    transform: translateX(calc(100% + 1.5rem));
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.35s ease;
  }

  .toast--visible {
    transform: translateX(0);
    opacity: 1;
  }

  .toast__icon {
    font-size: 1.75rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .toast__title {
    font-size: 0.7rem;
    font-weight: 700;
    color: #D4A017;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.15rem;
  }

  .toast__name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #E8EAF0;
    line-height: 1.2;
  }
</style>
