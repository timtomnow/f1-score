# f1-score — Specification

Single source of truth for design system, team colors, supported session
types, route map, and localStorage schema. This document grows as we move
through stages — keep it in sync with reality.

---

## Design System

All tokens are defined as CSS custom properties on `:root` in
[`src/app.css`](src/app.css). Never hardcode equivalents — add to the
system instead.

### Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0b0d` | App background |
| `--surface` | `#15151a` | Card surface |
| `--surface-2` | `#1d1d23` | Inset / nested surface (e.g. countdown cells) |
| `--border` | `#2a2a32` | Hairline borders on dark surfaces |
| `--text` | `#f5f5f7` | Primary text |
| `--text-dim` | `#a0a0a8` | Secondary text |
| `--text-faint` | `#6c6c75` | Labels, helper text |
| `--accent` | `#e10600` | Default accent (F1 red); overridden by favorite-driver theme in stage 3 |
| `--accent-fg` | `#ffffff` | Foreground on accent |

The favorite-driver theme (stage 3) overrides `--accent`, `--accent-bg`,
`--accent-fg` at the document root based on the team color map below.

### Spacing

Linear 4px scale: `--space-1` (4) → `--space-6` (32). Always use the token,
never a literal pixel value. If a layout needs a value not in the scale,
add it to the scale rather than inlining.

### Radius

| Token | Value | Use |
|---|---|---|
| `--radius-card` | `16px` | Card corners |
| `--radius-pill` | `999px` | Pill buttons, badges |

### Typography

- Sans family: `--font-sans` — system stack (`-apple-system, BlinkMacSystemFont, …`)
- Mono family: `--font-mono` — `ui-monospace, SFMono-Regular, Menlo, …`
- Use mono for all numeric live data (lap times, gaps, sectors, position
  numbers). Use `font-variant-numeric: tabular-nums` to prevent column
  jitter on update.
- Type scale (informal, refined as components arrive):
  - 11–12px — labels, helper text, badges
  - 14px — body / table cells
  - 16–18px — primary card body
  - 22–28px — card headlines
  - 50px — primary live score / position highlight (race header)

### Motion

- Card entrance / collapsibles: 200–310ms, ease-out
- Numeric updates (lap times, gaps): no transition; use color flash on
  change instead (added in stage 4)
- Track-viz dot interpolation: continuous via `requestAnimationFrame`
- Honor `prefers-reduced-motion` globally — already wired in `app.css`,
  with a manual override toggle added in stage 3

### Layout

- Mobile-first; max content width `--max-w` (`440px`), centered.
- Respect safe-area insets — `padding` on `body` reads
  `env(safe-area-inset-*)`.
- Touch targets ≥ 40px.

---

## Team color map (2025 baseline)

Colors are deliberately frozen at the 2025 grid as a starting point. Stage 3
introduces a per-driver picker; we'll re-validate against the actual 2026
season once OpenF1 is wired up. This map updates yearly — when liveries
shift (Audi takeover, new teams, etc.) update both the values and the
notes column.

| Constructor | Accent | Notes |
|---|---|---|
| McLaren | `#FF8000` | Papaya orange |
| Ferrari | `#E8002D` | Rosso |
| Mercedes | `#27F4D2` | Petronas teal |
| Red Bull Racing | `#3671C6` | RB blue |
| Aston Martin | `#229971` | British racing green |
| Alpine | `#0093CC` | Alpine blue |
| Williams | `#64C4FF` | Light blue |
| RB / Racing Bulls | `#6692FF` | Pale blue |
| Sauber / Audi | `#52E252` | Green (Sauber); revisit on Audi rebrand |
| Haas | `#B6BABD` | Silver |

Foreground (`--accent-fg`) is `#ffffff` for every team except where
contrast on a light accent (Williams, Sauber, Haas, Mercedes) requires
`#000000`. Decision per-team is in the data file added in stage 3.

---

## Session types

Surfaced via OpenF1 `session_name` / `session_type`. Each gets a
session-aware view in stage 5.

