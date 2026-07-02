import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { internalMutation, mutation, query } from './_generated/server';
import {
  buildDashboard,
  buildCategoryChart,
  buildSessionHistory,
  buildSessionRecord,
  buildTrendChart,
  computeSummary,
  defaultPreferences,
  normalizeProjectName,
  sortSessionsDesc,
  toLocalDateString,
  toLocalTimeString,
} from './trackerModel';

type TrackerCtx = QueryCtx | MutationCtx;
const helperConnectedThresholdMs = 20_000;

async function requireUser(ctx: TrackerCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError('Musisz być zalogowany.');
  }
  return userId;
}

async function getActiveSession(ctx: TrackerCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('activeSessions')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .unique();
}

async function getPreferences(ctx: TrackerCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('trackerPreferences')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .unique();
}

async function getDesktopHelper(ctx: TrackerCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('desktopHelpers')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .unique();
}

function normalizeText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function normalizeOptionalProjectName(value: string | null | undefined) {
  const normalized = normalizeProjectName(value ?? '');
  return normalized || null;
}

function normalizeOptionalDesktopText(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

function buildDesktopHelperStatus(helper: Awaited<ReturnType<typeof getDesktopHelper>>) {
  if (!helper) {
    return {
      configured: false,
      connected: false,
      lastAppName: null,
      lastDomain: null,
      lastSeenAt: null,
      lastWindowTitle: null,
      platform: null,
    };
  }

  return {
    configured: true,
    connected:
      helper.lastSeenAt !== null &&
      Date.now() - helper.lastSeenAt < helperConnectedThresholdMs,
    lastAppName: helper.lastAppName,
    lastDomain: helper.lastDomain,
    lastSeenAt: helper.lastSeenAt,
    lastWindowTitle: helper.lastWindowTitle,
    platform: helper.platform,
  };
}

function issueDesktopHelperKey() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
}

function resolveActiveSessionStopTime(
  activeSession: Awaited<ReturnType<typeof getActiveSession>>,
  requestedEndTime: number | undefined,
) {
  if (!activeSession) {
    throw new ConvexError('Brak aktywnej sesji do zatrzymania.');
  }

  if (activeSession.pausedAt !== null) {
    return activeSession.pausedAt;
  }

  return requestedEndTime ?? Date.now();
}

async function assertOwnedSession(
  ctx: MutationCtx,
  userId: Id<'users'>,
  sessionId: Id<'sessions'>,
) {
  const session = await ctx.db.get(sessionId);
  if (!session || session.userId !== userId) {
    throw new ConvexError('Nie znaleziono sesji dla tego konta.');
  }
  return session;
}

export const bootstrap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [user, activeSession, sessions, preferences, desktopHelper] = await Promise.all([
      ctx.db.get(userId),
      getActiveSession(ctx, userId),
      ctx.db
        .query('sessions')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .collect(),
      getPreferences(ctx, userId),
      getDesktopHelper(ctx, userId),
    ]);
    const resolvedPreferences = preferences ?? defaultPreferences;
    const sortedSessions = sortSessionsDesc(sessions);
    return {
      user: user
        ? { id: userId, name: user.name, email: user.email, image: user.image }
        : { id: userId },
      activeSession,
      sessions: sortedSessions.slice(0, 100),
      preferences: resolvedPreferences,
      desktopHelper: buildDesktopHelperStatus(desktopHelper),
      summary: computeSummary(sortedSessions, resolvedPreferences.dailyGoalHours),
      dashboard: buildDashboard(sortedSessions),
      history: buildSessionHistory(sortedSessions.slice(0, 100)),
      charts: {
        categories: buildCategoryChart(sortedSessions),
        trend: buildTrendChart(sortedSessions),
      },
    };
  },
});

export const start = mutation({
  args: {
    category: v.string(),
    description: v.string(),
    projectName: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (await getActiveSession(ctx, userId)) {
      throw new ConvexError('Masz już aktywną sesję.');
    }
    await ctx.db.insert('activeSessions', {
      userId,
      startTime: Date.now(),
      category: normalizeText(args.category, 'inne'),
      description: normalizeText(args.description, 'Praca nad projektem'),
      pausedAt: null,
      pausedSeconds: 0,
      projectName: normalizeOptionalProjectName(args.projectName),
    });
    return null;
  },
});

