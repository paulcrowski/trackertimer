# worktimer

[Polska wersja](./README.pl.md)

`worktimer` is a small work-tracking app with two modes:

- `Google / cloud` if you want one account and shared history across devices.
- `Private local` if you want data stored only in this browser on this device.

This project is not trying to auto-track everything behind the user's back.
The core product contract is still manual session start and manual session stop.
The desktop helper is optional.

## What is interesting here

- two honest modes: synced `Google / cloud` and device-only `Private local`
- manual-first tracking instead of fake "full AI automation"
- an optional desktop helper that can suggest context and support auto-pause
- CSV export, Pomodoro, and PWA installability in one compact app

## Live demo

- [worktimer-5gn.pages.dev](https://worktimer-5gn.pages.dev)

## What it does

- start, pause, and stop an active session
- add, edit, and delete sessions manually
- export history to CSV
- show a small dashboard with trends and summaries
- run a local Pomodoro timer with notifications
- offer an optional desktop helper for advanced mode
- work as an installable PWA

## How the two modes work

### Google / cloud

This mode uses Convex and Google sign-in. It is the right choice when you want:

- the same account on multiple devices
- history that survives a machine change
- the full advanced flow with the desktop helper

### Private local

This mode stores data locally in the browser on the current device. It is the
right choice when you want:

- to start without signing in
- no backend sync
- a private tracker for one machine only

If the browser cannot provide durable local storage, the app fails loudly
instead of pretending your data is safe.

## Local setup

Requirements:

- Node.js 22+
- a local Convex project or your own Convex deployment

Install:

```bash
npm install
```

Run in development:

```bash
npx convex dev
npm run dev
```

The frontend starts on `http://localhost:3000` by default.

## Environment variable

Copy `.env.example` and set:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud"
```

In local development, `npx convex dev` usually fills this in for you.

## Desktop helper

The desktop helper is an add-on for advanced mode. It captures the active app
or browser domain and sends that context to the ingest endpoint.

In practice this means:

- you still start and stop sessions manually
- the helper can suggest a project or support auto-pause
- the helper currently supports macOS and Windows

The repo ships with a ready launcher:

```bash
node worktimer-helper.mjs --url "<ingest-url>" --key "<helper-key>"
```

## Checks

Main commands:

```bash
npm run typecheck
npm test
npm run build
npm run ci
```

`npm run ci` runs the same simple public check set used in GitHub Actions:
typecheck, tests, and build.

## Deployment

The frontend build needs a real `VITE_CONVEX_URL`.

Example:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud" npm run build
```

After that you can deploy the frontend wherever you want. The repo is built
around Vite + Convex, so static hosting for `dist/` plus a Convex backend is
the natural setup.

## Notes

- `Private local` does not sync across devices.
- The desktop helper is optional and not required for normal time tracking.
- If you want to publish your own version, configure your own Convex deployment
  and OAuth credentials first.
