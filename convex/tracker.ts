import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { internalMutation, mutation, query } from './_generated/server';
import { hashDesktopHelperKey, issueDesktopHelperKey } from './helperKey';
import {
  buildDashboard,
  buildCategoryChart,
  buildRecentProjects,
  buildSessionHistory,
  buildSessionCleanupGroups,
  buildManualSessionRecords,
  buildStoppedSessionRecordsFromParts,
  buildStoppedSessionRecords,
  buildTrendChart,
  computeSummary,
  defaultPreferences,
  normalizeProjectName,
  sortSessionsDesc,
  normalizeDesktopPrivacyLevel,
  sanitizeDesktopWindowTitle,
} from './trackerModel';

type TrackerCtx = QueryCtx | MutationCtx;
const helperConnectedThresholdMs = 20_000;
const desktopActivityLogIntervalMs = 60_000;
const desktopActivityLogLimit = 512;
const desktopSessionActivityLimit = 2048;
const bootstrapSessionDisplayLimit = 100;
const bootstrapSessionFetchLimit = 1001;
const helperTimestampSkewLimitMs = 5 * 60_000;
const desktopTrackingDefaults = {
  desktopTrackingEnabled: true,
  desktopTrackingManualPause: false,
  desktopTrackingPausedUntil: null,
  privateDomainsText: '',
};
type ResolvedTrackerPreferences = {
  autoPauseEnabled: boolean;
  autoPauseMinutes: number;
  autoSplitMode: 'private-distraction' | 'all-contexts' | 'never';
  dailyGoalHours: number;
  desktopPrivacyLevel: 'low' | 'standard' | 'high';
  desktopTrackingEnabled: boolean;
  desktopTrackingManualPause: boolean;
  desktopTrackingPausedUntil: number | null;
  focusMode: boolean;
  privateDomainsText: string;
  stopSoundEnabled: boolean;
  userId: Id<'users'>;
};

async function requireUser(ctx: TrackerCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError('Musisz być zalogowany.');
  }
  return userId;
}

async function getActiveSession(ctx: TrackerCtx, userId: Id<'users'>) {
  const activeSessions = await ctx.db
    .query('activeSessions')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .order('asc')
    .take(2);
  const activeSession = activeSessions.sort((left, right) => left.startTime - right.startTime)[0];
  if (!activeSession) {
    return null;
  }
  return {
    ...activeSession,
    pausedAt: activeSession.pausedAt ?? null,
    pauseRanges: activeSession.pauseRanges ?? [],
    pausedSeconds: activeSession.pausedSeconds ?? 0,
    projectName: activeSession.projectName ?? null,
  };
}

async function getPreferences(ctx: TrackerCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('trackerPreferences')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .unique();
}

async function getDesktopHelper(ctx: TrackerCtx, userId: Id<'users'>) {
  const helpers = await ctx.db
    .query('desktopHelpers')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .take(desktopSessionActivityLimit);
  return (
    helpers.sort(
      (left, right) =>
        (right.lastSeenAt ?? right._creationTime) - (left.lastSeenAt ?? left._creationTime),
    )[0] ?? null
  );
}

async function listTrackingRules(ctx: TrackerCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('trackingRules')
    .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
    .take(256);
}

async function listRecentDesktopHelperActivities(ctx: TrackerCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('desktopHelperActivities')
    .withIndex('by_user_and_capturedAt', (queryBuilder) => queryBuilder.eq('userId', userId))
    .order('desc')
    .take(desktopActivityLogLimit);
}

async function listDesktopHelperActivitiesForWindow(
  ctx: TrackerCtx,
  userId: Id<'users'>,
  sessionStart: number,
  sessionEnd: number,
) {
  return await ctx.db
    .query('desktopHelperActivities')
    .withIndex('by_user_and_capturedAt', (queryBuilder) =>
      queryBuilder
        .eq('userId', userId)
        .gte('capturedAt', sessionStart)
        .lte('capturedAt', sessionEnd),
    )
    .order('desc')
    .take(desktopSessionActivityLimit);
}

function normalizeStoredSession(session: Doc<'sessions'>) {
  return {
    ...session,
    projectName: session.projectName ?? null,
  };
}

function serializeTrackingRule(rule: Awaited<ReturnType<typeof listTrackingRules>>[number]) {
  return {
    category: rule.category ?? null,
    id: rule._id,
    kind: rule.kind ?? null,
    matchAppName: rule.matchAppName,
    matchDomain: rule.matchDomain,
    projectName: rule.projectName,
  };
}

function serializeDesktopHelperActivity(
  activity: Awaited<ReturnType<typeof listRecentDesktopHelperActivities>>[number],
) {
  return {
    id: activity._id,
    appName: activity.appName,
    capturedAt: activity.capturedAt,
    deviceId: activity.helperId ?? null,
    domain: activity.domain,
    platform: activity.platform,
    windowTitle: activity.windowTitle,
  };
}

function buildDefaultPreferences(userId: Id<'users'>): ResolvedTrackerPreferences {
  return { userId, ...defaultPreferences, ...desktopTrackingDefaults };
}

