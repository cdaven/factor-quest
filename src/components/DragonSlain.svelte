<script lang="ts">
  import { dismissDragonSlain } from '../stores/gameStore.js';

  let showContinue = $state(false);

  $effect(() => {
    const timer = setTimeout(() => { showContinue = true; }, 3500);
    return () => clearTimeout(timer);
  });
</script>

<div class="dragon-slain-screen">
  <!-- Gold light flood overlay -->
  <div class="gold-flood"></div>

  <!-- Dragon fades away -->
  <div class="dragon-fade text-8xl select-none">🐉</div>

  <!-- Wizard rises to center -->
  <div class="wizard-rise text-[9rem] leading-none select-none">🧙</div>

  <!-- Title -->
  <div class="title-appear">
    <h1 class="title-text">The Dragon is Slain!</h1>
  </div>

  <!-- Continue button (fades in after delay) -->
  <div class="continue-appear" class:visible={showContinue}>
    <button
      class="px-8 py-3 rounded-lg font-bold text-white text-base transition-colors duration-150"
      style="background: #4A90D9;"
      onmouseenter={(e) => e.currentTarget.style.background = '#5BA3E8'}
      onmouseleave={(e) => e.currentTarget.style.background = '#4A90D9'}
      onclick={dismissDragonSlain}
    >
      Continue
    </button>
  </div>
</div>

<style>
  .dragon-slain-screen {
    position: fixed;
    inset: 0;
    background: #1A2340;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    z-index: 100;
    animation: screen-shake 0.5s ease-out;
  }

  @keyframes screen-shake {
    0%   { transform: translate(0, 0); }
    15%  { transform: translate(-10px, 6px); }
    30%  { transform: translate(10px, -6px); }
    45%  { transform: translate(-8px, 4px); }
    60%  { transform: translate(8px, -4px); }
    75%  { transform: translate(-4px, 2px); }
    100% { transform: translate(0, 0); }
  }

  .gold-flood {
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(212, 160, 23, 0.25) 0%, transparent 70%);
    animation: flood-in 3s ease-out 0.6s both;
    pointer-events: none;
  }

  @keyframes flood-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .dragon-fade {
    position: absolute;
    animation: dragon-away 1.2s ease-out 0.5s both;
  }

  @keyframes dragon-away {
    0%   { opacity: 1; filter: brightness(1); transform: scale(1); }
    60%  { opacity: 0.4; filter: brightness(0.4); transform: scale(0.9); }
    100% { opacity: 0; filter: brightness(0); transform: scale(0.7); }
  }

  .wizard-rise {
    animation: wizard-up 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) 1.4s both;
  }

  @keyframes wizard-up {
    from { opacity: 0; transform: translateY(50px) scale(0.7); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .title-appear {
    animation: title-in 1s ease-out 2.2s both;
  }

  @keyframes title-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .title-text {
    font-size: 2.25rem;
    font-weight: 800;
    color: #D4A017;
    text-align: center;
    animation: title-shimmer 2.5s ease-in-out 2.5s infinite;
  }

  @keyframes title-shimmer {
    0%, 100% { text-shadow: 0 0 10px rgba(212, 160, 23, 0.4); }
    50%       { text-shadow: 0 0 24px rgba(212, 160, 23, 0.85), 0 0 48px rgba(212, 160, 23, 0.3); }
  }

  .continue-appear {
    opacity: 0;
    transition: opacity 0.8s ease;
  }

  .continue-appear.visible {
    opacity: 1;
  }
</style>
