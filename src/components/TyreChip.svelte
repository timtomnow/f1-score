<script lang="ts">
  import type { TyreCompound } from '../lib/openf1';

  interface Props {
    compound: TyreCompound | null;
    age?: number | null;
  }

  const { compound, age = null }: Props = $props();

  const label = $derived((): string => {
    if (!compound) return '?';
    switch (compound.toUpperCase()) {
      case 'SOFT': return 'S';
      case 'MEDIUM': return 'M';
      case 'HARD': return 'H';
      case 'INTERMEDIATE': return 'I';
      case 'WET': return 'W';
      default: return compound.slice(0, 1).toUpperCase();
    }
  });

  const colorVar = $derived((): string => {
    if (!compound) return 'var(--tyre-unknown)';
    switch (compound.toUpperCase()) {
      case 'SOFT': return 'var(--tyre-soft)';
      case 'MEDIUM': return 'var(--tyre-medium)';
      case 'HARD': return 'var(--tyre-hard)';
      case 'INTERMEDIATE': return 'var(--tyre-intermediate)';
      case 'WET': return 'var(--tyre-wet)';
      default: return 'var(--tyre-unknown)';
    }
  });

  const fgVar = $derived((): string => {
    if (!compound) return 'var(--tyre-unknown-fg)';
    switch (compound.toUpperCase()) {
      case 'SOFT': return 'var(--tyre-soft-fg)';
      case 'MEDIUM': return 'var(--tyre-medium-fg)';
      case 'HARD': return 'var(--tyre-hard-fg)';
      case 'INTERMEDIATE': return 'var(--tyre-intermediate-fg)';
      case 'WET': return 'var(--tyre-wet-fg)';
      default: return 'var(--tyre-unknown-fg)';
    }
  });

  const ariaLabel = $derived((): string => {
    const name = compound ?? 'Unknown';
    return age !== null ? `${name} tyre, ${age} laps old` : `${name} tyre`;
  });
</script>

<span
  class="chip"
  style="background: {colorVar()}; color: {fgVar()};"
  aria-label={ariaLabel()}
  title={ariaLabel()}
>
  {label()}
  {#if age !== null}
    <span class="age">{age}</span>
  {/if}
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 11px;
    line-height: 1;
    padding: 2px var(--space-2);
    min-width: 22px;
    justify-content: center;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }
  .age {
    font-weight: 400;
    font-size: 10px;
    opacity: 0.8;
  }
</style>
