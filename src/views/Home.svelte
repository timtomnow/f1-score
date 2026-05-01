<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createPoller, type Poller } from '../lib/poller';
  import { getSessions, type Session } from '../lib/openf1';
  import { getRaceResults, type RaceResult, type RaceWithResults } from '../lib/jolpica';
  import { countdownParts, formatCountdown, formatRaceDateTime, formatRaceDate } from '../lib/format';
  import Card from '../components/Card.svelte';
  import Badge from '../components/Badge.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import TeamDot from '../components/TeamDot.svelte';

  let nextSession = $state<Session | null>(null);
  let sessionLoaded = $state(false);
  let sessionError = $state<string | null>(null);

  let lastRace = $state<RaceWithResults | null>(null);
  let raceLoaded = $state(false);
  let raceError = $state<string | null>(null);

  let now = $state(Date.now());
  let srNow = $state(Date.now());
  let tick: ReturnType<typeof setInterval> | undefined;
  let srTick: ReturnType<typeof setInterval> | undefined;
  let sessionPoller: Poller | undefined;

  function findCurrentOrNext(sessions: Session[], at = Date.now()): Session | null {
    const live = [...sessions]
      .filter((s) => !s.is_cancelled)
      .sort((a, b) => a.date_start.localeCompare(b.date_start));
    const current = live.find((s) => {
      const start = new Date(s.date_start).getTime();
      const end = new Date(s.date_end).getTime();
      return start <= at && at <= end;
    });
    if (current) return current;
    return live.find((s) => new Date(s.date_start).getTime() > at) ?? null;
  }

  let parts = $derived(
    nextSession ? countdownParts(new Date(nextSession.date_start).getTime(), now) : null
  );
  let srParts = $derived(
    nextSession ? countdownParts(new Date(nextSession.date_start).getTime(), srNow) : null
  );
  let isLive = $derived(
    nextSession
      ? new Date(nextSession.date_start).getTime() <= now &&
        now <= new Date(nextSession.date_end).getTime()
      : false
  );

  let podium = $derived<RaceResult[]>(
    lastRace?.Results ? lastRace.Results.slice(0, 3) : []
  );

  onMount(() => {
    const year = new Date().getFullYear();
    sessionPoller = createPoller<Session | null>({
      intervalMs: 60_000,
      fetch: async (signal) => findCurrentOrNext(await getSessions({ year }, signal)),
      onUpdate: (s) => {
        nextSession = s;
        sessionError = null;
        sessionLoaded = true;
      },
      onError: (e) => {
        sessionError = (e as Error).message ?? String(e);
        sessionLoaded = true;
      }
    });
    sessionPoller.start();

    void getRaceResults('current', 'last')
      .then((res) => {
        lastRace = res.MRData.RaceTable.Races[0] ?? null;
        raceLoaded = true;
      })
      .catch((e: Error) => {
        raceError = e.message ?? String(e);
        raceLoaded = true;
      });

    tick = setInterval(() => { now = Date.now(); }, 1000);
    srTick = setInterval(() => { srNow = Date.now(); }, 60_000);
  });

  onDestroy(() => {
    sessionPoller?.stop();
    if (tick) clearInterval(tick);
    if (srTick) clearInterval(srTick);
  });
</script>

<Card label="Next session">
  {#if sessionError}
    <div class="text-err">{sessionError}</div>
  {:else if !sessionLoaded}
    <Skeleton lines={3} />
  {:else if !nextSession}
    <div class="text-empty">No upcoming session.</div>
  {:else}
    <div class="head">
      <div class="session-name">{nextSession.session_name}</div>
      {#if isLive}
        <Badge variant="live">Live</Badge>
      {:else}
        <Badge variant="upcoming">Upcoming</Badge>
      {/if}
    </div>
    <div class="circuit">
      {nextSession.circuit_short_name} · {nextSession.country_name}
    </div>

    {#if isLive}
      <div class="countdown live">In progress</div>
    {:else if parts && !parts.past}
      <div class="countdown">
        <div class="cd-cells">
          <div class="cell"><span class="num">{parts.days}</span><span class="lbl">d</span></div>
          <div class="cell"><span class="num">{String(parts.hours).padStart(2, '0')}</span><span class="lbl">h</span></div>
          <div class="cell"><span class="num">{String(parts.minutes).padStart(2, '0')}</span><span class="lbl">m</span></div>
          <div class="cell"><span class="num">{String(parts.seconds).padStart(2, '0')}</span><span class="lbl">s</span></div>
        </div>
      </div>
      <span class="sr-only" aria-live="polite">
        {srParts ? `${formatCountdown(srParts)} remaining` : ''}
      </span>
    {/if}
    <div class="start">{formatRaceDateTime(nextSession.date_start)}</div>
  {/if}
</Card>

<Card label="Last race">
  {#if raceError}
    <div class="text-err">{raceError}</div>
  {:else if !raceLoaded}
    <Skeleton lines={4} />
  {:else if !lastRace || podium.length === 0}
    <div class="text-empty">No completed races yet.</div>
  {:else}
    <div class="race-name">{lastRace.raceName}</div>
    <div class="race-date">{formatRaceDate(lastRace.date)}</div>
    <ol class="podium">
      {#each podium as r (r.Driver.driverId)}
        <li class="row pos-{r.position}">
          <span class="pos">{r.position}</span>
          <TeamDot constructorId={r.Constructor.constructorId} />
          <span class="code">{r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase()}</span>
          <span class="name">{r.Driver.givenName} {r.Driver.familyName}</span>
          <span class="pts">{r.points}</span>
        </li>
      {/each}
    </ol>
  {/if}
</Card>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .session-name {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.15;
  }
  .circuit {
    color: var(--text-dim);
    margin-top: var(--space-1);
    font-size: 14px;
  }
  .countdown {
    margin-top: var(--space-4);
  }
  .cd-cells {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
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
  .countdown.live {
    color: var(--accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 14px;
  }
  .start {
    margin-top: var(--space-3);
    font-size: 14px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--text-dim);
  }

  .race-name {
    font-size: 18px;
    font-weight: 700;
  }
  .race-date {
    color: var(--text-dim);
    font-size: 14px;
    margin-top: var(--space-1);
    margin-bottom: var(--space-3);
  }

  .podium {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--surface-2);
    border-radius: var(--radius-md);
    font-size: 14px;
  }
  .row.pos-1 { box-shadow: inset 3px 0 0 var(--medal-gold); }
  .row.pos-2 { box-shadow: inset 3px 0 0 var(--medal-silver); }
  .row.pos-3 { box-shadow: inset 3px 0 0 var(--medal-bronze); }
  .pos {
    width: 18px;
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
  .code {
    width: 40px;
    font-family: var(--font-mono);
    font-weight: 700;
  }
  .name {
    flex: 1;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pts {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
</style>
