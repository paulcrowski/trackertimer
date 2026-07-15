import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ActiveSession,
  type PauseRange,
  type ActiveSessionSnapshot,
  type ActiveSessionSource,
  type AutoSplitMode,
  type DesktopPrivacyLevel,
  categories,
  categoryLabels,
  type DesktopHelperActivity,
  defaultPreferences,
  type DesktopHelperKeyIssue,
  type DesktopProjectSuggestion,
  type DesktopTrackingRule,
  type DesktopHelperStatus,
  type DashboardDayPoint,
  type LocalTrackerState,
  type SessionDraft,
  type SessionDayGroup,
  type SessionCleanupGroup,
  type SessionRecord,
  type StopReviewEntryDraft,
  type TrackerProjectSummary,
  type TrackerBootstrap,
  type TrackerDashboard,
  type TrackerHistory,
  type TrackerPreferences,
  type TrackerSummary,
  type TrackerWorkspaceHandlers,
} from './trackerTypes.ts';

export { categories, defaultPreferences } from './trackerTypes.ts';

export function formatCategoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}
export type {
  ActiveSession,
  ActiveSessionSnapshot,
  ActiveSessionSource,
  AutoSplitMode,
  DesktopPrivacyLevel,
  PauseRange,
  CategoryPoint,
  DesktopHelperActivity,
  DashboardDayPoint,
  DesktopHelperKeyIssue,
  DesktopProjectSuggestion,
  DesktopTrackingRule,
  DesktopHelperStatus,
  LocalTrackerState,
  SessionDraft,
  SessionDayGroup,
  SessionCleanupGroup,
  SessionRecord,
  StopReviewEntryDraft,
  TrackerProjectSummary,
  TrackerBootstrap,
  TrackerDashboard,
  TrackerHistory,
  TrackerPreferences,
  TrackerSummary,
  TrackerWorkspaceHandlers,
  TrendPoint,
} from './trackerTypes.ts';

const activeSessionSnapshotPrefix = 'worktimer.active-session';
const localTrackerStateKey = 'worktimer.local-state.v1';
const activeSessionSnapshotMaxAgeMs = 48 * 60 * 60 * 1000;
export const desktopHelperConnectedThresholdMs = 20_000;
export const autoPauseMinuteOptions = [3, 5, 7, 10, 15] as const;
const builtInPrivateApps = new Set([
  'messages',
  'signal',
  'telegram',
  'whatsapp',
  'prywatna domena',
]);
const builtInDistractionDomains = [
  'allegro.pl',
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'tinder.com',
  'twitter.com',
  'x.com',
  'wykop.pl',
  'youtube.com',
] as const;
const focusLossMinBlockSeconds = 20;
const longSessionReminderSeconds = 8 * 60 * 60;

export type StopFocusSummaryBlock = {
  appName: string | null;
  contextTitles: string[];
  domain: string | null;
  durationSeconds: number;
  endTime: number;
  id: string;
  kind: 'work' | 'private' | 'distraction';
  label: string;
  startTime: number;
};
export type StopFocusSummary = {
  blocks: StopFocusSummaryBlock[];
  distractionSeconds: number;
  focusLossCount: number;
  isPartial: boolean;
  missingSeconds: number;
  privateSeconds: number;
  trackedSeconds: number;
  workSeconds: number;
};
export type ReviewedStopBlockKind = 'work' | 'private' | 'distraction';
export type ReviewedStopFocusSummary = {
  blocks: Array<StopFocusSummaryBlock & { reviewedKind: ReviewedStopBlockKind }>;
  distractionSeconds: number;
  focusLossCount: number;
  missingSeconds: number;
  nonWorkSeconds: number;
  privateSeconds: number;
  trackedSeconds: number;
  workSeconds: number;
};

type ActiveSessionLike = {
  category: string;
  description: string;
  pausedAt?: number | null;
  pausedSeconds?: number;
  pauseRanges?: PauseRange[];
  startTime: number;
};

type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

type ResolvedActiveSessionState = {
  activeSession: ActiveSession | null;
  notice: string | null;
  source: ActiveSessionSource | null;
};

export type ActionOutcome<T = void> = { ok: true; value: T } | { error: unknown; ok: false };

const missingActiveSessionStopErrorMessage = 'There is no active session to stop.';

export async function resolveActionOutcome<T>(action: () => Promise<T>): Promise<ActionOutcome<T>> {
  try {
    return { ok: true, value: await action() };
  } catch (error) {
    return { error, ok: false };
  }
}

function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : null;
}

export function isMissingActiveSessionStopError(value: unknown) {
  return errorMessage(value) === missingActiveSessionStopErrorMessage;
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<SessionRecord>;
  return (
    typeof record._id === 'string' &&
    typeof record.category === 'string' &&
    typeof record.date === 'string' &&
    typeof record.description === 'string' &&
    typeof record.duration === 'number' &&
    (record.projectName === null || typeof record.projectName === 'string') &&
    typeof record.startTime === 'string' &&
    typeof record.stopTime === 'string' &&
    typeof record.whatIsDone === 'string'
  );
}

function normalizePauseRanges(value: unknown) {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || !value.every(isPauseRange)) {
    return null;
  }
  return value;
}

function isActiveSession(value: unknown): value is ActiveSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<ActiveSession>;
  const pauseRanges = normalizePauseRanges(session.pauseRanges);
  return (
    typeof session._id === 'string' &&
    typeof session.category === 'string' &&
    typeof session.description === 'string' &&
    (session.pausedAt === null || typeof session.pausedAt === 'number') &&
    typeof session.pausedSeconds === 'number' &&
    pauseRanges !== null &&
    (session.projectName === null || typeof session.projectName === 'string') &&
    typeof session.startTime === 'number'
  );
}

function isPauseRange(value: unknown): value is PauseRange {
  if (!value || typeof value !== 'object') return false;
  const range = value as Partial<PauseRange>;
  return (
    typeof range.startTime === 'number' &&
    (range.endTime === null || typeof range.endTime === 'number')
  );
}

function isTrackerPreferences(value: unknown): value is TrackerPreferences {
  if (!value || typeof value !== 'object') return false;
  const preferences = value as Partial<TrackerPreferences>;
  return (
    typeof preferences.autoPauseEnabled === 'boolean' &&
    typeof preferences.autoPauseMinutes === 'number' &&
    (preferences.autoSplitMode === 'private-distraction' ||
      preferences.autoSplitMode === 'all-contexts' ||
      preferences.autoSplitMode === 'never') &&
    (preferences.desktopPrivacyLevel === 'low' ||
      preferences.desktopPrivacyLevel === 'standard' ||
      preferences.desktopPrivacyLevel === 'high') &&
    typeof preferences.dailyGoalHours === 'number' &&
    typeof preferences.desktopTrackingEnabled === 'boolean' &&
    typeof preferences.desktopTrackingManualPause === 'boolean' &&
    (preferences.desktopTrackingPausedUntil === null ||
      typeof preferences.desktopTrackingPausedUntil === 'number') &&
    typeof preferences.focusMode === 'boolean' &&
    typeof preferences.privateDomainsText === 'string' &&
    typeof preferences.stopSoundEnabled === 'boolean'
  );
}

function parseSessionTimestamp(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

function toLocalTimeString(timestamp: number) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createDefaultLocalTrackerState(): LocalTrackerState {
  return {
    activeSession: null,
    preferences: {
      ...defaultPreferences,
      desktopTrackingEnabled: false,
    },
    sessions: [],
  };
}

export function parseLocalTrackerState(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<LocalTrackerState>;
    const parsedPreferences =
      parsed.preferences && typeof parsed.preferences === 'object'
        ? { ...defaultPreferences, ...parsed.preferences }
        : parsed.preferences;
    const activeSession =
      parsed.activeSession === null || parsed.activeSession === undefined
        ? null
        : ({
            ...parsed.activeSession,
            pauseRanges:
              normalizePauseRanges((parsed.activeSession as Partial<ActiveSession>).pauseRanges) ??
              null,
          } as ActiveSession);
    if (
      !Array.isArray(parsed.sessions) ||
      !parsed.sessions.every(isSessionRecord) ||
      !isTrackerPreferences(parsedPreferences) ||
      !(activeSession === null || isActiveSession(activeSession))
    ) {
      return null;
    }
    return {
      activeSession,
      preferences: parsedPreferences,
      sessions: parsed.sessions,
    } satisfies LocalTrackerState;
  } catch {
    return null;
  }
}

