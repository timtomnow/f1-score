<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import { liveState, startLive, stopLive, type DriverRow } from '../lib/live.svelte';
  import { prefs } from '../lib/prefs.svelte';
  import { countdownParts, formatCountdown, formatLapTime, formatGap } from '../lib/format';
  import TyreChip from '../components/TyreChip.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import Badge from '../components/Badge.svelte';

  let now = $state(Date.now());
  let tick: ReturnType<typeof setInterval> | undefined;

  const session = $derived(liveState.session);
  const isLive = $derived(liveState.isLive);
  const drivers = $derived(liveState.drivers);
  const currentLap = $derived(liveState.currentLap);
  const loaded = $derived(liveState.loaded);
  const error = $derived(liveState.error);

  const sessionLabel = $derived((): string => {
    if (!session) return 'Live Timing';
    const t = session.session_type?.toLowerCase() ?? '';
    if (t === 'race') return 'Race';
    if (t === 'qualifying') return 'Qualifying';
    if (t === 'practice') return session.session_name;
    return session.session_name;
  });

  const sessionTypeTag = $derived((): string => {
    if (!session) return '';
    const t = session.session_type?.toLowerCase() ?? '';
    if (t === 'race') return 'Race';
    if (t === 'qualifying') return 'Quali';
    if (t === 'practice') return 'Practice';
    return session.session_type ?? '';
  });

  const nextSessionCountdown = $derived((): ReturnType<typeof countdownParts> | null => {
    if (!session || isLive) return null;
    return countdownParts(new Date(session.date_start).getTime(), now);
  });

  const followedIds = $derived(new SvelteSet(prefs.value.followedDriverIds));
  const favoriteId = $derived(prefs.value.favoriteDriverId);

  let flashMap = new SvelteMap<number, 'improve' | 'worsen'>();
  const prevLapMap = new SvelteMap<number, number | null>();

  $effect(() => {
    const current = drivers;
    const toFlash: Array<[number, 'improve' | 'worsen']> = [];
    for (const d of current) {
      const prev = prevLapMap.get(d.driver_number);
      if (prev !== undefined && d.last_lap !== null && prev !== null) {
        if (d.last_lap < prev) toFlash.push([d.driver_number, 'improve']);
        else if (d.last_lap > prev) toFlash.push([d.driver_number, 'worsen']);
      }
      prevLapMap.set(d.driver_number, d.last_lap);
    }

    if (toFlash.length > 0) {
      flashMap.clear();
      for (const [num, kind] of toFlash) flashMap.set(num, kind);
      const t = setTimeout(() => { flashMap.clear(); }, 700);
      return () => clearTimeout(t);
    }
  });

  function positionFlash(d: DriverRow): string {
    const f = flashMap.get(d.driver_number);
    if (f === 'improve') return 'flash-improve';
    if (f === 'worsen') return 'flash-worsen';
    return '';
  }

  onMount(() => {
    startLive();
    tick = setInterval(() => { now = Date.now(); }, 1000);
  });

  onDestroy(() => {
    stopLive();
    if (tick) clearInterval(tick);
  });
</script>

