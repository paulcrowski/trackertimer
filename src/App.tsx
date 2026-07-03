import { useEffect, useMemo, useState } from 'react';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { anyApi } from 'convex/server';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { TrackerWorkspace } from './components/TrackerWorkspace.tsx';
import {
  createDefaultLocalTrackerState,
  defaultPreferences,
  readLocalTrackerState,
  type LocalTrackerState,
  type SessionRecord,
  type TrackerBootstrap,
  writeLocalTrackerState,
} from './lib/tracker.ts';
import {
  buildCategoryChart,
  buildDashboard,
  buildSessionRecord,
  buildStoppedSessionRecords,
  buildTrendChart,
  computeSummary,
  sortSessionsDesc,
} from '../convex/trackerModel.ts';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.';

export async function runLocalActionWithErrorSurface<T>(args: {
  action: () => T | Promise<T>;
  setError: (value: string | null) => void;
}) {
  try {
    return await args.action();
  } catch (reason) {
    const message = errorMessage(reason);
    args.setError(message);
    throw new Error(message);
  }
}

type AuthScreenProps = {
  error: string | null;
  isLoading: boolean;
  onChooseLocalMode?: () => void;
  onSignIn: () => void;
};

export function AuthScreen({
  error,
  isLoading,
  onChooseLocalMode,
  onSignIn,
}: AuthScreenProps) {
  return (
    <main className="auth-shell">
      <section className="auth-poster">
        <div className="auth-copy">
          <span className="eyebrow">worktimer • Convex</span>
          <h1>
            Wejdź prosto w rytm pracy.
            <span> Pracuj na jednym, czystym rytmie.</span>
          </h1>
          <p>
            Rejestr sesji, trend pracy, ręczne korekty i preferencje użytkownika
            w jednym źródle prawdy na Convex.
          </p>
          <div className="auth-actions">
            <button className="btn btn-primary" onClick={onSignIn} type="button">
              Zaloguj przez Google
              <ArrowRight size={16} />
            </button>
            {onChooseLocalMode ? (
              <button className="chip-btn" onClick={onChooseLocalMode} type="button">
                Private local
              </button>
            ) : null}
            <span className="auth-note">
              <LockKeyhole size={14} />
              To samo konto dziala na wielu urzadzeniach.
            </span>
          </div>
          {error ? <div className="inline-error">{error}</div> : null}
          {isLoading ? (
            <p className="muted-copy">
              Łączenie z auth trwa dłużej niż zwykle, ale możesz zacząć flow
              logowania już teraz.
            </p>
          ) : null}
        </div>
        <div className="auth-proof">
          <div className="proof-kicker">
            <Sparkles size={14} />
            Gotowy workspace
          </div>
          <ul className="proof-list">
            <li>Live timer z recznym stopem i opcjonalna auto-pauza.</li>
            <li>Manual add, edit, delete i eksport CSV.</li>
            <li>Wykres kategorii i trend 30 dni bez legacy D3 shell.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function buildLocalHistory(sessions: SessionRecord[]) {
  const groups: TrackerBootstrap['history']['groups'] = [];
  for (const session of sessions) {
    const group = groups.at(-1);
    if (!group || group.date !== session.date) {
      groups.push({
        date: session.date,
        sessionCount: 1,
        sessions: [session],
        totalSeconds: session.duration,
      });
      continue;
    }
    group.sessionCount += 1;
    group.totalSeconds += session.duration;
    group.sessions.push(session);
  }
  return {
    groups,
    isTruncated: false,
    totalAvailableSessions: sessions.length,
    totalShownDays: groups.length,
    totalShownSessions: sessions.length,
  };
}

function buildLocalBootstrap(state: LocalTrackerState): TrackerBootstrap {
  const sessions = sortSessionsDesc(state.sessions);
  return {
    activeSession: state.activeSession,
    charts: {
      categories: buildCategoryChart(sessions),
      trend: buildTrendChart(sessions),
    },
    desktopHelper: {
      configured: false,
      connected: false,
      lastAppName: null,
      lastDomain: null,
      lastSeenAt: null,
      lastWindowTitle: null,
      platform: null,
    },
    desktopHelperActivities: [],
    desktopProjectSuggestion: null,
    desktopTrackingRules: [],
    dashboard: buildDashboard(sessions),
    history: buildLocalHistory(sessions),
    preferences: state.preferences,
    sessions,
    summary: computeSummary(sessions, state.preferences.dailyGoalHours),
    user: {
      id: 'local-private',
      name: 'Private local',
    },
  };
}

type LocalTrackerAppProps = {
  onExitLocalMode: () => void;
};

export function LocalTrackerApp({ onExitLocalMode }: LocalTrackerAppProps) {
  const [state, setState] = useState<LocalTrackerState>(
    () => readLocalTrackerState() ?? createDefaultLocalTrackerState(),
  );
  const [error, setError] = useState<string | null>(null);
  const data = useMemo(() => buildLocalBootstrap(state), [state]);

  useEffect(() => {
    writeLocalTrackerState(state);
  }, [state]);

  const updateState = (
    updater: (current: LocalTrackerState) => LocalTrackerState,
  ) => {
    setState((current) => updater(current));
  };
  const runLocalAction = <T,>(action: () => T | Promise<T>) =>
    runLocalActionWithErrorSurface({
      action,
      setError,
    });

  return (
    <TrackerWorkspace
      allowDesktopHelper={false}
      data={data}
      error={error}
      onAddManualSession={(args) =>
        runLocalAction(() => {
          updateState((current) => ({
            ...current,
            sessions: [
              {
                _id: `local-session:${crypto.randomUUID()}`,
                ...buildSessionRecord(
                  args,
                  (value, fallback) => value?.trim() || fallback,
                  Error,
                ),
              },
              ...current.sessions,
            ],
          }));
        })}
      onClearError={() => setError(null)}
      onDeleteAccount={() =>
        runLocalAction(() => {
          updateState(() => createDefaultLocalTrackerState());
        })}
      onDeleteAllUserData={() =>
        runLocalAction(() => {
          updateState(() => createDefaultLocalTrackerState());
        })}
      onDeleteSession={({ sessionId }) =>
        runLocalAction(() => {
          updateState((current) => ({
            ...current,
            sessions: current.sessions.filter((session) => session._id !== sessionId),
          }));
        })}
      onDeleteTrackingRule={async () => null}
      onIssueDesktopHelperKey={async () => ({ helperKey: 'local-mode-disabled' })}
      onPauseSession={() =>
        runLocalAction(() => {
          updateState((current) => {
            if (!current.activeSession) {
              throw new Error('Brak aktywnej sesji do wstrzymania.');
            }
            if (current.activeSession.pausedAt !== null) {
              return current;
            }
            return {
              ...current,
              activeSession: { ...current.activeSession, pausedAt: Date.now() },
            };
          });
        })}
      onResumeSession={() =>
        runLocalAction(() => {
          updateState((current) => {
            if (!current.activeSession) {
              throw new Error('Brak aktywnej sesji do wznowienia.');
            }
            if (current.activeSession.pausedAt === null) {
              return current;
            }
            return {
              ...current,
              activeSession: {
                ...current.activeSession,
                pausedAt: null,
                pausedSeconds:
                  current.activeSession.pausedSeconds +
                  Math.max(
                    0,
                    Math.floor((Date.now() - current.activeSession.pausedAt) / 1000),
                  ),
              },
            };
          });
        })}
      onSavePreferences={(patch) =>
        runLocalAction(() => {
          updateState((current) => ({
            ...current,
            preferences: {
              ...current.preferences,
              ...patch,
              desktopTrackingEnabled: false,
            },
          }));
        })}
      onSaveTrackingRule={async () => null}
      onSignOut={() =>
        runLocalAction(() => {
          onExitLocalMode();
        })}
      onStartSession={(args) =>
        runLocalAction(() => {
          updateState((current) => {
            if (current.activeSession) {
              throw new Error('Masz już aktywną sesję.');
            }
            return {
              ...current,
              activeSession: {
                _id: `local-active:${crypto.randomUUID()}`,
                category: args.category.trim() || 'inne',
                description: args.description.trim() || 'Praca nad projektem',
                pausedAt: null,
                pausedSeconds: 0,
                projectName: args.projectName?.trim() || null,
                startTime: Date.now(),
              },
            };
          });
        })}
      onStopSession={(args) =>
        runLocalAction(() => {
          updateState((current) => {
            if (!current.activeSession) {
              throw new Error('Brak aktywnej sesji do zatrzymania.');
            }
            const activeSession = current.activeSession;
            const endTime =
              activeSession.pausedAt !== null
                ? activeSession.pausedAt
                : args.endTime ?? Date.now();
            if (endTime <= activeSession.startTime) {
              throw new Error('Czas zakończenia sesji jest nieprawidłowy.');
            }
            const sessions: SessionRecord[] = buildStoppedSessionRecords({
              category: activeSession.category,
              description: activeSession.description,
              endTime,
              pausedSeconds: activeSession.pausedSeconds,
              projectName: activeSession.projectName,
              startTime: activeSession.startTime,
              whatIsDone:
                args.whatIsDone?.trim() || activeSession.description || 'Zapisana sesja pracy',
            }).map((session) => ({
              _id: `local-session:${crypto.randomUUID()}`,
              ...session,
            }));
            return {
              ...current,
              activeSession: null,
              sessions: [...sessions, ...current.sessions],
            };
          });
        })}
      onUpdateSession={({ sessionId, ...args }) =>
        runLocalAction(() => {
          updateState((current) => ({
            ...current,
            sessions: current.sessions.map((session) =>
              session._id === sessionId
                ? {
                    _id: sessionId,
                    ...buildSessionRecord(
                      args,
                      (value, fallback) => value?.trim() || fallback,
                      Error,
                    ),
                  }
                : session,
            ),
          }));
        })}
      onExportSessions={() =>
        runLocalAction(() =>
          sortSessionsDesc(readLocalTrackerState()?.sessions ?? state.sessions),
        )}
      signOutLabel="Wyjdź do wyboru trybu"
      storageMode="local"
    />
  );
}

type CloudAppProps = {
  onChooseLocalMode: () => void;
  startupError?: string | null;
};

export default function CloudApp({
  onChooseLocalMode,
  startupError = null,
}: CloudAppProps) {
  const convex = useConvex();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const data = useQuery(
    anyApi.tracker.bootstrap,
    isAuthenticated ? {} : 'skip',
  ) as TrackerBootstrap | undefined;
  const issueDesktopHelperKey = useMutation(anyApi.tracker.issueDesktopHelperKeyForUser);
  const startSession = useMutation(anyApi.tracker.start);
  const stopSession = useMutation(anyApi.tracker.stop);
  const pauseSession = useMutation(anyApi.tracker.pause);
  const resumeSession = useMutation(anyApi.tracker.resume);
  const savePreferences = useMutation(anyApi.tracker.savePreferences);
  const deleteAllUserData = useMutation(anyApi.tracker.deleteAllUserData);
  const deleteUserAccount = useMutation(anyApi.tracker.deleteUserAccount);
  const deleteTrackingRule = useMutation(anyApi.tracker.deleteTrackingRule);
  const saveTrackingRule = useMutation(anyApi.tracker.saveTrackingRule);
  const addManualSession = useMutation(anyApi.tracker.addManualSession);
  const updateSession = useMutation(anyApi.tracker.updateSession);
  const deleteSession = useMutation(anyApi.tracker.deleteSession);
  const [error, setError] = useState<string | null>(startupError);
  const [authFallbackReady, setAuthFallbackReady] = useState(false);
  const helperPlatformSource = typeof navigator === 'undefined' ? '' : ((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? navigator.userAgent);
  const helperPlatform = /win/i.test(helperPlatformSource) ? 'windows' : /mac/i.test(helperPlatformSource) ? 'macos' : /linux/i.test(helperPlatformSource) ? 'linux' : 'unknown';

  useEffect(() => {
    if (!isLoading) {
      setAuthFallbackReady(false);
      return;
    }
    const timeoutId = window.setTimeout(() => setAuthFallbackReady(true), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  if (isLoading && !authFallbackReady) {
    return (
      <div className="loading-screen">
        <div className="loading-mark"></div>
        <p>Łączenie z Convex…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        error={error}
        isLoading={isLoading}
        onChooseLocalMode={onChooseLocalMode}
        onSignIn={() =>
          signIn('google').catch((reason) =>
            setError(errorMessage(reason)),
          )
        }
      />
    );
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="loading-mark"></div>
        <p>Ładowanie danych trackera…</p>
      </div>
    );
  }

  return (
    <TrackerWorkspace
      data={data}
      error={error}
      onClearError={() => setError(null)}
      onDeleteAccount={() =>
        deleteUserAccount({}).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onDeleteAllUserData={() =>
        deleteAllUserData({}).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onDeleteTrackingRule={(args) =>
        deleteTrackingRule(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onIssueDesktopHelperKey={() =>
        issueDesktopHelperKey({ platform: helperPlatform }).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onStartSession={(args) =>
        startSession(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onPauseSession={() =>
        pauseSession({}).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onResumeSession={() =>
        resumeSession({}).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onStopSession={(args) =>
        stopSession(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      signOutLabel="Wyloguj"
      storageMode="cloud"
      onSavePreferences={(args) =>
        savePreferences(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onSaveTrackingRule={(args) =>
        saveTrackingRule(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onAddManualSession={(args) =>
        addManualSession(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onUpdateSession={(args) =>
        updateSession(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onDeleteSession={(args) =>
        deleteSession(args).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onExportSessions={() =>
        convex.query(anyApi.tracker.sessionsForExport, {}).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
      onSignOut={() =>
        signOut().catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
    />
  );
}
