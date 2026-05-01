<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getDriverStandings,
    getConstructorStandings,
    type DriverStanding,
    type ConstructorStanding
  } from '../lib/jolpica';
  import { teamColor } from '../lib/teams';
  import { formatPoints } from '../lib/format';
  import Card from '../components/Card.svelte';

  type Tab = 'drivers' | 'constructors';

  interface Cache<T> {
    data: T[];
    fetchedAt: number;
  }

  const FRESH_MS = 60_000;
  const cache: { drivers: Cache<DriverStanding> | null; constructors: Cache<ConstructorStanding> | null } = {
    drivers: null,
    constructors: null
  };

  let tab = $state<Tab>('drivers');
  let drivers = $state<DriverStanding[]>(cache.drivers?.data ?? []);
  let constructors = $state<ConstructorStanding[]>(cache.constructors?.data ?? []);
  let driversLoaded = $state(!!cache.drivers);
  let constructorsLoaded = $state(!!cache.constructors);
  let driversError = $state<string | null>(null);
  let constructorsError = $state<string | null>(null);

  async function loadDrivers(force = false): Promise<void> {
    if (!force && cache.drivers && Date.now() - cache.drivers.fetchedAt < FRESH_MS) {
      drivers = cache.drivers.data;
      driversLoaded = true;
      return;
    }
    try {
      const res = await getDriverStandings('current', { limit: 100 });
      const list = res.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
      cache.drivers = { data: list, fetchedAt: Date.now() };
      drivers = list;
      driversError = null;
      driversLoaded = true;
    } catch (e) {
      driversError = (e as Error).message ?? String(e);
      driversLoaded = true;
    }
  }

  async function loadConstructors(force = false): Promise<void> {
    if (!force && cache.constructors && Date.now() - cache.constructors.fetchedAt < FRESH_MS) {
      constructors = cache.constructors.data;
      constructorsLoaded = true;
      return;
    }
    try {
      const res = await getConstructorStandings('current', { limit: 100 });
      const list = res.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
      cache.constructors = { data: list, fetchedAt: Date.now() };
      constructors = list;
      constructorsError = null;
      constructorsLoaded = true;
    } catch (e) {
      constructorsError = (e as Error).message ?? String(e);
      constructorsLoaded = true;
    }
  }

  function selectTab(next: Tab): void {
    tab = next;
    if (next === 'drivers') void loadDrivers();
    else void loadConstructors();
  }

  onMount(() => {
    void loadDrivers();
  });
</script>

<header class="vh">
  <h1>Standings</h1>
</header>

<div class="seg" role="tablist" aria-label="Standings type">
  <button
    role="tab"
    aria-selected={tab === 'drivers'}
    class:active={tab === 'drivers'}
    onclick={() => selectTab('drivers')}
  >Drivers</button>
  <button
    role="tab"
    aria-selected={tab === 'constructors'}
    class:active={tab === 'constructors'}
    onclick={() => selectTab('constructors')}
  >Constructors</button>
</div>

{#if tab === 'drivers'}
  <Card>
    {#if driversError}
      <div class="err">{driversError}</div>
    {:else if !driversLoaded}
      <div class="skel">
        {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
          <div class="skel-line"></div>
        {/each}
      </div>
    {:else if drivers.length === 0}
      <div class="empty">No standings available.</div>
    {:else}
      <ol class="rows">
        {#each drivers as s (s.Driver.driverId)}
          {@const color = teamColor(s.Constructors[0]?.constructorId ?? '')}
          <li class="row driver">
            <span class="pos">{s.position}</span>
            <span class="dot" style:background={color.accent} aria-hidden="true"></span>
            <span class="code">{s.Driver.code ?? s.Driver.familyName.slice(0, 3).toUpperCase()}</span>
            <span class="name">
              <span class="full">{s.Driver.givenName} {s.Driver.familyName}</span>
              <span class="team">{s.Constructors[0]?.name ?? ''}</span>
            </span>
            <span class="wins">{s.wins}W</span>
            <span class="pts">{formatPoints(s.points)}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </Card>
{:else}
  <Card>
    {#if constructorsError}
      <div class="err">{constructorsError}</div>
    {:else if !constructorsLoaded}
      <div class="skel">
        {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
          <div class="skel-line"></div>
        {/each}
      </div>
    {:else if constructors.length === 0}
      <div class="empty">No standings available.</div>
    {:else}
      <ol class="rows">
        {#each constructors as c (c.Constructor.constructorId)}
          {@const color = teamColor(c.Constructor.constructorId)}
          <li class="row team">
            <span class="pos">{c.position}</span>
            <span class="dot" style:background={color.accent} aria-hidden="true"></span>
            <span class="name">
              <span class="full">{c.Constructor.name}</span>
            </span>
            <span class="wins">{c.wins}W</span>
            <span class="pts">{formatPoints(c.points)}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </Card>
{/if}

<style>
  .vh { margin-bottom: var(--space-3); }
  .vh h1 { font-size: 22px; font-weight: 700; margin: 0; }

  .seg {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: var(--space-1);
    margin-bottom: var(--space-4);
    gap: var(--space-1);
  }
  .seg button {
    min-height: 40px;
    border-radius: var(--radius-pill);
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: background 200ms ease-out, color 200ms ease-out;
  }
  .seg button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .row {
    display: grid;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-1);
    font-size: 14px;
    border-bottom: 1px solid var(--border);
  }
  .row.driver { grid-template-columns: 24px 8px 44px 1fr auto auto; }
  .row.team { grid-template-columns: 24px 8px 1fr auto auto; }
  .row:last-child { border-bottom: none; }

  .pos {
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--text-faint);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .code {
    font-family: var(--font-mono);
    font-weight: 700;
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .full {
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
  .wins {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--text-faint);
  }
  .pts {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    min-width: 38px;
    text-align: right;
  }

  .empty { color: var(--text-faint); font-size: 14px; }
  .err { color: var(--error); font-size: 13px; font-family: var(--font-mono); }

  .skel { display: flex; flex-direction: column; gap: var(--space-2); }
  .skel-line {
    height: 28px;
    background: var(--surface-2);
    border-radius: 6px;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .skel-line { animation: none; }
  }
</style>
