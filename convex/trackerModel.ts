import type { Doc } from './_generated/dataModel';

export const defaultPreferences = {
  autoPauseEnabled: false,
  autoPauseMinutes: 7,
  dailyGoalHours: 4,
  focusMode: false,
  stopSoundEnabled: true,
} as const;

export type SessionDoc = {
  category: string;
  date: string;
  description: string;
  duration: number;
  projectName?: string | null;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

export type StoppedSessionPart = {
  category: string;
  description: string;
  endTime: number;
  projectName?: string | null;
  startTime: number;
  whatIsDone: string;
};

export type SessionHistoryGroup = {
  date: string;
  sessionCount: number;
  totalSeconds: number;
  sessions: Doc<'sessions'>[];
};

const excludedSummaryCategories = new Set(['prywatne', 'rozproszenie']);

function countsAsWorkSession(session: Pick<SessionDoc, 'category'>) {
  return !excludedSummaryCategories.has(session.category);
}

export function toLocalDateString(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toLocalTimeString(timestamp: number) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseSessionTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfLocalDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayDiff(left: string, right: string) {
  const leftDate = startOfLocalDay(new Date(left));
  const rightDate = startOfLocalDay(new Date(right));
  return Math.round(
    (leftDate.getTime() - rightDate.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function isDateInsideWindow(date: string, days: number) {
  const start = startOfLocalDay(addDays(new Date(), -(days - 1)));
  const sessionDate = startOfLocalDay(new Date(date));
  return sessionDate >= start;
}

export function sortSessionsDesc<T extends SessionDoc>(sessions: T[]) {
  return [...sessions].sort(
    (left, right) =>
      parseSessionTime(right.date, right.startTime) -
      parseSessionTime(left.date, left.startTime),
  );
}

export function computeSummary(sessions: SessionDoc[], dailyGoalHours: number) {
  const now = new Date();
  const today = toLocalDateString(now.getTime());
  const month = now.getMonth();
  const year = now.getFullYear();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - (weekday - 1));
  const workSessions = sessions.filter(countsAsWorkSession);

  let todaySeconds = 0;
  let weekSeconds = 0;
  let monthSeconds = 0;
  let totalSeconds = 0;

  for (const session of workSessions) {
    totalSeconds += session.duration;
    if (session.date === today) todaySeconds += session.duration;
    const date = new Date(session.date);
    if (date >= monday) weekSeconds += session.duration;
    if (date.getMonth() === month && date.getFullYear() === year) {
      monthSeconds += session.duration;
    }
  }

  const dailyGoalSeconds = Math.max(0, Math.round(dailyGoalHours * 3600));
  return {
    todaySeconds,
    weekSeconds,
    monthSeconds,
    totalSeconds,
    sessionCount: workSessions.length,
    goalProgressPercent:
      dailyGoalSeconds > 0
        ? Math.min(100, Math.round((todaySeconds / dailyGoalSeconds) * 100))
        : 0,
    goalRemainingSeconds: Math.max(0, dailyGoalSeconds - todaySeconds),
  };
}

export function buildCategoryChart(sessions: SessionDoc[]) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const totals = new Map<string, number>();

  for (const session of sessions) {
    if (!countsAsWorkSession(session)) continue;
    const sessionDate = new Date(session.date);
    if (sessionDate < sevenDaysAgo) continue;
    totals.set(
      session.category,
      (totals.get(session.category) ?? 0) + session.duration,
    );
  }

  return [...totals.entries()]
    .map(([category, seconds]) => ({ category, seconds }))
    .sort((left, right) => right.seconds - left.seconds);
}

export function buildTrendChart(sessions: SessionDoc[]) {
  const points = new Map<string, number>();
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    points.set(toLocalDateString(date.getTime()), 0);
  }

  for (const session of sessions) {
    if (!countsAsWorkSession(session) || !points.has(session.date)) continue;
    points.set(session.date, (points.get(session.date) ?? 0) + session.duration);
  }

  return [...points.entries()].map(([date, seconds]) => ({ date, seconds }));
}

export function buildDashboard(sessions: SessionDoc[]) {
  const sortedSessions = sortSessionsDesc(sessions.filter(countsAsWorkSession));
  const uniqueDates = [...new Set(sortedSessions.map((session) => session.date))];

  let streakDays = 0;
  for (let index = 0; index < uniqueDates.length; index += 1) {
    if (index === 0) {
      streakDays = 1;
      continue;
    }
    const gap = dayDiff(uniqueDates[index - 1], uniqueDates[index]);
    if (gap === 1) {
      streakDays += 1;
      continue;
    }
    break;
  }

  const dayTotals = new Map<string, { seconds: number; sessionCount: number }>();
  const categoryTotals = new Map<string, number>();
  let averageSessionSeconds = 0;

  if (sortedSessions.length) {
    averageSessionSeconds = Math.round(
      sortedSessions.reduce((sum, session) => sum + session.duration, 0) /
        sortedSessions.length,
    );
  }

  for (const session of sortedSessions) {
    const current = dayTotals.get(session.date) ?? { seconds: 0, sessionCount: 0 };
    current.seconds += session.duration;
    current.sessionCount += 1;
    dayTotals.set(session.date, current);

    if (isDateInsideWindow(session.date, 14)) {
      categoryTotals.set(
        session.category,
        (categoryTotals.get(session.category) ?? 0) + session.duration,
      );
    }
  }

  let bestDay: { date: string; seconds: number } | null = null;
  for (const [date, totals] of dayTotals.entries()) {
    if (!isDateInsideWindow(date, 30)) continue;
    if (!bestDay || totals.seconds > bestDay.seconds) {
      bestDay = { date, seconds: totals.seconds };
    }
  }

  let topCategory: { category: string; seconds: number } | null = null;
  for (const [category, seconds] of categoryTotals.entries()) {
    if (!topCategory || seconds > topCategory.seconds) {
      topCategory = { category, seconds };
    }
  }

  const recentDays = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = startOfLocalDay(addDays(new Date(), -offset));
    const dateKey = toLocalDateString(date.getTime());
    const totals = dayTotals.get(dateKey) ?? { seconds: 0, sessionCount: 0 };
    recentDays.push({
      date: dateKey,
      seconds: totals.seconds,
      sessionCount: totals.sessionCount,
    });
  }

  return {
    averageSessionSeconds,
    bestDay,
    recentDays,
    streakDays,
    topCategory,
  };
}

export function buildRecentProjects(
  sessions: Array<Pick<SessionDoc, 'projectName'>>,
  activeProjectName?: string | null,
  limit = 5,
) {
  const recentProjects: string[] = [];
  const seen = new Set<string>();

  const pushProject = (value: string | null | undefined) => {
    const projectName = value?.trim();
    if (!projectName) {
      return;
    }
    const dedupeKey = projectName.toLocaleLowerCase('pl');
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);
    recentProjects.push(projectName);
  };

  pushProject(activeProjectName);
  for (const session of sessions) {
    pushProject(session.projectName);
    if (recentProjects.length >= limit) {
      break;
    }
  }

  return recentProjects;
}