export const stop = mutation({
  args: {
    whatIsDone: v.optional(v.string()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const activeSession = await getActiveSession(ctx, userId);
    const endTime = resolveActiveSessionStopTime(activeSession, args.endTime);
    if (endTime <= activeSession.startTime) {
      throw new ConvexError('Czas zakończenia sesji jest nieprawidłowy.');
    }
    await ctx.db.insert('sessions', {
      userId,
      date: toLocalDateString(activeSession.startTime),
      startTime: toLocalTimeString(activeSession.startTime),
      stopTime: toLocalTimeString(endTime),
      duration: Math.max(
        0,
        Math.floor((endTime - activeSession.startTime) / 1000) -
          activeSession.pausedSeconds,
      ),
      category: activeSession.category,
      description: activeSession.description,
      projectName: activeSession.projectName,
      whatIsDone: normalizeText(
        args.whatIsDone,
        activeSession.description || 'Zakończona sesja',
      ),
    });
    await ctx.db.delete(activeSession._id);
    return null;
  },
});

export const pause = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const activeSession = await getActiveSession(ctx, userId);
    if (!activeSession) {
      throw new ConvexError('Brak aktywnej sesji do wstrzymania.');
    }
    if (activeSession.pausedAt !== null) {
      return null;
    }
    await ctx.db.patch(activeSession._id, { pausedAt: Date.now() });
    return null;
  },
});

export const resume = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const activeSession = await getActiveSession(ctx, userId);
    if (!activeSession) {
      throw new ConvexError('Brak aktywnej sesji do wznowienia.');
    }
    if (activeSession.pausedAt === null) {
      return null;
    }
    await ctx.db.patch(activeSession._id, {
      pausedAt: null,
      pausedSeconds:
        activeSession.pausedSeconds +
        Math.max(0, Math.floor((Date.now() - activeSession.pausedAt) / 1000)),
    });
    return null;
  },
});

export const savePreferences = mutation({
  args: {
    autoPauseEnabled: v.optional(v.boolean()),
    autoPauseMinutes: v.optional(v.number()),
    dailyGoalHours: v.optional(v.number()),
    focusMode: v.optional(v.boolean()),
    stopSoundEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const current = (await getPreferences(ctx, userId)) ?? {
      userId,
      ...defaultPreferences,
    };
    const next = {
      userId,
      autoPauseEnabled: args.autoPauseEnabled ?? current.autoPauseEnabled,
      autoPauseMinutes: args.autoPauseMinutes ?? current.autoPauseMinutes,
      dailyGoalHours: args.dailyGoalHours ?? current.dailyGoalHours,
      focusMode: args.focusMode ?? current.focusMode,
      stopSoundEnabled: args.stopSoundEnabled ?? current.stopSoundEnabled,
    };
    if ('_id' in current) {
      await ctx.db.patch(current._id, next);
      return next;
    }
    await ctx.db.insert('trackerPreferences', next);
    return next;
  },
});

export const issueDesktopHelperKeyForUser = mutation({
  args: {
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const helper = await getDesktopHelper(ctx, userId);
    const helperKey = issueDesktopHelperKey();
    const next = {
      helperKey,
      lastAppName: null,
      lastDomain: null,
      lastSeenAt: null,
      lastWindowTitle: null,
      platform: (args.platform?.trim() || helper?.platform || 'macos'),
      userId,
    };

    if (helper) {
      await ctx.db.patch(helper._id, next);
    } else {
      await ctx.db.insert('desktopHelpers', next);
    }

    return { helperKey };
  },
});

export const ingestDesktopActivity = internalMutation({
  args: {
    appName: v.string(),
    capturedAt: v.optional(v.number()),
    domain: v.union(v.string(), v.null()),
    helperKey: v.string(),
    platform: v.string(),
    windowTitle: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const helper = await ctx.db
      .query('desktopHelpers')
      .withIndex('by_helperKey', (queryBuilder) =>
        queryBuilder.eq('helperKey', args.helperKey),
      )
      .unique();

    if (!helper) {
      throw new ConvexError('Nieprawidlowy klucz helpera.');
    }

    await ctx.db.patch(helper._id, {
      lastAppName: args.appName.trim() || 'Unknown',
      lastDomain: normalizeOptionalDesktopText(args.domain),
      lastSeenAt: args.capturedAt ?? Date.now(),
      lastWindowTitle: normalizeOptionalDesktopText(args.windowTitle),
      platform: args.platform.trim() || helper.platform,
    });
    return null;
  },
});

export const addManualSession = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    stopTime: v.string(),
    category: v.string(),
    description: v.string(),
    projectName: v.union(v.string(), v.null()),
    whatIsDone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await ctx.db.insert('sessions', {
      userId,
      ...buildSessionRecord(
        {
          ...args,
          projectName: normalizeOptionalProjectName(args.projectName),
        },
        normalizeText,
        ConvexError,
      ),
    });
    return null;
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id('sessions'),
    date: v.string(),
    startTime: v.string(),
    stopTime: v.string(),
    category: v.string(),
    description: v.string(),
    projectName: v.union(v.string(), v.null()),
    whatIsDone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await assertOwnedSession(ctx, userId, args.sessionId);
    await ctx.db.patch(
      args.sessionId,
      buildSessionRecord(
        {
          ...args,
          projectName: normalizeOptionalProjectName(args.projectName),
        },
        normalizeText,
        ConvexError,
      ),
    );
    return null;
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await assertOwnedSession(ctx, userId, args.sessionId);
    await ctx.db.delete(args.sessionId);
    return null;
  },
});
