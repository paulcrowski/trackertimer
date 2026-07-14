# worktimer

[Polska wersja](./README.pl.md)

`worktimer` is a small work-tracking app with two modes:

- `Google / cloud` if you want one account and shared history across devices.
- `Private local` if you want data stored only in this browser on this device.

This project is not trying to auto-track everything behind the user's back.
The core product contract is still manual session start and manual session stop.
The desktop helper is optional.

## Language selection

The app starts in English for a new browser. Choose `PL` or `EN` on the startup
mode picker or in the workspace header. The selection is persisted locally under
`worktimer.language` and changes interface copy and date formatting only.

Language selection does not change timer state, the manual-first contract,
desktop-helper opt-in behavior, privacy masking, focus-loss summaries, or the
stored category keys used by existing sessions.

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

The desktop helper is an optional automation layer for macOS and Windows. Every
few seconds it captures the foreground application, its window title, and —
when available — the active browser-tab domain. Samples are sent to a protected
Convex ingest endpoint and assigned to the signed-in account.

In practice this means:

- you still decide when a real work session starts and ends
- a fresh helper context can be used to start a session
- app and domain rules can suggest a project
- missing helper heartbeats can trigger optional auto-pause
- STOP shows a review of work contexts, distractions, private blocks, and
  periods without helper coverage
- the review can be corrected before saving; helper output is evidence, not an
  unquestionable source of truth

### STOP activity review

Samples are converted into readable activity blocks. Repeated apps and domains
are grouped, and short activity is displayed in seconds instead of misleading
`0h 0m` entries. User-configured private domains are masked before storage, so
the backend receives `Private domain` rather than the site name and window
title.

`Missing helper coverage` means that no recent, trustworthy sample covered that
part of the timer session. Typical causes include a stopped helper, an obsolete
key, a sleeping computer, or starting the helper after the timer.

The helper observes the foreground window. If OBS, ScreenFlow, or another tool
records in the background, the report keeps the app where the work happens,
such as Canva or Chrome. This avoids counting the same period twice as both
“recording” and “work in an app.”

### Using Mac and Windows at the same time

Cloud mode has one shared timer session per account. The app can stay open on a
Mac and a Windows machine: both screens control the same timer, while repeated
START and STOP requests are safe and do not create duplicate sessions.

Each computer should use its own starter and helper key:

1. Expand `Automatic activity detection` on the first computer.
2. Generate a key and download the starter for that operating system.
3. Repeat on the second computer.

Adding another device no longer revokes helpers that are already running.

### Privacy and control

- helper tracking can be disabled or paused for 15 minutes, 60 minutes, or
  indefinitely
- private domains are controlled by the user
- private activity is masked before the sample is stored
- the helper does not silently start or save work sessions
- the regular timer works without the helper

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

This repository includes a production command that pins the correct Convex
deployment and prevents a local backend URL from leaking into a release build:

```bash
npm run build:production
npm run deploy:production
```

Example for your own deployment:

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
