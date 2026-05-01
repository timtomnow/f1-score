# F1 Score

A mobile-first Formula 1 PWA — live timing, schedule, standings, and
track view. Installable on Android and iPhone home screens. Hosted on
GitHub Pages, no backend.

> **Status: Stage 0 (foundation).** The placeholder shows a countdown to
> the next race. Real features land stage by stage — see [PLAN.md](PLAN.md).

## What's planned

- Live timing for practice, qualifying, sprint, and race sessions
- Drivers' and constructors' standings, season schedule, last-race results
- Per-driver detail (sectors, tires, pit history, gap trends) for the
  drivers you choose to follow
- Real-circuit track visualization with animated car dots
- Per-user customization: favorite driver (drives the theme color),
  followed drivers, default landing view, units, reduced-motion toggle —
  all persisted locally
- Past race / qualifying / sprint results, weather, race-control feed,
  safety-car & red-flag banners, off-season state, season stats

## Stack

- Svelte 5 + TypeScript, built with Vite 6
- `vite-plugin-pwa` for the manifest + service worker
- Direct browser access to **OpenF1** (live timing & telemetry) and
  **Jolpica-F1** (Ergast-compatible historical) — no proxy, no auth
- Deployed to GitHub Pages via Actions on every push to `main`

## Develop

```sh
npm install
npm run dev      # local dev server
npm run check    # svelte-check (type + a11y)
npm run build    # type-check then production build into dist/
npm run preview  # serve dist/ locally
```

## Install on your phone

On **Android** (Chrome): visit the site and tap the "Add to Home Screen"
banner that appears at the bottom of the screen.

On **iPhone** (Safari): tap the Share button → "Add to Home Screen".

The app installs with a custom icon and opens full-screen without a
browser address bar. Both portrait and landscape orientations are
supported.

## Project layout

```
src/
  App.svelte          root component
  main.ts             mount entry
  app.css             global tokens + resets (CSS custom properties)
  lib/                shared logic (api clients, stores, helpers)
public/               static assets (icon.svg, etc.)
.claude/agents/       focused subagents (f1-data-expert, f1-ui-component)
.github/workflows/    GH Pages deploy
PLAN.md               staged roadmap
SPEC.md               design system, team colors, routes, prefs schema
CLAUDE.md             AI-assistant context for this repo
```

## License

MIT — © 2026 timtomnow
