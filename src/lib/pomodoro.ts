import { useEffect, useRef, useState } from 'react';

export type PomodoroPhase = 'focus' | 'break';
export type PomodoroStatus = 'idle' | 'running' | 'completed';
export type PomodoroPermission = 'default' | 'denied' | 'granted' | 'unsupported';

export type PomodoroPreset = {
  breakMinutes: number;
  focusMinutes: number;
  id: string;
  label: string;
};

export type PomodoroState = {
  completedAt: number | null;
  durationMinutes: number;
  endsAt: number | null;
  lastNotificationAt: number | null;
  phase: PomodoroPhase;
  presetId: string;
  startedAt: number | null;
  status: PomodoroStatus;
};

export const pomodoroPresets: PomodoroPreset[] = [
  { id: 'classic', label: '25 / 5', focusMinutes: 25, breakMinutes: 5 },
  { id: 'quick', label: '5 / 1', focusMinutes: 5, breakMinutes: 1 },
  { id: 'deep', label: '50 / 10', focusMinutes: 50, breakMinutes: 10 },
];

function getPomodoroStorageKey() {
  if (typeof window === 'undefined') return 'worktimer:pomodoro';
  return `worktimer:pomodoro:${window.location.origin}`;
}

function getPresetById(presetId: string) {
  return pomodoroPresets.find((preset) => preset.id === presetId) ?? pomodoroPresets[0];
}

function getNotificationPermission(): PomodoroPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return window.Notification.permission;
}

export function createPomodoroState(
  overrides: Partial<PomodoroState> = {},
): PomodoroState {
  const preset = getPresetById(overrides.presetId ?? pomodoroPresets[0].id);
  return {
    completedAt: null,
    durationMinutes: preset.focusMinutes,
    endsAt: null,
    lastNotificationAt: null,
    phase: 'focus',
    presetId: preset.id,
    startedAt: null,
    status: 'idle',
    ...overrides,
  };
}

export function startPomodoroCycle(
  state: PomodoroState,
  phase: PomodoroPhase,
  durationMinutes: number,
  now = Date.now(),
): PomodoroState {
  return {
    ...state,
    completedAt: null,
    durationMinutes,
    endsAt: now + durationMinutes * 60_000,
    lastNotificationAt: null,
    phase,
    startedAt: now,
    status: 'running',
  };
}

export function resolvePomodoroState(
  state: PomodoroState,
  now = Date.now(),
): PomodoroState {
  if (state.status !== 'running' || !state.endsAt) return state;
  if (state.endsAt > now) return state;

  return {
    ...state,
    completedAt: state.endsAt,
    status: 'completed',
  };
}

export function getPomodoroRemainingMs(
  state: PomodoroState,
  now = Date.now(),
) {
  if (state.status !== 'running' || !state.endsAt) {
    return state.durationMinutes * 60_000;
  }

  return Math.max(0, state.endsAt - now);
}

export function getPomodoroProgressPercent(
  state: PomodoroState,
  now = Date.now(),
) {
  const durationMs = Math.max(1, state.durationMinutes * 60_000);
  const remainingMs = getPomodoroRemainingMs(state, now);
  return Math.max(0, Math.min(100, 100 - (remainingMs / durationMs) * 100));
}

export function formatPomodoroClock(totalMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function readStoredPomodoroState(now = Date.now()) {
  if (typeof window === 'undefined') return createPomodoroState();

  try {
    const raw = window.localStorage.getItem(getPomodoroStorageKey());
    if (!raw) return createPomodoroState();
    const parsed = JSON.parse(raw) as Partial<PomodoroState>;
    const hydrated = createPomodoroState(parsed);
    return resolvePomodoroState(hydrated, now);
  } catch {
    return createPomodoroState();
  }
}

async function showPomodoroNotification(
  phase: PomodoroPhase,
  presetLabel: string,
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (window.Notification.permission !== 'granted') return false;

  const title =
    phase === 'focus' ? 'Koniec focusu w worktimer' : 'Koniec przerwy w worktimer';
  const body =
    phase === 'focus'
      ? `Cykl ${presetLabel} dobiegł końca. Czas zapisać efekt pracy albo wejść w przerwę.`
      : `Przerwa ${presetLabel} dobiegła końca. Możesz wrócić do kolejnego bloku pracy.`;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        badge: '/icons/badge-96.png',
        icon: '/icons/icon-192.png',
        tag: `worktimer-${phase}`,
      });
      return true;
    }

    new window.Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      tag: `worktimer-${phase}`,
    });
    return true;
  } catch (error) {
    console.error('Failed to show pomodoro notification.', error);
    return false;
  }
}

