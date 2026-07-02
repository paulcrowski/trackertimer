import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ActiveSession,
  type ActiveSessionSnapshot,
  type ActiveSessionSource,
  categories,
  defaultPreferences,
  type DashboardDayPoint,
  type SessionDraft,
  type SessionDayGroup,
  type SessionRecord,
  type TrackerProjectSummary,
  type TrackerBootstrap,
  type TrackerDashboard,
  type TrackerHistory,
  type TrackerPreferences,
  type TrackerSummary,
  type TrackerWorkspaceHandlers,
} from './trackerTypes.ts';

export { categories, defaultPreferences } from './trackerTypes.ts';
export type {
  ActiveSession,
  ActiveSessionSnapshot,
  ActiveSessionSource,
  CategoryPoint,
  DashboardDayPoint,
  SessionDraft,
  SessionDayGroup,
  SessionRecord,
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
const activeSessionSnapshotMaxAgeMs = 48 * 60 * 60 * 1000;
export const autoPauseMinuteOptions = [3, 5, 7, 10, 15] as const;

type ActiveSessionLike = {
  category: string;
  description: string;
  pausedAt?: number | null;
  pausedSeconds?: number;
  startTime: number;
};

type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

type ResolvedActiveSessionState = {
  activeSession: ActiveSession | null;
  notice: string | null;
  source: ActiveSessionSource | null;
};

function parseSessionTimestamp(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
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
    if (
      typeof parsed.userId !== 'string' ||
      typeof parsed.category !== 'string' ||
      typeof parsed.description !== 'string' ||
      (parsed.pausedAt !== null && typeof parsed.pausedAt !== 'number') ||
      typeof parsed.pausedSeconds !== 'number' ||
      typeof parsed.startTime !== 'number' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as ActiveSessionSnapshot;
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
  storage.setItem(
    getActiveSessionSnapshotKey(snapshot.userId),
    JSON.stringify(snapshot),
  );
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
      projectName: null,
      startTime: snapshot.startTime,
    },
    notice:
      'Przywrócono aktywną sesję z tego urządzenia. Gdy Convex potwierdzi nowszy stan, UI przełączy się na dane z serwera.',
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

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

export function formatPolishDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export function formatWeekdayShort(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(
    new Date(value),
  );
}

export function formatDurationHms(totalSeconds: number) {
  return [Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function formatDurationPretty(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
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
) {
  return autoPauseEnabled
    ? `Po ${autoPauseMinutes} min bezczynnosci w tym oknie timer przejdzie w pauze. Pauza zamraza czas, nie zeruje sesji.`
    : 'Timer dziala w pelni recznie. Nic nie zatrzyma ani nie spauzuje sesji bez Twojej decyzji.';
}

export function describeAutoPauseReason() {
  return `Auto-pauza reaguje tylko na aktywnosc widoczna w oknie tej appki. Praca w Codexie, Canva albo OBS moze nie byc tu widoczna.`;
}

export function getActiveElapsedSeconds(
  activeSession: Pick<ActiveSession, 'pausedAt' | 'pausedSeconds' | 'startTime'>,
  now = Date.now(),
) {
  const effectiveEndTime = activeSession.pausedAt ?? now;
  return Math.max(
    0,
    Math.floor((effectiveEndTime - activeSession.startTime) / 1000) -
      activeSession.pausedSeconds,
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
        const categoryMatches =
          filters.category === 'all' || session.category === filters.category;
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
        totalSeconds: sessions.reduce(
          (sum, session) => sum + session.duration,
          0,
        ),
      };
    })
    .filter((group): group is SessionDayGroup => group !== null);
}

export function deriveHistoryCategories(groups: SessionDayGroup[]) {
  return [...new Set(groups.flatMap((group) => group.sessions.map((session) => session.category)))]
    .sort((left, right) => left.localeCompare(right, 'pl'));
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
    description: 'Praca nad projektem',
    projectName,
    startTime: '09:00',
    stopTime: '10:00',
    whatIsDone: 'Konkretny rezultat sesji',
  };
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
    'Data',
    'Godzina startu',
    'Godzina stopu',
    'Czas trwania (sekundy)',
    'Czas trwania (tekst)',
    'Projekt',
    'Kategoria',
    'Opis sesji',
    'Co zrobiono',
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
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1320,
      context.currentTime + 0.12,
    );
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

function withLiveSummary(
  summary: TrackerSummary,
  elapsedSeconds: number,
  activeStartTime: number | null,
  dailyGoalHours: number,
) {
  if (!activeStartTime) {
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
  const activeDate = new Date(activeStartTime);
  const sameDay =
    toLocalDateString(activeStartTime) === toLocalDateString(now.getTime());
  const sameMonth =
    now.getMonth() === activeDate.getMonth() &&
    now.getFullYear() === activeDate.getFullYear();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - (dayOfWeek - 1));
  const sameWeek = activeDate >= monday;

  const todaySeconds = summary.todaySeconds + (sameDay ? elapsedSeconds : 0);
  const weekSeconds = summary.weekSeconds + (sameWeek ? elapsedSeconds : 0);
  const monthSeconds = summary.monthSeconds + (sameMonth ? elapsedSeconds : 0);
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

function updateDraftFactory(
  setter: Dispatch<SetStateAction<SessionDraft>>,
) {
  return (field: keyof SessionDraft, value: string | null) =>
    setter((current) => ({ ...current, [field]: value }));
}

type TrackerControllerArgs = {
  data: TrackerBootstrap;
} & TrackerWorkspaceHandlers;

export function useTrackerWorkspaceController({
  data,
  onAddManualSession,
  onDeleteSession,
  onPauseSession,
  onResumeSession,
  onSavePreferences,
  onSignOut,
  onStartSession,
  onStopSession,
  onUpdateSession,
}: TrackerControllerArgs) {
  const [category, setCategory] = useState('kodowanie');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [idleNotice, setIdleNotice] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(data.preferences);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stopNote, setStopNote] = useState('');
  const [stopSoundEnabled, setStopSoundEnabled] = useState(
    data.preferences.stopSoundEnabled,
  );
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState<SessionDraft>(createSessionDraft());
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null);
  const [editDraft, setEditDraft] = useState<SessionDraft>(createSessionDraft());
  const [deletingSession, setDeletingSession] = useState<SessionRecord | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const autoPauseInFlight = useRef(false);
  const latestSession = data.sessions[0] ?? null;
  const projectSummaries = useMemo(
    () => buildProjectSummaries(data.sessions),
    [data.sessions],
  );
  const resolvedActiveSessionState = useMemo(
    () =>
      data.user
        ? resolveActiveSessionState({
            userId: data.user.id,
            serverActiveSession: data.activeSession,
            snapshot: readActiveSessionSnapshot(data.user.id),
            latestSession,
          })
        : {
            activeSession: data.activeSession,
            notice: null,
            source: data.activeSession ? 'server' : null,
          },
    [data.activeSession, data.user, latestSession],
  );
  const activeSession = resolvedActiveSessionState.activeSession;

  useEffect(() => {
    setPreferences(data.preferences);
    setStopSoundEnabled(data.preferences.stopSoundEnabled);
  }, [data.preferences]);

  useEffect(() => {
    if (!data.user) {
      return;
    }
    if (data.activeSession) {
      writeActiveSessionSnapshot(
        createActiveSessionSnapshot(data.user.id, data.activeSession),
      );
      return;
    }
    if (resolvedActiveSessionState.source !== 'local') {
      clearActiveSessionSnapshot(data.user.id);
    }
  }, [data.activeSession, data.user, resolvedActiveSessionState.source]);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(getActiveElapsedSeconds(activeSession));
    tick();
    if (activeSession.pausedAt !== null) {
      return;
    }
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.pausedAt !== null || !preferences.autoPauseEnabled) {
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
            `Timer wszedl w pauze po ${preferences.autoPauseMinutes} minutach bezczynnosci. Wznow albo zakoncz sesje recznie.`,
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
    onPauseSession,
    preferences.autoPauseEnabled,
    preferences.autoPauseMinutes,
  ]);

  const summary = useMemo(
    () =>
      withLiveSummary(
        data.summary,
        elapsedSeconds,
        activeSession?.startTime ?? null,
        preferences.dailyGoalHours,
      ),
    [activeSession?.startTime, data.summary, elapsedSeconds, preferences.dailyGoalHours],
  );

  const applyPreferencePatch = async (patch: Partial<TrackerPreferences>) => {
    const nextPreferences = { ...preferences, ...patch };
    setPreferences(nextPreferences);
    try {
      await onSavePreferences(patch);
    } catch {
      setPreferences(data.preferences);
      throw new Error('Nie udało się zapisać preferencji.');
    }
  };

  const handleStartSession = async () => {
    setBusyAction('start');
    try {
      await onStartSession({ category, description, projectName });
      if (data.user) {
        writeActiveSessionSnapshot(
          createActiveSessionSnapshot(data.user.id, {
            category,
            description: description.trim() || 'Praca nad projektem',
            pausedAt: null,
            pausedSeconds: 0,
            startTime: Date.now(),
          }),
        );
      }
      setDescription('');
    } finally {
      setBusyAction(null);
    }
  };

  const handleStopConfirm = async () => {
    setBusyAction('stop');
    try {
      if (stopSoundEnabled !== preferences.stopSoundEnabled) {
        await applyPreferencePatch({ stopSoundEnabled });
      }
      await onStopSession({ whatIsDone: stopNote });
      if (data.user) {
        clearActiveSessionSnapshot(data.user.id);
      }
      if (stopSoundEnabled) playPingSound();
      setStopDialogOpen(false);
      setStopNote('');
    } finally {
      setBusyAction(null);
    }
  };

  const handleResumeSession = async () => {
    setBusyAction('resume');
    try {
      await onResumeSession();
      setIdleNotice(null);
    } finally {
      setBusyAction(null);
    }
  };

  const handleManualAdd = async () => {
    setBusyAction('manual');
    try {
      await onAddManualSession(manualDraft);
      setManualDialogOpen(false);
      setManualDraft(createSessionDraft(projectName));
    } finally {
      setBusyAction(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingSession) return;
    setBusyAction('edit');
    try {
      await onUpdateSession({ sessionId: editingSession._id, ...editDraft });
      setEditingSession(null);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSession) return;
    setBusyAction('delete');
    try {
      await onDeleteSession({ sessionId: deletingSession._id });
      setDeletingSession(null);
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
      setManualDialogOpen(false);
    },
    closeStopDialog() {
      setStopDialogOpen(false);
    },
    currentProjectName: projectName,
    deletingSession,
    description,
    dismissIdleNotice() {
      setIdleNotice(null);
    },
    editDraft,
    editingSession,
    elapsedSeconds,
    exportSessions() {
      downloadCsv(
        `worktimer-${toLocalDateString(Date.now())}.csv`,
        buildSessionsCsv(data.sessions),
      );
    },
    handleDeleteConfirm,
    handleEditSave,
    handleManualAdd,
    handleCurrentProjectNameChange(value: string) {
      setProjectName(value.trim() || null);
    },
    handleResumeSession,
    handleSignOut() {
      return onSignOut();
    },
    handleStartSession,
    handleStopConfirm,
    idleNotice,
    manualDialogOpen,
    manualDraft,
    openDeleteDialog(session: SessionRecord) {
      setDeletingSession(session);
    },
    openEditDialog(session: SessionRecord) {
      setEditingSession(session);
      setEditDraft(createSessionDraftFromRecord(session));
    },
    openManualDialog() {
      setManualDraft(createSessionDraft(projectName));
      setManualDialogOpen(true);
    },
    openStopDialog() {
      setStopNote(activeSession?.description ?? '');
      setStopSoundEnabled(preferences.stopSoundEnabled);
      setStopDialogOpen(true);
    },
    preferences,
    projectSummaries,
    setCategory,
    setDescription,
    setStopNote,
    setStopSoundEnabled,
    stopDialogOpen,
    stopNote,
    stopSoundEnabled,
    summary,
    toggleAutoPause() {
      void applyPreferencePatch({ autoPauseEnabled: !preferences.autoPauseEnabled });
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
