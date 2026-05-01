export interface TeamColor {
  accent: string;
  fg: string;
}

const PALETTE: Record<string, TeamColor> = {
  mclaren: { accent: '#FF8000', fg: '#000000' },
  ferrari: { accent: '#E8002D', fg: '#ffffff' },
  mercedes: { accent: '#27F4D2', fg: '#000000' },
  red_bull: { accent: '#3671C6', fg: '#ffffff' },
  aston_martin: { accent: '#229971', fg: '#ffffff' },
  alpine: { accent: '#0093CC', fg: '#ffffff' },
  williams: { accent: '#64C4FF', fg: '#000000' },
  racing_bulls: { accent: '#6692FF', fg: '#ffffff' },
  audi: { accent: '#00C7B6', fg: '#000000' },
  cadillac: { accent: '#E8E8EC', fg: '#000000' },
  haas: { accent: '#B6BABD', fg: '#000000' }
};

const FALLBACK: TeamColor = { accent: '#6c6c75', fg: '#ffffff' };

const ALIASES: Record<string, keyof typeof PALETTE> = {
  red_bull_racing: 'red_bull',
  redbull: 'red_bull',
  rb: 'racing_bulls',
  alphatauri: 'racing_bulls',
  alfa: 'audi',
  alfa_romeo: 'audi',
  sauber: 'audi',
  kick_sauber: 'audi',
  stake_f1_team_kick_sauber: 'audi',
  haas_f1_team: 'haas'
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function teamColor(name: string | null | undefined): TeamColor {
  if (!name) return FALLBACK;
  const key = normalize(name);
  if (PALETTE[key]) return PALETTE[key];
  if (ALIASES[key] && PALETTE[ALIASES[key]]) return PALETTE[ALIASES[key]];
  for (const k of Object.keys(PALETTE)) {
    if (key.includes(k) || k.includes(key)) return PALETTE[k];
  }
  return FALLBACK;
}

// Foreground contrast estimate for an arbitrary hex accent (used for OpenF1
// team_colour fallbacks on unknown teams). Uses the WCAG relative-luminance
// formula and a 0.6 cutoff that matches the curated palette decisions above.
function pickFg(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const lin = (c: number): number => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.6 ? '#000000' : '#ffffff';
}

export function teamColorFromHex(hex: string | null | undefined): TeamColor | null {
  if (!hex) return null;
  const trimmed = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(trimmed)) return null;
  const accent = `#${trimmed.toUpperCase()}`;
  return { accent, fg: pickFg(accent) };
}

const _byDriverNumber: Record<string, TeamColor> = {};

export function setDriverTeam(driverNumber: number | string, color: TeamColor): void {
  _byDriverNumber[String(driverNumber)] = color;
}

export function teamColorForDriver(driverNumber: number | string | null | undefined): TeamColor {
  if (driverNumber === null || driverNumber === undefined) return FALLBACK;
  return _byDriverNumber[String(driverNumber)] ?? FALLBACK;
}

export function clearDriverTeams(): void {
  for (const k of Object.keys(_byDriverNumber)) delete _byDriverNumber[k];
}
