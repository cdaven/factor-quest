<script lang="ts">
  import { AREA_COLORS, AREA_NAMES, areaForFight } from '../lib/ui.js';

  let { fightNumber }: { fightNumber: number } = $props();

  const areas: { key: string; fights: number[] }[] = [
    { key: 'forest',   fights: [1, 2, 3] },
    { key: 'caves',    fights: [4, 5, 6] },
    { key: 'fortress', fights: [7, 8, 9] },
  ];

  function dotState(fight: number): 'completed' | 'current' | 'upcoming' {
    if (fight < fightNumber)  return 'completed';
    if (fight === fightNumber) return 'current';
    return 'upcoming';
  }
</script>

<div class="flex items-center justify-center gap-3 px-4 py-2 text-xs select-none">
  {#each areas as area, aIdx}
    <!-- Area group -->
    <div class="flex flex-col items-center gap-1">
      <span class="font-semibold tracking-wide uppercase text-[10px]"
            style="color: {AREA_COLORS[area.key]}">
        {AREA_NAMES[area.key]}
      </span>
      <div class="flex gap-2">
        {#each area.fights as fight}
          {@const state = dotState(fight)}
          <div class="flex flex-col items-center gap-0.5">
            <div
              class="rounded-full flex items-center justify-center font-bold transition-all duration-200"
              style="
                width: {state === 'current' ? '20px' : '16px'};
                height: {state === 'current' ? '20px' : '16px'};
                background: {state === 'upcoming'
                  ? 'transparent'
                  : state === 'current'
                    ? AREA_COLORS[area.key]
                    : AREA_COLORS[area.key] + '60'};
                border: 2px solid {state === 'upcoming' ? '#3A4560' : AREA_COLORS[area.key]};
                box-shadow: {state === 'current' ? `0 0 6px ${AREA_COLORS[area.key]}` : 'none'};
                font-size: 8px;
                color: {state === 'completed' ? '#fff' : '#aaa'};
              "
            >
              {#if state === 'completed'}✓{/if}
            </div>
            <span style="color: #8A9BB5; font-size: 9px;">{fight}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Separator between groups -->
    {#if aIdx < 2}
      <div class="w-px h-8 bg-[#3A4560] self-center"></div>
    {/if}
  {/each}
</div>
