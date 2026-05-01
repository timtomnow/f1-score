import { SvelteSet } from 'svelte/reactivity';
import { getDrivers, type Driver } from './openf1';
import { prefs } from './prefs.svelte';
import {
  teamColor,
  teamColorFromHex,
  setDriverTeam,
  clearDriverTeams,
  type TeamColor
} from './teams';

const DEFAULT_THEME: TeamColor = { accent: '#e10600', fg: '#ffffff' };
const DEFAULT_ACCENT_BG = 'rgba(225, 6, 0, 0.14)';

let _drivers = $state<Driver[]>([]);
let _driversLoaded = $state(false);
let _driversError = $state<string | null>(null);
let _initStarted = false;

export const theme = {
  get drivers(): Driver[] {
    return _drivers;
  },
  get driversLoaded(): boolean {
    return _driversLoaded;
  },
  get driversError(): string | null {
    return _driversError;
  }
};

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return DEFAULT_ACCENT_BG;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyToRoot(color: TeamColor): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent', color.accent);
  root.style.setProperty('--accent-fg', color.fg);
  root.style.setProperty('--accent-bg', hexToRgba(color.accent, 0.18));
}

function clearRoot(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.removeProperty('--accent');
  root.style.removeProperty('--accent-fg');
  root.style.removeProperty('--accent-bg');
}

function resolveDriverTheme(driverId: string | null, drivers: Driver[]): TeamColor | null {
  if (!driverId) return null;
  const driver = drivers.find((d) => String(d.driver_number) === driverId);
  if (!driver) return null;
  const named = driver.team_name ? teamColor(driver.team_name) : null;
  if (named && named.accent !== '#6c6c75') return named;
  return teamColorFromHex(driver.team_colour) ?? named;
}

function syncTheme(): void {
  const fav = prefs.value.favoriteDriverId;
  const resolved = resolveDriverTheme(fav, _drivers);
  if (resolved) applyToRoot(resolved);
  else if (fav && !_driversLoaded) {
    // Drivers not yet fetched — leave whatever was applied last cycle.
  } else {
    clearRoot();
    void DEFAULT_THEME;
  }
}

function indexDriverTeams(list: Driver[]): void {
  clearDriverTeams();
  for (const d of list) {
    const named = d.team_name ? teamColor(d.team_name) : null;
    const fromHex = teamColorFromHex(d.team_colour);
    const color = named && named.accent !== '#6c6c75' ? named : fromHex ?? named ?? null;
    if (color) setDriverTeam(d.driver_number, color);
  }
}

export async function initTheme(signal?: AbortSignal): Promise<void> {
  if (_initStarted) return;
  _initStarted = true;
  // Re-apply theme whenever drivers list or favorite changes.
  $effect.root(() => {
    $effect(() => {
      // Read both reactive sources so the effect tracks them.
      void prefs.value.favoriteDriverId;
      void _drivers.length;
      syncTheme();
    });
  });
  try {
    const list = await getDrivers({ session_key: 'latest' }, signal);
    const seen = new SvelteSet<number>();
    const unique: Driver[] = [];
    for (const d of list) {
      if (seen.has(d.driver_number)) continue;
      seen.add(d.driver_number);
      unique.push(d);
    }
    unique.sort((a, b) => {
      const t = (a.team_name ?? '').localeCompare(b.team_name ?? '');
      if (t !== 0) return t;
      return a.driver_number - b.driver_number;
    });
    indexDriverTeams(unique);
    _drivers = unique;
    _driversError = null;
    _driversLoaded = true;
  } catch (e) {
    _driversError = (e as Error).message ?? String(e);
    _driversLoaded = true;
  }
}

export function driverDisplayName(d: Driver): string {
  const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim();
  return name || d.broadcast_name || d.full_name || `#${d.driver_number}`;
}

export function driverHeadshot(d: Driver): string | null {
  if (!d.headshot_url) return null;
  if (d.headshot_url.includes('d_driver_fallback_image.png')) return null;
  return d.headshot_url;
}
