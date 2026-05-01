<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    value: string;
    onChange: (next: string) => void;
    ariaLabel?: string;
  }

  let { options, value, onChange, ariaLabel }: Props = $props();
</script>

<div
  class="seg"
  role="group"
  aria-label={ariaLabel}
  style:grid-template-columns="repeat({options.length}, 1fr)"
>
  {#each options as opt (opt.value)}
    {@const active = opt.value === value}
    <button
      type="button"
      class:active
      aria-pressed={active}
      onclick={() => onChange(opt.value)}
    >{opt.label}</button>
  {/each}
</div>

<style>
  .seg {
    display: grid;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: var(--space-1);
    gap: var(--space-1);
  }
  button {
    min-height: 40px;
    border-radius: var(--radius-pill);
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1px;
    transition: background 200ms ease-out, color 200ms ease-out;
  }
  button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
</style>
