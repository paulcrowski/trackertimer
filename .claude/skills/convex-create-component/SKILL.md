---
name: convex-create-component
description:
  Builds reusable Convex components with isolated tables and app-facing APIs.
  Use for new components, reusable backend modules, integrations, or component
  boundary work.
---

# Convex Create Component

Create reusable Convex components with clear boundaries and a small app-facing
API.

## When to Use

- Creating a new Convex component in an existing app
- Extracting reusable backend logic into a component
- Building a third-party integration that should own its own tables and
  workflows
- Packaging Convex functionality for reuse across multiple apps

## When Not to Use

- One-off business logic that belongs in the main app
- Thin utilities that do not need Convex tables or functions
- App-level orchestration that should stay in `convex/`
- Cases where a normal TypeScript library is enough

## Workflow

1. Ask the user what they are building and what the end goal is. If the repo
   already makes the answer obvious, say so and confirm before proceeding.
2. Choose the shape using the decision tree below and read the matching
   reference file.
3. Decide whether a component is justified. Prefer normal app code or a regular
   library if the feature does not need isolated tables, backend functions, or
   reusable persistent state.
4. Make a short plan for:
   - what tables the component owns
   - what public functions it exposes
   - what data must be passed in from the app (auth, env vars, parent IDs)
   - what stays in the app as wrappers or HTTP mounts
5. Create the component structure with `convex.config.ts`, `schema.ts`, and
   function files.
6. Implement functions using the component's own `./_generated/server` imports,
   not the app's generated files.
7. Wire the component into the app with `app.use(...)`. If the app does not
   already have `convex/convex.config.ts`, create it.
8. Call the component from the app through `components.<name>` using
   `ctx.runQuery`, `ctx.runMutation`, or `ctx.runAction`.
9. If React clients, HTTP callers, or public APIs need access, create wrapper
   functions in the app instead of exposing component functions directly.
10. Run `npx convex dev` and fix codegen, type, or boundary issues before
    finishing.

## Choose the Shape

Ask the user, then pick one path:

| Goal                                              | Shape            | Reference                           |
| ------------------------------------------------- | ---------------- | ----------------------------------- |
| Component for this app only                       | Local            | `references/local-components.md`    |
| Publish or share across apps                      | Packaged         | `references/packaged-components.md` |
| User explicitly needs local + shared library code | Hybrid           | `references/hybrid-components.md`   |
| Not sure                                          | Default to local | `references/local-components.md`    |

Read exactly one reference file before proceeding.

## Default Approach

Unless the user explicitly wants an npm package, default to a local component:

- Put it under `convex/components/<componentName>/`
- Define it with `defineComponent(...)` in its own `convex.config.ts`
- Install it from the app's `convex/convex.config.ts` with `app.use(...)`
- Let `npx convex dev` generate the component's own `_generated/` files

## Component Skeleton

A minimal local component with a table and two functions, plus the app wiring.

```ts
// convex/components/notifications/convex.config.ts
import { defineComponent } from "convex/server";

export default defineComponent("notifications");
```

```ts
// convex/components/notifications/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notifications: defineTable({
    userId: v.string(),
    message: v.string(),
    read: v.boolean(),
  }).index("by_user_read", ["userId", "read"]),
});
```

```ts
// convex/components/notifications/lib.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

export const send = mutation({
  args: { userId: v.string(), message: v.string() },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      message: args.message,
      read: false,
    });
  },
});

export const listUnread = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.string(),
      message: v.string(),
      read: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false),
      )
      .collect();
  },
});
```

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import notifications from "./components/notifications/convex.config.js";

const app = defineApp();
app.use(notifications);

export default app;
```

```ts
// convex/notifications.ts  (app-side wrapper)
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendNotification = mutation({
  args: { message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.runMutation(components.notifications.lib.send, {
      userId,
      message: args.message,
    });
    return null;
  },
});

export const myUnread = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.runQuery(components.notifications.lib.listUnread, {
      userId,
    });
  },
});
```

Note the reference path shape: a function in
`convex/components/notifications/lib.ts` is called as
`components.notifications.lib.send` from the app.

## Critical Rules

- Keep authentication in the app, because `ctx.auth` is not available inside
  components.
- Keep environment access in the app, because component functions cannot read
  `process.env`.
- Pass parent app IDs across the boundary as strings, because `Id` types become
  plain strings in the app-facing `ComponentApi`.
- Do not use `v.id("parentTable")` for app-owned tables inside component args or
