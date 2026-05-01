<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getDriverStandings,
    getConstructorStandings,
    type DriverStanding,
    type ConstructorStanding
  } from '../lib/jolpica';
  import { formatPoints } from '../lib/format';
  import Card from '../components/Card.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import TeamDot from '../components/TeamDot.svelte';

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

  const TAB_OPTIONS = [
    { value: 'drivers', label: 'Drivers' },
    { value: 'constructors', label: 'Constructors' }
  ];

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

  function selectTab(next: string): void {
    tab = next as Tab;
    if (tab === 'drivers') void loadDrivers();
    else void loadConstructors();
  }

  onMount(() => {
    void loadDrivers();
  });
</script>

<header class="view-header">
  <h1>Standings</h1>
</header>

<div class="seg-wrap">
  <Segmented
    options={TAB_OPTIONS}
    value={tab}
    onChange={selectTab}
    ariaLabel="Standings type"
  />
</div>

{#if tab === 'drivers'}
  <Card>
    {#if driversError}
      <div class="text-err">{driversError}</div>
    {:else if !driversLoaded}
      <Skeleton lines={8} height="28px" />
    {:else if drivers.length === 0}
      <div class="text-empty">No standings available.</div>
    {:else}
      <ol class="rows">
        {#each drivers as s (s.Driver.driverId)}
          <li class="row driver">
            <span class="pos">{s.position}</span>
            <TeamDot constructorId={s.Constructors[0]?.constructorId ?? ''} />
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
      <div class="text-err">{constructorsError}</div>
    {:else if !constructorsLoaded}
      <Skeleton lines={8} height="28px" />
    {:else if constructors.length === 0}
      <div class="text-empty">No standings available.</div>
    {:else}
      <ol class="rows">
        {#each constructors as c (c.Constructor.constructorId)}
          <li class="row team-row">
            <span class="pos">{c.position}</span>
            <TeamDot constructorId={c.Constructor.constructorId} />
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
  .seg-wrap {
    margin-bottom: var(--space-4);
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
  .row.team-row { grid-template-columns: 24px 8px 1fr auto auto; }
  .row:last-child { border-bottom: none; }

  .pos {
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--text-faint);
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
</style>
