import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

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

export type TrackerBootstrap = {
  activeSession: ActiveSession | null;
  charts: {
    categories: CategoryPoint[];
    trend: TrendPoint[];
  };
  preferences: TrackerPreferences;
  sessions: SessionRecord[];
  summary: TrackerSummary;
  user: {
    email?: string;
    image?: string;
    name?: string;
  } | null;
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

export type SessionDraft = {
  category: string;
  date: string;
  description: string;
  startTime: string;
  stopTime: string;
  whatIsDone: string;
};

export const defaultPreferences: TrackerPreferences = {
  dailyGoalHours: 4,
  focusMode: false,
  stopSoundEnabled: true,
};

const idleThresholdMs = 15 * 60 * 1000;

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

export function formatGoalHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export function createSessionDraft(): SessionDraft {
  return {
    category: categories[1],
    date: toLocalDateString(Date.now()),
    description: 'Praca nad projektem',
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
  return (field: keyof SessionDraft, value: string) =>
    setter((current) => ({ ...current, [field]: value }));
}

type TrackerControllerArgs = {
  data: TrackerBootstrap;
} & TrackerWorkspaceHandlers;

export function useTrackerWorkspaceController({
  data,
  onAddManualSession,
  onDeleteSession,
  onSavePreferences,
  onSignOut,
  onStartSession,
  onStopSession,
  onUpdateSession,
}: TrackerControllerArgs) {
  const [category, setCategory] = useState('kodowanie');
  const [description, setDescription] = useState('');
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
  const autoStopInFlight = useRef(false);
  const activeSession = data.activeSession;

  useEffect(() => {
    setPreferences(data.preferences);
    setStopSoundEnabled(data.preferences.stopSoundEnabled);
  }, [data.preferences]);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)),
      );
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession) return;
    let lastActivityAt = Date.now();
    const resetActivity = () => {
      lastActivityAt = Date.now();
    };
    const checkIdle = () => {
      if (autoStopInFlight.current) return;
      const idleTime = Date.now() - lastActivityAt;
      if (idleTime < idleThresholdMs) return;
      autoStopInFlight.current = true;
      const endTime = Date.now() - idleThresholdMs;
      void onStopSession({
        endTime,
        whatIsDone: 'Auto-stop po 15 minutach bezczynności.',
      })
        .then(() => {
          if (preferences.stopSoundEnabled) playPingSound();
          const actualDuration = Math.max(
            0,
            Math.floor((endTime - activeSession.startTime) / 1000),
          );
          setIdleNotice(
            `Zapisano rzeczywisty czas pracy: ${formatDurationPretty(actualDuration)}.`,
          );
          setStopDialogOpen(false);
        })
        .finally(() => {
          autoStopInFlight.current = false;
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
  }, [activeSession, onStopSession, preferences.stopSoundEnabled]);

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
      await onStartSession({ category, description });
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
      if (stopSoundEnabled) playPingSound();
      setStopDialogOpen(false);
      setStopNote('');
    } finally {
      setBusyAction(null);
    }
  };

  const handleManualAdd = async () => {
    setBusyAction('manual');
    try {
      await onAddManualSession(manualDraft);
      setManualDialogOpen(false);
      setManualDraft(createSessionDraft());
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
        `poprostukoduj-time-tracker-${toLocalDateString(Date.now())}.csv`,
        buildSessionsCsv(data.sessions),
      );
    },
    handleDeleteConfirm,
    handleEditSave,
    handleManualAdd,
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
      setManualDraft(createSessionDraft());
      setManualDialogOpen(true);
    },
    openStopDialog() {
      setStopNote(activeSession?.description ?? '');
      setStopSoundEnabled(preferences.stopSoundEnabled);
      setStopDialogOpen(true);
    },
    preferences,
    setCategory,
    setDescription,
    setStopNote,
    setStopSoundEnabled,
    stopDialogOpen,
    stopNote,
    stopSoundEnabled,
    summary,
    toggleFocusMode() {
      void applyPreferencePatch({ focusMode: !preferences.focusMode });
    },
    updateEditDraft: updateDraftFactory(setEditDraft),
    updateManualDraft: updateDraftFactory(setManualDraft),
  };
}
