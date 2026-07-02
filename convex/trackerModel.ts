export const defaultPreferences = {
  dailyGoalHours: 4,
  focusMode: false,
  stopSoundEnabled: true,
} as const;

export type SessionDoc = {
  category: string;
  date: string;
  description: string;
  duration: number;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

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

export function computeSummary(sessions: SessionDoc[], dailyGoalHours: number) {
  const now = new Date();
  const today = toLocalDateString(now.getTime());
  const month = now.getMonth();
  const year = now.getFullYear();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - (weekday - 1));

  let todaySeconds = 0;
  let weekSeconds = 0;
  let monthSeconds = 0;
  let totalSeconds = 0;

  for (const session of sessions) {
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
    sessionCount: sessions.length,
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
    if (!points.has(session.date)) continue;
    points.set(session.date, (points.get(session.date) ?? 0) + session.duration);
  }

  return [...points.entries()].map(([date, seconds]) => ({ date, seconds }));
}

export function buildSessionRecord(
  args: {
    date: string;
    startTime: string;
    stopTime: string;
    category: string;
    description: string;
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
    throw new ErrorCtor('Godzina zakończenia musi być późniejsza niż start.');
  }
  return {
    date: args.date,
    startTime: args.startTime,
    stopTime: args.stopTime,
    duration: Math.floor((stopTimestamp - startTimestamp) / 1000),
    category: normalizeText(args.category, 'inne'),
    description: normalizeText(args.description, 'Praca nad projektem'),
    whatIsDone: normalizeText(args.whatIsDone, 'Zapisana sesja pracy'),
  };
}