export function readLocalTrackerState(storage: StorageLike | null = browserStorage()) {
  if (!storage) {
    return null;
  }
  return parseLocalTrackerState(storage.getItem(localTrackerStateKey));
}

export function writeLocalTrackerState(
  state: LocalTrackerState,
  storage: StorageLike | null = browserStorage(),
) {
  if (!storage) {
    return;
  }
  storage.setItem(localTrackerStateKey, JSON.stringify(state));
}

export function getActiveSessionSnapshotKey(userId: string) {
  return `${activeSessionSnapshotPrefix}:${userId}`;
}

export function createActiveSessionSnapshot(
  userId: string,
  activeSession: ActiveSessionLike,
  savedAt = Date.now(),
) {
  return {
    userId,
    category: activeSession.category,
    description: activeSession.description,
    pausedAt: activeSession.pausedAt ?? null,
    pausedSeconds: activeSession.pausedSeconds ?? 0,
    pauseRanges: activeSession.pauseRanges ?? [],
    startTime: activeSession.startTime,
    savedAt,
  };
}

export function parseActiveSessionSnapshot(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<ActiveSessionSnapshot>;
    const pauseRanges = normalizePauseRanges(parsed.pauseRanges);
    if (
      typeof parsed.userId !== 'string' ||
      typeof parsed.category !== 'string' ||
      typeof parsed.description !== 'string' ||
      (parsed.pausedAt !== null && typeof parsed.pausedAt !== 'number') ||
      typeof parsed.pausedSeconds !== 'number' ||
      pauseRanges === null ||
      typeof parsed.startTime !== 'number' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return {
      ...parsed,
      pauseRanges,
    } as ActiveSessionSnapshot;
  } catch {
    return null;
  }
}

export function readActiveSessionSnapshot(
  userId: string,
  storage: StorageLike | null = browserStorage(),
) {
  if (!storage) {
    return null;
  }
  return parseActiveSessionSnapshot(storage.getItem(getActiveSessionSnapshotKey(userId)));
}

export function writeActiveSessionSnapshot(
  snapshot: ActiveSessionSnapshot,
  storage: StorageLike | null = browserStorage(),
) {
  if (!storage) {
    return;
  }
  storage.setItem(getActiveSessionSnapshotKey(snapshot.userId), JSON.stringify(snapshot));
}

export function clearActiveSessionSnapshot(
  userId: string,
  storage: StorageLike | null = browserStorage(),
) {
  if (!storage) {
    return;
  }
  storage.removeItem(getActiveSessionSnapshotKey(userId));
}

export function resolveActiveSessionState(args: {
  latestSession?: Pick<SessionRecord, 'date' | 'startTime'> | null;
  serverActiveSession: ActiveSession | null;
  snapshot: ActiveSessionSnapshot | null;
  userId: string;
  now?: number;
}): ResolvedActiveSessionState {
  if (args.serverActiveSession) {
    return {
      activeSession: args.serverActiveSession,
      notice: null,
      source: 'server',
    };
  }

  const snapshot = args.snapshot;
  if (!snapshot || snapshot.userId !== args.userId) {
    return { activeSession: null, notice: null, source: null };
  }

  const now = args.now ?? Date.now();
  if (now - snapshot.savedAt > activeSessionSnapshotMaxAgeMs) {
    return { activeSession: null, notice: null, source: null };
  }

  const latestSessionTimestamp = args.latestSession
    ? parseSessionTimestamp(args.latestSession.date, args.latestSession.startTime)
    : null;
  if (latestSessionTimestamp !== null && latestSessionTimestamp >= snapshot.startTime) {
    return { activeSession: null, notice: null, source: null };
  }

  return {
    activeSession: {
      _id: `local:${snapshot.userId}`,
      category: snapshot.category,
      description: snapshot.description,
      pausedAt: snapshot.pausedAt,
      pausedSeconds: snapshot.pausedSeconds,
      pauseRanges: snapshot.pauseRanges,
      projectName: null,
      startTime: snapshot.startTime,
    },
    notice:
      'Restored an active session from this device. When Convex confirms newer state, the UI will switch to server data.',
    source: 'local',
  };
}

