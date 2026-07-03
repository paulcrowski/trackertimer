import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexHttpClient } from 'convex/browser';
import { ConvexReactClient } from 'convex/react';
import CloudApp, { LocalTrackerApp } from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pwa.ts';
import {
  getLocalModeStorageError,
  hasStoredCloudAuthState,
  resolveInitialStorageMode,
  type StorageMode,
} from './lib/startupMode.ts';

const convexUrl =
  typeof import.meta.env.VITE_CONVEX_URL === 'string'
    ? import.meta.env.VITE_CONVEX_URL.trim()
    : '';
const storageModeKey = 'worktimer.storage-mode';
const storageNamespace = convexUrl.replace(/[^a-zA-Z0-9]/g, '');
const storageKey = (key: string) => `${key}_${storageNamespace}`;
const verifierStorageKey = storageKey('__convexAuthOAuthVerifier');
const jwtStorageKey = storageKey('__convexAuthJWT');
const refreshTokenStorageKey = storageKey('__convexAuthRefreshToken');
const authCallbackFailureMessage =
  'Nie udało się dokończyć logowania Google. Odśwież stronę i spróbuj ponownie.';

const cookieStorage = {
  getItem(key: string) {
    const match = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${encodeURIComponent(key)}=`));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
  },
  setItem(key: string, value: string) {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  },
  removeItem(key: string) {
    document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; path=/; SameSite=Lax`;
  },
};