function resolvePreferences(
  userId: Id<'users'>,
  preferences: Awaited<ReturnType<typeof getPreferences>>,
): ResolvedTrackerPreferences {
  const defaults = buildDefaultPreferences(userId);
  return {
    userId,
    autoPauseEnabled: preferences?.autoPauseEnabled ?? defaults.autoPauseEnabled,
    autoPauseMinutes: preferences?.autoPauseMinutes ?? defaults.autoPauseMinutes,
    autoSplitMode: preferences?.autoSplitMode ?? defaults.autoSplitMode,
    desktopPrivacyLevel: normalizeDesktopPrivacyLevel(
      preferences?.desktopPrivacyLevel ?? defaults.desktopPrivacyLevel,
    ),
    dailyGoalHours: preferences?.dailyGoalHours ?? defaults.dailyGoalHours,
    desktopTrackingEnabled: preferences?.desktopTrackingEnabled ?? defaults.desktopTrackingEnabled,
    desktopTrackingManualPause:
      preferences?.desktopTrackingManualPause ?? defaults.desktopTrackingManualPause,
    desktopTrackingPausedUntil:
      preferences?.desktopTrackingPausedUntil ?? defaults.desktopTrackingPausedUntil,
    focusMode: preferences?.focusMode ?? defaults.focusMode,
    privateDomainsText: preferences?.privateDomainsText ?? defaults.privateDomainsText,
    stopSoundEnabled: preferences?.stopSoundEnabled ?? defaults.stopSoundEnabled,
  };
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

function normalizeMatchAppName(value: string | null | undefined) {
  return normalizeOptionalDesktopText(value)?.toLowerCase() ?? null;
}

function normalizeMatchDomain(value: string | null | undefined) {
  const normalized = normalizeOptionalDesktopText(value)?.toLowerCase() ?? null;
  return normalized ? normalized.replace(/^www\./, '') : null;
}

function normalizePrivateDomainsText(value: string | undefined) {
  return [
    ...new Set(
      (value ?? '')
        .split(/[\n,]+/)
        .map((entry) => normalizeMatchDomain(entry))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  ]
    .slice(0, 50)
    .join('\n');
}

function domainMatches(ruleDomain: string | null, currentDomain: string | null) {
  if (!ruleDomain || !currentDomain) {
    return false;
  }
  return currentDomain === ruleDomain || currentDomain.endsWith(`.${ruleDomain}`);
}

function isDesktopTrackingPaused(
  preferences: ReturnType<typeof buildDefaultPreferences>,
  now = Date.now(),
) {
  return (
    preferences.desktopTrackingManualPause ||
    (preferences.desktopTrackingPausedUntil !== null &&
      preferences.desktopTrackingPausedUntil > now)
  );
}

function isPrivateDomainBlocked(privateDomainsText: string, domain: string | null) {
  const normalizedDomain = normalizeMatchDomain(domain);
  if (!normalizedDomain) {
    return false;
  }
  return normalizePrivateDomainsText(privateDomainsText)
    .split('\n')
    .some((privateDomain) => domainMatches(privateDomain, normalizedDomain));
}

function shouldStoreDesktopHelperActivity(
  previousActivity: DesktopActivityDecision | null,
  nextActivity: DesktopActivityDecision,
) {
  if (!previousActivity) {
    return true;
  }

  return (
    previousActivity.appName !== nextActivity.appName ||
    previousActivity.domain !== nextActivity.domain ||
    nextActivity.capturedAt - previousActivity.capturedAt >= desktopActivityLogIntervalMs
  );
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
      helper.lastSeenAt !== null && Date.now() - helper.lastSeenAt < helperConnectedThresholdMs,
    lastAppName: helper.lastAppName,
    lastDomain: helper.lastDomain,
    lastSeenAt: helper.lastSeenAt,
    lastWindowTitle: helper.lastWindowTitle,
    platform: helper.platform,
  };
}

function buildDesktopProjectSuggestion(
  helper: Awaited<ReturnType<typeof getDesktopHelper>>,
  rules: Awaited<ReturnType<typeof listTrackingRules>>,
  preferences: ReturnType<typeof buildDefaultPreferences>,
  sessions: Array<{ category: string; duration: number; projectName?: string | null }>,
) {
  if (
    !helper ||
    !preferences.desktopTrackingEnabled ||
    isDesktopTrackingPaused(preferences) ||
    helper.lastSeenAt === null ||
    Date.now() - helper.lastSeenAt >= helperConnectedThresholdMs
  ) {
    return null;
  }

  const currentAppName = normalizeMatchAppName(helper.lastAppName);
  const currentDomain = normalizeMatchDomain(helper.lastDomain);
  if (!currentAppName && !currentDomain) {
    return null;
  }

  let bestMatch: {
    matchedBy: 'app' | 'domain' | 'app+domain';
    rule: Awaited<ReturnType<typeof listTrackingRules>>[number];
    score: number;
  } | null = null;

  for (const rule of rules) {
    const appMatches = rule.matchAppName ? rule.matchAppName === currentAppName : false;
    const domainMatched = domainMatches(rule.matchDomain, currentDomain);
    if (!appMatches && !domainMatched) {
      continue;
    }
    if (rule.matchAppName && !appMatches) {
      continue;
    }
    if (rule.matchDomain && !domainMatched) {
      continue;
    }
    const matchedBy =
      rule.matchAppName && rule.matchDomain ? 'app+domain' : rule.matchDomain ? 'domain' : 'app';
    const score = (rule.matchDomain ? 2 : 0) + (rule.matchAppName ? 1 : 0);
    if (
      !bestMatch ||
      score > bestMatch.score ||
      (score === bestMatch.score && rule._creationTime > bestMatch.rule._creationTime)
    ) {
      bestMatch = { matchedBy, rule, score };
    }
  }

  if (!bestMatch) {
    return null;
  }

  const categoryTotals = new Map<string, number>();
  for (const session of sessions) {
    if (
      !session.projectName ||
      session.projectName.toLocaleLowerCase('pl-PL') !==
        bestMatch.rule.projectName.toLocaleLowerCase('pl-PL')
    ) {
      continue;
    }
    categoryTotals.set(
      session.category,
      (categoryTotals.get(session.category) ?? 0) + Math.max(0, session.duration),
    );
  }
  const inferredCategory =
    [...categoryTotals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  const category = bestMatch.rule.category ?? inferredCategory;
  const kind =
    bestMatch.rule.kind ??
    (category === 'prywatne' ? 'private' : category === 'rozproszenie' ? 'distraction' : null);

  return {
    appName: helper.lastAppName,
    category,
    domain: helper.lastDomain,
    kind,
    matchedBy: bestMatch.matchedBy,
    projectName: bestMatch.rule.projectName,
  };
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

async function deleteRowsInBatches<Row extends { _id: string }>(
  loadBatch: () => Promise<Row[]>,
  deleteRow: (row: Row) => Promise<void>,
) {
  let deletedCount = 0;

  while (true) {
    const rows = await loadBatch();

    if (!rows.length) {
      return deletedCount;
    }

    for (const row of rows) {
      await deleteRow(row);
      deletedCount += 1;
    }
  }
}

async function deleteDesktopHelperActivitiesByUser(ctx: MutationCtx, userId: Id<'users'>) {
  return await deleteRowsInBatches(
    () =>
      ctx.db
        .query('desktopHelperActivities')
        .withIndex('by_user_and_capturedAt', (queryBuilder) => queryBuilder.eq('userId', userId))
        .take(64),
    (row) => ctx.db.delete(row._id),
  );
}

async function deleteVerificationCodesForAccount(ctx: MutationCtx, accountId: Id<'authAccounts'>) {
  let deletedCount = 0;

  while (true) {
    const rows = await ctx.db
      .query('authVerificationCodes')
      .withIndex('accountId', (queryBuilder) => queryBuilder.eq('accountId', accountId))
      .take(64);

    if (!rows.length) {
      return deletedCount;
    }

    for (const row of rows) {
      await ctx.db.delete(row._id);
      deletedCount += 1;
    }
  }
}

async function deleteRefreshTokensForSession(ctx: MutationCtx, sessionId: Id<'authSessions'>) {
  let deletedCount = 0;

  while (true) {
    const rows = await ctx.db
      .query('authRefreshTokens')
      .withIndex('sessionId', (queryBuilder) => queryBuilder.eq('sessionId', sessionId))
      .take(64);

    if (!rows.length) {
      return deletedCount;
    }

    for (const row of rows) {
      await ctx.db.delete(row._id);
      deletedCount += 1;
    }
  }
}

async function deleteAllUserTrackerData(ctx: MutationCtx, userId: Id<'users'>) {
  const activeSessions = await deleteRowsInBatches(
    () =>
      ctx.db
        .query('activeSessions')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .take(64),
    (row) => ctx.db.delete(row._id),
  );
  const sessions = await deleteRowsInBatches(
    () =>
      ctx.db
        .query('sessions')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .take(64),
    (row) => ctx.db.delete(row._id),
  );
  const trackingRules = await deleteRowsInBatches(
    () =>
      ctx.db
        .query('trackingRules')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .take(64),
    (row) => ctx.db.delete(row._id),
  );
  const trackerPreferences = await deleteRowsInBatches(
    () =>
      ctx.db
        .query('trackerPreferences')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .take(64),
    (row) => ctx.db.delete(row._id),
  );
  const desktopHelpers = await deleteRowsInBatches(
    () =>
      ctx.db
        .query('desktopHelpers')
        .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
        .take(64),
    (row) => ctx.db.delete(row._id),
  );
  const desktopHelperActivities = await deleteDesktopHelperActivitiesByUser(ctx, userId);

  return {
    activeSessions,
    sessions,
    trackingRules,
    trackerPreferences,
    desktopHelpers,
    desktopHelperActivities,
  };
}

async function deleteUserAuthData(ctx: MutationCtx, userId: Id<'users'>) {
  let authVerificationCodes = 0;
  let authAccounts = 0;
  let authRefreshTokens = 0;
  let authSessions = 0;

  while (true) {
    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (queryBuilder) => queryBuilder.eq('userId', userId))
      .take(32);

    if (!accounts.length) {
      break;
    }

    for (const account of accounts) {
      authVerificationCodes += await deleteVerificationCodesForAccount(ctx, account._id);
      await ctx.db.delete(account._id);
      authAccounts += 1;
    }
  }

  while (true) {
    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('userId', (queryBuilder) => queryBuilder.eq('userId', userId))
      .take(32);

    if (!sessions.length) {
      break;
    }

    for (const session of sessions) {
      authRefreshTokens += await deleteRefreshTokensForSession(ctx, session._id);
      await ctx.db.delete(session._id);
      authSessions += 1;
    }
  }

  const user = await ctx.db.get(userId);
  if (user) {
    await ctx.db.delete(userId);
  }

  return {
    authAccounts,
    authRefreshTokens,
    authSessions,
    authVerificationCodes,
    userDeleted: Boolean(user),
  };
}

export const bootstrap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [user, activeSession, sessions, preferences, desktopHelper, trackingRules] =
      await Promise.all([
        ctx.db.get(userId),
        getActiveSession(ctx, userId),
        ctx.db
          .query('sessions')
          .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
          .order('desc')
          .take(bootstrapSessionFetchLimit),
        getPreferences(ctx, userId),
        getDesktopHelper(ctx, userId),
        listTrackingRules(ctx, userId),
      ]);
    const desktopHelperActivities = activeSession
      ? await listDesktopHelperActivitiesForWindow(
          ctx,
          userId,
          activeSession.startTime,
          activeSession.pausedAt ?? Date.now(),
        )
      : await listRecentDesktopHelperActivities(ctx, userId);
    const resolvedPreferences = resolvePreferences(userId, preferences);
    const sortedSessions = sortSessionsDesc(
      sessions.map((session) => normalizeStoredSession(session)),
    );
    const limitedSessions = sortedSessions.slice(0, bootstrapSessionDisplayLimit);
    const hasMoreSessions = sortedSessions.length > bootstrapSessionFetchLimit - 1;
    return {
      user: user
        ? { id: userId, name: user.name, email: user.email, image: user.image }
        : { id: userId },
      activeSession,
      sessions: limitedSessions,
      preferences: resolvedPreferences,
      desktopHelper: buildDesktopHelperStatus(desktopHelper),
      desktopHelperActivities: desktopHelperActivities.map(serializeDesktopHelperActivity),
      desktopProjectSuggestion: buildDesktopProjectSuggestion(
        desktopHelper,
        trackingRules,
        resolvedPreferences,
        sortedSessions,
      ),
      desktopTrackingRules: trackingRules.map(serializeTrackingRule),
      summary: computeSummary(sortedSessions, resolvedPreferences.dailyGoalHours),
      summaryIsPartial: hasMoreSessions,
      dashboard: buildDashboard(sortedSessions),
      history: {
        ...buildSessionHistory(limitedSessions),
        isTruncated: sortedSessions.length > limitedSessions.length,
        totalAvailableSessions: hasMoreSessions ? null : sortedSessions.length,
      },
      cleanupGroups: buildSessionCleanupGroups(limitedSessions),
      recentProjects: buildRecentProjects(sortedSessions, activeSession?.projectName ?? null),
      charts: {
        categories: buildCategoryChart(sortedSessions),
        trend: buildTrendChart(sortedSessions),
      },
    };
  },
});

