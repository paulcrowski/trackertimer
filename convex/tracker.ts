import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import {
  buildDashboard,
  buildCategoryChart,
  buildSessionRecord,
  buildSessionHistory,
  buildTrendChart,
  computeSummary,
  defaultPreferences,
  sortSessionsDesc,
  toLocalDateString,
  toLocalTimeString,
  type SessionDoc,
} from './trackerModel';

type TrackerCtx = QueryCtx | MutationCtx;

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

function normalizeText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

async function assertOwnedSession(ctx: MutationCtx, userId: Id<'users'>, sessionId: Id<'sessions'>) {
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
    const [user, activeSession, sessions, preferences] = await Promise.all([
      ctx.db.get(userId),
      getActiveSession(ctx, userId),
      ctx.db
        .query('sessions')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .collect(),
      getPreferences(ctx, userId),
    ]);
    const resolvedPreferences = preferences ?? defaultPreferences;
    const sortedSessions = sortSessionsDesc(sessions);
    return {
      user: user ? { name: user.name, email: user.email, image: user.image } : null,
      activeSession,
      sessions: sortedSessions.slice(0, 100),
      preferences: resolvedPreferences,
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
  args: { category: v.string(), description: v.string() },
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
    if (!activeSession) {
      throw new ConvexError('Brak aktywnej sesji do zatrzymania.');
    }
    const endTime = args.endTime ?? Date.now();
    if (endTime <= activeSession.startTime) {
      throw new ConvexError('Czas zakończenia sesji jest nieprawidłowy.');
    }
    await ctx.db.insert('sessions', {
      userId,
      date: toLocalDateString(activeSession.startTime),
      startTime: toLocalTimeString(activeSession.startTime),
      stopTime: toLocalTimeString(endTime),
      duration: Math.floor((endTime - activeSession.startTime) / 1000),
      category: activeSession.category,
      description: activeSession.description,
      whatIsDone: normalizeText(
        args.whatIsDone,
        activeSession.description || 'Zakończona sesja',
      ),
    });
    await ctx.db.delete(activeSession._id);
    return null;
  },
});

export const savePreferences = mutation({
  args: {
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

export const addManualSession = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    stopTime: v.string(),
    category: v.string(),
    description: v.string(),
    whatIsDone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await ctx.db.insert('sessions', {
      userId,
      ...buildSessionRecord(args, normalizeText, ConvexError),
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
    whatIsDone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await assertOwnedSession(ctx, userId, args.sessionId);
    await ctx.db.patch(
      args.sessionId,
      buildSessionRecord(args, normalizeText, ConvexError),
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
