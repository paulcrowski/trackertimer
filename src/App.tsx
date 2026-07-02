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
          <span className="eyebrow">PoprostuKoduj • Time Tracker</span>
          <h1>
            Przestań klikać w chaos.
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
              Twoje sesje są odseparowane per konto.
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
            <li>Live timer z auto-stopem po bezczynności.</li>
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
  const startSession = useMutation(anyApi.tracker.start);
  const stopSession = useMutation(anyApi.tracker.stop);
  const savePreferences = useMutation(anyApi.tracker.savePreferences);
  const addManualSession = useMutation(anyApi.tracker.addManualSession);
  const updateSession = useMutation(anyApi.tracker.updateSession);
  const deleteSession = useMutation(anyApi.tracker.deleteSession);
  const [error, setError] = useState<string | null>(null);
  const [authFallbackReady, setAuthFallbackReady] = useState(false);

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
          signIn('google', { redirectTo: window.location.origin }).catch((reason) =>
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
      onStartSession={(args) =>
        startSession(args).catch((reason) => {
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
