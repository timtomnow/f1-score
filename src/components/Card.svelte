<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label?: string;
    inset?: boolean;
    children: Snippet;
    action?: Snippet;
  }

  let { label, inset = false, children, action }: Props = $props();
</script>

<section class="card" class:inset>
  {#if label || action}
    <header class="card-head">
      {#if label}<div class="card-label">{label}</div>{/if}
      {#if action}<div class="card-action">{@render action()}</div>{/if}
    </header>
  {/if}
  {@render children()}
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }
  .card.inset {
    background: var(--surface-2);
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .card-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-faint);
  }
  .card-action {
    display: flex;
    align-items: center;
  }
</style>
