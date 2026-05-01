<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { getSchedule, type ScheduleRace, type SessionStamp } from '../lib/jolpica';
  import { formatRaceDate, formatTime, combineDateTime } from '../lib/format';
  import Card from '../components/Card.svelte';
  import Badge from '../components/Badge.svelte';
  import Skeleton from '../components/Skeleton.svelte';

  type Status = 'live' | 'upcoming' | 'finished';

  interface SessionRow {
    label: string;
    iso: string;
  }

  interface RaceRow {
    race: ScheduleRace;
    isSprint: boolean;
    status: Status;
    raceIso: string;
    sessions: SessionRow[];
  }

  let races = $state<RaceRow[]>([]);
  let loaded = $state(false);
  let error = $state<string | null>(null);
  const roundEls: Array<HTMLElement | null> = [];

  const SESSIONS: Array<{ key: keyof ScheduleRace; label: string }> = [
    { key: 'FirstPractice', label: 'Practice 1' },
    { key: 'SecondPractice', label: 'Practice 2' },
    { key: 'ThirdPractice', label: 'Practice 3' },
    { key: 'SprintQualifying', label: 'Sprint Qualifying' },
    { key: 'Sprint', label: 'Sprint' },
    { key: 'Qualifying', label: 'Qualifying' }
  ];

  function buildRow(race: ScheduleRace, now: number): RaceRow {
    const isSprint = !!race.Sprint || !!race.SprintQualifying;
    const raceIso = combineDateTime(race.date, race.time);
    const raceMs = new Date(raceIso).getTime();

    const sessions: SessionRow[] = [];
    let earliest = raceMs;
    for (const { key, label } of SESSIONS) {
      const s = race[key] as SessionStamp | undefined;
      if (s?.date) {
        const iso = combineDateTime(s.date, s.time);
        sessions.push({ label, iso });
        const ms = new Date(iso).getTime();
        if (ms < earliest) earliest = ms;
      }
    }
    sessions.push({ label: 'Race', iso: raceIso });

    let status: Status;
    const raceEnd = raceMs + 3 * 60 * 60 * 1000;
    if (raceEnd < now) status = 'finished';
    else if (earliest <= now && now <= raceEnd) status = 'live';
    else status = 'upcoming';

    return { race, isSprint, status, raceIso, sessions };
  }

  function nextRoundIndex(rows: RaceRow[]): number {
    const live = rows.findIndex((r) => r.status === 'live');
    if (live !== -1) return live;
    const upcoming = rows.findIndex((r) => r.status === 'upcoming');
    if (upcoming !== -1) return upcoming;
    return rows.length - 1;
  }

  let highlightIndex = $state(-1);

  onMount(() => {
    void (async () => {
      try {
        const res = await getSchedule('current');
        const list = res.MRData.RaceTable.Races;
        const now = Date.now();
        races = list.map((r) => buildRow(r, now));
        highlightIndex = nextRoundIndex(races);
        loaded = true;
        await tick();
        roundEls[highlightIndex]?.scrollIntoView({ block: 'start', behavior: 'auto' });
      } catch (e) {
        error = (e as Error).message ?? String(e);
        loaded = true;
      }
    })();
  });
</script>

<header class="view-header">
  <h1>Schedule</h1>
</header>

{#if error}
  <Card><div class="text-err">{error}</div></Card>
{:else if !loaded}
  {#each Array.from({ length: 3 }, (_, i) => i) as i (i)}
    <Card>
      <Skeleton lines={3} />
    </Card>
  {/each}
{:else if races.length === 0}
  <Card><div class="text-empty">No schedule available.</div></Card>
{:else}
  {#each races as row, i (row.race.round)}
    <Card bind:element={roundEls[i]}>
      <div class="head">
        <div class="round">Round {row.race.round}</div>
        <div class="badges">
          {#if row.isSprint}<Badge variant="sprint">Sprint</Badge>{/if}
          {#if row.status === 'live'}
            <Badge variant="live">Live</Badge>
          {:else if row.status === 'upcoming'}
            <Badge variant="upcoming">Upcoming</Badge>
          {:else}
            <Badge variant="finished">Finished</Badge>
          {/if}
        </div>
      </div>
      <div class="race-name">{row.race.raceName}</div>
      <div class="circuit">
        {row.race.Circuit.circuitName} · {row.race.Circuit.Location.country}
      </div>
      <div class="race-date">{formatRaceDate(row.raceIso)}</div>

      <ul class="sessions">
        {#each row.sessions as s (s.label)}
          <li>
            <span class="s-label">{s.label}</span>
            <span class="s-time">{formatTime(s.iso)}</span>
            <span class="s-date">{formatRaceDate(s.iso)}</span>
          </li>
        {/each}
      </ul>
    </Card>
  {/each}
{/if}

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }
  .round {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-faint);
  }
  .badges { display: flex; gap: var(--space-1); flex-wrap: wrap; }

  .race-name {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  }
  .circuit {
    color: var(--text-dim);
    font-size: 14px;
    margin-top: var(--space-1);
  }
  .race-date {
    color: var(--text-faint);
    font-size: 12px;
    margin-top: var(--space-1);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .sessions {
    list-style: none;
    margin: var(--space-3) 0 0;
    padding: var(--space-3) 0 0;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .sessions li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-2);
    font-size: 14px;
    padding: var(--space-1) 0;
    align-items: baseline;
  }
  .s-label { color: var(--text-dim); }
  .s-time, .s-date {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .s-time { color: var(--text); }
  .s-date { color: var(--text-faint); font-size: 12px; }
</style>