const browserStorage = (() => {
  if (typeof window === 'undefined') return cookieStorage;
  try {
    if (window.localStorage) {
      const probe = '__convex_auth_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    // Fall back when the host browser disables localStorage.
  }
  try {
    if (window.sessionStorage) {
      const probe = '__convex_auth_probe__';
      window.sessionStorage.setItem(probe, '1');
      window.sessionStorage.removeItem(probe);
      return window.sessionStorage;
    }
  } catch {
    // Cookie storage keeps the OAuth verifier across redirects.
  }
  return cookieStorage;
})();

function readStorageMode(): StorageMode | null {
  const value = browserStorage.getItem(storageModeKey);
  return value === 'cloud' || value === 'local' ? value : null;
}

function writeStorageMode(mode: StorageMode | null) {
  if (mode) {
    browserStorage.setItem(storageModeKey, mode);
    return;
  }
  browserStorage.removeItem(storageModeKey);
}

const finishOAuthRedirect = async () => {
  if (typeof window === 'undefined' || !convexUrl) return;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return;

  try {
    const verifier = browserStorage.getItem(verifierStorageKey) ?? undefined;
    browserStorage.removeItem(verifierStorageKey);

    const http = new ConvexHttpClient(convexUrl);
    const result = await (http as { action: (name: string, args: unknown) => Promise<{ tokens?: { token: string; refreshToken: string } | null }> }).action('auth:signIn', {
      params: { code },
      verifier,
    });

    if (result.tokens?.token && result.tokens.refreshToken) {
      browserStorage.setItem(jwtStorageKey, result.tokens.token);
      browserStorage.setItem(refreshTokenStorageKey, result.tokens.refreshToken);
    } else {
      browserStorage.removeItem(jwtStorageKey);
      browserStorage.removeItem(refreshTokenStorageKey);
      return authCallbackFailureMessage;
    }
    return null;
  } catch (error) {
    console.error('Failed to finish Convex auth callback.', error);
    browserStorage.removeItem(jwtStorageKey);
    browserStorage.removeItem(refreshTokenStorageKey);
    return authCallbackFailureMessage;
  } finally {
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
};

function ModeChoiceScreen(props: {
  cloudAvailable: boolean;
  error?: string | null;
  localAvailable: boolean;
  onChooseCloud: () => void;
  onChooseLocal: () => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-poster">
        <div className="auth-copy">
          <span className="eyebrow">worktimer</span>
          <h1>
            Wybierz tryb pracy.
            <span> Sync w chmurze albo prywatnie na tym urządzeniu.</span>
          </h1>
          <p>
            Cloud sync zachowuje Google login i dane w Convexie. Private local
            trzyma dane trackera tylko lokalnie na tym urządzeniu.
          </p>
          <div className="auth-actions">
            <button
              className="btn btn-primary"
              disabled={!props.cloudAvailable}
              onClick={props.onChooseCloud}
              type="button"
            >
              Cloud sync + Google
            </button>
            <button
              className="chip-btn"
              disabled={!props.localAvailable}
              onClick={props.onChooseLocal}
              type="button"
            >
              Private local
            </button>
          </div>
          {!props.cloudAvailable ? (
            <p className="muted-copy">
              Cloud sync lokalnie wymaga `VITE_CONVEX_URL`. Private local działa
              bez tej konfiguracji.
            </p>
          ) : null}
          {!props.localAvailable ? (
            <p className="muted-copy">
              Private local wymaga zapisywalnego `localStorage`, więc w tym
              środowisku nie da się bezpiecznie utrzymać danych pracy.
            </p>
          ) : null}
          {props.error ? <div className="inline-error">{props.error}</div> : null}
        </div>
        <div className="auth-proof">
          <div className="proof-kicker">Dwa runtime</div>
          <ul className="proof-list">
            <li>Cloud sync: to samo konto na wielu urządzeniach.</li>
            <li>Private local: bez query i mutacji trackera do Convexa.</li>
            <li>Tryb możesz zmienić później bez usuwania Google loginu.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function CloudModeShell(props: {
  onExitCloudMode: () => void;
  onChooseLocalMode: () => void;
  startupError: string | null;
}) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexAuthProvider client={convex} storage={browserStorage} shouldHandleCode={false}>
      <CloudApp
        onExitCloudMode={props.onExitCloudMode}
        onChooseLocalMode={props.onChooseLocalMode}
        startupError={props.startupError}
      />
    </ConvexAuthProvider>
  );
}

function RootApp(props: { startupError: string | null }) {
  const localModeStorageError = getLocalModeStorageError();
  const localModeAvailable = localModeStorageError === null;
  const [mode, setMode] = useState<StorageMode | null>(() =>
    resolveInitialStorageMode({
      hasCloudAuthState: hasStoredCloudAuthState({
        jwt: browserStorage.getItem(jwtStorageKey),
        refreshToken: browserStorage.getItem(refreshTokenStorageKey),
      }),
      localModeReady: localModeAvailable,
      storedMode: readStorageMode(),
    }),
  );
  const [modeError, setModeError] = useState<string | null>(() => {
    const storedMode = readStorageMode();
    if (storedMode === 'local' && localModeStorageError) {
      return localModeStorageError;
    }
    return null;
  });
  const cloudAvailable = convexUrl.length > 0;

  useEffect(() => {
    if (mode === 'cloud' && !cloudAvailable) {
      writeStorageMode(null);
      setMode(null);
    }
    if (mode === 'local' && localModeStorageError) {
      writeStorageMode(null);
      setMode(null);
      setModeError(localModeStorageError);
    }
  }, [cloudAvailable, localModeStorageError, mode]);

  if (mode === 'local') {
    return (
      <LocalTrackerApp
        onExitLocalMode={() => {
          writeStorageMode(null);
          setMode(null);
        }}
      />
    );
  }

  if (mode === 'cloud' && cloudAvailable) {
    return (
      <CloudModeShell
        onExitCloudMode={() => {
          writeStorageMode(null);
          setMode(null);
        }}
        onChooseLocalMode={() => {
          writeStorageMode('local');
          setMode('local');
        }}
        startupError={props.startupError}
      />
    );
  }

  return (
    <ModeChoiceScreen
      cloudAvailable={cloudAvailable}
      error={props.startupError ?? modeError}
      localAvailable={localModeAvailable}
      onChooseCloud={() => {
        if (!cloudAvailable) {
          return;
        }
        setModeError(null);
        writeStorageMode('cloud');
        setMode('cloud');
      }}
      onChooseLocal={() => {
        if (localModeStorageError) {
          setModeError(localModeStorageError);
          writeStorageMode(null);
          setMode(null);
          return;
        }
        setModeError(null);
        writeStorageMode('local');
        setMode('local');
      }}
    />
  );
}

const renderApp = (startupError: string | null = null) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RootApp startupError={startupError} />
    </StrictMode>,
  );
};

void registerServiceWorker();

void finishOAuthRedirect().then((startupError) => {
  renderApp(startupError ?? null);
});
