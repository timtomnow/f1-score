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
  rb: { accent: '#6692FF', fg: '#ffffff' },
  sauber: { accent: '#52E252', fg: '#000000' },
  audi: { accent: '#52E252', fg: '#000000' },
  haas: { accent: '#B6BABD', fg: '#000000' }
};

const FALLBACK: TeamColor = { accent: '#6c6c75', fg: '#ffffff' };

const ALIASES: Record<string, keyof typeof PALETTE> = {
  red_bull_racing: 'red_bull',
  redbull: 'red_bull',
  alfa: 'sauber',
  alphatauri: 'rb',
  racing_bulls: 'rb',
  alfa_romeo: 'sauber'
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