export function usePomodoro() {
  const [permission, setPermission] = useState<PomodoroPermission>(
    getNotificationPermission,
  );
  const [now, setNow] = useState(Date.now);
  const [state, setState] = useState(() => readStoredPomodoroState(Date.now()));
  const notifiedCompletionRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(getPomodoroStorageKey(), JSON.stringify(state));
    } catch {
      // Ignore local storage write failures in restrictive browsers.
    }
  }, [state]);

  useEffect(() => {
    if (state.status !== 'running') return;

    const intervalId = window.setInterval(() => {
      const tickNow = Date.now();
      setNow(tickNow);
      setState((current) => resolvePomodoroState(current, tickNow));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [state.status]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const syncNow = Date.now();
      setNow(syncNow);
      setPermission(getNotificationPermission());
      setState((current) => resolvePomodoroState(current, syncNow));
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (state.status !== 'completed' || !state.completedAt) return;
    if (permission !== 'granted') return;
    if (notifiedCompletionRef.current === state.completedAt) return;

    notifiedCompletionRef.current = state.completedAt;
    const preset = getPresetById(state.presetId);

    void showPomodoroNotification(state.phase, preset.label).then((shown) => {
      if (!shown) return;
      setState((current) => ({
        ...current,
        lastNotificationAt: current.completedAt,
      }));
    });
  }, [permission, state.completedAt, state.phase, state.presetId, state.status]);

  const selectedPreset = getPresetById(state.presetId);
  const remainingMs = getPomodoroRemainingMs(state, now);
  const nextPhaseLabel =
    state.phase === 'focus'
      ? `Przerwa ${selectedPreset.breakMinutes} min`
      : `Focus ${selectedPreset.focusMinutes} min`;

  const selectPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    setState((current) =>
      current.status === 'running'
        ? { ...current, presetId: preset.id }
        : createPomodoroState({
            ...current,
            durationMinutes:
              current.phase === 'focus' ? preset.focusMinutes : preset.breakMinutes,
            phase: current.phase,
            presetId: preset.id,
          }),
    );
  };

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported' as const;
    }

    const result = await window.Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const startFocus = () => {
    const startedAt = Date.now();
    setNow(startedAt);
    setState((current) =>
      startPomodoroCycle(
        { ...current, presetId: selectedPreset.id },
        'focus',
        selectedPreset.focusMinutes,
        startedAt,
      ),
    );
  };

  const startBreak = () => {
    const startedAt = Date.now();
    setNow(startedAt);
    setState((current) =>
      startPomodoroCycle(
        { ...current, presetId: selectedPreset.id },
        'break',
        selectedPreset.breakMinutes,
        startedAt,
      ),
    );
  };

  const reset = () => {
    notifiedCompletionRef.current = null;
    setNow(Date.now());
    setState((current) =>
      createPomodoroState({
        phase: 'focus',
        presetId: current.presetId,
      }),
    );
  };

  const statusMessage =
    permission === 'unsupported'
      ? 'Ta przegladarka nie wspiera systemowych powiadomien.'
      : permission === 'denied'
        ? 'Powiadomienia sa zablokowane. Timer nadal dziala, ale koniec cyklu zobaczysz tylko w aplikacji.'
        : permission === 'granted'
          ? 'Powiadomienia sa wlaczone dla konca cyklu.'
          : 'Wlacz powiadomienia, aby dostawac sygnal konca pomodoro.';

  return {
    canRequestPermission: permission === 'default',
    nextPhaseLabel,
    permission,
    presets: pomodoroPresets,
    progressPercent: getPomodoroProgressPercent(state, now),
    remainingLabel: formatPomodoroClock(remainingMs),
    requestPermission,
    reset,
    selectedPreset,
    selectPreset,
    startBreak,
    startFocus,
    state,
    statusMessage,
  };
}
