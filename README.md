# worktimer

[Polski](./README.pl.md) | [English](./README.en.md)

`worktimer` is a small work-tracking app built with React and Convex. It lets
you track time in two ways:

- `Google / cloud` when you want one account shared across devices.
- `Private local` when you want everything kept only in your browser on this device.

The app also includes CSV export, a Pomodoro timer, and an optional macOS and
Windows desktop helper. The helper captures foreground-app and browser-domain
context, supports project suggestions and auto-pause, and builds an editable
activity review when a session is stopped.

## Why it is interesting

- Two honest storage modes: synced `Google / cloud` and device-only `Private local`
- Manual-first tracking instead of fake "AI automation"
- Optional desktop helper that can suggest context and support auto-pause
- One shared cloud timer across computers, with independent helper keys for Mac
  and Windows
- Editable STOP review with grouped activity, privacy masking, distraction
  signals, and honest missing-coverage reporting
- CSV export, Pomodoro, and PWA installability in one small app

## Live demo

- [worktimer-5gn.pages.dev](https://worktimer-5gn.pages.dev)

## Quick start

```bash
npm install
npx convex dev
npm run dev
```

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## More

- [README.pl.md](./README.pl.md) for Polish docs
- [README.en.md](./README.en.md) for English docs