export const sessionsForExport = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
      .collect();
    return sortSessionsDesc(sessions.map((session) => normalizeStoredSession(session)));
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
      // START is idempotent across devices. The existing cloud session is the
      // shared source of truth for Mac, Windows and additional browser tabs.
      return null;
    }
    await ctx.db.insert('activeSessions', {
      userId,
      startTime: Date.now(),
      category: normalizeText(args.category, 'inne'),
      description: normalizeText(args.description, 'Praca nad projektem'),
      pausedAt: null,
      pauseRanges: [],
      pausedSeconds: 0,
      projectName: normalizeOptionalProjectName(args.projectName),
    });
    return null;
  },
});

export const stop = mutation({
  args: {
    endTime: v.optional(v.number()),
    entries: v.optional(
      v.array(
        v.object({
          category: v.string(),
          description: v.string(),
          endTime: v.number(),
          projectName: v.union(v.string(), v.null()),
          startTime: v.number(),
        }),
      ),
    ),
    timezoneOffsetMinutes: v.optional(v.number()),
    whatIsDone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const activeSession = await getActiveSession(ctx, userId);
    if (!activeSession) {
      // STOP can arrive from a second computer after the shared cloud session
      // has already been saved elsewhere. Treat that repeat as success.
      return null;
    }
    const endTime =
      activeSession.pausedAt !== null ? activeSession.pausedAt : (args.endTime ?? Date.now());
    if (endTime <= activeSession.startTime) {
      throw new ConvexError('Czas zakończenia sesji jest nieprawidłowy.');
    }
    const whatIsDone = normalizeText(
      args.whatIsDone,
      activeSession.description || 'Zakończona sesja',
    );
    const sessionRecords = args.entries?.length
      ? buildStoppedSessionRecordsFromParts({
          parts: args.entries.map((entry) => ({
            category: normalizeText(entry.category, activeSession.category),
            description: normalizeText(entry.description, activeSession.description),
            endTime: entry.endTime,
            projectName: normalizeOptionalProjectName(entry.projectName),
            startTime: entry.startTime,
            whatIsDone,
          })),
          pauseRanges: activeSession.pauseRanges,
          timezoneOffsetMinutes: args.timezoneOffsetMinutes,
        })
      : buildStoppedSessionRecords({
          category: activeSession.category,
          description: activeSession.description,
          endTime,
          pauseRanges: activeSession.pauseRanges,
          pausedSeconds: activeSession.pausedSeconds,
          projectName: activeSession.projectName,
          splitGroupId: crypto.randomUUID(),
          startTime: activeSession.startTime,
          timezoneOffsetMinutes: args.timezoneOffsetMinutes,
          whatIsDone,
        });
    for (const sessionRecord of sessionRecords) {
      await ctx.db.insert('sessions', {
        userId,
        ...sessionRecord,
      });
    }
    const activeSessions = await ctx.db
      .query('activeSessions')
      .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
      .collect();
    for (const session of activeSessions) {
      await ctx.db.delete(session._id);
    }
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
    const pausedAt = Date.now();
    await ctx.db.patch(activeSession._id, {
      pausedAt,
      pauseRanges: [...activeSession.pauseRanges, { startTime: pausedAt, endTime: null }],
    });
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
    const resumedAt = Date.now();
    await ctx.db.patch(activeSession._id, {
      pausedAt: null,
      pauseRanges: activeSession.pauseRanges.map((range, index, ranges) =>
        index === ranges.length - 1 && range.endTime === null
          ? { ...range, endTime: resumedAt }
          : range,
      ),
      pausedSeconds:
        activeSession.pausedSeconds +
        Math.max(0, Math.floor((resumedAt - activeSession.pausedAt) / 1000)),
    });
    return null;
  },
});

