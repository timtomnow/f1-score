import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { createPoller, type Poller } from './poller';
import {
  getSessions,
  getDrivers,
  getPosition,
  getIntervals,
  getLaps,
  getStints,
  type Session,
  type Driver,
  type TyreCompound
} from './openf1';

export interface DriverRow {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string;
  position: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
  last_lap: number | null;
  best_lap: number | null;
  lap_number: number | null;
  compound: TyreCompound | null;
  tyre_age: number | null;
}

export interface LiveState {
  session: Session | null;
  isLive: boolean;
  drivers: DriverRow[];
  currentLap: number | null;
  lastUpdated: number | null;
  loaded: boolean;
  error: string | null;
}

let _session = $state<Session | null>(null);
let _isLive = $state(false);
let _drivers = $state<DriverRow[]>([]);
let _currentLap = $state<number | null>(null);
let _lastUpdated = $state<number | null>(null);
let _loaded = $state(false);
let _error = $state<string | null>(null);

export const liveState: LiveState = {
  get session() { return _session; },
  get isLive() { return _isLive; },
  get drivers() { return _drivers; },
  get currentLap() { return _currentLap; },
  get lastUpdated() { return _lastUpdated; },
  get loaded() { return _loaded; },
  get error() { return _error; }
};

let _positionCursor = $state<string | null>(null);
let _intervalCursor = $state<string | null>(null);

const _driverMeta = new SvelteMap<number, Driver>();
const _positions = new SvelteMap<number, number>();
const _gaps = new SvelteMap<number, number | string | null>();
const _intervals = new SvelteMap<number, number | string | null>();
const _lastLaps = new SvelteMap<number, number | null>();
const _bestLaps = new SvelteMap<number, number | null>();
const _lapNumbers = new SvelteMap<number, number | null>();
const _compounds = new SvelteMap<number, TyreCompound | null>();
const _tyreAges = new SvelteMap<number, number | null>();

let _fastPoller: Poller | null = null;
let _slowPoller: Poller | null = null;
let _sessionPoller: Poller | null = null;
let _started = false;

function isSessionLive(s: Session, now = Date.now()): boolean {
  return new Date(s.date_start).getTime() <= now && now <= new Date(s.date_end).getTime();
}

function buildRows(): DriverRow[] {
  const nums = Array.from(_driverMeta.keys());
  const rows: DriverRow[] = nums.map((n) => {
    const d = _driverMeta.get(n)!;
    return {
      driver_number: n,
      name_acronym: d.name_acronym,
      full_name: d.full_name,
      team_name: d.team_name,
      team_colour: d.team_colour,
      position: _positions.get(n) ?? 99,
      gap_to_leader: _gaps.get(n) ?? null,
      interval: _intervals.get(n) ?? null,
      last_lap: _lastLaps.get(n) ?? null,
      best_lap: _bestLaps.get(n) ?? null,
      lap_number: _lapNumbers.get(n) ?? null,
      compound: _compounds.get(n) ?? null,
      tyre_age: _tyreAges.get(n) ?? null
    };
  });
  rows.sort((a, b) => a.position - b.position);
  return rows;
}

async function fetchSession(signal: AbortSignal): Promise<Session | null> {
  const sessions = await getSessions({ session_key: 'latest' }, signal);
  return sessions[0] ?? null;
}

async function fetchFast(signal: AbortSignal): Promise<void> {
  if (!_session) return;
  const sk = _session.session_key;
  const now = new Date();

  const posParams: Record<string, string | number> = { session_key: sk };
  if (_positionCursor) posParams['date>'] = _positionCursor;
  else {
    const tenSecondsAgo = new Date(now.getTime() - 10_000);
    posParams['date>'] = tenSecondsAgo.toISOString();
  }

  const intParams: Record<string, string | number> = { session_key: sk };
  if (_intervalCursor) intParams['date>'] = _intervalCursor;
  else {
    const tenSecondsAgo = new Date(now.getTime() - 10_000);
    intParams['date>'] = tenSecondsAgo.toISOString();
  }

  const [positions, intervals] = await Promise.all([
    getPosition(posParams, signal),
    getIntervals(intParams, signal)
  ]);

  for (const p of positions) {
    const prev = _positions.get(p.driver_number);
    if (prev !== undefined && prev !== p.position) {
      _positions.set(p.driver_number, p.position);
    } else {
      _positions.set(p.driver_number, p.position);
    }
    if (!_positionCursor || p.date > _positionCursor) _positionCursor = p.date;
  }

  for (const iv of intervals) {
    _gaps.set(iv.driver_number, iv.gap_to_leader);
    _intervals.set(iv.driver_number, iv.interval);
    if (!_intervalCursor || iv.date > _intervalCursor) _intervalCursor = iv.date;
  }

  _drivers = buildRows();
  _lastUpdated = Date.now();
  _error = null;
}

