<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createPoller, type Poller } from './lib/poller';
  import {
    getSessions,
    getDrivers,
    type Session
  } from './lib/openf1';
  import {
    getDriverStandings,
    getSchedule,
    type DriverStanding
  } from './lib/jolpica';

  type HealthCheck = {
    label: string;
    status: 'pending' | 'ok' | 'fail';
    code?: number;
    latencyMs?: number;
    detail?: string;
  };

  let nextSession = $state<Session | null>(null);
  let sessionError = $state<string | null>(null);
  let standings = $state<DriverStanding[]>([]);
  let standingsError = $state<string | null>(null);
  let health = $state<HealthCheck[]>([]);

  function findCurrentOrNext(sessions: Session[], now = new Date()): Session | null {
    const live = [...sessions].filter((s) => !s.is_cancelled).sort((a, b) =>
      a.date_start.localeCompare(b.date_start)
    );
    const t = now.getTime();
    const current = live.find((s) => {
      const start = new Date(s.date_start).getTime();
      const end = new Date(s.date_end).getTime();
      return start <= t && t <= end;
    });
    if (current) return current;
    return live.find((s) => new Date(s.date_start).getTime() > t) ?? null;
  }

  function fmtSessionStart(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  async function timeIt(label: string, fn: () => Promise<unknown>): Promise<HealthCheck> {
    const t0 = performance.now();
    try {
      await fn();
      return { label, status: 'ok', code: 200, latencyMs: Math.round(performance.now() - t0) };
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return {
        label,
        status: 'fail',
        code: e.status,
        latencyMs: Math.round(performance.now() - t0),
        detail: e.message ?? String(err)
      };
    }
  }

  let sessionPoller: Poller | undefined;

  onMount(() => {
    const year = new Date().getFullYear();

    sessionPoller = createPoller<Session | null>({
      intervalMs: 60_000,
      fetch: async (signal) => findCurrentOrNext(await getSessions({ year }, signal)),
      onUpdate: (s) => {
        nextSession = s;
        sessionError = null;
      },
      onError: (e) => {
        sessionError = (e as Error).message ?? String(e);
      }
    });
    sessionPoller.start();

    void getDriverStandings('current', { limit: 10 })
      .then((res) => {
        standings = res.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
      })
      .catch((e: Error) => {
        standingsError = e.message ?? String(e);
      });

    void Promise.all([
      timeIt('OpenF1 sessions', () => getSessions({ year })),
      timeIt('OpenF1 drivers (latest)', () => getDrivers({ session_key: 'latest' })),
      timeIt('Jolpica schedule', () => getSchedule('current', { limit: 1 })),
      timeIt('Jolpica driver standings', () => getDriverStandings('current', { limit: 1 }))
    ]).then((results) => { health = results; });
  });

  onDestroy(() => {
    sessionPoller?.stop();
  });
</script>

<header class="hdr">
  <div class="wordmark">F1<span class="wordmark-dim">SCORE</span></div>
  <div class="tag">Stage 1 · debug</div>
</header>

<section class="card">
  <div class="card-label">Next / current session</div>
  {#if sessionError}
    <div class="err">{sessionError}</div>
  {:else if nextSession}
    <div class="race-name">{nextSession.session_name} · {nextSession.location}</div>
    <div class="circuit">{nextSession.circuit_short_name} · {nextSession.country_name}</div>
    <div class="start-local">{fmtSessionStart(nextSession.date_start)}</div>
  {:else}
    <div class="empty">Loading…</div>
  {/if}
</section>

<section class="card">
  <div class="card-label">Drivers' standings · top 10</div>
  {#if standingsError}
    <div class="err">{standingsError}</div>
  {:else if standings.length === 0}
    <div class="empty">Loading…</div>
  {:else}
    <ol class="standings">
      {#each standings as s (s.Driver.driverId)}
        <li class="row">
          <span class="pos">{s.position}</span>
          <span class="code">{s.Driver.code ?? s.Driver.familyName.slice(0, 3).toUpperCase()}</span>
          <span class="name">{s.Driver.givenName} {s.Driver.familyName}</span>
          <span class="pts">{s.points}</span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<section class="card">
  <div class="card-label">API health</div>
  {#if health.length === 0}
    <div class="empty">Checking…</div>
  {:else}
    <ul class="health">
      {#each health as h (h.label)}
        <li class="row">
          <span class="hlabel">{h.label}</span>
          <span class="hstatus" class:ok={h.status === 'ok'} class:fail={h.status === 'fail'}>
            {h.status === 'ok' ? `${h.code} OK` : `${h.code ?? 'ERR'} ${h.detail ?? ''}`}
          </span>
          <span class="hlat">{h.latencyMs}ms</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<footer class="ftr">Throwaway view — replaced in stage 2.</footer>

<style>
  .hdr {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--space-5);
  }
  .wordmark {
    font-family: var(--font-mono);
    font-weight: 900;
    font-size: 28px;
    letter-spacing: -1px;
    color: var(--accent);
  }
  .wordmark-dim {
    margin-left: 6px;
    color: var(--text);
  }
  .tag {
    font-size: 12px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: var(--space-5) var(--space-4);
    margin-bottom: var(--space-4);
  }
  .card-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-faint);
    margin-bottom: var(--space-3);
  }

  .race-name { font-size: 22px; font-weight: 700; line-height: 1.15; }
  .circuit { color: var(--text-dim); margin-top: var(--space-1); font-size: 14px; }
  .start-local {
    margin-top: var(--space-3);
    font-size: 14px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .empty { color: var(--text-faint); font-size: 14px; }
  .err {
    color: #ff6b6b;
    font-size: 13px;
    font-family: var(--font-mono);
    word-break: break-all;
  }

  .standings, .health {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    font-size: 14px;
  }
  .pos {
    width: 24px;
    text-align: right;
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .code {
    width: 44px;
    font-family: var(--font-mono);
    font-weight: 700;
  }
  .name { flex: 1; color: var(--text-dim); }
  .pts {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  .hlabel { flex: 1; color: var(--text-dim); }
  .hstatus {
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .hstatus.ok { color: #67e0a3; }
  .hstatus.fail { color: #ff6b6b; }
  .hlat {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
    min-width: 56px;
    text-align: right;
  }

  .ftr {
    margin-top: var(--space-5);
    text-align: center;
    color: var(--text-faint);
    font-size: 12px;
  }
</style>
