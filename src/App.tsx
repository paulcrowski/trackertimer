import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { anyApi } from 'convex/server';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { TrackerWorkspace } from './components/TrackerWorkspace.tsx';
import {
  createDefaultLocalTrackerState,
  defaultPreferences,
  type LocalTrackerState,
  type SessionRecord,
  type TrackerBootstrap,
} from './lib/tracker.ts';
import {
  loadPersistedLocalTrackerState,
  localModeLoadFailedMessage,
  localModeSaveFailedMessage,
  savePersistedLocalTrackerState,
} from './lib/localTrackerStore.ts';
import { signOutToModeChoice } from './lib/startupMode.ts';
import { useLanguage } from './lib/i18n.tsx';
import {
  buildCategoryChart,
  buildSessionCleanupGroups,
  buildDashboard,
  buildManualSessionRecords,
  buildRecentProjects,
  buildStoppedSessionRecords,
  buildStoppedSessionRecordsFromParts,
  buildTrendChart,
  computeSummary,
  sortSessionsDesc,
} from '../convex/trackerModel.ts';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'An unexpected error occurred.';

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
  const { t } = useLanguage();
  return (
    <main className="auth-shell">
      <section className="auth-poster">
        <div className="auth-copy">
          <span className="eyebrow">worktimer • Convex</span>
          <h1>
            {t('Get straight into your work rhythm.')}
            <span> {t('Keep your focus in one clear rhythm.')}</span>
          </h1>
          <p>{t('Session history, work trends, manual corrections, and your preferences in one source of truth on Convex.')}</p>
          <div className="auth-actions">
            <button className="btn btn-primary" onClick={onSignIn} type="button">
              {t('Sign in with Google')}
              <ArrowRight size={16} />
            </button>
            {onChooseLocalMode ? (
              <button className="chip-btn" onClick={onChooseLocalMode} type="button">
                {t('Private local')}
              </button>
            ) : null}
            <span className="auth-note">
              <LockKeyhole size={14} />
              {t('The same account works across devices.')}
            </span>
          </div>
          {error ? <div className="inline-error">{error}</div> : null}
          {isLoading ? (
            <p className="muted-copy">
              Sign-in is taking longer than usual, but you can start the login flow
              now.
            </p>
          ) : null}
        </div>
        <div className="auth-proof">
          <div className="proof-kicker">
            <Sparkles size={14} />
            Ready-to-use workspace
          </div>
          <ul className="proof-list">
            <li>{t('Live timer with manual stop and optional auto-pause.')}</li>
            <li>{t('Manual add, edit, delete, and CSV export.')}</li>
            <li>{t('Category breakdown and a 30-day trend in a lightweight UI.')}</li>
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
    cleanupGroups: buildSessionCleanupGroups(sessions),
    history: buildLocalHistory(sessions),
    preferences: state.preferences,
    recentProjects: buildRecentProjects(sessions, state.activeSession?.projectName ?? null),
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
  const { t } = useLanguage();
  const [state, setState] = useState<LocalTrackerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const persistQueueRef = useRef(Promise.resolve());
  const data = useMemo(
    () => buildLocalBootstrap(state ?? createDefaultLocalTrackerState()),
    [state],
  );

  useEffect(() => {
    let cancelled = false;
    void loadPersistedLocalTrackerState()
      .then((persistedState) => {
        if (!cancelled) setState(persistedState ?? createDefaultLocalTrackerState());
      })
      .catch(() => {
        if (!cancelled) setStorageError(localModeLoadFailedMessage);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state || storageError) {
      return;
    }
    let cancelled = false;
    persistQueueRef.current = persistQueueRef.current
      .then(() => savePersistedLocalTrackerState(state))
      .catch(() => {
        if (!cancelled) setStorageError(localModeSaveFailedMessage);
      });
    return () => {
      cancelled = true;
    };
  }, [state, storageError]);

  const updateState = (
    updater: (current: LocalTrackerState) => LocalTrackerState,
  ) => {
    setState((current) => updater(current ?? createDefaultLocalTrackerState()));
  };
  const runLocalAction = <T,>(action: () => T | Promise<T>) =>
    runLocalActionWithErrorSurface({
      action,
      setError,
    });

  if (!state && !storageError) {
    return (
      <div className="loading-screen">
        <div className="loading-mark"></div>
        <p>{t('Loading Private local data…')}</p>
      </div>
    );
  }

  if (storageError) {
    return (
      <main className="auth-shell">
        <section className="auth-poster">
          <div className="auth-copy">
            <span className="eyebrow">worktimer • Private local</span>
            <h1>
              {t('Private local cannot save data safely.')}
              <span> {t('I will not show an empty workspace and pretend your data is being persisted.')}</span>
            </h1>
            <p>{storageError}</p>
            <div className="auth-actions">
              <button className="btn btn-primary" onClick={onExitLocalMode} type="button">
                {t('Return to the mode picker')}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const localState = state ?? createDefaultLocalTrackerState();

  return (
    <TrackerWorkspace
      allowDesktopHelper={false}
      data={data}
      error={error}
      onAddManualSession={(args) =>
        runLocalAction(() => {
          const splitGroupId = crypto.randomUUID();
          updateState((current) => ({
            ...current,
            sessions: [
              ...buildManualSessionRecords(
                { ...args, splitGroupId },
                (value, fallback) => value?.trim() || fallback,
                Error,
              ).map((session) => ({
                _id: `local-session:${crypto.randomUUID()}`,
                ...session,
              })),
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
      onMergeSessions={({ sessionIds }) =>
        runLocalAction(() => {
          const uniqueSessionIds = [...new Set(sessionIds)];
          updateState((current) => {
            if (uniqueSessionIds.length < 2) {
              throw new Error('Wybierz co najmniej dwa wpisy do scalenia.');
            }
            const selected = current.sessions
              .filter((session) => uniqueSessionIds.includes(session._id))
              .sort((left, right) => `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`));
            const first = selected[0];
            const last = selected.at(-1);
            if (!first || !last || selected.length !== uniqueSessionIds.length) {
              throw new Error('Nie znaleziono wszystkich wpisów do scalenia.');
            }
            if (!selected.every((session) =>
              session.date === first.date &&
              session.category === first.category &&
              session.description === first.description &&
              session.whatIsDone === first.whatIsDone &&
              session.projectName === first.projectName,
            )) {
              throw new Error('Można scalać tylko wpisy z tego samego kontekstu.');
            }
            if (selected.some((session) => session.duration <= 0 || session.duration > 90)) {
              throw new Error('Scalanie dotyczy tylko krótkich wpisów do 90 sekund.');
            }
            for (let index = 1; index < selected.length; index += 1) {
              const previous = selected[index - 1];
              const current = selected[index];
              const previousStop = new Date(`${previous.date}T${previous.stopTime}:00`).getTime();
              const currentStart = new Date(`${current.date}T${current.startTime}:00`).getTime();
              if (currentStart - previousStop > 120_000) {
                throw new Error('Scalane wpisy muszą być blisko siebie (maksymalnie 2 minuty przerwy).');
              }
            }
            const merged = {
                ...first,
                duration: selected.reduce((total, session) => total + session.duration, 0),
                stopTime: last.stopTime,
              };
            return {
              ...current,
              sessions: sortSessionsDesc([
                merged,
                ...current.sessions.filter((session) => !uniqueSessionIds.includes(session._id)),
              ]),
            };
          });
        })}
      onDeleteTrackingRule={async () => null}
      onIssueDesktopHelperKey={async () => ({ helperKey: 'local-mode-disabled' })}
      onPauseSession={() =>
        runLocalAction(() => {
          updateState((current) => {
            if (!current.activeSession) {
              throw new Error('There is no active session to pause.');
            }
            if (current.activeSession.pausedAt !== null) {
              return current;
            }
            const pausedAt = Date.now();
            return {
              ...current,
              activeSession: {
                ...current.activeSession,
                pausedAt,
                pauseRanges: [
                  ...current.activeSession.pauseRanges,
                  { startTime: pausedAt, endTime: null },
                ],
              },
            };
          });
        })}
      onResumeSession={() =>
        runLocalAction(() => {
          updateState((current) => {
            if (!current.activeSession) {
              throw new Error('There is no active session to resume.');
            }
            if (current.activeSession.pausedAt === null) {
              return current;
            }
            const resumedAt = Date.now();
            return {
              ...current,
              activeSession: {
                ...current.activeSession,
                pausedAt: null,
                pausedSeconds:
                  current.activeSession.pausedSeconds +
                  Math.max(
                    0,
                    Math.floor((resumedAt - current.activeSession.pausedAt) / 1000),
                  ),
                pauseRanges: current.activeSession.pauseRanges.map((range, index, ranges) =>
                  index === ranges.length - 1 && range.endTime === null
                    ? { ...range, endTime: resumedAt }
                    : range,
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
              throw new Error('You already have an active session.');
            }
            return {
              ...current,
              activeSession: {
                _id: `local-active:${crypto.randomUUID()}`,
                category: args.category.trim() || 'inne',
                description: args.description.trim() || 'Work on a project',
                pausedAt: null,
                pausedSeconds: 0,
                pauseRanges: [],
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
              throw new Error('There is no active session to stop.');
            }
            const activeSession = current.activeSession;
            const endTime =
              activeSession.pausedAt !== null
                ? activeSession.pausedAt
                : args.endTime ?? Date.now();
            if (endTime <= activeSession.startTime) {
              throw new Error('The session end time is invalid.');
            }
            const whatIsDone =
              args.whatIsDone?.trim() || activeSession.description || 'Saved work session';
            const sessions: SessionRecord[] = (
              args.entries?.length
                ? buildStoppedSessionRecordsFromParts({
                    parts: args.entries.map((entry) => ({
                      category: entry.category,
                      description: entry.description,
                      endTime: entry.endTime,
                      projectName: entry.projectName,
                      startTime: entry.startTime,
                      whatIsDone,
                    })),
                    pauseRanges: activeSession.pauseRanges,
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
                    whatIsDone,
                  })
            ).map((session) => ({
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
          updateState((current) => {
            const currentSession = current.sessions.find((session) => session._id === sessionId);
            const splitGroupId = currentSession?.splitGroupId ?? crypto.randomUUID();
            const nextRecords = buildManualSessionRecords(
              { ...args, splitGroupId },
              (value, fallback) => value?.trim() || fallback,
              Error,
            ).map((session, index) => ({
              _id: index === 0 ? sessionId : `local-session:${crypto.randomUUID()}`,
              ...session,
            }));
            return {
              ...current,
              sessions: sortSessionsDesc([
                ...nextRecords,
                ...current.sessions.filter((session) =>
                  session._id !== sessionId &&
                  (!currentSession?.splitGroupId || session.splitGroupId !== currentSession.splitGroupId),
                ),
              ]),
            };
          });
        })}
      onExportSessions={() => runLocalAction(() => sortSessionsDesc(localState.sessions))}
      signOutLabel="Return to mode picker"
      storageMode="local"
    />
  );
}

type CloudAppProps = {
  autoStartSignIn?: boolean;
  onExitCloudMode: () => void;
  onChooseLocalMode: () => void;
  startupError?: string | null;
};

export default function CloudApp({
  autoStartSignIn = false,
  onExitCloudMode,
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
  const mergeSessions = useMutation(anyApi.tracker.mergeSessions);
  const [error, setError] = useState<string | null>(startupError);
  const [authFallbackReady, setAuthFallbackReady] = useState(false);
  const autoSignInStartedRef = useRef(false);
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

  useEffect(() => {
    if (
      !autoStartSignIn ||
      autoSignInStartedRef.current ||
      isLoading ||
      isAuthenticated
    ) {
      return;
    }
    autoSignInStartedRef.current = true;
    signIn('google').catch((reason) => {
      setError(errorMessage(reason));
      autoSignInStartedRef.current = false;
    });
  }, [autoStartSignIn, isAuthenticated, isLoading, signIn]);

  if (isLoading && !authFallbackReady) {
    return (
      <div className="loading-screen">
        <div className="loading-mark"></div>
        <p>Connecting to Convex…</p>
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
        <p>Loading timer data…</p>
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
      signOutLabel="Sign out"
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
      onMergeSessions={(args) =>
        mergeSessions(args).catch((reason) => {
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
        signOutToModeChoice({
          clearStoredMode: onExitCloudMode,
          signOut,
        }).catch((reason) => {
          const message = errorMessage(reason);
          setError(message);
          throw new Error(message);
        })
      }
    />
  );
}
