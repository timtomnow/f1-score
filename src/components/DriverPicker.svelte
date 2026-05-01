<script lang="ts">
  import { tick } from 'svelte';
  import type { Driver } from '../lib/openf1';
  import { driverDisplayName } from '../lib/theme.svelte';
  import { teamColor, teamColorFromHex } from '../lib/teams';

  interface Props {
    open: boolean;
    title: string;
    drivers: Driver[];
    mode: 'single' | 'multi';
    selected: string[];
    allowClear?: boolean;
    onClose: () => void;
    onSelect: (driverId: string) => void;
    onClear?: () => void;
  }

  let {
    open,
    title,
    drivers,
    mode,
    selected,
    allowClear = true,
    onClose,
    onSelect,
    onClear
  }: Props = $props();

  let query = $state('');
  let searchEl = $state<HTMLInputElement | null>(null);
  let listEl = $state<HTMLUListElement | null>(null);
  let activeIndex = $state(0);

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => {
      const name = driverDisplayName(d).toLowerCase();
      const team = (d.team_name ?? '').toLowerCase();
      const acronym = (d.name_acronym ?? '').toLowerCase();
      const num = String(d.driver_number);
      return name.includes(q) || team.includes(q) || acronym.includes(q) || num.includes(q);
    });
  });

  $effect(() => {
    if (open) {
      query = '';
      activeIndex = 0;
      void tick().then(() => searchEl?.focus());
    }
  });

  $effect(() => {
    if (activeIndex >= filtered.length) activeIndex = Math.max(0, filtered.length - 1);
  });

  function pickColor(d: Driver): { accent: string; fg: string } {
    const named = d.team_name ? teamColor(d.team_name) : null;
    if (named && named.accent !== '#6c6c75') return named;
    return teamColorFromHex(d.team_colour) ?? named ?? { accent: '#6c6c75', fg: '#ffffff' };
  }

  function isSelected(d: Driver): boolean {
    return selected.includes(String(d.driver_number));
  }

  function commit(d: Driver): void {
    onSelect(String(d.driver_number));
    if (mode === 'single') onClose();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % filtered.length;
      scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
      scrollActiveIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const d = filtered[activeIndex];
      if (d) commit(d);
    }
  }

  function scrollActiveIntoView(): void {
    void tick().then(() => {
      const el = listEl?.querySelector<HTMLElement>(`li[data-idx="${activeIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  function onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) onClose();
  }
</script>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={onBackdrop}
    onkeydown={onKeydown}
  >
    <div
      class="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div class="grabber" aria-hidden="true"></div>
      <header class="head">
        <h2>{title}</h2>
        <button type="button" class="close" aria-label="Close" onclick={onClose}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>

      <div class="search">
        <input
          bind:this={searchEl}
          type="search"
          placeholder="Search driver, team, or number"
          bind:value={query}
          aria-label="Search drivers"
        />
      </div>

      {#if mode === 'single' && allowClear && onClear}
        <button
          type="button"
          class="clear"
          onclick={() => { onClear?.(); onClose(); }}
        >
          Clear selection
        </button>
      {/if}

      {#if filtered.length === 0}
        <div class="empty">No drivers match "{query}".</div>
      {:else}
        <ul class="list" bind:this={listEl} role="listbox" aria-multiselectable={mode === 'multi'}>
          {#each filtered as d, i (d.driver_number)}
            {@const c = pickColor(d)}
            {@const sel = isSelected(d)}
            {@const active = i === activeIndex}
            <li data-idx={i}>
              <button
                type="button"
                class="row"
                class:active
                class:selected={sel}
                role="option"
                aria-selected={sel}
                onclick={() => { activeIndex = i; commit(d); }}
                onmouseenter={() => { activeIndex = i; }}
              >
                <span class="bar" style:background={c.accent}></span>
                <span class="num" style:color={c.accent}>
                  {String(d.driver_number).padStart(2, '0')}
                </span>
                <span class="name">
                  <span class="full">{driverDisplayName(d)}</span>
                  <span class="team">{d.team_name ?? ''}</span>
                </span>
                <span class="acr">{d.name_acronym ?? ''}</span>
                {#if mode === 'multi'}
                  <span class="check" class:on={sel} aria-hidden="true">
                    {#if sel}
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                    {/if}
                  </span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fade-in 200ms ease-out;
  }
  .sheet {
    width: 100%;
    max-width: var(--max-w);
    max-height: 85dvh;
    background: var(--surface);
    border-top-left-radius: var(--radius-card);
    border-top-right-radius: var(--radius-card);
    border-top: 1px solid var(--border);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
    animation: slide-up 260ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .grabber {
    width: 36px;
    height: 4px;
    background: var(--border);
    border-radius: var(--radius-pill);
    margin: var(--space-2) auto var(--space-1);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4) var(--space-3);
    gap: var(--space-3);
  }
  .head h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }
  .close {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    border-radius: var(--radius-pill);
  }
  .close:hover { color: var(--text); }

  .search {
    padding: 0 var(--space-4) var(--space-3);
  }
  .search input {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    color: var(--text);
    font: inherit;
    font-size: 14px;
    padding: 10px var(--space-4);
    min-height: 40px;
  }
  .search input::placeholder { color: var(--text-faint); }
  .search input:focus { outline-color: var(--accent); }

  .clear {
    margin: 0 var(--space-4) var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--surface-2);
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 600;
    align-self: flex-start;
    min-height: 36px;
  }
  .clear:hover { color: var(--text); }

  .list {
    list-style: none;
    margin: 0;
    padding: 0 var(--space-2) var(--space-3);
    overflow-y: auto;
    flex: 1;
  }
  .row {
    display: grid;
    grid-template-columns: 4px 36px 1fr auto auto;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-2);
    border-radius: var(--radius-md);
    text-align: left;
    min-height: 48px;
    color: var(--text);
  }
  .row.active { background: var(--surface-2); }
  .row.selected { background: var(--accent-bg); }
  .bar {
    width: 4px;
    height: 28px;
    border-radius: var(--radius-pill);
  }
  .num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 16px;
    text-align: right;
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .full {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .team {
    font-size: 11px;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .acr {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint);
    letter-spacing: 1px;
  }
  .check {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: transparent;
    background: var(--surface-2);
  }
  .check.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }

  .empty {
    padding: var(--space-5) var(--space-4);
    color: var(--text-faint);
    font-size: 14px;
    text-align: center;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .backdrop, .sheet { animation: none; }
  }
</style>
