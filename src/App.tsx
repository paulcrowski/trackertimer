import { useEffect, useState } from 'react';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { anyApi } from 'convex/server';
import { useMutation, useQuery } from 'convex/react';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { TrackerWorkspace } from './components/TrackerWorkspace.tsx';
import type { TrackerBootstrap } from './lib/tracker.ts';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.';

type AuthScreenProps = {
  error: string | null;
  isLoading: boolean;
  onSignIn: () => void;
};

export function AuthScreen({
  error,
  isLoading,
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

export default function App() {
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
  const deleteTrackingRule = useMutation(anyApi.tracker.deleteTrackingRule);
  const saveTrackingRule = useMutation(anyApi.tracker.saveTrackingRule);
  const addManualSession = useMutation(anyApi.tracker.addManualSession);
  const updateSession = useMutation(anyApi.tracker.updateSession);
  const deleteSession = useMutation(anyApi.tracker.deleteSession);
  const [error, setError] = useState<string | null>(null);
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