export const savePreferences = mutation({
  args: {
    autoPauseEnabled: v.optional(v.boolean()),
    autoPauseMinutes: v.optional(v.number()),
    autoSplitMode: v.optional(
      v.union(v.literal('private-distraction'), v.literal('all-contexts'), v.literal('never')),
    ),
    desktopPrivacyLevel: v.optional(
      v.union(v.literal('low'), v.literal('standard'), v.literal('high')),
    ),
    dailyGoalHours: v.optional(v.number()),
    desktopTrackingEnabled: v.optional(v.boolean()),
    desktopTrackingManualPause: v.optional(v.boolean()),
    desktopTrackingPausedUntil: v.optional(v.union(v.number(), v.null())),
    focusMode: v.optional(v.boolean()),
    privateDomainsText: v.optional(v.string()),
    stopSoundEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const currentDoc = await getPreferences(ctx, userId);
    const current = resolvePreferences(userId, currentDoc);
    const next = {
      userId,
      autoPauseEnabled: args.autoPauseEnabled ?? current.autoPauseEnabled,
      autoPauseMinutes: args.autoPauseMinutes ?? current.autoPauseMinutes,
      autoSplitMode: args.autoSplitMode ?? current.autoSplitMode,
      desktopPrivacyLevel: normalizeDesktopPrivacyLevel(
        args.desktopPrivacyLevel ?? current.desktopPrivacyLevel,
      ),
      dailyGoalHours: args.dailyGoalHours ?? current.dailyGoalHours,
      desktopTrackingEnabled: args.desktopTrackingEnabled ?? current.desktopTrackingEnabled,
      desktopTrackingManualPause:
        args.desktopTrackingManualPause ?? current.desktopTrackingManualPause,
      desktopTrackingPausedUntil:
        args.desktopTrackingPausedUntil ?? current.desktopTrackingPausedUntil,
      focusMode: args.focusMode ?? current.focusMode,
      privateDomainsText:
        args.privateDomainsText !== undefined
          ? normalizePrivateDomainsText(args.privateDomainsText)
          : current.privateDomainsText,
      stopSoundEnabled: args.stopSoundEnabled ?? current.stopSoundEnabled,
    };
    if (currentDoc) {
      await ctx.db.patch(currentDoc._id, next);
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
    const helperKey = issueDesktopHelperKey();
    const helperKeyHash = await hashDesktopHelperKey(helperKey);
    const next = {
      helperKeyHash,
      lastAppName: null,
      lastDomain: null,
      lastSeenAt: null,
      lastWindowTitle: null,
      platform: args.platform?.trim() || 'unknown',
      userId,
    };

    // Every downloaded starter is a separate device. Issuing a Windows key
    // must not revoke the already running Mac helper (and vice versa).
    await ctx.db.insert('desktopHelpers', next);

    return { helperKey };
  },
});

export const revokeDesktopHelperKeysForUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await deleteRowsInBatches(
      () =>
        ctx.db
          .query('desktopHelpers')
          .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
          .take(64),
      (row) => ctx.db.delete(row._id),
    );
  },
});

