<script lang="ts">
  import { teamColor } from '../lib/teams';

  interface Props {
    constructorId: string | null | undefined;
    size?: number;
  }

  let { constructorId, size = 8 }: Props = $props();
  let color = $derived(teamColor(constructorId));
</script>

<span
  class="dot"
  style:background={color.accent}
  style:width="{size}px"
  style:height="{size}px"
  aria-hidden="true"
></span>

<style>
  .dot {
    display: inline-block;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
