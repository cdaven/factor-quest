<script lang="ts">
  import { trophyStore } from '../stores/trophyStore.js';

  let streak      = $derived($trophyStore.streak);
  let showBroken  = $derived($trophyStore.showBrokenStreakMessage);
</script>

{#if showBroken}
  <p class="text-sm text-center" style="color: #8A9BB5;">
    Your streak ended. Start a new one today!
  </p>
{:else if streak.current >= 1}
  <p class="text-sm text-center select-none">
    <span style="color: #C4922A;">🔥 {streak.current}-day streak!</span>
    <span style="color: #8A9BB5;"> Keep it up!</span>
  </p>
{/if}
