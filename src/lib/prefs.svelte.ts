const STORAGE_KEY = 'f1score:prefs';

export type DefaultView = 'live' | 'schedule' | 'standings' | 'auto';
export type Units = 'metric' | 'imperial';

export interface PreferencesV1 {
  schemaVersion: 1;
  favoriteDriverId: string | null;
  followedDriverIds: string[];
  defaultView: DefaultView;
  units: Units;
  reducedMotion: boolean;
}

export type Preferences = PreferencesV1;
export const CURRENT_SCHEMA_VERSION = 1 as const;

export const DEFAULTS: PreferencesV1 = {
  schemaVersion: 1,
  favoriteDriverId: null,
  followedDriverIds: [],
  defaultView: 'auto',
  units: 'metric',
  reducedMotion: false
};

const VALID_VIEWS: ReadonlySet<DefaultView> = new Set(['live', 'schedule', 'standings', 'auto']);
const VALID_UNITS: ReadonlySet<Units> = new Set(['metric', 'imperial']);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function coerceV1(raw: Record<string, unknown>): PreferencesV1 {
  const favoriteDriverId =
    typeof raw.favoriteDriverId === 'string' && raw.favoriteDriverId.length > 0
      ? raw.favoriteDriverId
      : null;

  const followedDriverIds = Array.isArray(raw.followedDriverIds)
    ? raw.followedDriverIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];

  const defaultView =
    typeof raw.defaultView === 'string' && VALID_VIEWS.has(raw.defaultView as DefaultView)
      ? (raw.defaultView as DefaultView)
      : DEFAULTS.defaultView;

  const units =
    typeof raw.units === 'string' && VALID_UNITS.has(raw.units as Units)
      ? (raw.units as Units)
      : DEFAULTS.units;

  const reducedMotion = typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : DEFAULTS.reducedMotion;

  return {
    schemaVersion: 1,
    favoriteDriverId,
    followedDriverIds,
    defaultView,
    units,
    reducedMotion
  };
}

type Migrator = (raw: Record<string, unknown>) => Record<string, unknown>;

const MIGRATIONS: Record<number, Migrator> = {
  // Future: when schemaVersion bumps to 2, add `1: (v1) => v2`.
};

function migrate(raw: Record<string, unknown>): PreferencesV1 {
  let cur = raw;
  let version = typeof cur.schemaVersion === 'number' ? cur.schemaVersion : 1;
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    cur = step(cur);
    version += 1;
  }
  return coerceV1(cur);
}

const _state = $state<PreferencesV1>({ ...DEFAULTS });
let _hydrated = false;

export const prefs = {
  get value(): PreferencesV1 {
    return _state;
  },
  get hydrated(): boolean {
    return _hydrated;
  }
};

function persist(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch {
    // Quota / disabled storage — fail silently; in-memory state is still authoritative.
  }
}

export function loadPrefs(): PreferencesV1 {
  if (typeof localStorage === 'undefined') {
    _hydrated = true;
    return _state;
  }
  let next: PreferencesV1 = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isObject(parsed)) next = migrate(parsed);
    }
  } catch {
    next = { ...DEFAULTS };
  }
  Object.assign(_state, next);
  _hydrated = true;
  return _state;
}

export function setPref<K extends keyof PreferencesV1>(key: K, value: PreferencesV1[K]): void {
  if (key === 'schemaVersion') return;
  _state[key] = value;
  persist();
}

export function resetPrefs(): void {
  Object.assign(_state, { ...DEFAULTS });
  persist();
}

export function toggleFollowedDriver(driverId: string): void {
  const idx = _state.followedDriverIds.indexOf(driverId);
  if (idx === -1) {
    _state.followedDriverIds = [..._state.followedDriverIds, driverId];
  } else {
    _state.followedDriverIds = _state.followedDriverIds.filter((id) => id !== driverId);
  }
  persist();
}
