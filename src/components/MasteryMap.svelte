<script lang="ts">
  import { masteryStore } from '../stores/masteryStore.js';
  import { masteryColor, cellTier, canonicalKey, TIER_COLORS, type CellTier } from '../lib/ui.js';

  let { onclose }: { onclose: () => void } = $props();

  let scores = $derived($masteryStore);

  // Count mastered problems (score >= 3)
  let masteredCount = $derived(
    Object.entries(scores).filter(([, v]) => v >= 3).length
  );

  // Hover state
  let hoveredCell = $state<{ a: number; b: number } | null>(null);

  const rows = [1,2,3,4,5,6,7,8,9,10];
  const cols = [1,2,3,4,5,6,7,8,9,10];

  const TIER_BORDER: Record<CellTier, string> = {
    gold:   '#D4A017',
    silver: '#A8B4C0',
    bronze: '#A0522D',
  };
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-[#1A2340] overflow-auto">
  <!-- Header -->
  <div class="flex items-center justify-between px-6 pt-6 pb-2">
    <button
      class="text-[#8A9BB5] hover:text-[#E8EAF0] text-sm transition-colors"
      onclick={onclose}
    >← Back</button>
    <h1 class="text-xl font-bold text-[#E8EAF0]">📊 Mastery Map</h1>
    <div class="w-12"></div>
  </div>

  <!-- Explanatory text -->
  <p class="text-center text-[#8A9BB5] text-sm px-4 pb-4">
    These are all your multiplication problems.
    <span style="color: #4CAF50">Green</span> means you know it well.
    <span style="color: #F4C542">Yellow</span> means you're still learning.
    <span style="color: #E57373">Red</span> means it needs more practice.
  </p>

  <!-- Grid -->
  <div class="flex justify-center px-4 pb-4 overflow-auto">
    <div>
      <!-- Column headers -->
      <div class="flex mb-1">
        <div class="w-6"></div> <!-- row header spacer -->
        {#each cols as c}
          <div class="w-9 text-center text-[10px] text-[#8A9BB5] font-semibold">{c}</div>
        {/each}
      </div>

      {#each rows as r}
        <div class="flex mb-1 items-center">
          <!-- Row header -->
          <div class="w-6 text-[10px] text-[#8A9BB5] font-semibold text-right pr-1 shrink-0">{r}</div>

          {#each cols as c}
            {@const key = canonicalKey(r, c)}
            {@const answer = r * c}
            {@const bgColor = masteryColor(key, scores)}
            {@const tier = cellTier(r, c)}
            {@const borderColor = tier ? TIER_BORDER[tier] : '#3A4560'}
            {@const isHovered = hoveredCell?.a === r && hoveredCell?.b === c}

            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="w-9 h-9 rounded flex items-center justify-center cursor-default relative transition-transform duration-100"
              style="
                background: {bgColor};
                border: 1px solid {borderColor};
                opacity: {tier ? 1 : 0.5};
                transform: {isHovered ? 'scale(1.4)' : 'scale(1)'};
                z-index: {isHovered ? 10 : 1};
              "
              onmouseenter={() => hoveredCell = { a: r, b: c }}
              onmouseleave={() => hoveredCell = null}
            >
              {#if isHovered}
                <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#232E4A] border border-[#3A4560] rounded px-2 py-1 text-[10px] whitespace-nowrap text-[#E8EAF0] z-20 pointer-events-none">
                  {r} × {c} = {answer}
                </div>
              {/if}
              <span class="text-[10px] font-bold" style="color: {bgColor === '#3A4560' ? '#8A9BB5' : '#1A2340'}">
                {answer}
              </span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend -->
  <div class="flex justify-center gap-4 text-xs text-[#8A9BB5] pb-2">
    <span><span style="color: {TIER_COLORS.bronze}">▪</span> 🥉 Bronze</span>
    <span><span style="color: {TIER_COLORS.silver}">▪</span> 🥈 Silver</span>
    <span><span style="color: {TIER_COLORS.gold}">▪</span> 🥇 Gold</span>
  </div>

  <!-- Progress summary -->
  <p class="text-center text-[#8A9BB5] text-sm pb-6">
    You've mastered
    <span class="font-bold text-[#4CAF50]">{masteredCount}</span>
    out of <span class="font-bold text-[#E8EAF0]">55</span> problems!
  </p>
</div>
