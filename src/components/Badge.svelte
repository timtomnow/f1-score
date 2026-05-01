<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'live' | 'upcoming' | 'finished' | 'sprint' | 'cancelled';

  interface Props {
    variant: Variant;
    children: Snippet;
  }

  let { variant, children }: Props = $props();
</script>

<span class="badge {variant}">
  {#if variant === 'live'}<span class="dot" aria-hidden="true"></span>{/if}
  {@render children()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    line-height: 1.6;
    white-space: nowrap;
  }
  .badge.live {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .badge.upcoming {
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .badge.finished {
    background: var(--surface-2);
    color: var(--text-faint);
  }
  .badge.sprint {
    background: var(--warning);
    color: #1a1300;
  }
  .badge.cancelled {
    background: var(--surface-2);
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-fg);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot { animation: none; }
  }
</style>