export const saveTrackingRule = mutation({
  args: {
    category: v.optional(v.union(v.string(), v.null())),
    kind: v.optional(
      v.union(v.literal('work'), v.literal('private'), v.literal('distraction'), v.null()),
    ),
    matchAppName: v.union(v.string(), v.null()),
    matchDomain: v.union(v.string(), v.null()),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const projectName = normalizeProjectName(args.projectName);
    const category = normalizeOptionalDesktopText(args.category);
    const kind = args.kind ?? undefined;
    const matchAppName = normalizeMatchAppName(args.matchAppName);
    const matchDomain = normalizeMatchDomain(args.matchDomain);

    if (!projectName) {
      throw new ConvexError('Projekt reguly jest wymagany.');
    }
    if (!matchAppName && !matchDomain) {
      throw new ConvexError('Podaj appke albo domene dla reguly.');
    }

    const existingRule = (await listTrackingRules(ctx, userId)).find(
      (rule) => rule.matchAppName === matchAppName && rule.matchDomain === matchDomain,
    );

    if (existingRule) {
      if (
        existingRule.projectName !== projectName ||
        (existingRule.category ?? null) !== category ||
        (existingRule.kind ?? null) !== (kind ?? null)
      ) {
        await ctx.db.patch(existingRule._id, { category, kind, projectName });
      }
      return null;
    }

    await ctx.db.insert('trackingRules', {
      category,
      kind,
      matchAppName,
      matchDomain,
      projectName,
      userId,
    });
    return null;
  },
});

