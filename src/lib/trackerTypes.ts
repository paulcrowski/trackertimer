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
  'prywatne',
  'rozproszenie',
  'inne',
] as const;

export const categoryLabels: Record<string, string> = {
  materiały: 'Materials',
  kodowanie: 'Coding',
  'aplikacja klubowa': 'Club app',
  Patronite: 'Patronite',
  komunikacja: 'Communication',
  nagrania: 'Recording',
  research: 'Research',
  UX: 'UX',
  administracja: 'Administration',
  prywatne: 'Private',
  rozproszenie: 'Distraction',
  inne: 'Other',
};

export type AutoSplitMode = 'private-distraction' | 'all-contexts' | 'never';
export type DesktopPrivacyLevel = 'low' | 'standard' | 'high';
export type ActivityKind = 'work' | 'private' | 'distraction';

export type SessionRecord = {
  _id: string;
  category: string;
  date: string;
  description: string;
  duration: number;
  projectName: string | null;
  splitGroupId?: string;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

export type PauseRange = {
  endTime: number | null;
  startTime: number;
};

export type ActiveSession = {
  _id: string;
  category: string;
  description: string;
  pausedAt: number | null;
  pausedSeconds: number;
  pauseRanges: PauseRange[];
  projectName: string | null;
  startTime: number;
};

export type ActiveSessionSource = 'server' | 'local';

export type ActiveSessionSnapshot = {
  category: string;
  description: string;
  pausedAt: number | null;
  pausedSeconds: number;
  pauseRanges: PauseRange[];
  savedAt: number;
  startTime: number;
  userId: string;
};

export type TrackerPreferences = {
  autoPauseEnabled: boolean;
  autoPauseMinutes: number;
  autoSplitMode: AutoSplitMode;
  desktopPrivacyLevel: DesktopPrivacyLevel;
  dailyGoalHours: number;
  desktopTrackingEnabled: boolean;
  desktopTrackingManualPause: boolean;
  desktopTrackingPausedUntil: number | null;
  focusMode: boolean;
  privateDomainsText: string;
  stopSoundEnabled: boolean;
};

export type DesktopHelperStatus = {
  configured: boolean;
  connected: boolean;
  lastAppName: string | null;
  lastDomain: string | null;
  lastSeenAt: number | null;
  lastWindowTitle: string | null;
  platform: string | null;
};

export type DesktopHelperKeyIssue = {
  helperKey: string;
};

export type DesktopProjectSuggestion = {
  appName: string | null;
  category: string | null;
  domain: string | null;
  kind: ActivityKind | null;
  matchedBy: 'app' | 'domain' | 'window-title' | 'app+domain' | 'app+domain+window-title';
  projectName: string;
} | null;

export type DesktopTrackingRule = {
  category: string | null;
  id: string;
  kind: ActivityKind | null;
  matchAppName: string | null;
  matchDomain: string | null;
  matchWindowTitle: string | null;
  projectName: string;
};

export type DesktopHelperActivity = {
  id: string;
  appName: string;
  capturedAt: number;
  deviceId?: string | null;
  domain: string | null;
  platform: string;
  windowTitle: string | null;
};

export type DesktopHelperActivityGroup = {
  appName: string;
  capturedAt: number;
  domain: string | null;
  firstCapturedAt: number;
  id: string;
  platform: string;
  sampleCount: number;
  windowTitle: string | null;
};

export type SessionActivityBlock = {
  appName: string | null;
  category: string | null;
  domain: string | null;
  durationSeconds: number;
  kind: ActivityKind;
  label: string;
  startTime: number;
};

export type StopReviewEntryDraft = {
  blockId: string;
  category: string;
  description: string;
  durationSeconds: number;
  endTime: number;
  kind: ActivityKind;
  matchAppName: string | null;
  matchDomain: string | null;
  matchWindowTitle: string | null;
  projectName: string | null;
  sourceBlockIds: string[];
  startTime: number;
  whatIsDone: string;
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

export type TrackerProjectSummary = {
  projectName: string;
  seconds: number;
  sessionCount: number;
};

export type SessionDayGroup = {
  date: string;
  sessionCount: number;
  sessions: SessionRecord[];
  totalSeconds: number;
};

export type SessionCleanupGroup = {
  id: string;
  category: string;
  date: string;
  description: string;
  projectName: string | null;
  whatIsDone: string;
  sessionIds: string[];
  sessionCount: number;
  startTime: string;
  stopTime: string;
  totalSeconds: number;
};

export type TrackerHistory = {
  groups: SessionDayGroup[];
  isTruncated: boolean;
  totalAvailableSessions: number | null;
  totalShownDays: number;
  totalShownSessions: number;
};

export type TrackerBootstrap = {
  activeSession: ActiveSession | null;
  charts: {
    categories: CategoryPoint[];
    trend: TrendPoint[];
  };
  desktopHelper: DesktopHelperStatus;
  desktopHelperActivities: DesktopHelperActivity[];
  desktopProjectSuggestion: DesktopProjectSuggestion;
  desktopTrackingRules: DesktopTrackingRule[];
  dashboard: TrackerDashboard;
  history: TrackerHistory;
  cleanupGroups: SessionCleanupGroup[];
  preferences: TrackerPreferences;
  recentProjects: string[];
  sessions: SessionRecord[];
  summaryIsPartial: boolean;
  summary: TrackerSummary;
  user: {
    id: string;
    email?: string;
    image?: string;
    name?: string;
  } | null;
};

export type LocalTrackerState = {
  activeSession: ActiveSession | null;
  preferences: TrackerPreferences;
  sessions: SessionRecord[];
};

export type SessionDraft = {
  category: string;
  date: string;
  description: string;
  projectName: string | null;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

export type TrackerWorkspaceHandlers = {
  onAddManualSession: (args: SessionDraft) => Promise<unknown>;
  onDeleteTrackingRule: (args: { ruleId: string }) => Promise<unknown>;
  onDeleteSession: (args: { sessionId: string }) => Promise<unknown>;
  onMergeSessions: (args: { sessionIds: string[] }) => Promise<unknown>;
  onExportSessions: () => Promise<SessionRecord[]>;
  onIssueDesktopHelperKey: () => Promise<DesktopHelperKeyIssue>;
  onRevokeDesktopHelperKeys: () => Promise<unknown>;
  onPauseSession: () => Promise<unknown>;
  onResumeSession: () => Promise<unknown>;
  onSavePreferences: (args: Partial<TrackerPreferences>) => Promise<unknown>;
  onSaveTrackingRule: (args: {
    category?: string | null;
    kind?: ActivityKind | null;
    matchAppName: string | null;
    matchDomain: string | null;
    matchWindowTitle: string | null;
    projectName: string;
  }) => Promise<unknown>;
  onSignOut: () => Promise<unknown>;
  onStartSession: (args: {
    category: string;
    description: string;
    projectName: string | null;
  }) => Promise<unknown>;
  onStopSession: (args: {
    description?: string;
    endTime?: number;
    entries?: Array<
      Pick<
        StopReviewEntryDraft,
        | 'category'
        | 'description'
        | 'durationSeconds'
        | 'endTime'
        | 'projectName'
        | 'startTime'
        | 'whatIsDone'
      >
    >;
    timezoneOffsetMinutes?: number;
    whatIsDone?: string;
  }) => Promise<unknown>;
  onUpdateSession: (args: SessionDraft & { sessionId: string }) => Promise<unknown>;
};

export const defaultPreferences: TrackerPreferences = {
  autoPauseEnabled: false,
  autoPauseMinutes: 7,
  autoSplitMode: 'private-distraction',
  desktopPrivacyLevel: 'standard',
  dailyGoalHours: 4,
  desktopTrackingEnabled: true,
  desktopTrackingManualPause: false,
  desktopTrackingPausedUntil: null,
  focusMode: false,
  privateDomainsText: '',
  stopSoundEnabled: true,
};
