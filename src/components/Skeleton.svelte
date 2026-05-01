<script lang="ts">
  interface Props {
    lines?: number;
    height?: string;
  }

  let { lines = 3, height }: Props = $props();
</script>

<div class="skel" aria-hidden="true">
  {#each Array.from({ length: lines }, (_, i) => i) as i (i)}
    <div class="skel-line" style:height={height}></div>
  {/each}
</div>

<style>
  .skel {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
