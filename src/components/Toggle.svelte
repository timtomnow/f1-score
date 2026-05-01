<script lang="ts">
  interface Props {
    checked: boolean;
    onChange: (next: boolean) => void;
    label?: string;
    ariaLabel?: string;
    disabled?: boolean;
  }

  let { checked, onChange, label, ariaLabel, disabled = false }: Props = $props();

  function toggle(): void {
    if (disabled) return;
    onChange(!checked);
  }
</script>

<button
  type="button"
  class="toggle"
  role="switch"
  aria-checked={checked}
  aria-label={ariaLabel ?? label}
  {disabled}
  onclick={toggle}
>
  <span class="track" class:on={checked} aria-hidden="true">
    <span class="thumb"></span>
  </span>
  {#if label}<span class="label">{label}</span>{/if}
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 40px;
  }
  .toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .track {
    position: relative;
    width: 40px;
    height: 24px;
    border-radius: var(--radius-pill);
    background: var(--surface-2);
    border: 1px solid var(--border);
    transition: background 200ms ease-out, border-color 200ms ease-out;
    flex-shrink: 0;
  }
  .track.on {
    background: var(--accent);
    border-color: var(--accent);
  }
  .thumb {
    position: absolute;
    top: 50%;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text);
    transform: translateY(-50%);
    transition: left 200ms ease-out, background 200ms ease-out;
  }
  .track.on .thumb {
    left: 18px;
    background: var(--accent-fg);
  }
  .label {
    font-size: 14px;
    color: var(--text);
  }
  @media (prefers-reduced-motion: reduce) {
    .track, .thumb {
      transition: none;
    }
  }
</style>
