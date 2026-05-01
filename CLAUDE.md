# Claude context — f1-score

A mobile-first Formula 1 PWA. Sibling to `oilers-score` and `bluejays-score`,
deliberately stepping up in complexity for live timing, multiple session
types, customization, and track visualization.

The roadmap and stage breakdown live in [PLAN.md](PLAN.md). Read it before
starting any non-trivial work — every change should map to a stage.

The design system, team colors, route map, and localStorage schema live in
[SPEC.md](SPEC.md). Update SPEC.md whenever you touch design tokens or
data shapes; treat it as the source of truth those decisions point back to.

## Stack

- **Svelte 5** + TypeScript (strict)
- **Vite 6** as the build tool
- **vite-plugin-pwa** for manifest + service worker
- No backend. Browser hits **OpenF1** (live data) and **Jolpica** (historical)
  directly. CORS is open on both. If that ever changes, drop in the
  oilers-score Cloudflare Worker pattern as a proxy.
- Deployed to GitHub Pages at `https://timtomnow.github.io/f1-score/`
  via `.github/workflows/deploy.yml` (push to `main` builds and publishes
  `dist/` to `gh-pages`).
- Vite `base: '/f1-score/'` — keep this in mind when writing asset paths
  or routing.

## Commands

```sh
npm install
npm run dev       # local dev server
npm run check     # svelte-check (type + a11y)
npm run build     # type-check then production build into dist/
npm run preview   # serve dist/ locally to test the built bundle
```

## Project layout

```
src/
  App.svelte          # root component (current stage's view)
  main.ts             # mount entry
  app.css             # global tokens + resets (CSS custom properties)
  lib/                # shared logic (api clients, stores, types, helpers)
  components/         # reusable Svelte components (added in stage 2)
  views/              # top-level views per route (added in stage 2)
public/               # static assets copied as-is (icon.svg, etc.)
.claude/agents/       # focused subagents (f1-data-expert, f1-ui-component)
.github/workflows/    # GH Pages deploy
```

## Conventions

- **No comments except for non-obvious WHY.** Don't restate what code does.
- **Edit existing files; don't create new ones unless required.**
- **No emojis** in code or docs unless explicitly requested.
- **Tabs/indentation match the surrounding file.** Two spaces here.
- Use the design tokens in [SPEC.md](SPEC.md) — never hardcode colors,
  spacing, or radii inline. If a value is missing from the system, add it
  to SPEC.md and `app.css` first.
- Prefer Svelte 5 runes (`$state`, `$derived`, `$effect`) over the legacy
  reactive syntax.
- Keep the bundle tight. Reach for a dependency only if the equivalent
  hand-rolled code would be >100 LOC or genuinely tricky (date math is
  fine, charts are not — yet).

## Subagents

Two subagents in `.claude/agents/`:
- **`f1-data-expert`** — F1 API surface (OpenF1 + Jolpica). Use it whenever
  you need to figure out which endpoint provides a piece of data, or to
  recall a response shape.
- **`f1-ui-component`** — UI/component conventions. Use it when building or
  modifying Svelte components so the design system stays consistent.

## Git commits

**Never run `git commit` or `git push`.** The user reviews and commits every
change themselves. This applies even when a task feels obviously "done" —
stop at staging-ready.

When work is complete, output a **suggested commit title** and **suggested
commit body** as two separate fenced code blocks so each can be copied
independently. Format:

> Suggested commit title:
> ```
> short imperative title under ~70 chars
> ```
>
> Suggested commit body:
> ```
> 1–4 bullet points or short paragraphs covering the why
> and any non-obvious details. Wrap at ~72 chars.
> ```

Title style: imperative, present tense, no trailing period, no
Conventional-Commits prefix (match the existing repo style — see `git log`).
Body style: focus on *why*, not a restatement of the diff. Skip a body if
the title fully covers it.

Do **not** include a `Co-Authored-By` trailer or any "Generated with" line —
the user wants clean authorship.

## Don't

- Don't introduce a build-time backend, SSR, or serverless function unless a
  CORS or rate-limit issue forces it (then use the oilers-score Worker
  pattern).
- Don't add push notifications or DRS indicators — explicitly out of scope.
- Don't ship features past the current stage. Park future-stage ideas in
  PLAN.md or SPEC.md instead.
- Don't commit secrets or API keys. Neither API needs auth.
