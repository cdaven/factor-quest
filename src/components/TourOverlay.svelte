<script lang="ts">
  import { onMount } from 'svelte';

  export interface TourStep {
    targetId: string;
    tooltipSide: 'below' | 'above' | 'left' | 'right';
    arrowSide: 'top' | 'bottom' | 'left' | 'right';
    title: string;
    body: string;
    logLabel: string;
  }

  let {
    steps,
    oncomplete,
  }: {
    steps: TourStep[];
    oncomplete: () => void;
  } = $props();

  const PADDING = 4;
  const GAP = 12;
  const TIP_W = 210;
  const TIP_H = 160;

  let stepIndex = $state(0);
  let showCompletion = $state(false);
  let ready = $state(false);
  let _skippedAt: number | null = null;

  let hlStyle = $state('left:-9999px;top:0;width:0;height:0');
  let tipStyle = $state('left:-9999px;top:0');

  function computePositions(index: number) {
    const step = steps[index];
    const el = document.getElementById(step.targetId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const hlL = rect.left - PADDING;
    const hlT = rect.top - PADDING;
    const hlW = rect.width + 2 * PADDING;
    const hlH = rect.height + 2 * PADDING;
    hlStyle = `left:${hlL}px;top:${hlT}px;width:${hlW}px;height:${hlH}px`;

    let tL = 0, tT = 0;
    if (step.tooltipSide === 'below') {
      tT = hlT + hlH + GAP;
      tL = hlL + hlW / 2 - TIP_W / 2;
    } else if (step.tooltipSide === 'above') {
      tT = hlT - TIP_H - GAP;
      tL = hlL + hlW / 2 - TIP_W / 2;
    } else if (step.tooltipSide === 'right') {
      tL = hlL + hlW + GAP;
      tT = hlT + hlH / 2 - TIP_H / 2;
    } else {
      // left
      tL = hlL - TIP_W - GAP;
      tT = hlT + hlH / 2 - TIP_H / 2;
    }
    tL = Math.max(8, Math.min(vw - TIP_W - 8, tL));
    tT = Math.max(8, Math.min(vh - TIP_H - 8, tT));
    tipStyle = `left:${tL}px;top:${tT}px`;
    ready = true;
  }

  function handleResize() {
    requestAnimationFrame(() => computePositions(stepIndex));
  }

  function goToStep(index: number) {
    stepIndex = index;
    console.log(`[SCENE] Tour step ${index + 1}/${steps.length} — ${steps[index].logLabel}`);
    requestAnimationFrame(() => computePositions(index));
  }

  onMount(() => {
    console.log('[SCENE] Tour started — fight 1, first run');
    window.addEventListener('resize', handleResize);
    goToStep(0);
    return () => window.removeEventListener('resize', handleResize);
  });

  function next() {
    if (stepIndex < steps.length - 1) {
      goToStep(stepIndex + 1);
    } else {
      showCompletion = true;
    }
  }

  function skip() {
    _skippedAt = stepIndex + 1;
    showCompletion = true;
  }

  function finish() {
    localStorage.setItem('tourComplete', 'true');
    localStorage.setItem('fight1HintsComplete', 'true');
    if (_skippedAt !== null) {
      console.log(`[SCENE] Tour skipped at step ${_skippedAt}/${steps.length} — tourComplete and fight1HintsComplete flags set`);
    } else {
      console.log('[SCENE] Tour completed — tourComplete and fight1HintsComplete flags set');
    }
    oncomplete();
  }

  let currentStep = $derived(steps[stepIndex]);
</script>

{#if showCompletion}
  <!-- Completion screen -->
  <div class="completion-overlay">
    <div class="completion-panel">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚔️</div>
      <h2 class="completion-heading">You're ready to fight!</h2>
      <p class="completion-body">
        Pick a card from your hand, answer the multiplication problem, and press End Turn &amp; Attack when you're done.
      </p>
      <!-- svelte-ignore a11y_autofocus -->
      <button class="lets-go-btn" onclick={finish} autofocus>Let's go!</button>
    </div>
  </div>
{:else}
  <!-- Pointer blocker (prevents interaction with game elements) -->
  <div class="tour-blocker"></div>

  <!-- Highlight cutout -->
  <div
    class="tour-highlight"
    class:tour-highlight--ready={ready}
    style={hlStyle}
  ></div>

  <!-- Tooltip -->
  <div class="tour-tooltip" style={tipStyle}>
    <!-- Directional arrow -->
    <div class="tour-arrow tour-arrow--{currentStep.arrowSide}"></div>

    <!-- Title -->
    <div class="tour-title">{currentStep.title}</div>

    <!-- Body -->
    <p class="tour-body">{currentStep.body}</p>

    <!-- Navigation row -->
    <div class="tour-nav">
      <button class="skip-btn" onclick={skip}>Skip tour</button>

      <!-- Step dots -->
      <div class="tour-dots">
        {#each steps as _, i}
          <div class="tour-dot" class:tour-dot--active={i === stepIndex}></div>
        {/each}
      </div>

      <button class="next-btn" onclick={next}>
        {stepIndex === steps.length - 1 ? 'Done ✓' : 'Next →'}
      </button>
    </div>
  </div>
{/if}

<style>
  .tour-blocker {
    position: fixed;
    inset: 0;
    z-index: 998;
    pointer-events: all;
  }

  .tour-highlight {
    position: fixed;
    border-radius: 8px;
    border: 3px solid #4A90D9;
    box-shadow: 0 0 0 9999px rgba(10, 14, 30, 0.78);
    pointer-events: none;
    z-index: 1000;
  }

  /* Transition only after initial position is set (prevents animating from off-screen) */
  .tour-highlight--ready {
    transition: left 350ms ease-in-out, top 350ms ease-in-out,
                width 350ms ease-in-out, height 350ms ease-in-out;
  }

  .tour-tooltip {
    position: fixed;
    z-index: 1001;
    background: #1A2340;
    border: 1.5px solid #4A90D9;
    border-radius: 10px;
    width: 210px;
    padding: 12px 14px;
    transition: left 350ms ease-in-out, top 350ms ease-in-out;
  }

  /* Arrow: rotated square with two sides of the tooltip border */
  .tour-arrow {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #1A2340;
  }

  .tour-arrow--top {
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-left: 1.5px solid #4A90D9;
    border-top: 1.5px solid #4A90D9;
  }

  .tour-arrow--bottom {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-right: 1.5px solid #4A90D9;
    border-bottom: 1.5px solid #4A90D9;
  }

  .tour-arrow--left {
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-left: 1.5px solid #4A90D9;
    border-bottom: 1.5px solid #4A90D9;
  }

  .tour-arrow--right {
    right: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-right: 1.5px solid #4A90D9;
    border-top: 1.5px solid #4A90D9;
  }

  .tour-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #4A90D9;
    margin-bottom: 0.35rem;
  }

  .tour-body {
    font-size: 0.73rem;
    color: #C8D0E0;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .tour-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tour-dots {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .tour-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3A4560;
  }

  .tour-dot--active {
    background: #4A90D9;
  }

  .skip-btn {
    font-size: 0.68rem;
    color: #6B82A8;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    line-height: 1;
  }

  .skip-btn:hover {
    color: #8A9BB5;
  }

  .next-btn {
    font-size: 0.73rem;
    font-weight: 600;
    color: #E8EAF0;
    background: #4A90D9;
    border: none;
    border-radius: 6px;
    padding: 5px 10px;
    cursor: pointer;
  }

  .next-btn:hover {
    background: #5BA3E8;
  }

  /* Completion screen */
  .completion-overlay {
    position: fixed;
    inset: 0;
    z-index: 1002;
    background: rgba(10, 14, 30, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .completion-panel {
    background: #1A2340;
    border: 1.5px solid #4A90D9;
    border-radius: 14px;
    padding: 2rem 1.5rem;
    max-width: 280px;
    width: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .completion-heading {
    font-size: 1.2rem;
    font-weight: 700;
    color: #E8EAF0;
    margin-bottom: 0.75rem;
  }

  .completion-body {
    font-size: 0.8rem;
    color: #8A9BB5;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .lets-go-btn {
    background: #4A90D9;
    color: #E8EAF0;
    border: none;
    border-radius: 8px;
    padding: 10px 28px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }

  .lets-go-btn:hover {
    background: #5BA3E8;
  }
</style>