<div class="live-view">
  <header class="live-hdr">
    <div class="live-hdr-left">
      <h1 class="live-title">{sessionLabel()}</h1>
      {#if session}
        <div class="live-circuit">
          <span class="session-tag">{sessionTypeTag()}</span>
          {session.circuit_short_name} · {session.country_name}
        </div>
      {/if}
    </div>
    <div class="live-hdr-right">
      {#if isLive}
        <Badge variant="live">Live</Badge>
      {:else if session}
        <Badge variant="upcoming">Upcoming</Badge>
      {/if}
      {#if currentLap !== null}
        <div class="lap-counter">
          <span class="lap-n">{currentLap}</span>
          <span class="lap-sep">/</span>
          <span class="lap-total">—</span>
        </div>
      {/if}
    </div>
  </header>

  {#if error}
    <div class="text-err">{error}</div>
  {:else if !loaded}
    <Skeleton lines={6} />
  {:else if !session}
    <div class="text-empty">No session data available.</div>
  {:else if !isLive}
    <section class="card no-session-card">
      <div class="card-label">Next session</div>
      <div class="card-body">
        <div class="no-session-name">{session.session_name}</div>
        <div class="no-session-circuit">{session.circuit_short_name} · {session.country_name}</div>
        {#if nextSessionCountdown() && !nextSessionCountdown()?.past}
          {@const parts = nextSessionCountdown()!}
          <div class="cd-cells" aria-live="polite">
            <div class="cell"><span class="num">{parts.days}</span><span class="lbl">d</span></div>
            <div class="cell"><span class="num">{String(parts.hours).padStart(2, '0')}</span><span class="lbl">h</span></div>
            <div class="cell"><span class="num">{String(parts.minutes).padStart(2, '0')}</span><span class="lbl">m</span></div>
            <div class="cell"><span class="num">{String(parts.seconds).padStart(2, '0')}</span><span class="lbl">s</span></div>
          </div>
          <span class="sr-only" aria-live="polite">
            {formatCountdown(parts)} until {session.session_name}
          </span>
        {:else}
          <div class="no-session-soon">Starting soon</div>
        {/if}
      </div>
    </section>
  {:else if drivers.length === 0}
    <Skeleton lines={6} />
  {:else}
    <section class="timing-table" aria-live="polite" aria-label="Live timing">
      <div class="table-head" aria-hidden="true">
        <span class="col-pos">P</span>
        <span class="col-driver">Driver</span>
        <span class="col-gap">Gap</span>
        <span class="col-int">Int</span>
        <span class="col-lap">Last lap</span>
        <span class="col-tyre">Tyre</span>
      </div>
      <ol class="driver-list">
        {#each drivers as d (d.driver_number)}
          {@const isFollowed = followedIds.has(String(d.driver_number))}
          {@const isFavorite = favoriteId === String(d.driver_number)}
          {@const flash = positionFlash(d)}
          <li
            class="driver-row"
            class:followed={isFollowed}
            class:favorite={isFavorite}
            class:flash-improve={flash === 'flash-improve'}
            class:flash-worsen={flash === 'flash-worsen'}
            style="--team-color: #{d.team_colour};"
          >
            <span class="col-pos pos-num">{d.position}</span>
            <span class="col-driver driver-info">
              <span class="team-bar" aria-hidden="true"></span>
              <span class="driver-code">{d.name_acronym}</span>
            </span>
            <span class="col-gap gap-val">{formatGap(d.gap_to_leader)}</span>
            <span class="col-int gap-val">{formatGap(d.interval)}</span>
            <span class="col-lap lap-val">{formatLapTime(d.last_lap)}</span>
            <span class="col-tyre">
              <TyreChip compound={d.compound} age={d.tyre_age} />
            </span>
          </li>
        {/each}
      </ol>
    </section>
  {/if}
</div>

<style>
  .live-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .live-hdr {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .live-hdr-left {
    min-width: 0;
  }
  .live-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    line-height: 1.15;
  }
  .live-circuit {
    font-size: 13px;
    color: var(--text-dim);
    margin-top: var(--space-1);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .session-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-faint);
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    padding: 2px var(--space-2);
    flex-shrink: 0;
  }
  .live-hdr-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .lap-counter {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .lap-n {
    color: var(--text);
    font-weight: 700;
  }
  .lap-sep {
    color: var(--text-faint);
  }
  .lap-total {
    color: var(--text-faint);
  }

  /* No-session card */
  .no-session-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: var(--space-5) var(--space-4);
  }
  .card-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-faint);
    margin-bottom: var(--space-2);
  }
  .no-session-name {
    font-size: 20px;
    font-weight: 700;
  }
  .no-session-circuit {
    font-size: 13px;
    color: var(--text-dim);
    margin-top: var(--space-1);
    margin-bottom: var(--space-4);
  }
  .no-session-soon {
    color: var(--accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 13px;
    margin-top: var(--space-3);
  }

  .cd-cells {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    margin-top: var(--space-3);
  }
  .cell {
    background: var(--surface-2);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }
  .num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
  }
  .lbl {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-faint);
  }

  /* Timing table */
  .timing-table {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    overflow: hidden;
  }

  .table-head {
    display: grid;
    grid-template-columns: var(--timing-cols);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-faint);
    font-family: var(--font-mono);
  }

  .driver-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .driver-row {
    display: grid;
    grid-template-columns: var(--timing-cols);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border);
    min-height: 44px;
    transition: background 0.6s ease-out;
  }
  .driver-row:last-child {
    border-bottom: none;
  }
  .driver-row.favorite {
    background: var(--accent-bg);
  }
  .driver-row.followed:not(.favorite) {
    background: color-mix(in srgb, var(--surface-2) 80%, var(--accent-bg) 20%);
  }

  .driver-row.flash-improve {
    background: color-mix(in srgb, var(--flash-improve-bg) 60%, transparent 40%);
    transition: background 0s;
  }
  .driver-row.flash-worsen {
    background: color-mix(in srgb, var(--flash-worsen-bg) 60%, transparent 40%);
    transition: background 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    .driver-row.flash-improve,
    .driver-row.flash-worsen {
      background: var(--surface);
    }
  }

  .col-pos {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 13px;
    color: var(--text-dim);
    text-align: right;
    padding-right: var(--space-2);
  }
  .pos-num {
    color: var(--text);
  }

  .col-driver {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .team-bar {
    width: 3px;
    height: 20px;
    border-radius: 2px;
    background: var(--team-color, var(--text-faint));
    flex-shrink: 0;
  }
  .driver-code {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .col-gap,
  .col-int,
  .col-lap {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--text-dim);
    text-align: right;
    padding-right: var(--space-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .gap-val {
    color: var(--text-dim);
  }
  .lap-val {
    color: var(--text);
  }

  .col-tyre {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* Column proportions: pos | driver | gap | interval | last lap | tyre */
  .timing-table,
  .table-head,
  .driver-row {
    --timing-cols: 28px 1fr 68px 68px 72px 44px;
  }
</style>