async function fetchSlow(signal: AbortSignal): Promise<void> {
  if (!_session) return;
  const sk = _session.session_key;

  const [laps, stints] = await Promise.all([
    getLaps({ session_key: sk }, signal),
    getStints({ session_key: sk }, signal)
  ]);

  const lapsByDriver = new SvelteMap<number, typeof laps[number][]>();
  for (const lap of laps) {
    const arr = lapsByDriver.get(lap.driver_number) ?? [];
    arr.push(lap);
    lapsByDriver.set(lap.driver_number, arr);
  }

  let maxLap = 0;
  for (const [dnum, driverLaps] of lapsByDriver) {
    const sorted = [...driverLaps].sort((a, b) => b.lap_number - a.lap_number);
    const latest = sorted[0];
    if (latest) {
      _lapNumbers.set(dnum, latest.lap_number);
      _lastLaps.set(dnum, latest.lap_duration);
      if (latest.lap_number > maxLap) maxLap = latest.lap_number;
    }
    const best = driverLaps.reduce<number | null>((acc, l) => {
      if (l.lap_duration === null) return acc;
      if (acc === null || l.lap_duration < acc) return l.lap_duration;
      return acc;
    }, null);
    _bestLaps.set(dnum, best);
  }
  if (maxLap > 0) _currentLap = maxLap;

  const latestStintByDriver = new SvelteMap<number, typeof stints[number]>();
  for (const s of stints) {
    const prev = latestStintByDriver.get(s.driver_number);
    if (!prev || s.stint_number > prev.stint_number) {
      latestStintByDriver.set(s.driver_number, s);
    }
  }
  for (const [dnum, stint] of latestStintByDriver) {
    _compounds.set(dnum, stint.compound);
    _tyreAges.set(dnum, stint.tyre_age_at_start);
  }

  _drivers = buildRows();
}

async function fetchDrivers(sk: number, signal: AbortSignal): Promise<void> {
  const list = await getDrivers({ session_key: sk }, signal);
  const seen = new SvelteSet<number>();
  _driverMeta.clear();
  for (const d of list) {
    if (seen.has(d.driver_number)) continue;
    seen.add(d.driver_number);
    _driverMeta.set(d.driver_number, d);
  }
}

function resetCursors(): void {
  _positionCursor = null;
  _intervalCursor = null;
  _positions.clear();
  _gaps.clear();
  _intervals.clear();
  _lastLaps.clear();
  _bestLaps.clear();
  _lapNumbers.clear();
  _compounds.clear();
  _tyreAges.clear();
  _currentLap = null;
}

export function startLive(): void {
  if (_started) return;
  _started = true;

  const ac = new AbortController();

  _sessionPoller = createPoller<Session | null>({
    intervalMs: 30_000,
    fetch: (signal) => fetchSession(signal),
    onUpdate: async (s) => {
      const live = s ? isSessionLive(s) : false;
      const sessionChanged = s?.session_key !== _session?.session_key;

      if (sessionChanged) {
        resetCursors();
        _driverMeta.clear();
        _drivers = [];
        _loaded = false;
        if (s) {
          try {
            await fetchDrivers(s.session_key, ac.signal);
          } catch {
            // Carry on — we'll retry next cycle.
          }
        }
      }

      _session = s;
      _isLive = live;

      if (live) {
        _fastPoller?.stop();
        _fastPoller = createPoller<void>({
          intervalMs: 2_000,
          fetch: (sig) => fetchFast(sig),
          onUpdate: () => {},
          onError: (e) => { _error = (e as Error).message ?? String(e); }
        });
        _fastPoller.start();

        _slowPoller?.stop();
        _slowPoller = createPoller<void>({
          intervalMs: 15_000,
          fetch: (sig) => fetchSlow(sig),
          onUpdate: () => {},
          onError: (e) => { _error = (e as Error).message ?? String(e); }
        });
        _slowPoller.start();
      } else {
        _fastPoller?.stop();
        _fastPoller = null;
        _slowPoller?.stop();
        _slowPoller = null;
      }

      _loaded = true;
      _error = null;
    },
    onError: (e) => {
      _error = (e as Error).message ?? String(e);
      _loaded = true;
    }
  });

  _sessionPoller.start();
}

export function stopLive(): void {
  _fastPoller?.stop();
  _fastPoller = null;
  _slowPoller?.stop();
  _slowPoller = null;
  _sessionPoller?.stop();
  _sessionPoller = null;
  _started = false;
}

export function isLiveSessionActive(): boolean {
  return _isLive;
}