export function toLocalDateString(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDate(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

export function formatPolishDate(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function formatWeekdayShort(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(value));
}

export function formatDurationHms(totalSeconds: number) {
  return [
    Math.floor(totalSeconds / 3600),
    Math.floor((totalSeconds % 3600) / 60),
    totalSeconds % 60,
  ]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function formatDurationPretty(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function formatDurationPrecise(totalSeconds: number) {
  const normalized = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;

  if (hours > 0) {
    return seconds > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

export function getIdleThresholdMs(minutes: number) {
  return minutes * 60 * 1000;
}

export function normalizeAutoPauseMinutes(minutes: number) {
  return autoPauseMinuteOptions.includes(minutes as (typeof autoPauseMinuteOptions)[number])
    ? minutes
    : 7;
}

export function describeAutoPauseSetting(
  autoPauseEnabled: boolean,
  autoPauseMinutes: number,
  workspaceMode: 'simple' | 'advanced' = 'simple',
) {
  if (workspaceMode === 'advanced') {
    return autoPauseEnabled
      ? `After ${autoPauseMinutes} minutes without a desktop-helper signal, the timer will pause. This does not depend on activity in the worktimer window.`
      : 'In advanced mode, the helper can watch for silence outside this window, but helper auto-pause is currently off.';
  }
  return autoPauseEnabled
    ? `After ${autoPauseMinutes} minutes of inactivity in this window, the timer will pause. Pausing freezes time; it does not reset the session.`
    : 'The timer is fully manual. Nothing will stop or pause the session without your decision.';
}

export function describeAutoPauseReason(workspaceMode: 'simple' | 'advanced' = 'simple') {
  if (workspaceMode === 'advanced') {
    return 'The helper tracks the active app outside this window. If its last heartbeat goes quiet longer than the threshold, the session will pause.';
  }
  return 'Auto-pause only reacts to activity visible in this app window. Work in Codex, Canva, or OBS may not be visible here.';
}

export function isDesktopTrackingPaused(
  preferences: Pick<
    TrackerPreferences,
    'desktopTrackingManualPause' | 'desktopTrackingPausedUntil'
  >,
  now = Date.now(),
) {
  return (
    preferences.desktopTrackingManualPause ||
    (preferences.desktopTrackingPausedUntil !== null &&
      preferences.desktopTrackingPausedUntil > now)
  );
}

export function getDesktopHelperQuickStartSource(args: {
  preferences: Pick<
    TrackerPreferences,
    'desktopTrackingEnabled' | 'desktopTrackingManualPause' | 'desktopTrackingPausedUntil'
  >;
  status: Pick<DesktopHelperStatus, 'connected' | 'lastAppName' | 'lastDomain'>;
  now?: number;
}) {
  const { preferences, status, now = Date.now() } = args;
  if (
    !preferences.desktopTrackingEnabled ||
    isDesktopTrackingPaused(preferences, now) ||
    !status.connected
  ) {
    return null;
  }

  const source = status.lastDomain?.trim() || status.lastAppName?.trim() || null;
  return source || null;
}

export function canQuickStartFromHelper(args: {
  preferences: Pick<
    TrackerPreferences,
    'desktopTrackingEnabled' | 'desktopTrackingManualPause' | 'desktopTrackingPausedUntil'
  >;
  status: Pick<DesktopHelperStatus, 'connected' | 'lastAppName' | 'lastDomain'>;
  now?: number;
}) {
  return getDesktopHelperQuickStartSource(args) !== null;
}

export function shouldAutoPauseFromDesktopHelper(args: {
  activeSession: Pick<ActiveSession, 'pausedAt' | 'startTime'> | null;
  now?: number;
  preferences: Pick<
    TrackerPreferences,
    | 'autoPauseEnabled'
    | 'autoPauseMinutes'
    | 'desktopTrackingEnabled'
    | 'desktopTrackingManualPause'
    | 'desktopTrackingPausedUntil'
  >;
  status: Pick<DesktopHelperStatus, 'lastSeenAt'>;
}) {
  const { activeSession, preferences, status } = args;
  if (!activeSession || activeSession.pausedAt !== null || !preferences.autoPauseEnabled) {
    return false;
  }
  if (!preferences.desktopTrackingEnabled || isDesktopTrackingPaused(preferences, args.now)) {
    return false;
  }
  const lastSeenAt = status.lastSeenAt;
  if (
    lastSeenAt === null ||
    lastSeenAt < activeSession.startTime - desktopHelperConnectedThresholdMs
  ) {
    return false;
  }
  const now = args.now ?? Date.now();
  return now - lastSeenAt >= getIdleThresholdMs(preferences.autoPauseMinutes);
}

export function buildDesktopHelperIngestUrl(convexUrl: string) {
  const normalizedUrl = convexUrl.replace(/\/+$/, '');

  try {
    const url = new URL(normalizedUrl);
    if (url.hostname.endsWith('.convex.cloud')) {
      url.hostname = url.hostname.replace(/\.convex\.cloud$/, '.convex.site');
    }
    url.pathname = '/api/desktop/activity';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return `${normalizedUrl}/api/desktop/activity`;
  }
}

export function buildDesktopHelperCommand(args: { helperKey: string; ingestUrl: string }) {
  return `node scripts/desktop-helper.mjs --url "${args.ingestUrl}" --key "${args.helperKey}"`;
}

const normalizeFocusAppName = (value: string | null | undefined) =>
  value?.trim().toLowerCase() || null;

const normalizeFocusDomain = (value: string | null | undefined) =>
  value
    ?.trim()
    .toLowerCase()
    .replace(/^www\./, '') || null;

const matchesFocusDomain = (candidates: readonly string[], domain: string | null) =>
  Boolean(
    domain &&
    candidates.some((candidate) => domain === candidate || domain.endsWith(`.${candidate}`)),
  );

function classifyFocusContext(
  sample: Pick<DesktopHelperActivity, 'appName' | 'domain' | 'windowTitle'>,
  privateDomainsText: string,
) {
  const appName = sample.appName?.trim() || null;
  const normalizedAppName = normalizeFocusAppName(sample.appName);
  const domain = normalizeFocusDomain(sample.domain);
  const privateDomains = privateDomainsText
    .split(/[\n,]+/)
    .map((entry) => normalizeFocusDomain(entry))
    .filter((entry): entry is string => Boolean(entry));
  const isMaskedPrivateDomain =
    normalizedAppName === 'private domain' || normalizedAppName === 'prywatna domena';
  const isPrivate =
    isMaskedPrivateDomain ||
    (normalizedAppName !== null && builtInPrivateApps.has(normalizedAppName)) ||
    matchesFocusDomain(privateDomains, domain);
  const kind: StopFocusSummaryBlock['kind'] = isPrivate
    ? 'private'
    : matchesFocusDomain(builtInDistractionDomains, domain)
      ? 'distraction'
      : 'work';

  return {
    appName,
    contextTitles:
      kind === 'work' && sample.windowTitle?.trim()
        ? [sample.windowTitle.trim().slice(0, 120)]
        : [],
    domain,
    kind,
    label:
      kind === 'private'
        ? isMaskedPrivateDomain || domain
          ? 'Private domain'
          : 'Private app'
        : (domain ?? appName ?? 'Unknown context'),
  };
}

function getPauseOverlapMs(args: {
  endTime: number;
  pauseRanges: PauseRange[];
  startTime: number;
}) {
  const { endTime, pauseRanges, startTime } = args;
  if (endTime <= startTime || !pauseRanges.length) {
    return 0;
  }

  return pauseRanges.reduce((total, range) => {
    const pausedUntil = range.endTime ?? endTime;
    if (pausedUntil <= range.startTime) {
      return total;
    }
    const overlapStart = Math.max(startTime, range.startTime);
    const overlapEnd = Math.min(endTime, pausedUntil);
    if (overlapEnd <= overlapStart) {
      return total;
    }
    return total + (overlapEnd - overlapStart);
  }, 0);
}

export function buildStopFocusSummary(args: {
  activeSession: ActiveSession | null;
  activities: DesktopHelperActivity[];
  now?: number;
  preferences: TrackerPreferences;
  status: DesktopHelperStatus;
}): StopFocusSummary | null {
  const { activeSession, activities, preferences, status } = args;
  const sessionStart = activeSession?.startTime ?? 0;
  const sessionEnd = activeSession?.pausedAt ?? args.now ?? Date.now();
  if (!activeSession || !preferences.desktopTrackingEnabled || sessionEnd <= sessionStart) {
    return null;
  }

  const samples = activities
    .filter((activity) => activity.capturedAt >= sessionStart && activity.capturedAt <= sessionEnd)
    .map(({ appName, capturedAt, domain, platform, windowTitle }) => ({
      appName,
      capturedAt,
      domain,
      platform,
      windowTitle,
    }))
    .sort((left, right) => left.capturedAt - right.capturedAt);
  if (
    status.lastSeenAt &&
    status.lastSeenAt >= sessionStart &&
    status.lastSeenAt <= sessionEnd &&
    status.lastAppName
  ) {
    const lastSample = samples.at(-1);
    if (
      !lastSample ||
      lastSample.capturedAt !== status.lastSeenAt ||
      lastSample.appName !== status.lastAppName ||
      lastSample.domain !== status.lastDomain
    ) {
      samples.push({
        appName: status.lastAppName,
        capturedAt: status.lastSeenAt,
        domain: status.lastDomain,
        platform: status.platform ?? 'unknown',
        windowTitle: null,
      });
    }
  }
  if (!samples.length) {
    return null;
  }

  const firstConfirmedAt = samples[0]?.capturedAt ?? sessionStart;
  const lastConfirmedAt = samples.at(-1)?.capturedAt ?? sessionStart;
  const hasStartCoverage = firstConfirmedAt - sessionStart <= desktopHelperConnectedThresholdMs;
  const hasEndCoverage = sessionEnd - lastConfirmedAt <= desktopHelperConnectedThresholdMs;
  const isPartial = !hasStartCoverage || !hasEndCoverage;
  const sessionTrackedSeconds = getActiveElapsedSeconds(activeSession, sessionEnd);
  const confirmedSessionStart = hasStartCoverage ? sessionStart : firstConfirmedAt;
  const confirmedSessionEnd = isPartial ? lastConfirmedAt : sessionEnd;
  const blocks: StopFocusSummaryBlock[] = [];
  for (let index = 0; index < samples.length; index += 1) {
    const startAt =
      index === 0 ? confirmedSessionStart : Math.max(sessionStart, samples[index].capturedAt);
    const endAt =
      index < samples.length - 1
        ? Math.min(confirmedSessionEnd, samples[index + 1].capturedAt)
        : confirmedSessionEnd;
    const durationSeconds = Math.max(
      0,
      Math.round(
        (endAt -
          startAt -
          getPauseOverlapMs({
            endTime: endAt,
            pauseRanges: activeSession.pauseRanges,
            startTime: startAt,
          })) /
          1000,
      ),
    );
    if (!durationSeconds) {
      continue;
    }
    const block = {
      ...classifyFocusContext(samples[index], preferences.privateDomainsText),
      durationSeconds,
      endTime: endAt,
      id: `focus-block-${index}-${startAt}`,
      startTime: startAt,
    };
    const previousBlock = blocks.at(-1);
    if (
      previousBlock &&
      previousBlock.kind === block.kind &&
      previousBlock.label === block.label &&
      previousBlock.appName === block.appName &&
      previousBlock.domain === block.domain
    ) {
      previousBlock.durationSeconds += durationSeconds;
      for (const title of block.contextTitles) {
        if (
          !previousBlock.contextTitles.includes(title) &&
          previousBlock.contextTitles.length < 3
        ) {
          previousBlock.contextTitles.push(title);
        }
      }
    } else {
      blocks.push(block);
    }
  }
  if (!blocks.length) {
    return null;
  }

  const totals = blocks.reduce(
    (result, block, index) => {
      result.trackedSeconds += block.durationSeconds;
      if (block.kind === 'work') result.workSeconds += block.durationSeconds;
      if (block.kind === 'private') result.privateSeconds += block.durationSeconds;
      if (block.kind === 'distraction') result.distractionSeconds += block.durationSeconds;
      if (
        index > 0 &&
        block.kind !== 'work' &&
        block.durationSeconds >= focusLossMinBlockSeconds &&
        blocks[index - 1]?.kind === 'work'
      ) {
        result.focusLossCount += 1;
      }
      return result;
    },
    {
      distractionSeconds: 0,
      focusLossCount: 0,
      isPartial,
      privateSeconds: 0,
      trackedSeconds: 0,
      workSeconds: 0,
    },
  );

  return {
    blocks,
    ...totals,
    missingSeconds: Math.max(0, sessionTrackedSeconds - totals.trackedSeconds),
  };
}

export function getDefaultStopFocusBlockKinds(summary: StopFocusSummary | null) {
  if (!summary) {
    return {};
  }
  return Object.fromEntries(summary.blocks.map((block) => [block.id, block.kind])) as Record<
    string,
    ReviewedStopBlockKind
  >;
}

export function buildReviewedStopFocusSummary(args: {
  blockKinds: Record<string, ReviewedStopBlockKind>;
  summary: StopFocusSummary | null;
}): ReviewedStopFocusSummary | null {
  const { summary } = args;
  if (!summary) {
    return null;
  }

  const blocks = summary.blocks.map((block) => ({
    ...block,
    reviewedKind: args.blockKinds[block.id] ?? block.kind,
  }));
  const workSeconds = blocks.reduce(
    (total, block) => total + (block.reviewedKind === 'work' ? block.durationSeconds : 0),
    0,
  );
  const privateSeconds = blocks.reduce(
    (total, block) => total + (block.reviewedKind === 'private' ? block.durationSeconds : 0),
    0,
  );
  const distractionSeconds = blocks.reduce(
    (total, block) => total + (block.reviewedKind === 'distraction' ? block.durationSeconds : 0),
    0,
  );
  const trackedSeconds = blocks.reduce((total, block) => total + block.durationSeconds, 0);
  const nonWorkSeconds = Math.max(0, trackedSeconds - workSeconds);
  const focusLossCount = blocks.reduce((total, block, index) => {
    if (
      index > 0 &&
      block.reviewedKind !== 'work' &&
      block.durationSeconds >= focusLossMinBlockSeconds &&
      blocks[index - 1]?.reviewedKind === 'work'
    ) {
      return total + 1;
    }
    return total;
  }, 0);

  return {
    blocks,
    distractionSeconds,
    focusLossCount,
    missingSeconds: summary.missingSeconds,
    nonWorkSeconds,
    privateSeconds,
    trackedSeconds,
    workSeconds,
  };
}

export function buildReviewedStopNote(summary: ReviewedStopFocusSummary | null) {
  if (!summary || !summary.blocks.length) {
    return '';
  }
  const groupedBlocks = [
    ...summary.blocks
      .reduce((groups, block) => {
        const key = `${block.reviewedKind}:${block.label}`;
        const current = groups.get(key);
        if (current) {
          current.durationSeconds += block.durationSeconds;
        } else {
          groups.set(key, { ...block });
        }
        return groups;
      }, new Map<string, ReviewedStopFocusSummary['blocks'][number]>())
      .values(),
  ];
  const workBlocks = groupedBlocks.filter((block) => block.reviewedKind === 'work');
  const distractionBlocks = groupedBlocks.filter((block) => block.reviewedKind === 'distraction');
  const privateBlocks = groupedBlocks.filter((block) => block.reviewedKind === 'private');
  const lines = [`Total work: ${formatDurationPretty(summary.workSeconds)}.`];
  if (workBlocks.length) {
    lines.push('Work blocks:');
    for (const block of workBlocks) {
      const contextTitle = block.contextTitles.find(
        (title) => title.trim().toLowerCase() !== block.label.trim().toLowerCase(),
      );
      lines.push(
        `- ${block.label} — ${formatDurationPrecise(block.durationSeconds)}${contextTitle ? ` — ${contextTitle}` : ''}`,
      );
    }
  }
  if (distractionBlocks.length) {
    lines.push('Outside work:');
    for (const block of distractionBlocks) {
      lines.push(`- ${block.label} — distraction ${formatDurationPrecise(block.durationSeconds)}`);
    }
  }
  if (privateBlocks.length) {
    if (!distractionBlocks.length) {
      lines.push('Outside work:');
    }
    for (const block of privateBlocks) {
      lines.push(`- ${block.label} — private ${formatDurationPrecise(block.durationSeconds)}`);
    }
  }
  if (summary.focusLossCount > 0) {
    lines.push(`Focus losses: ${summary.focusLossCount}.`);
  }
  if (summary.missingSeconds > 0) {
    lines.push(`Missing helper coverage: ${formatDurationPretty(summary.missingSeconds)}.`);
  }
  lines.push('');
  lines.push('Session outcome:');
  return lines.join('\n');
}

export function toStopSessionEntries(entries: StopReviewEntryDraft[]) {
  return entries.map(({ category, description, endTime, projectName, startTime }) => ({
    category,
    description,
    endTime,
    projectName,
    startTime,
  }));
}

function isGenericStopBlockLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  return (
    normalized === 'electron' ||
    normalized === 'app_mode_loader' ||
    normalized === 'unknown context' ||
    normalized === 'nieznany kontekst'
  );
}

function buildStopEntryDescription(args: {
  activeDescription: string;
  block: StopFocusSummaryBlock & { reviewedKind?: ReviewedStopBlockKind };
  index: number;
  total: number;
}) {
  const activeDescription = args.activeDescription.trim();
  const helperLabel = isGenericStopBlockLabel(args.block.label) ? '' : args.block.label;
  const workContext = args.block.contextTitles[0] ?? '';
  const helperContext = workContext || helperLabel;

  if (!activeDescription) {
    return helperContext || 'Work on a project';
  }
  if (!helperContext || helperContext.toLowerCase() === activeDescription.toLowerCase()) {
    return activeDescription;
  }
  return args.total > 1 ? `${activeDescription} • ${helperContext}` : helperContext;
}

export function buildStopReviewEntryDrafts(args: {
  activeSession: Pick<ActiveSession, 'category' | 'description' | 'projectName'> | null;
  includeNonWork?: boolean;
  reviewedSummary: ReviewedStopFocusSummary | null;
  previousEntries?: StopReviewEntryDraft[];
}) {
  if (!args.activeSession || !args.reviewedSummary) {
    return [];
  }

  const previousByBlockId = new Map(
    (args.previousEntries ?? []).map((entry) => [entry.blockId, entry]),
  );
  const blocks = args.includeNonWork
    ? args.reviewedSummary.blocks
    : args.reviewedSummary.blocks.filter((block) => block.reviewedKind === 'work');

  return blocks.map((block, index) => {
    const previous = previousByBlockId.get(block.id);
    const defaultCategory =
      block.reviewedKind === 'private'
        ? 'prywatne'
        : block.reviewedKind === 'distraction'
          ? 'rozproszenie'
          : (args.activeSession?.category ?? 'kodowanie');
    const category =
      previous?.category &&
      previous.category !== args.activeSession?.category &&
      previous.category !== 'prywatne' &&
      previous.category !== 'rozproszenie'
        ? previous.category
        : defaultCategory;
    return {
      blockId: block.id,
      category,
      description:
        previous?.description ??
        buildStopEntryDescription({
          activeDescription: args.activeSession?.description ?? '',
          block,
          index,
          total: blocks.length,
        }),
      durationSeconds: block.durationSeconds,
      endTime: block.endTime,
      projectName: previous?.projectName ?? args.activeSession?.projectName ?? null,
      startTime: block.startTime,
    };
  });
}

export function shouldAutoSplitStop(args: {
  mode: AutoSplitMode;
  summary: ReviewedStopFocusSummary | null;
}) {
  const blocks = args.summary?.blocks ?? [];
  if (blocks.length < 2 || args.mode === 'never') {
    return false;
  }
  if (args.mode === 'all-contexts') {
    return true;
  }
  return blocks.some((block) => block.reviewedKind !== 'work');
}

export function describeDesktopHelperStatus(status: DesktopHelperStatus, now = Date.now()) {
  if (!status.configured) {
    return 'The helper is not configured yet.';
  }
  if (status.connected && status.lastAppName) {
    const domainSuffix = status.lastDomain ? ` • ${status.lastDomain}` : '';
    return `Connected. Last activity: ${status.lastAppName}${domainSuffix}.`;
  }
  if (status.lastSeenAt) {
    const secondsAgo = Math.max(0, Math.round((now - status.lastSeenAt) / 1000));
    return `Helper configured, but offline for about ${secondsAgo}s.`;
  }
  return 'The helper has a key but has not sent any activity yet.';
}

export function describeDesktopHelperLastSeen(status: DesktopHelperStatus, now = Date.now()) {
  if (!status.lastSeenAt) {
    return 'No signal from the helper.';
  }
  const secondsAgo = Math.max(0, Math.round((now - status.lastSeenAt) / 1000));
  return secondsAgo < 60
    ? `Last signal ${secondsAgo}s ago.`
    : `Last signal ${Math.round(secondsAgo / 60)} min ago.`;
}

export function describeDesktopHelperActivityContext(activity: DesktopHelperActivity) {
  return `${activity.appName}${activity.domain ? ` • ${activity.domain}` : ''}`;
}

export function describeDesktopHelperActivityTime(
  activity: Pick<DesktopHelperActivity, 'capturedAt'>,
  now = Date.now(),
) {
  const secondsAgo = Math.max(0, Math.round((now - activity.capturedAt) / 1000));
  return secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.round(secondsAgo / 60)} min ago`;
}

export function getActiveElapsedSeconds(
  activeSession: Pick<ActiveSession, 'pausedAt' | 'pausedSeconds' | 'startTime'>,
  now = Date.now(),
) {
  const effectiveEndTime = activeSession.pausedAt ?? now;
  return Math.max(
    0,
    Math.floor((effectiveEndTime - activeSession.startTime) / 1000) - activeSession.pausedSeconds,
  );
}

export function filterHistoryGroups(
  groups: SessionDayGroup[],
  filters: { category: string; query: string },
) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return groups
    .map((group) => {
      const sessions = group.sessions.filter((session) => {
        const categoryMatches = filters.category === 'all' || session.category === filters.category;
        if (!categoryMatches) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const haystack = [
          session.description,
          session.whatIsDone,
          session.category,
          session.date,
          session.projectName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });

      if (!sessions.length) {
        return null;
      }

      return {
        date: group.date,
        sessionCount: sessions.length,
        sessions,
        totalSeconds: sessions.reduce((sum, session) => sum + session.duration, 0),
      };
    })
    .filter((group): group is SessionDayGroup => group !== null);
}

export function deriveHistoryCategories(groups: SessionDayGroup[]) {
  return [
    ...new Set(groups.flatMap((group) => group.sessions.map((session) => session.category))),
  ].sort((left, right) => left.localeCompare(right, 'pl'));
}

export function buildProjectSummaries(sessions: SessionRecord[]) {
  const totals = new Map<string, TrackerProjectSummary>();
  for (const session of sessions) {
    const projectName = session.projectName;
    if (!projectName) continue;
    const current = totals.get(projectName) ?? {
      projectName,
      seconds: 0,
      sessionCount: 0,
    };
    current.seconds += session.duration;
    current.sessionCount += 1;
    totals.set(projectName, current);
  }
  return [...totals.values()].sort((left, right) => {
    if (right.seconds !== left.seconds) return right.seconds - left.seconds;
    return left.projectName.localeCompare(right.projectName, 'pl');
  });
}

export function formatGoalHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export function createSessionDraft(projectName: string | null = null): SessionDraft {
  return {
    category: categories[1],
    date: toLocalDateString(Date.now()),
    description: 'Work on a project',
    projectName,
    startTime: '09:00',
    stopTime: '10:00',
    whatIsDone: 'A concrete session outcome',
  };
}

export function createRecoveredSessionDraft(args: {
  activeSession: ActiveSession;
  endTime: number;
  whatIsDone: string;
}) {
  if (toLocalDateString(args.activeSession.startTime) !== toLocalDateString(args.endTime)) {
    return null;
  }
  return {
    category: args.activeSession.category,
    date: toLocalDateString(args.activeSession.startTime),
    description: args.activeSession.description,
    projectName: args.activeSession.projectName,
    startTime: toLocalTimeString(args.activeSession.startTime),
    stopTime: toLocalTimeString(args.endTime),
    whatIsDone: args.whatIsDone.trim() || args.activeSession.description || 'Saved work session',
  } satisfies SessionDraft;
}

export function createSessionDraftFromRecord(record: SessionRecord): SessionDraft {
  return {
    category: record.category,
    date: record.date,
    description: record.description,
    projectName: record.projectName,
    startTime: record.startTime,
    stopTime: record.stopTime,
    whatIsDone: record.whatIsDone,
  };
}

export function buildSessionsCsv(sessions: SessionRecord[]) {
  const header = [
    'Date',
    'Start time',
    'Stop time',
    'Duration (seconds)',
    'Duration (formatted)',
    'Project',
    'Category',
    'Session description',
    'What was done',
  ];
  const rows = sessions.map((session) =>
    [
      session.date,
      session.startTime,
      session.stopTime,
      String(session.duration),
      formatDurationPretty(session.duration),
      session.projectName ?? '',
      session.category,
      session.description,
      session.whatIsDone,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  );
  return `\uFEFF${header.join(',')}\n${rows.join('\n')}`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function playPingSound() {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.12);
    gainNode.gain.setValueAtTime(0.18, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  } catch {
    // Ignore audio errors in browsers that block sound until interaction.
  }
}

export function getActiveElapsedSecondsBetween(
  activeSession: Pick<ActiveSession, 'pausedAt' | 'pausedSeconds' | 'pauseRanges' | 'startTime'>,
  rangeStart: number,
  rangeEnd: number,
) {
  const effectiveEnd = Math.min(activeSession.pausedAt ?? rangeEnd, rangeEnd);
  const start = Math.max(activeSession.startTime, rangeStart);
  const end = Math.max(start, effectiveEnd);
  if (end <= start) {
    return 0;
  }
  const pausedSeconds = activeSession.pauseRanges.reduce((total, range) => {
    const pauseEnd = Math.min(range.endTime ?? effectiveEnd, end);
    const overlapStart = Math.max(start, range.startTime);
    return pauseEnd > overlapStart ? total + Math.floor((pauseEnd - overlapStart) / 1000) : total;
  }, 0);
  const rawSeconds = Math.floor((end - start) / 1000);
  const legacyPausedSeconds = activeSession.pauseRanges.length
    ? 0
    : Math.floor(
        (rawSeconds / Math.max(1, Math.floor((effectiveEnd - activeSession.startTime) / 1000))) *
          activeSession.pausedSeconds,
      );
  return Math.max(0, rawSeconds - pausedSeconds - legacyPausedSeconds);
}

function withLiveSummary(
  summary: TrackerSummary,
  elapsedSeconds: number,
  activeSession: Pick<
    ActiveSession,
    'pausedAt' | 'pausedSeconds' | 'pauseRanges' | 'startTime'
  > | null,
  dailyGoalHours: number,
) {
  if (!activeSession) {
    return {
      ...summary,
      goalProgressPercent:
        dailyGoalHours > 0
          ? Math.min(100, Math.round((summary.todaySeconds / (dailyGoalHours * 3600)) * 100))
          : 0,
      goalRemainingSeconds: Math.max(0, Math.round(dailyGoalHours * 3600) - summary.todaySeconds),
    };
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todaySeconds =
    summary.todaySeconds +
    getActiveElapsedSecondsBetween(activeSession, todayStart.getTime(), now.getTime());
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - (dayOfWeek - 1));
  const weekSeconds =
    summary.weekSeconds +
    getActiveElapsedSecondsBetween(activeSession, monday.getTime(), now.getTime());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthSeconds =
    summary.monthSeconds + getActiveElapsedSecondsBetween(activeSession, monthStart, now.getTime());
  const totalSeconds = summary.totalSeconds + elapsedSeconds;
  const dailyGoalSeconds = Math.max(0, Math.round(dailyGoalHours * 3600));

  return {
    ...summary,
    todaySeconds,
    weekSeconds,
    monthSeconds,
    totalSeconds,
    goalProgressPercent:
      dailyGoalSeconds > 0 ? Math.min(100, Math.round((todaySeconds / dailyGoalSeconds) * 100)) : 0,
    goalRemainingSeconds: Math.max(0, dailyGoalSeconds - todaySeconds),
  };
}

function nextDailyGoalHours(current: number, delta: number) {
  return Math.max(0.5, Math.min(12, Math.round((current + delta) * 10) / 10));
}

function updateDraftFactory(setter: Dispatch<SetStateAction<SessionDraft>>) {
  return (field: keyof SessionDraft, value: string | null) =>
    setter((current) => ({ ...current, [field]: value }));
}

type TrackerControllerArgs = Omit<TrackerWorkspaceHandlers, 'onMergeSessions'> & {
  autoPauseMode?: 'simple' | 'advanced';
  data: TrackerBootstrap;
};

export function useTrackerWorkspaceController({
  data,
  onAddManualSession,
  onDeleteTrackingRule,
  onDeleteSession,
  onExportSessions,
  onIssueDesktopHelperKey,
  onRevokeDesktopHelperKeys,
  onPauseSession,
  onResumeSession,
  onSavePreferences,
  onSaveTrackingRule,
  onSignOut,
  onStartSession,
  onStopSession,
  onUpdateSession,
  autoPauseMode = 'simple',
}: TrackerControllerArgs) {
  const [category, setCategory] = useState('kodowanie');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [idleNotice, setIdleNotice] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(data.preferences);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stopSplitIntoEntries, setStopSplitIntoEntries] = useState(false);
  const [stopReviewEntries, setStopReviewEntries] = useState<StopReviewEntryDraft[]>([]);
  const [stopNote, setStopNote] = useState('');
  const [stopReviewedBlockKinds, setStopReviewedBlockKinds] = useState<
    Record<string, ReviewedStopBlockKind>
  >({});
  const [stopSoundEnabled, setStopSoundEnabled] = useState(data.preferences.stopSoundEnabled);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState<SessionDraft>(createSessionDraft());
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null);
  const [editDraft, setEditDraft] = useState<SessionDraft>(createSessionDraft());
  const [deletingSession, setDeletingSession] = useState<SessionRecord | null>(null);
  const [desktopHelperSetup, setDesktopHelperSetup] = useState<DesktopHelperKeyIssue | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [recoveredSessionDraft, setRecoveredSessionDraft] = useState<SessionDraft | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [manualRecoveryFlow, setManualRecoveryFlow] = useState(false);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const autoPauseInFlight = useRef(false);
  const sessionReminderSessionId = useRef<string | null>(null);
  const latestSession = data.sessions[0] ?? null;
  const usesCloudSnapshot = Boolean(data.user && data.user.id !== 'local-private');
  const cloudSnapshot = useMemo(
    () => (usesCloudSnapshot && data.user ? readActiveSessionSnapshot(data.user.id) : null),
    [data.user, snapshotVersion, usesCloudSnapshot],
  );
  const projectSummaries = useMemo(() => buildProjectSummaries(data.sessions), [data.sessions]);
  const resolvedActiveSessionState = useMemo(
    () =>
      usesCloudSnapshot && data.user
        ? resolveActiveSessionState({
            userId: data.user.id,
            serverActiveSession: data.activeSession,
            snapshot: cloudSnapshot,
            latestSession,
          })
        : {
            activeSession: data.activeSession,
            notice: null,
            source: data.activeSession ? 'local' : null,
          },
    [cloudSnapshot, data.activeSession, data.user, latestSession, usesCloudSnapshot],
  );
  const activeSession = resolvedActiveSessionState.activeSession;
  const desktopHelperIngestUrl = (() => {
    const convexUrl = import.meta.env?.VITE_CONVEX_URL as string | undefined;
    return convexUrl ? buildDesktopHelperIngestUrl(convexUrl) : null;
  })();

  const writeCloudSnapshot = (snapshot: ActiveSessionSnapshot) => {
    writeActiveSessionSnapshot(snapshot);
    setSnapshotVersion((current) => current + 1);
  };

  const clearCloudSnapshot = (userId: string) => {
    clearActiveSessionSnapshot(userId);
    setSnapshotVersion((current) => current + 1);
  };

  useEffect(() => {
    setPreferences(data.preferences);
    setStopSoundEnabled(data.preferences.stopSoundEnabled);
  }, [data.preferences]);

  useEffect(() => {
    if (!usesCloudSnapshot || !data.user) {
      return;
    }
    if (data.activeSession) {
      writeCloudSnapshot(createActiveSessionSnapshot(data.user.id, data.activeSession));
      setRecoveredSessionDraft(null);
      setRecoveryNotice(null);
      setManualRecoveryFlow(false);
      return;
    }
    if (resolvedActiveSessionState.source !== 'local') {
      clearCloudSnapshot(data.user.id);
    }
  }, [data.activeSession, data.user, resolvedActiveSessionState.source, usesCloudSnapshot]);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      setSessionNotice(null);
      sessionReminderSessionId.current = null;
      return;
    }
    const updateElapsed = () => {
      const nextElapsedSeconds = getActiveElapsedSeconds(activeSession);
      setElapsedSeconds(nextElapsedSeconds);
      if (
        nextElapsedSeconds >= longSessionReminderSeconds &&
        sessionReminderSessionId.current !== activeSession._id
      ) {
        sessionReminderSessionId.current = activeSession._id;
        setSessionNotice(
          'This timer has been running for more than eight hours. Review the session and decide whether to keep it, pause it, or save it.',
        );
      }
    };
    updateElapsed();
    if (activeSession.pausedAt !== null) {
      return;
    }
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSession]);

  useEffect(() => {
    if (
      autoPauseMode !== 'simple' ||
      !activeSession ||
      activeSession.pausedAt !== null ||
      !preferences.autoPauseEnabled
    ) {
      return;
    }
    const idleThresholdMs = getIdleThresholdMs(preferences.autoPauseMinutes);
    let lastActivityAt = Date.now();
    const resetActivity = () => {
      lastActivityAt = Date.now();
    };
    const checkIdle = () => {
      if (autoPauseInFlight.current) return;
      const idleTime = Date.now() - lastActivityAt;
      if (idleTime < idleThresholdMs) return;
      autoPauseInFlight.current = true;
      void onPauseSession()
        .then(() => {
          setIdleNotice(
            `Timer paused after ${preferences.autoPauseMinutes} minutes of inactivity. Resume or end the session manually.`,
          );
          setStopDialogOpen(false);
        })
        .finally(() => {
          autoPauseInFlight.current = false;
        });
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];
    for (const eventName of events) {
      window.addEventListener(eventName, resetActivity, { passive: true });
    }
    const intervalId = window.setInterval(checkIdle, 10000);
    return () => {
      window.clearInterval(intervalId);
      for (const eventName of events) {
        window.removeEventListener(eventName, resetActivity);
      }
    };
  }, [
    activeSession,
    autoPauseMode,
    onPauseSession,
    preferences.autoPauseEnabled,
    preferences.autoPauseMinutes,
  ]);

  useEffect(() => {
    if (
      autoPauseMode !== 'advanced' ||
      !activeSession ||
      activeSession.pausedAt !== null ||
      !preferences.autoPauseEnabled
    ) {
      return;
    }

    const checkIdle = () => {
      if (autoPauseInFlight.current) return;
      if (
        !shouldAutoPauseFromDesktopHelper({
          activeSession,
          preferences,
          status: data.desktopHelper,
        })
      ) {
        return;
      }
      autoPauseInFlight.current = true;
      void onPauseSession()
        .then(() => {
          setIdleNotice(
            `Timer paused after ${preferences.autoPauseMinutes} minutes without a desktop-helper signal. Resume or end the session manually.`,
          );
          setStopDialogOpen(false);
        })
        .finally(() => {
          autoPauseInFlight.current = false;
        });
    };

    checkIdle();
    const intervalId = window.setInterval(checkIdle, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeSession, autoPauseMode, data.desktopHelper, onPauseSession, preferences]);

  const summary = useMemo(
    () => withLiveSummary(data.summary, elapsedSeconds, activeSession, preferences.dailyGoalHours),
    [activeSession, data.summary, elapsedSeconds, preferences.dailyGoalHours],
  );
  const stopFocusSummary = useMemo(
    () =>
      buildStopFocusSummary({
        activeSession,
        activities: data.desktopHelperActivities,
        now: Date.now(),
        preferences,
        status: data.desktopHelper,
      }),
    [activeSession, data.desktopHelper, data.desktopHelperActivities, elapsedSeconds, preferences],
  );
  const reviewedStopFocusSummary = useMemo(
    () =>
      buildReviewedStopFocusSummary({
        blockKinds: stopReviewedBlockKinds,
        summary: stopFocusSummary,
      }),
    [stopFocusSummary, stopReviewedBlockKinds],
  );

  useEffect(() => {
    if (!stopDialogOpen) {
      return;
    }
    setStopReviewEntries((current) =>
      buildStopReviewEntryDrafts({
        activeSession,
        includeNonWork: preferences.autoSplitMode !== 'never',
        previousEntries: current,
        reviewedSummary: reviewedStopFocusSummary,
      }),
    );
  }, [activeSession, preferences.autoSplitMode, reviewedStopFocusSummary, stopDialogOpen]);

  const applyPreferencePatch = async (patch: Partial<TrackerPreferences>) => {
    const nextPreferences = { ...preferences, ...patch };
    setPreferences(nextPreferences);
    try {
      await onSavePreferences(patch);
    } catch {
      setPreferences(data.preferences);
      throw new Error('Could not save preferences.');
    }
  };

  const handleStartSession = async () => {
    setBusyAction('start');
    try {
      const resolvedProjectName =
        projectName?.trim() || data.desktopProjectSuggestion?.projectName || null;
      const result = await resolveActionOutcome(() =>
        onStartSession({
          category,
          description,
          projectName: resolvedProjectName,
        }),
      );
      if (!result.ok) {
        return false;
      }
      if (data.user) {
        writeCloudSnapshot(
          createActiveSessionSnapshot(data.user.id, {
            category,
            description: description.trim() || 'Work on a project',
            pausedAt: null,
            pausedSeconds: 0,
            startTime: Date.now(),
          }),
        );
      }
      setDescription('');
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleQuickStartFromHelper = async () => {
    setBusyAction('start');
    try {
      const helperSource = getDesktopHelperQuickStartSource({
        preferences,
        status: data.desktopHelper,
      });
      if (!helperSource) {
        setIdleNotice(
          'Starting from the helper requires active tracking and a fresh helper signal.',
        );
        return;
      }
      const resolvedProjectName =
        projectName?.trim() || data.desktopProjectSuggestion?.projectName || null;
      const resolvedDescription = description.trim() || `Work in ${helperSource}`;
      const result = await resolveActionOutcome(() =>
        onStartSession({
          category,
          description: resolvedDescription,
          projectName: resolvedProjectName,
        }),
      );
      if (!result.ok) {
        return false;
      }
      if (data.user) {
        writeCloudSnapshot(
          createActiveSessionSnapshot(data.user.id, {
            category,
            description: resolvedDescription,
            pausedAt: null,
            pausedSeconds: 0,
            startTime: Date.now(),
          }),
        );
      }
      setDescription('');
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleStopConfirm = async () => {
    setBusyAction('stop');
    try {
      const activeSessionAtStop = activeSession;
      const stopEndTime = activeSessionAtStop?.pausedAt ?? Date.now();
      if (stopSoundEnabled !== preferences.stopSoundEnabled) {
        const preferenceResult = await resolveActionOutcome(() =>
          applyPreferencePatch({ stopSoundEnabled }),
        );
        if (!preferenceResult.ok) {
          return false;
        }
      }
      const stopResult = await resolveActionOutcome(() =>
        onStopSession({
          entries: stopSplitIntoEntries ? toStopSessionEntries(stopReviewEntries) : undefined,
          whatIsDone: stopNote.trim() || buildReviewedStopNote(reviewedStopFocusSummary),
        }),
      );
      if (!stopResult.ok) {
        const stopError = 'error' in stopResult ? stopResult.error : null;
        if (
          activeSessionAtStop &&
          resolvedActiveSessionState.source === 'local' &&
          isMissingActiveSessionStopError(stopError)
        ) {
          const draft = createRecoveredSessionDraft({
            activeSession: activeSessionAtStop,
            endTime: stopEndTime,
            whatIsDone: stopNote,
          });
          setRecoveredSessionDraft(draft);
          setRecoveryNotice(
            draft
              ? 'Convex no longer has this active session. You can save it manually from this device or discard the local recovery.'
              : 'Convex no longer has this active session. The locally restored timer crossed midnight, so discard the recovery and add two separate entries manually.',
          );
          setStopDialogOpen(false);
        }
        return false;
      }
      if (data.user) {
        clearCloudSnapshot(data.user.id);
      }
      setRecoveredSessionDraft(null);
      setRecoveryNotice(null);
      setManualRecoveryFlow(false);
      if (stopSoundEnabled) playPingSound();
      setStopDialogOpen(false);
      setStopSplitIntoEntries(false);
      setStopReviewEntries([]);
      setStopNote('');
      setStopReviewedBlockKinds({});
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleResumeSession = async () => {
    setBusyAction('resume');
    try {
      const result = await resolveActionOutcome(() => onResumeSession());
      if (!result.ok) {
        return false;
      }
      setIdleNotice(null);
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleIssueDesktopHelperKey = async () => {
    setBusyAction('desktop-helper-key');
    try {
      const result = await resolveActionOutcome(() => onIssueDesktopHelperKey());
      if (!result.ok) {
        return false;
      }
      setDesktopHelperSetup(result.value);
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleRevokeDesktopHelperKeys = async () => {
    setBusyAction('desktop-helper-revoke');
    try {
      const result = await resolveActionOutcome(() => onRevokeDesktopHelperKeys());
      if (!result.ok) {
        return false;
      }
      setDesktopHelperSetup(null);
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveTrackingRule = async (rule: {
    matchAppName: string | null;
    matchDomain: string | null;
    projectName: string;
  }) => {
    setBusyAction('desktop-rule-save');
    try {
      const result = await resolveActionOutcome(() => onSaveTrackingRule(rule));
      return result.ok ? result.value : null;
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteTrackingRule = async (ruleId: string) => {
    setBusyAction(`desktop-rule-delete:${ruleId}`);
    try {
      const result = await resolveActionOutcome(() => onDeleteTrackingRule({ ruleId }));
      return result.ok;
    } finally {
      setBusyAction(null);
    }
  };

  const handleSavePrivateDomains = async (privateDomainsText: string) => {
    setBusyAction('desktop-helper-privacy');
    try {
      const result = await resolveActionOutcome(() =>
        applyPreferencePatch({
          privateDomainsText,
        }),
      );
      return result.ok;
    } finally {
      setBusyAction(null);
    }
  };

  const handleManualAdd = async () => {
    setBusyAction('manual');
    try {
      const result = await resolveActionOutcome(() => onAddManualSession(manualDraft));
      if (!result.ok) {
        return false;
      }
      if (manualRecoveryFlow) {
        if (data.user) {
          clearCloudSnapshot(data.user.id);
        }
        setRecoveredSessionDraft(null);
        setRecoveryNotice(null);
        setManualRecoveryFlow(false);
      }
      setManualDialogOpen(false);
      setManualDraft(createSessionDraft(projectName));
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingSession) return;
    setBusyAction('edit');
    try {
      const result = await resolveActionOutcome(() =>
        onUpdateSession({ sessionId: editingSession._id, ...editDraft }),
      );
      if (!result.ok) {
        return false;
      }
      setEditingSession(null);
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSession) return;
    setBusyAction('delete');
    try {
      const result = await resolveActionOutcome(() =>
        onDeleteSession({ sessionId: deletingSession._id }),
      );
      if (!result.ok) {
        return false;
      }
      setDeletingSession(null);
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportSessions = async () => {
    setBusyAction('export');
    try {
      const result = await resolveActionOutcome(() => onExportSessions());
      if (!result.ok) {
        return false;
      }
      downloadCsv(`worktimer-${toLocalDateString(Date.now())}.csv`, buildSessionsCsv(result.value));
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  return {
    activeSession,
    activeSessionNotice: resolvedActiveSessionState.notice,
    activeSessionSource: resolvedActiveSessionState.source,
    busyAction,
    category,
    changeDailyGoal(delta: number) {
      const nextValue = nextDailyGoalHours(preferences.dailyGoalHours, delta);
      void applyPreferencePatch({ dailyGoalHours: nextValue });
    },
    closeDeleteDialog() {
      setDeletingSession(null);
    },
    closeEditDialog() {
      setEditingSession(null);
    },
    closeManualDialog() {
      setManualRecoveryFlow(false);
      setManualDialogOpen(false);
    },
    closeStopDialog() {
      setStopDialogOpen(false);
    },
    currentProjectName: projectName,
    deletingSession,
    desktopProjectSuggestion: data.desktopProjectSuggestion,
    desktopTrackingRules: data.desktopTrackingRules,
    description,
    dismissIdleNotice() {
      setIdleNotice(null);
    },
    editDraft,
    editingSession,
    elapsedSeconds,
    exportSessions: handleExportSessions,
    handleDeleteConfirm,
    handleEditSave,
    handleManualAdd,
    handleCurrentProjectNameChange(value: string) {
      setProjectName(value.trim() || null);
    },
    handleDeleteTrackingRule,
    handleIssueDesktopHelperKey,
    handleRevokeDesktopHelperKeys,
    handleQuickStartFromHelper,
    handleSavePrivateDomains,
    handleResumeSession,
    handleSaveTrackingRule,
    handleSignOut() {
      return onSignOut();
    },
    handleStartSession,
    handleStopConfirm,
    idleNotice,
    sessionNotice,
    dismissSessionNotice() {
      setSessionNotice(null);
    },
    openRecoveredSessionAsManual() {
      if (!recoveredSessionDraft) {
        return;
      }
      setManualRecoveryFlow(true);
      setManualDraft(recoveredSessionDraft);
      setManualDialogOpen(true);
    },
    desktopHelperCommand:
      desktopHelperSetup && desktopHelperIngestUrl
        ? buildDesktopHelperCommand({
            helperKey: desktopHelperSetup.helperKey,
            ingestUrl: desktopHelperIngestUrl,
          })
        : null,
    desktopHelperKey: desktopHelperSetup?.helperKey ?? null,
    desktopHelperStatus: data.desktopHelper,
    manualDialogOpen,
    manualDraft,
    recoveredSessionCanBeSavedManually: Boolean(recoveredSessionDraft),
    recoveryNotice,
    openDeleteDialog(session: SessionRecord) {
      setDeletingSession(session);
    },
    openEditDialog(session: SessionRecord) {
      setEditingSession(session);
      setEditDraft(createSessionDraftFromRecord(session));
    },
    openManualDialog() {
      setManualRecoveryFlow(false);
      setManualDraft(createSessionDraft(projectName));
      setManualDialogOpen(true);
    },
    openStopDialog() {
      setStopNote(activeSession?.description ?? '');
      setStopReviewedBlockKinds(getDefaultStopFocusBlockKinds(stopFocusSummary));
      const defaultReviewedSummary = buildReviewedStopFocusSummary({
        blockKinds: getDefaultStopFocusBlockKinds(stopFocusSummary),
        summary: stopFocusSummary,
      });
      const defaultEntries = buildStopReviewEntryDrafts({
        activeSession,
        includeNonWork: preferences.autoSplitMode !== 'never',
        reviewedSummary: defaultReviewedSummary,
      });
      setStopReviewEntries(defaultEntries);
      setStopSplitIntoEntries(
        shouldAutoSplitStop({
          mode: preferences.autoSplitMode,
          summary: defaultReviewedSummary,
        }),
      );
      setStopSoundEnabled(preferences.stopSoundEnabled);
      setStopDialogOpen(true);
    },
    preferences,
    savePreferences(patch: Partial<TrackerPreferences>) {
      return applyPreferencePatch(patch);
    },
    projectSummaries,
    discardRecoveredSession() {
      if (data.user) {
        clearCloudSnapshot(data.user.id);
      }
      setRecoveredSessionDraft(null);
      setRecoveryNotice(null);
      setManualRecoveryFlow(false);
      setStopDialogOpen(false);
    },
    setCategory,
    setDescription,
    setStopNote,
    setStopReviewEntries,
    setStopReviewedBlockKinds,
    setStopSplitIntoEntries,
    setStopSoundEnabled,
    stopDialogOpen,
    stopFocusSummary,
    stopNote,
    stopReviewEntries,
    stopReviewedBlockKinds,
    stopSplitIntoEntries,
    stopSoundEnabled,
    reviewedStopFocusSummary,
    summary,
    setStopReviewedBlockKind(blockId: string, kind: ReviewedStopBlockKind) {
      setStopReviewedBlockKinds((current) => ({
        ...current,
        [blockId]: kind,
      }));
    },
    updateStopReviewEntry(
      blockId: string,
      patch: Partial<Pick<StopReviewEntryDraft, 'category' | 'description' | 'projectName'>>,
    ) {
      setStopReviewEntries((current) =>
        current.map((entry) =>
          entry.blockId === blockId
            ? {
                ...entry,
                ...patch,
              }
            : entry,
        ),
      );
    },
    useReviewedStopSummaryNote() {
      const nextNote = buildReviewedStopNote(reviewedStopFocusSummary);
      if (nextNote) {
        setStopNote(nextNote);
      }
    },
    pauseDesktopTracking(minutes: number | null) {
      setBusyAction('desktop-helper-privacy');
      void applyPreferencePatch({
        desktopTrackingEnabled: true,
        desktopTrackingManualPause: minutes === null,
        desktopTrackingPausedUntil: minutes === null ? null : Date.now() + minutes * 60 * 1000,
      }).finally(() => setBusyAction(null));
    },
    resumeDesktopTracking() {
      setBusyAction('desktop-helper-privacy');
      void applyPreferencePatch({
        desktopTrackingManualPause: false,
        desktopTrackingPausedUntil: null,
      }).finally(() => setBusyAction(null));
    },
    toggleDesktopTracking() {
      const nextEnabled = !preferences.desktopTrackingEnabled;
      setBusyAction('desktop-helper-privacy');
      void applyPreferencePatch({
        desktopTrackingEnabled: nextEnabled,
        desktopTrackingManualPause: false,
        desktopTrackingPausedUntil: null,
      }).finally(() => setBusyAction(null));
    },
    toggleAutoPause() {
      void applyPreferencePatch({
        autoPauseEnabled: !preferences.autoPauseEnabled,
      });
    },
    changeAutoPauseMinutes(value: number) {
      void applyPreferencePatch({
        autoPauseMinutes: normalizeAutoPauseMinutes(value),
      });
    },
    toggleFocusMode() {
      void applyPreferencePatch({ focusMode: !preferences.focusMode });
    },
    updateEditDraft: updateDraftFactory(setEditDraft),
    updateManualDraft: updateDraftFactory(setManualDraft),
  };
}
