---
name: convex-quickstart
description:
  Creates or adds Convex to an app. Use for new Convex projects, npm create
  convex@latest, frontend setup, env vars, or the first npx convex dev run.
---

# Convex Quickstart

Set up a working Convex project as fast as possible.

## When to Use

- Starting a brand new project with Convex
- Adding Convex to an existing React, Next.js, Vue, Svelte, or other app
- Scaffolding a Convex app for prototyping

## When Not to Use

- The project already has Convex installed and `convex/` exists - just start
  building
- You only need to add auth to an existing Convex app - use the
  `convex-setup-auth` skill

## Workflow

1. Determine the starting point: new project or existing app
2. If new project, pick a template and scaffold with `npm create convex@latest`
3. If existing app, install `convex` and wire up the provider
4. Run `npx convex dev --once` to provision a local anonymous deployment, push
   the current `convex/` code, typecheck it, and regenerate types — all in one
   shot, exiting cleanly. The output tells the agent whether the schema and
   functions are valid.
5. Ask the user (or, for cloud agents, start in the background) `npm run dev` —
   Convex templates wire the watcher and the frontend into a single command. If
   the project has no combined dev script, use `npx convex dev` for the watcher
   and run the frontend separately.
6. Verify the setup works

## Path 1: New Project (Recommended)

Use the official scaffolding tool. It creates a complete project with the
frontend framework, Convex backend, and all config wired together.

### Pick a template

| Template                   | Stack                                     |
| -------------------------- | ----------------------------------------- |
| `react-vite-shadcn`        | React + Vite + Tailwind + shadcn/ui       |
| `nextjs-shadcn`            | Next.js App Router + Tailwind + shadcn/ui |
| `react-vite-clerk-shadcn`  | React + Vite + Clerk auth + shadcn/ui     |
| `nextjs-clerk`             | Next.js + Clerk auth                      |
| `nextjs-convexauth-shadcn` | Next.js + Convex Auth + shadcn/ui         |
| `nextjs-lucia-shadcn`      | Next.js + Lucia auth + shadcn/ui          |
| `bare`                     | Convex backend only, no frontend          |

If the user has not specified a preference, default to `react-vite-shadcn` for
simple apps or `nextjs-shadcn` for apps that need SSR or API routes.

You can also use any GitHub repo as a template:

```bash
npm create convex@latest my-app -- -t owner/repo
npm create convex@latest my-app -- -t owner/repo#branch
```

### Scaffold the project

Always pass the project name and template flag to avoid interactive prompts:

```bash
npm create convex@latest my-app -- -t react-vite-shadcn
cd my-app
npm install
```

The scaffolding tool creates files but does not run `npm install`, so you must
run it yourself.

To scaffold in the current directory (if it is empty):

```bash
npm create convex@latest . -- -t react-vite-shadcn
npm install
```

### Provision the deployment and push code

Run this yourself — it is a one-shot command that exits cleanly:

```bash
npx convex dev --once
```

In a non-TTY environment (which is true for almost every agent run), this:

- Provisions an _anonymous_ local Convex backend bound to `127.0.0.1`. No
  browser login, no team/project prompts.
- Writes `CONVEX_DEPLOYMENT` and the framework's `*_CONVEX_URL` variables to
  `.env.local`.
- Generates `convex/_generated/`.
- Pushes the current `convex/` code to the deployment, **typechecks it**, and
  **validates the schema**. The agent reads this output to find out if the code
  it just wrote is broken.

To be explicit (recommended), set `CONVEX_AGENT_MODE=anonymous` so the behavior
does not depend on TTY detection:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev --once
```

The deployment lives under `~/.convex/` and persists across runs. Re-running
`convex dev --once` after editing `convex/` files is the agent's main feedback
loop while the user-launched `npm run dev` is not in use.

If the template's `package.json` defines a `predev` script (Convex Auth
templates and similar do), `npm run predev` runs `convex init` plus any one-time
setup (e.g. minting auth keys). Use it _in addition to_ `convex dev --once` when
present — `predev` handles the one-time setup, `convex dev --once` pushes and
validates the code.

### Start the dev loop

In most Convex templates, `npm run dev` runs both the Convex watcher and the
frontend dev server together (typically `convex dev --start 'vite --open'` or
the Next.js equivalent). That is what the user should run.

```bash
npm run dev
```

If the project does not have a combined `dev` script — e.g. the `bare` template,
or an existing app where you haven't wired the frontend dev server into Convex's
`--start` flag — the user can run the Convex watcher directly:

```bash
npx convex dev
```

`npx convex dev` is the same long-running watcher `npm run dev` invokes under
the hood; it just doesn't start the frontend. Use it when there is no frontend,
or when the user prefers to run the frontend in a separate terminal.

Either way, the agent should not invoke the watcher in the foreground because it
does not exit. Two options:

- **Local development (user is at the keyboard):** ask the user to run
  `npm run dev` (or `npx convex dev`) in a terminal. The deployment provisioned
  by `convex dev --once` above is already selected, so the watcher picks up
  immediately with no prompts.
- **Cloud or headless agents:** start `npm run dev` (or `npx convex dev`) in the
  background.

Vite apps serve on `http://localhost:5173`, Next.js on `http://localhost:3000`.

### What you get

After scaffolding, the project structure looks like:

```
my-app/
  convex/           # Backend functions and schema
    _generated/     # Auto-generated types (check this into git)
    schema.ts       # Database schema (if template includes one)
  src/              # Frontend code (or app/ for Next.js)
  package.json
  .env.local        # CONVEX_URL / VITE_CONVEX_URL / NEXT_PUBLIC_CONVEX_URL
```

The template already has:

- `ConvexProvider` wired into the app root
- Correct env var names for the framework
- Tailwind and shadcn/ui ready (for shadcn templates)
- Auth provider configured (for auth templates)

Proceed to adding schema, functions, and UI.

## Path 2: Add Convex to an Existing App

Use this when the user already has a frontend project and wants to add Convex as
the backend.

### Install

```bash
npm install convex
```

### Provision and push

Run `npx convex dev --once` yourself to provision a local anonymous deployment,
write `.env.local`, generate types, push the current `convex/` code, and
typecheck it. This is one-shot and exits:

```bash
npx convex dev --once
```

