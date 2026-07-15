# Worktimer

[English](./README.md) · [Polski](./README.pl.md) · [Live app](https://worktimer-5gn.pages.dev)

![Worktimer — manual timer and smart automatic activity detection](./docs/assets/worktimer-overview.jpg)

Worktimer is a manual-first time tracker with an optional desktop automation
layer for macOS and Windows. You decide when work starts and stops; the helper
adds evidence about the foreground apps, browser domains, and window titles
used during that session.

It supports two storage modes:

- **Google / cloud** — one account, shared history, and one timer across devices.
- **Private local** — timer data stays in this browser on this device.

## How we used Codex and GPT-5.6

Codex was part of the implementation workflow, not just a writing assistant. I
used it to inspect the existing tracker, design and implement the optional
desktop helper, connect activity samples to the stop-session summary, improve
privacy masking, and verify the macOS and Windows flows. Codex also helped bring
the English product flow into the app and check changes with targeted tests and
real browser runs.

GPT-5.6 helped with the reasoning and iteration behind those changes: turning
the problem of exhausting manual time entry into a practical manual-first
workflow, reviewing edge cases around focus loss and private activity, and
refining the user-facing summary. The helper creates useful context and a draft
summary, while the user can review, edit, or delete it before saving.

## Why this project exists

Most automatic trackers either collect too much or pretend that every open app
is productive work. Worktimer keeps the timer under human control and uses
automation only to answer useful questions at STOP:

- Which apps and websites were actually in the foreground?
- How much of the session was confirmed by the helper?
- Which blocks were work, distractions, or private activity?
- Did focus move away from work?
- Is the final record correct before it is saved?

## Main features

- manual START, pause, resume, and STOP
- editable activity review before saving
- optional automatic activity detection on macOS and Windows
- one cloud timer shared by multiple computers
- project suggestions based on app and domain rules
- optional auto-pause after helper silence
- private-domain masking before activity is stored
- manual session editing and CSV export
- Pomodoro, notifications, dashboard summaries, and PWA installation
- English and Polish interface

## How the automation works

The desktop helper is optional and is available in **Auto** mode with cloud
sync. It never starts or saves a work session without your decision.

| Stage | What happens |
| --- | --- |
| 1. START | You start a real work session manually. |
| 2. Observe | About every five seconds, the helper reads the foreground application and window title. For supported browsers it also reads the active tab domain. |
| 3. Protect | User-defined private domains are masked before the sample is stored. |
| 4. Store | Convex stores context changes and periodic heartbeats rather than treating every poll as a separate work entry. |
| 5. Review | At STOP, the complete active-session sample window is merged into readable blocks. |
| 6. Correct | You can relabel every block as work, distraction, or private time. |
| 7. Save | Only the reviewed result is written to session history. |

### Automatic splitting at STOP

The default **Session split when saving** option prepares separate entries only
for private-time and distraction blocks. Work blocks stay together. You can
choose **Every helper context** when you want every detected context prepared
as its own entry, or **Never split automatically** to keep one final entry.
Nothing is written until you review and confirm the STOP dialog. A session with
only one block does not show a pointless multi-entry option.

Built-in rules treat Signal as private time and YouTube, Instagram, Tinder,
Reddit, Wykop, X, Facebook, and Allegro as distractions. You can correct every
classification before saving. With **High — store app only** privacy, browser
domains are intentionally hidden, so website-based distraction rules cannot
identify YouTube or similar sites; app-only privacy is the trade-off.

The status beside the timer shows whether Auto is connected, which app/domain
is currently visible, and when the last helper signal arrived.

### What the helper detects

- foreground desktop application
- active window title
- active browser-tab domain where the browser exposes it
- Codex by its macOS application identifier, even when its process is named
  `ChatGPT`
- common development tools and terminals, including Terminal, iTerm2, Warp,
  Ghostty, Alacritty, kitty, WezTerm, Hyper, Windows Terminal, PowerShell,
  Command Prompt, WSL, Git Bash, VS Code, Cursor, Zed, Windsurf, and Xcode
- Chrome-installed Worktimer and PoprostuKoduj apps instead of the generic
  `app_mode_loader` label

The helper observes the foreground window. OBS, DaVinci Resolve, ScreenFlow,
or another recorder running only in the background does not replace the app in
which the work is happening.

### Understanding helper coverage

`Missing helper coverage` is time for which Worktimer has no fresh, trustworthy
helper signal. Typical causes are:

- the helper was started after the timer
- the helper process was stopped
- the computer slept or lost network access
- an obsolete key or launcher was used

Short gaps at the beginning and end are covered when a fresh signal arrives
within the connection threshold. During an active session the app loads that
session's full stored activity window, not only the latest status cards.

### Privacy model

- helper automation is opt-in
- the regular manual timer works without the helper
- tracking can be paused for 15 minutes, 60 minutes, or indefinitely
- private domains are configured by the user
- private domains and their window titles are masked before storage
- privacy level can store full context, mask sensitive title text, or store only
  the app name
- the STOP review can always override the suggested classification

## Using Mac and Windows together

Cloud mode has one active timer per account. The app may stay open on multiple
computers, while repeated START or STOP requests are handled safely.

Each computer should have its own helper key and starter:

1. Open **Auto** mode and expand **Automatic activity detection**.
2. Generate a helper key.
3. Download the starter for that computer.
4. Repeat on the other computer with a new key.

Creating a starter for another device does not revoke helpers that are already
running elsewhere.

## Running the desktop helper

### macOS starter

Download the Mac starter and keep its files in one folder. Then run:

```bash
zsh worktimer-helper-macos.command
```

Do not launch a browser-downloaded helper as `./worktimer-helper.mjs`; browser
downloads do not receive executable permission. The `.command` launcher already
contains the generated URL and key.

### Windows starter

Download the Windows starter, keep its files together, and run:

```text
worktimer-helper-windows.cmd
```

### Repository launcher

When running directly from a cloned repository:

```bash
node worktimer-helper.mjs --url "<ingest-url>" --key "<helper-key>"
```

Keep the terminal window open while the timer is running.

## Storage modes

### Google / cloud

Use this mode when you want:

- Google sign-in and Convex synchronization
- the same history on multiple devices
- the shared cloud timer
- desktop-helper automation and project rules

### Private local

Use this mode when you want:

- no sign-in
- no tracker queries or mutations sent to Convex
- data stored only in IndexedDB on the current device

If durable browser storage is unavailable, the app fails visibly instead of
pretending that data is being saved.

## Local development

Requirements:

- Node.js 22+
- a Convex project or your own Convex deployment

Install dependencies:

```bash
npm install
```

Set the frontend backend URL in `.env.local` or `.env`:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud"
```

Run Convex and Vite:

```bash
npx convex dev
npm run dev
```

The frontend starts at `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run ci
```

`npm run ci` runs type checking, the test suite, and a production-style build.

## Deployment

Deploy Convex first, then build the frontend against that production URL. A git
push alone does not publish the static frontend:

```bash
npx convex deploy
npm run deploy:production
```

After deployment, verify the public Pages URL loads with HTTP 200 and run a
logged-in browser smoke for start/stop, the STOP review, and the split settings.
For the helper endpoint, an unauthenticated POST should return `401`, not
`404`; use a real helper key only for an authenticated smoke check.

For another environment:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud" npm run build
```

Deploy the generated `dist/` directory to a static host such as Cloudflare
Pages. Configure your own Convex deployment and OAuth credentials before
publishing a fork.

## Documentation

- [Polish README](./README.pl.md)
- [English compatibility path](./README.en.md)
- [Codex handoff and rebuild notes](./docs/codex-handoff-2026-07-07/START_HERE.md)

## License and responsibility

This repository contains a productivity tool, not an employee-monitoring
system. Review privacy, retention, authentication, and deployment settings
before using it with other people or accounts.
