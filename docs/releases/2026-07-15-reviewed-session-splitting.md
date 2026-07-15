# Release: reviewed session splitting — 2026-07-15

## What shipped

- reviewed helper blocks for work, private time, and distractions
- configurable session splitting at STOP
- helper privacy levels and explicit high-privacy trade-off
- cleanup suggestions for adjacent short fragments
- safe fragment merging that preserves different notes and rejects duplicate IDs
- updated English, Polish, and compatibility README documentation

## Release proof

- source merge: `f086fbc` — reviewed session splitting and privacy controls
- hardening merge: `1ee0c20` — session fragment merge safety
- Convex production: `uncommon-cuttlefish-79` (`https://uncommon-cuttlefish-79.convex.cloud`)
- frontend: [worktimer-5gn.pages.dev](https://worktimer-5gn.pages.dev)
- latest Pages release URL: `https://118be6eb.worktimer-5gn.pages.dev`
- local gate: `npm run ci` — typecheck, 56 tests, and build passed
- public frontend smoke: HTTP 200
- helper endpoint without a key: HTTP 401 `Missing helper key.`
- production bundle contains the production Convex URL

## Scope notes

The untracked legacy `artifacts/` and `video/` directories were intentionally
left out of the release. The full authenticated helper smoke was not run with a
real key, so no test activity was written to a user's production history.