export function buildSessionHistory(sessions: Doc<'sessions'>[]) {
  const sortedSessions = sortSessionsDesc(sessions);
  const groups: SessionHistoryGroup[] = [];

  for (const session of sortedSessions) {
    const currentGroup = groups.at(-1);
    if (!currentGroup || currentGroup.date !== session.date) {
      groups.push({
        date: session.date,
        sessionCount: 1,
        sessions: [session],
        totalSeconds: session.duration,
      });
      continue;
    }
    currentGroup.sessionCount += 1;
    currentGroup.totalSeconds += session.duration;
    currentGroup.sessions.push(session);
  }

  return {
    groups,
    totalShownDays: groups.length,
    totalShownSessions: sortedSessions.length,
  };
}

export function buildSessionRecord(
  args: {
    date: string;
    startTime: string;
    stopTime: string;
    category: string;
    description: string;
    projectName?: string | null;
    whatIsDone: string;
  },
  normalizeText: (value: string | undefined, fallback: string) => string,
  ErrorCtor: new (message: string) => Error,
) {
  const startTimestamp = parseSessionTime(args.date, args.startTime);
  const stopTimestamp = parseSessionTime(args.date, args.stopTime);
  if (Number.isNaN(startTimestamp) || Number.isNaN(stopTimestamp)) {
    throw new ErrorCtor('Nieprawidłowa data lub godzina sesji.');
  }
  if (stopTimestamp <= startTimestamp) {
    throw new ErrorCtor(
      'Ręczny wpis działa w ramach jednej doby. Sesję przez północ zapisz jako dwa osobne wpisy.',
    );
  }
  return {
    date: args.date,
    startTime: args.startTime,
    stopTime: args.stopTime,
    duration: Math.floor((stopTimestamp - startTimestamp) / 1000),
    category: normalizeText(args.category, 'inne'),
    description: normalizeText(args.description, 'Praca nad projektem'),
    projectName: args.projectName?.trim() || null,
    whatIsDone: normalizeText(args.whatIsDone, 'Zapisana sesja pracy'),
  };
}