export const deleteTrackingRule = mutation({
  args: {
    ruleId: v.id('trackingRules'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const rule = await ctx.db.get(args.ruleId);
    if (!rule || rule.userId !== userId) {
      throw new ConvexError('Nie znaleziono reguly dla tego konta.');
    }
    await ctx.db.delete(args.ruleId);
    return null;
  },
});

type DesktopActivityInput = {
  appName: string;
  capturedAt?: number;
  domain: string | null;
  platform: string;
  windowTitle: string | null;
};

type DesktopActivityDecision = {
  appName: string;
  capturedAt: number;
  domain: string | null;
};

type LatestDesktopActivity = {
  appName: string | null;
  capturedAt: number;
  domain: string | null;
  platform: string;
  windowTitle: string | null;
};

async function ingestDesktopActivityBatch(
  ctx: MutationCtx,
  helperKey: string,
  activities: DesktopActivityInput[],
  batchId?: string,
) {
  const helperKeyHash = await hashDesktopHelperKey(helperKey);
  let helper = await ctx.db
    .query('desktopHelpers')
    .withIndex('by_helperKeyHash', (queryBuilder) =>
      queryBuilder.eq('helperKeyHash', helperKeyHash),
    )
    .unique();

  // Migrate keys issued before hash-at-rest was introduced. The plaintext
  // value exists only for this lookup and is removed immediately afterwards.
  if (!helper) {
    const legacyHelper = await ctx.db
      .query('desktopHelpers')
      .withIndex('by_helperKey', (queryBuilder) => queryBuilder.eq('helperKey', helperKey))
      .unique();
    if (legacyHelper) {
      await ctx.db.patch(legacyHelper._id, {
        helperKey: undefined,
        helperKeyHash,
      });
      helper = { ...legacyHelper, helperKey: undefined, helperKeyHash };
    }
  }

  if (!helper) {
    return { accepted: false, trackingActive: false };
  }

  // The helper may stay open in the background, but desktop activity belongs
  // only to an actively running timer session. Avoid touching helper status,
  // preferences, or activity history while the timer is stopped or paused.
  const activeSession = await getActiveSession(ctx, helper.userId);
  if (!activeSession || activeSession.pausedAt !== null) {
    return { accepted: true, trackingActive: false };
  }

  if (batchId) {
    const existingBatch = await ctx.db
      .query('desktopHelperActivities')
      .withIndex('by_helper_and_batch', (queryBuilder) =>
        queryBuilder.eq('helperId', helper._id).eq('batchId', batchId),
      )
      .take(1);
    if (existingBatch.length > 0) {
      return { accepted: true, trackingActive: true };
    }
  }

  const preferences = resolvePreferences(helper.userId, await getPreferences(ctx, helper.userId));
  const recentActivities = await ctx.db
    .query('desktopHelperActivities')
    .withIndex('by_user_and_capturedAt', (queryBuilder) => queryBuilder.eq('userId', helper.userId))
    .order('desc')
    .take(32);
  let previousActivity: DesktopActivityDecision | null =
    recentActivities.find((activity) => activity.helperId === helper._id) ?? null;
  let latestActivity: LatestDesktopActivity | null = null;

  for (const activity of activities) {
    const receivedAt = Date.now();
    const requestedCapturedAt = activity.capturedAt ?? receivedAt;
    const lastSeenAt =
      Number.isFinite(requestedCapturedAt) &&
      Math.abs(requestedCapturedAt - receivedAt) <= helperTimestampSkewLimitMs
        ? requestedCapturedAt
        : receivedAt;
    const trackingPaused = isDesktopTrackingPaused(preferences, lastSeenAt);
    const blockedDomain = isPrivateDomainBlocked(preferences.privateDomainsText, activity.domain);
    const normalizedAppName = activity.appName.trim() || 'Unknown';
    const normalizedDomain = normalizeOptionalDesktopText(activity.domain);
    const normalizedWindowTitle = sanitizeDesktopWindowTitle(
      normalizeOptionalDesktopText(activity.windowTitle),
      preferences.desktopPrivacyLevel,
    );
    const hideDomain = blockedDomain || preferences.desktopPrivacyLevel === 'high';
    const platform = activity.platform.trim() || helper.platform;
    const effectiveActivity =
      !preferences.desktopTrackingEnabled || trackingPaused
        ? null
        : {
            appName: blockedDomain ? 'Prywatna domena' : normalizedAppName,
            capturedAt: lastSeenAt,
            domain: hideDomain ? null : normalizedDomain,
            platform,
            windowTitle: blockedDomain ? null : normalizedWindowTitle,
          };

    latestActivity = {
      appName: effectiveActivity?.appName ?? null,
      capturedAt: lastSeenAt,
      domain: effectiveActivity?.domain ?? null,
      platform,
      windowTitle: effectiveActivity?.windowTitle ?? null,
    };

    if (
      effectiveActivity &&
      shouldStoreDesktopHelperActivity(previousActivity, effectiveActivity)
    ) {
      await ctx.db.insert('desktopHelperActivities', {
        ...(batchId ? { batchId } : {}),
        helperId: helper._id,
        userId: helper.userId,
        ...effectiveActivity,
      });
      previousActivity = effectiveActivity;
    }
  }

  if (latestActivity) {
    await ctx.db.patch(helper._id, {
      lastAppName: latestActivity.appName,
      lastDomain: latestActivity.domain,
      lastSeenAt: latestActivity.capturedAt,
      lastWindowTitle: latestActivity.windowTitle,
      platform: latestActivity.platform,
    });
  }

  return { accepted: true, trackingActive: true };
}

export const ingestDesktopActivity = internalMutation({
  args: {
    appName: v.string(),
    capturedAt: v.optional(v.number()),
    domain: v.union(v.string(), v.null()),
    helperKey: v.string(),
    platform: v.string(),
    windowTitle: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) =>
    ingestDesktopActivityBatch(ctx, args.helperKey, [
      {
        appName: args.appName,
        capturedAt: args.capturedAt,
        domain: args.domain,
        platform: args.platform,
        windowTitle: args.windowTitle,
      },
    ]),
});

export const ingestDesktopActivityBatchMutation = internalMutation({
  args: {
    activities: v.array(
      v.object({
        appName: v.string(),
        capturedAt: v.optional(v.number()),
        domain: v.union(v.string(), v.null()),
        platform: v.string(),
        windowTitle: v.union(v.string(), v.null()),
      }),
    ),
    batchId: v.string(),
    helperKey: v.string(),
  },
  handler: async (ctx, args) =>
    ingestDesktopActivityBatch(ctx, args.helperKey, args.activities, args.batchId),
});

export const ingestDesktopSessionSummary = internalMutation({
  args: {
    blocks: v.array(
      v.object({
        appName: v.string(),
        capturedAt: v.number(),
        domain: v.union(v.string(), v.null()),
        durationSeconds: v.number(),
        endTime: v.number(),
        platform: v.string(),
        startTime: v.number(),
        windowTitle: v.union(v.string(), v.null()),
      }),
    ),
    endedAt: v.number(),
    final: v.boolean(),
    helperKey: v.string(),
    revision: v.number(),
    sessionId: v.string(),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const helperKeyHash = await hashDesktopHelperKey(args.helperKey);
    let helper = await ctx.db
      .query('desktopHelpers')
      .withIndex('by_helperKeyHash', (queryBuilder) =>
        queryBuilder.eq('helperKeyHash', helperKeyHash),
      )
      .unique();
    if (!helper) {
      const legacyHelper = await ctx.db
        .query('desktopHelpers')
        .withIndex('by_helperKey', (queryBuilder) => queryBuilder.eq('helperKey', args.helperKey))
        .unique();
      if (legacyHelper) {
        await ctx.db.patch(legacyHelper._id, { helperKey: undefined, helperKeyHash });
        helper = { ...legacyHelper, helperKey: undefined, helperKeyHash };
      }
    }
    if (!helper) return { accepted: false, revision: 0 };

    const existing = await ctx.db
      .query('desktopSessionSummaries')
      .withIndex('by_user_and_session', (queryBuilder) =>
        queryBuilder.eq('userId', helper.userId).eq('sessionId', args.sessionId),
      )
      .take(1);
    if (existing[0] && existing[0].revision >= args.revision) {
      return { accepted: true, revision: existing[0].revision };
    }

    const preferences = resolvePreferences(helper.userId, await getPreferences(ctx, helper.userId));
    const blocks = args.blocks.map((block) => {
      const blockedDomain = isPrivateDomainBlocked(preferences.privateDomainsText, block.domain);
      const normalizedAppName = block.appName.trim() || 'Unknown';
      const normalizedDomain = normalizeOptionalDesktopText(block.domain);
      const normalizedWindowTitle = sanitizeDesktopWindowTitle(
        normalizeOptionalDesktopText(block.windowTitle),
        preferences.desktopPrivacyLevel,
      );
      const hideDomain = blockedDomain || preferences.desktopPrivacyLevel === 'high';
      return {
        appName: blockedDomain ? 'Prywatna domena' : normalizedAppName,
        capturedAt: block.capturedAt,
        domain: hideDomain ? null : normalizedDomain,
        durationSeconds: Math.max(0, Math.round(block.durationSeconds)),
        endTime: block.endTime,
        platform: block.platform.trim() || helper.platform,
        startTime: block.startTime,
        windowTitle: blockedDomain ? null : normalizedWindowTitle,
      };
    });
    const totalSeconds = blocks.reduce((total, block) => total + block.durationSeconds, 0);
    const summary = {
      blocks,
      endedAt: args.endedAt,
      final: args.final,
      helperId: helper._id,
      revision: args.revision,
      sessionId: args.sessionId,
      startedAt: args.startedAt,
      totalSeconds,
      updatedAt: Date.now(),
      userId: helper.userId,
    };
    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, summary);
    } else {
      await ctx.db.insert('desktopSessionSummaries', summary);
    }
    const lastBlock = blocks.at(-1);
    if (lastBlock) {
      await ctx.db.patch(helper._id, {
        lastAppName: lastBlock.appName,
        lastDomain: lastBlock.domain,
        lastSeenAt: lastBlock.endTime,
        lastWindowTitle: lastBlock.windowTitle,
        platform: lastBlock.platform,
      });
    }
    return { accepted: true, revision: args.revision };
  },
  handler: async (ctx, args) =>
    ingestDesktopActivityBatch(ctx, args.helperKey, [
      {
        appName: args.appName,
        capturedAt: args.capturedAt,
        domain: args.domain,
        platform: args.platform,
        windowTitle: args.windowTitle,
      },
    ]),
});

