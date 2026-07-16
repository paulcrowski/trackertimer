# Worktimer

[English — canonical README](./README.md) · [Polski](./README.pl.md)

![Worktimer — manual timer and smart automatic activity detection](./docs/assets/worktimer-overview.jpg)

> The canonical English documentation is now the repository's main
> [README.md](./README.md). This compatibility file remains available for
> existing links.

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
five seconds it captures the foreground application, its window title, and —
when available — the active browser-tab domain. Samples stay local first: the
helper groups them into compact context blocks in a small JSON buffer, exposes
live status to the page over localhost, and sends only a summary checkpoint
about every 15 minutes plus the final summary at STOP. No SQLite installation
or local copy of the repository is required.

The page sends a short local lease heartbeat only while the timer is running.
If the timer is stopped, paused, or the page disappears, the lease expires and
the helper stops capturing. Cloud summaries are idempotent by session and
revision, so retrying a checkpoint cannot duplicate the same work.

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

### Splitting a session at STOP

The default **Session split when saving** option prepares separate entries only
for private-time and distraction blocks. Work blocks stay together. Choose
**Every helper context** to prepare one entry per detected context, or **Never
split automatically** to keep one final entry. Nothing is saved until you
review and confirm the STOP dialog. A single block does not show a confusing
multi-entry option.

Built-in rules treat Signal as private time and YouTube, Instagram, Tinder,
Reddit, Wykop, X, Facebook, and Allegro as distractions. You can correct every
block before saving. With **High — store app only** privacy, browser domains are
hidden, so sites such as YouTube cannot be identified as distractions; that is
the privacy trade-off.

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
- the privacy level can store full context, mask sensitive title text, or store
  only the app name
- the helper does not silently start or save work sessions
- the regular timer works without the helper

The repo ships with a ready launcher:

```bash
node worktimer-helper.mjs --url "<ingest-url>" --key "<helper-key>"
```

The downloaded macOS starter also includes `worktimer-helper-macos.command`.
Run it without changing file permissions:

```bash
zsh worktimer-helper-macos.command
```

Do not run the downloaded file as `./worktimer-helper.mjs`, because browser
downloads do not receive executable permission. The helper identifies Codex by
its application bundle (even when the process is named `ChatGPT`) and recognizes
common terminals: Terminal, iTerm2, Warp, Ghostty, Alacritty, kitty, WezTerm,
Hyper, Windows Terminal, PowerShell, Command Prompt, WSL, and Git Bash. While a
session is active, the final review loads that session's full sample window
instead of only a few recent samples.

## Checks

Main commands:

```bash
npm run typecheck
npm test
npm run build
npm run ci
```

`npm run ci` runs the same simple check set used by the repository's GitHub
Actions workflow: typecheck, tests, and build.

## Deployment

The frontend build needs a real `VITE_CONVEX_URL`.

This repository includes a production command that pins the correct Convex
deployment and prevents a local backend URL from leaking into a release build:

```bash
npm run build:production
npm run deploy:production
```

A git push alone does not publish the static frontend. After deploying, verify
the public Pages URL (HTTP 200), sign-in, a short start/STOP flow, and the split
settings. Without a helper key, the Convex endpoint should return `401`, not
`404`.

Example for your own deployment:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud" npm run build
```

## Documentation

- [Polish README](./README.pl.md)
- [Human worklog from July 15–16, 2026](./docs/worklog-2026-07-15-2026-07-16.md)

After that you can deploy the frontend wherever you want. The repo is built
around Vite + Convex, so static hosting for `dist/` plus a Convex backend is
the natural setup.

## Notes

- `Private local` does not sync across devices.
- The desktop helper is optional and not required for normal time tracking.
- If you want to publish your own version, configure your own Convex deployment
  and OAuth credentials first.