export function buildManualSessionRecords(
  args: {
    date: string;
    startTime: string;
    stopTime: string;
    category: string;
    description: string;
    projectName?: string | null;
    whatIsDone: string;
  },
  normalizeText: (value: string | undefined, fallback: string) => string,
  ErrorCtor: new (message: string) => Error,
) {
  const startTimestamp = parseSessionTime(args.date, args.startTime);
  const stopTimestampSameDay = parseSessionTime(args.date, args.stopTime);
  if (Number.isNaN(startTimestamp) || Number.isNaN(stopTimestampSameDay)) {
    throw new ErrorCtor('Nieprawidłowa data lub godzina sesji.');
  }
  if (stopTimestampSameDay === startTimestamp) {
    throw new ErrorCtor('Godzina zakończenia musi różnić się od startu.');
  }
  const normalizedStopTimestamp =
    stopTimestampSameDay < startTimestamp
      ? new Date(stopTimestampSameDay).setDate(
          new Date(stopTimestampSameDay).getDate() + 1,
        )
      : stopTimestampSameDay;
  return buildStoppedSessionRecords({
    category: normalizeText(args.category, 'inne'),
    description: normalizeText(args.description, 'Praca nad projektem'),
    endTime: normalizedStopTimestamp,
    pausedSeconds: 0,
    projectName: args.projectName?.trim() || null,
    startTime: startTimestamp,
    whatIsDone: normalizeText(args.whatIsDone, 'Zapisana sesja pracy'),
  });
}

export function buildStoppedSessionRecords(args: {
  category: string;
  description: string;
  endTime: number;
  pauseRanges?: Array<{ startTime: number; endTime: number | null }>;
  pausedSeconds: number;
  projectName: string | null;
  startTime: number;
  whatIsDone: string;
}) {
  if (args.endTime <= args.startTime) {
    return [
      {
        category: args.category,
        date: toLocalDateString(args.startTime),
        description: args.description,
        duration: 0,
        projectName: args.projectName,
        startTime: toLocalTimeString(args.startTime),
        stopTime: toLocalTimeString(args.startTime),
        whatIsDone: args.whatIsDone,
      },
    ];
  }

  const segments: Array<{ startTime: number; endTime: number; rawMs: number }> = [];
  let cursor = args.startTime;
  while (cursor < args.endTime) {
    const nextDay = new Date(cursor);
    nextDay.setHours(24, 0, 0, 0);
    const segmentEnd = Math.min(args.endTime, nextDay.getTime());
    segments.push({
      startTime: cursor,
      endTime: segmentEnd,
      rawMs: segmentEnd - cursor,
    });
    cursor = segmentEnd;
  }

  const totalRawMs = Math.max(1, args.endTime - args.startTime);
  const exactPauseRanges = (args.pauseRanges ?? [])
    .map((range) => {
      const endTime = range.endTime ?? args.endTime;
      return {
        startTime: Math.max(args.startTime, range.startTime),
        endTime: Math.min(args.endTime, endTime),
      };
    })
    .filter((range) => range.endTime > range.startTime);
  const trackedMsBySegment =
    exactPauseRanges.length > 0
      ? segments.map((segment) => {
          const pausedMs = exactPauseRanges.reduce((sum, range) => {
            const overlapStart = Math.max(segment.startTime, range.startTime);
            const overlapEnd = Math.min(segment.endTime, range.endTime);
            return sum + Math.max(0, overlapEnd - overlapStart);
          }, 0);
          return Math.max(0, segment.rawMs - pausedMs);
        })
      : segments.map((segment) =>
          Math.max(
            0,
            segment.rawMs -
              Math.floor((segment.rawMs / totalRawMs) * args.pausedSeconds * 1000),
          ),
        );
  const totalTrackedSeconds = Math.max(
    0,
    Math.floor(trackedMsBySegment.reduce((sum, value) => sum + value, 0) / 1000),
  );
  let remainingSeconds = totalTrackedSeconds;

  const records = segments.map((segment, index) => {
    const duration =
      index === segments.length - 1
        ? remainingSeconds
        : Math.max(0, Math.min(remainingSeconds, Math.floor(trackedMsBySegment[index] / 1000)));
    remainingSeconds -= duration;
    return {
      category: args.category,
      date: toLocalDateString(segment.startTime),
      description: args.description,
      duration,
      projectName: args.projectName,
      startTime: toLocalTimeString(segment.startTime),
      stopTime: toLocalTimeString(segment.endTime),
      whatIsDone: args.whatIsDone,
    };
  });

  return records.filter((record) => record.duration > 0 || records.length === 1);
}

export function buildStoppedSessionRecordsFromParts(args: {
  parts: StoppedSessionPart[];
  pauseRanges?: Array<{ startTime: number; endTime: number | null }>;
}) {
  return args.parts.flatMap((part) =>
    buildStoppedSessionRecords({
      category: part.category,
      description: part.description,
      endTime: part.endTime,
      pauseRanges: args.pauseRanges,
      pausedSeconds: 0,
      projectName: part.projectName ?? null,
      startTime: part.startTime,
      whatIsDone: part.whatIsDone,
    }),
  );
}

export function normalizeProjectName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}
