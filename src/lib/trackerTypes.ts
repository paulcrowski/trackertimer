export const categories = [
  'materiały',
  'kodowanie',
  'aplikacja klubowa',
  'Patronite',
  'komunikacja',
  'nagrania',
  'research',
  'UX',
  'administracja',
  'inne',
] as const;

export type SessionRecord = {
  _id: string;
  category: string;
  date: string;
  description: string;
  duration: number;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

export type ActiveSession = {
  _id: string;
  category: string;
  description: string;
  startTime: number;
};

export type ActiveSessionSource = 'server' | 'local';

export type ActiveSessionSnapshot = {
  category: string;
  description: string;
  savedAt: number;
  startTime: number;
  userId: string;
};

export type TrackerPreferences = {
  dailyGoalHours: number;
  focusMode: boolean;
  stopSoundEnabled: boolean;
};

export type TrackerSummary = {
  goalProgressPercent: number;
  goalRemainingSeconds: number;
  monthSeconds: number;
  sessionCount: number;
  todaySeconds: number;
  totalSeconds: number;
  weekSeconds: number;
};

export type CategoryPoint = {
  category: string;
  seconds: number;
};

export type TrendPoint = {
  date: string;
  seconds: number;
};

export type DashboardDayPoint = {
  date: string;
  seconds: number;
  sessionCount: number;
};

export type DashboardHighlight = {
  date: string;
  seconds: number;
} | null;

export type DashboardCategoryHighlight = {
  category: string;
  seconds: number;
} | null;

export type TrackerDashboard = {
  averageSessionSeconds: number;
  bestDay: DashboardHighlight;
  recentDays: DashboardDayPoint[];
  streakDays: number;
  topCategory: DashboardCategoryHighlight;
};

export type SessionDayGroup = {
  date: string;
  sessionCount: number;
  sessions: SessionRecord[];
  totalSeconds: number;
};

export type TrackerHistory = {
  groups: SessionDayGroup[];
  totalShownDays: number;
  totalShownSessions: number;
};

export type TrackerBootstrap = {
  activeSession: ActiveSession | null;
  charts: {
    categories: CategoryPoint[];
    trend: TrendPoint[];
  };
  dashboard: TrackerDashboard;
  history: TrackerHistory;
  preferences: TrackerPreferences;
  sessions: SessionRecord[];
  summary: TrackerSummary;
  user: {
    id: string;
    email?: string;
    image?: string;
    name?: string;
  } | null;
};

export type SessionDraft = {
  category: string;
  date: string;
  description: string;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

export type TrackerWorkspaceHandlers = {
  onAddManualSession: (args: SessionDraft) => Promise<unknown>;
  onDeleteSession: (args: { sessionId: string }) => Promise<unknown>;
  onSavePreferences: (args: Partial<TrackerPreferences>) => Promise<unknown>;
  onSignOut: () => Promise<unknown>;
  onStartSession: (args: { category: string; description: string }) => Promise<unknown>;
  onStopSession: (args: { endTime?: number; whatIsDone?: string }) => Promise<unknown>;
  onUpdateSession: (args: SessionDraft & { sessionId: string }) => Promise<unknown>;
};

export const defaultPreferences: TrackerPreferences = {
  dailyGoalHours: 4,
  focusMode: false,
  stopSoundEnabled: true,
};