- `Practice 1`, `Practice 2`, `Practice 3` — best lap + sector deltas
- `Qualifying` — Q1 / Q2 / Q3 elimination columns, drop-zone indicator
- `Sprint Qualifying` (a.k.a. `Sprint Shootout`) — SQ1 / SQ2 / SQ3
- `Sprint` — abbreviated race view (no pit-strategy column)
- `Race` — full race view (pit stops, tire strategy strip, undercut/overcut)

A weekend without a sprint runs P1 / P2 / P3 / Q / R. A sprint weekend runs
P1 / SQ / S / Q / R.

---

## Route / View map

Hash-based routing (e.g. `#/schedule`) — chosen over HTML5 history routing
because GitHub Pages serves a single `index.html` and hash routing avoids
404s on direct refresh of a sub-route. Routes added per stage.

| Route | Stage | View |
|---|---|---|
| `#/` | 0 | Placeholder (next-race countdown) |
| `#/live` | 4 | Live session timing |
| `#/schedule` | 2 | Season calendar |
| `#/standings` | 2 | Drivers + Constructors standings |
| `#/race/:round` | 9 | Past race / qualifying / sprint results |
| `#/track` | 7 | Live track visualization |
| `#/settings` | 3 | Preferences |

Default landing route is configurable in preferences (stage 3); falls back
to `#/live` during a session weekend, `#/schedule` otherwise.

---

## localStorage schema

Stored under a single key: `f1score:prefs`. Always parse and validate;
fall back to defaults on schema mismatch. Bump `schemaVersion` when shape
changes and write a migration in `src/lib/prefs.ts` (added in stage 3).

```ts
interface PreferencesV1 {
  schemaVersion: 1;
  favoriteDriverId: string | null;       // OpenF1 driver_number as string
  followedDriverIds: string[];           // OpenF1 driver_number as string
  defaultView: 'live' | 'schedule' | 'standings' | 'auto';
  units: 'metric' | 'imperial';
  reducedMotion: boolean;                // overrides system pref when true
}

const DEFAULTS: PreferencesV1 = {
  schemaVersion: 1,
  favoriteDriverId: null,
  followedDriverIds: [],
  defaultView: 'auto',
  units: 'metric',
  reducedMotion: false
};
```

Theme (`--accent` / `--accent-bg` / `--accent-fg`) is derived from
`favoriteDriverId` at app start and on change — not stored separately.

---

## API surface (cheatsheet)

Full endpoint catalogue lives in the `f1-data-expert` subagent. Quick
reference for stage-1 wiring:

**OpenF1** (`https://api.openf1.org/v1`)
- `sessions?year=YYYY&country_name=…` — discover sessions and their keys
- `drivers?session_key=latest` — driver list for a session
- `position?session_key=…&date>=…` — running order over time
- `intervals?session_key=…` — gap to leader / interval to ahead
- `laps?session_key=…&driver_number=…` — per-lap data
- `pit?session_key=…` — pit stops
- `stints?session_key=…` — tire stints (compound + age)
- `weather?session_key=…` — air/track temp, humidity, rain
- `race_control?session_key=…` — flags, SC/VSC, penalties
- `location?session_key=…&date>=…` — x/y/z car positions for track viz
- `car_data?session_key=…&driver_number=…` — telemetry (speed, throttle, brake, gear, RPM)

**Jolpica** (`https://api.jolpi.ca/ergast/f1`) — Ergast-compatible
- `/current.json` — current season schedule
- `/current/last/results.json` — last race results
- `/current/driverStandings.json`
- `/current/constructorStandings.json`
- `/{year}/{round}/qualifying.json` — qualifying results for past round
- `/{year}/{round}/sprint.json` — sprint results
- `/{year}/{round}/results.json` — race results

---

## Open questions / TODO

Items deferred until the relevant stage. Add here when something is decided
in conversation but not yet implemented.

- Per-circuit affine transform calibration data (stage 7) — file location
  and format TBD.
- Update-flash color spec (stage 4) — green for improvement, neutral for
  worse, fade duration.
- Off-season detection rule (stage 9) — likely "no session in next 14 days".
