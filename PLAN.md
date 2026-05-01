# f1-score — Implementation Plan

A mobile-first PWA for Formula 1 fans, hosted on GitHub Pages at
`https://timtomnow.github.io/f1-score/`. Sibling to `oilers-score` and
`bluejays-score`, deliberately stepping up in complexity to handle multiple
session types, live track visualization, and per-user customization.

This document is the source of truth for scope and sequencing. Each stage is
sized to fit a single Claude Pro session.

---

## Locked Decisions

**Stack:** Svelte 5 + TypeScript + Vite + `vite-plugin-pwa`. Svelte's reactive
stores map cleanly to live-updating data (positions, intervals, sectors) and
keep updates in-place without resetting scroll/state — better than the
"snapshot expanded IDs and rebuild" pattern used in the prior two apps. Tiny
runtime, first-class SVG for track visualization.

**Hosting:** GitHub Pages, project page at
`timtomnow.github.io/f1-score/`. Vite `base: '/f1-score/'`. Deploy via a small
GitHub Actions workflow that publishes `dist/` to the `gh-pages` branch.

**APIs (direct from browser, no proxy):**
- **[OpenF1](https://openf1.org)** — live timing, telemetry, positions,
  intervals, laps, pit stops, stints (tires), weather, race control, car
  location (x/y/z for track viz), session metadata. Free, no auth, CORS open.
- **[Jolpica-F1](https://github.com/jolpica/jolpica-f1)** — Ergast-compatible
  replacement for season schedule, drivers'/constructors' standings, historical
  race/qualifying/sprint results.
- Cloudflare Worker proxy (oilers-score pattern) is held in reserve if either
  API surfaces a CORS or rate-limit issue once exercised in stage 1.

**Live-update strategy:** Polling with reactive diffing, not full re-render.
Cadence: 2s during a live session, 60s between sessions, 5–10min off-day.
`document.visibilitychange` pauses polling on hidden tab. `AbortController`
cancels in-flight requests on view change.

**Track visualization:** Real circuit SVGs from
[bacinger/f1-circuits](https://github.com/bacinger/f1-circuits), bundled at
build time. Per-circuit affine transform maps OpenF1 `location` x/y to SVG
coordinates. Driver dots animate via `requestAnimationFrame` interpolation
between polled samples. Fallback: oval with `lap_completion %` for any circuit
not yet calibrated.

**Preferences (localStorage, typed schema with version migrations):**
- Favorite driver (1) → drives theme via CSS custom properties
  (`--accent`, `--accent-bg`, `--accent-fg`); team-color map kept in SPEC.md
  and refreshed yearly.
- Followed drivers (multi-select) → highlighted in lists, get expanded detail
  cards.
- Default landing view, units (kph/mph), reduced-motion toggle.

**Out of scope:** push notifications, DRS indicator.

---

## Stage Plan

| # | Stage | Outcome |
|---|---|---|
| **0** | **Foundation & agent setup** | Repo scaffolded; CLAUDE.md + SPEC.md written; 2 subagents defined; Vite + Svelte 5 + TS + PWA skeleton; GitHub Pages deploy proven with a placeholder page; favicon, manifest, icons in place. |
| **1** | **API client + types** | Typed clients for OpenF1 and Jolpica, full TS types for the endpoints we'll use, polling primitive (`createPoller`) with visibility/abort handling, throwaway debug page that lists today's session and current standings to prove the pipes. |
| **2** | **Calendar + Standings views** | Mobile card-based season schedule with countdown to next session, drivers' & constructors' standings, last-race results card. Establishes the design system (cards, badges, typography, color tokens). |
| **3** | **Preferences & theming** | Settings screen, favorite-driver picker (drives theme), followed drivers (multi-select), unit toggle, default landing, reduced-motion toggle, localStorage schema + migration. Theme propagates app-wide via CSS custom properties. |
| **4** | **Live session core** | Live timing screen: driver order, gap-to-leader, interval-to-ahead, last lap, current tire, lap N/total. Reactive store updates at 2s. Session-type-aware shell (auto-detects practice / quali / sprint quali / sprint / race). State persists across polls. |
| **5** | **Session-type specializations** | Qualifying (Q1/Q2/Q3 elimination columns, who's in the drop zone). Race (pit stops, tire-strategy strip per driver, undercut/overcut indicators). Sprint variants. Practice (best laps & sector deltas). |
| **6** | **Followed-driver detail** | Expanded card per followed driver: live sector times, last 5 laps, tire age, pit history, gap trend mini-chart, on-track battle indicator (driver ahead/behind). |
| **7** | **Track visualization** | Real circuit SVGs, animated dots for all 20 cars, team-colored, favorite/followed highlighted, lap counter overlay, race-control flag overlays (yellow / red / SC / VSC). Reduced-motion fallback. |
| **8** | **PWA hardening** | Service-worker caching (static = cache-first, API = network-first with stale-while-revalidate), install prompt UX, iOS splash screens & icon variants, theme-color on Android, Lighthouse PWA score 100, "what's new" toast on SW update. |
| **9** | **Polish & extended views** | Weather card, race-control message feed (yellows/blues/penalties), safety-car / red-flag banner, off-season state, season stats (podium counts, points trends, fastest-lap counts), past race results including past qualifying and sprint results (Jolpica). Final pass: error boundaries, loading/empty skeletons, a11y audit, visual QA. |

10 sessions total. We can compress (e.g. fold 5 into 4, or split 9) once we
see how far each session actually gets in practice.

---

## Stage 0 in Detail

The agent surface stays deliberately small — two focused subagents, more is
drift.

**Subagents (in `.claude/agents/`):**
1. **`f1-data-expert`** — pre-loaded with the OpenF1 endpoint catalogue,
   Jolpica endpoint catalogue, response shapes, and "which API for which
   question" mapping. Used in stages 1, 4, 5, 6, 7.
2. **`f1-ui-component`** — pre-loaded with the design system rules from
   SPEC.md (card structure, color tokens, typography scale, spacing, motion).
   Used in stages 2, 3, 5, 6 to keep components consistent.

Skipped: circuit-data, pwa-ops, and changelog agents — one-shot enough that
the main agent handles them fine.

**Stage 0 deliverables:**
- `CLAUDE.md` — high-level project context, conventions, do/don't.
- `SPEC.md` — design system tokens (colors, type, spacing, motion), team-color
  map for the current season, supported session types, view/route map,
  localStorage schema. Grows as we go.
- `.claude/agents/f1-data-expert.md` and `.claude/agents/f1-ui-component.md`.
- Vite + Svelte 5 + TS skeleton, `vite-plugin-pwa` configured, base manifest
  with 192px / 512px / maskable icons.
- `.github/workflows/deploy.yml` for GitHub Pages.
- One placeholder route ("F1 Score — coming soon" + countdown to next race
  using a hardcoded date) so we verify deploy + PWA install end-to-end before
  any real feature work.
- README with install-to-home-screen instructions (lifted/adapted from the
  prior repos).

End of stage 0: addable to an iPhone home screen, opens with an F1 wordmark
splash, just like oilers/jays.

---

## Open Risks

Worth knowing now, none block the start:

- **OpenF1 rate limits / CORS** — documented as open, will be verified for real
  in stage 1. Fallback: drop in the oilers-score Cloudflare Worker pattern
  (~one stage-1 day of work).
- **Track-coordinate calibration** — OpenF1 `location` x/y units are
  circuit-relative and need a per-circuit affine transform. Worst case: stage 7
  ships with 6–8 calibrated circuits and falls back to the oval shape for the
  rest, with the remainder calibrated over the season.
- **Team color shifts year-to-year** (e.g. Sauber → Audi). The team-color map
  in SPEC.md is data, easy to update annually.
