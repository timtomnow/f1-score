<script lang="ts">
  import { router, navigate, type RouteName } from '../lib/router.svelte';

  interface Tab {
    name: RouteName;
    path: string;
    label: string;
  }

  const TABS: Tab[] = [
    { name: 'home', path: '#/', label: 'Home' },
    { name: 'live', path: '#/live', label: 'Live' },
    { name: 'schedule', path: '#/schedule', label: 'Schedule' },
    { name: 'standings', path: '#/standings', label: 'Standings' },
    { name: 'settings', path: '#/settings', label: 'Settings' }
  ];

  function handleClick(path: string, event: MouseEvent): void {
    event.preventDefault();
    navigate(path);
  }
</script>

<nav class="bnav" aria-label="Primary">
  <ul>
    {#each TABS as tab (tab.name)}
      {@const active = router.current.name === tab.name}
      <li>
        <a
          href={tab.path}
          class:active
          aria-current={active ? 'page' : undefined}
          onclick={(e) => handleClick(tab.path, e)}
        >
          <span class="icon" aria-hidden="true">
            {#if tab.name === 'home'}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>
            {:else if tab.name === 'live'}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4"/><path d="M17.7 6.3a8 8 0 0 1 0 11.4"/><path d="M3.5 3.5a14 14 0 0 0 0 17"/><path d="M20.5 3.5a14 14 0 0 1 0 17"/></svg>
            {:else if tab.name === 'schedule'}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
            {:else if tab.name === 'standings'}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V10M12 21V4M19 21v-7"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {/if}
          </span>
          <span class="lbl">{tab.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .bnav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 10;
  }
  ul {
    list-style: none;
    margin: 0 auto;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    max-width: var(--max-w);
    height: var(--bottom-nav-h);
  }
  li { display: flex; }
  a {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    color: var(--text-faint);
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    min-height: 40px;
    transition: color 200ms ease-out;
  }
  a.active {
    color: var(--accent);
    font-weight: 700;
  }
  a.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 2px;
    background: var(--accent);
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }
  a:hover { color: var(--text); }
  a.active:hover { color: var(--accent); }
  .icon { display: flex; }
  .lbl { line-height: 1; }
</style>