export const ingestDesktopActivityBatchMutation = internalMutation({
  args: {
    activities: v.array(
      v.object({
        appName: v.string(),
        capturedAt: v.optional(v.number()),
        domain: v.union(v.string(), v.null()),
        platform: v.string(),
        windowTitle: v.union(v.string(), v.null()),
      }),
    ),
    batchId: v.string(),
    helperKey: v.string(),
  },
  handler: async (ctx, args) =>
    ingestDesktopActivityBatch(ctx, args.helperKey, args.activities, args.batchId),
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
    const sessionRecords = buildManualSessionRecords(
      {
        ...args,
        splitGroupId: crypto.randomUUID(),
        projectName: normalizeOptionalProjectName(args.projectName),
      },
      normalizeText,
      ConvexError,
    );
    for (const sessionRecord of sessionRecords) {
      await ctx.db.insert('sessions', {
        userId,
        ...sessionRecord,
      });
    }
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
    const currentSession = await assertOwnedSession(ctx, userId, args.sessionId);
    const splitGroupId = currentSession.splitGroupId ?? crypto.randomUUID();
    const sessionRecords = buildManualSessionRecords(
      {
        ...args,
        splitGroupId,
        projectName: normalizeOptionalProjectName(args.projectName),
      },
      normalizeText,
      ConvexError,
    );
    const [firstRecord, secondRecord] = sessionRecords;
    if (!firstRecord) {
      throw new ConvexError('Nie udało się zapisać sesji.');
    }
    const siblingSessions = currentSession.splitGroupId
      ? (
          await ctx.db
            .query('sessions')
            .withIndex('by_user', (queryBuilder) => queryBuilder.eq('userId', userId))
            .collect()
        ).filter((session) => session.splitGroupId === currentSession.splitGroupId)
      : [];
    await ctx.db.patch(args.sessionId, firstRecord);
    if (secondRecord) {
      await ctx.db.insert('sessions', {
        userId,
        ...secondRecord,
      });
    }
    for (const sibling of siblingSessions) {
      if (sibling._id !== args.sessionId) {
        await ctx.db.delete(sibling._id);
      }
    }
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

export const mergeSessions = mutation({
  args: {
    sessionIds: v.array(v.id('sessions')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const uniqueSessionIds = [...new Set(args.sessionIds)];
    if (uniqueSessionIds.length < 2 || uniqueSessionIds.length > 100) {
      throw new ConvexError('Wybierz od dwóch do stu wpisów do scalenia.');
    }
    const sessions = await Promise.all(
      uniqueSessionIds.map((sessionId) => assertOwnedSession(ctx, userId, sessionId)),
    );
    const sorted = sessions.sort((left, right) => {
      const leftTimestamp = new Date(`${left.date}T${left.startTime}:00`).getTime();
      const rightTimestamp = new Date(`${right.date}T${right.startTime}:00`).getTime();
      return leftTimestamp - rightTimestamp;
    });
    const first = sorted[0];
    const last = sorted.at(-1);
    if (!first || !last) {
      throw new ConvexError('Nie znaleziono wpisów do scalenia.');
    }
    const sameIdentity = sorted.every(
      (session) =>
        session.date === first.date &&
        session.category === first.category &&
        session.description === first.description &&
        session.whatIsDone === first.whatIsDone &&
        (session.projectName ?? null) === (first.projectName ?? null),
    );
    if (!sameIdentity) {
      throw new ConvexError('Można scalać tylko wpisy z tego samego dnia i tego samego kontekstu.');
    }
    if (sorted.some((session) => session.duration <= 0 || session.duration > 90)) {
      throw new ConvexError('Scalanie dotyczy tylko krótkich wpisów do 90 sekund.');
    }
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const previousStop = new Date(`${previous.date}T${previous.stopTime}:00`).getTime();
      const currentStart = new Date(`${current.date}T${current.startTime}:00`).getTime();
      if (currentStart - previousStop > 120_000) {
        throw new ConvexError(
          'Scalane wpisy muszą być blisko siebie (maksymalnie 2 minuty przerwy).',
        );
      }
    }
    await ctx.db.patch(first._id, {
      duration: sorted.reduce((total, session) => total + session.duration, 0),
      stopTime: last.stopTime,
    });
    for (const session of sorted.slice(1)) {
      await ctx.db.delete(session._id);
    }
    return null;
  },
});

export const deleteAllUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await deleteAllUserTrackerData(ctx, userId);
  },
});

export const deleteUserAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const deletedData = await deleteAllUserTrackerData(ctx, userId);
    const deletedAuth = await deleteUserAuthData(ctx, userId);
    return {
      ...deletedData,
      ...deletedAuth,
    };
  },
});
