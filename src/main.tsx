import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexHttpClient } from 'convex/browser';
import { ConvexReactClient } from 'convex/react';
import { api } from '../convex/_generated/api.js';
import CloudApp, { LocalTrackerApp } from './App.tsx';
import { AuthDemo, AuthDemoTrigger } from './components/AuthDemo.tsx';
import { AuthStorySlider } from './components/AuthStorySlider.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pwa.ts';
import { LanguagePicker, LanguageProvider, useLanguage } from './lib/i18n.tsx';
import {
  getLocalModeStorageError,
  hasStoredCloudAuthState,
  resolveInitialStorageMode,
  type StorageMode,
} from './lib/startupMode.ts';

const convexUrl =
  typeof import.meta.env.VITE_CONVEX_URL === 'string' ? import.meta.env.VITE_CONVEX_URL.trim() : '';
const storageModeKey = 'worktimer.storage-mode';
const storageNamespace = convexUrl.replace(/[^a-zA-Z0-9]/g, '');
const storageKey = (key: string) => `${key}_${storageNamespace}`;
const verifierStorageKey = storageKey('__convexAuthOAuthVerifier');
const jwtStorageKey = storageKey('__convexAuthJWT');
const refreshTokenStorageKey = storageKey('__convexAuthRefreshToken');
const authCallbackFailureMessage =
  'Could not finish Google sign-in. Refresh the page and try again.';

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
    const result = await http.action(api.auth.signIn, {
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
  const { t } = useLanguage();
  const [showDemo, setShowDemo] = useState(false);
  return (
    <main className="auth-shell">
      <section className="auth-poster">
        <div className="auth-copy">
          <span className="eyebrow">worktimer</span>
          <h1>
            {t('Worktimer — know where your work time goes.')}
            <span> {t('Without remembering every minute yourself.')}</span>
          </h1>
          <p>
            {t(
              'Start manually, let optional automatic desktop tracking notice your context, then review the summary before saving.',
            )}
          </p>
          <p className="auth-choice-label">Choose how to save your time</p>
          <div className="auth-actions">
            <button
              className="btn btn-primary"
              disabled={!props.cloudAvailable}
              onClick={props.onChooseCloud}
              type="button"
            >
              {t('Cloud sync + Google')}
            </button>
            <button
              className="chip-btn"
              disabled={!props.localAvailable}
              onClick={props.onChooseLocal}
              type="button"
            >
              {t('Private local')}
            </button>
          </div>
          <AuthDemoTrigger onClick={() => setShowDemo(true)} />
          {!props.cloudAvailable ? (
            <p className="muted-copy">
              {t(
                'Cloud sync requires `VITE_CONVEX_URL` in this environment. Private local works without this configuration.',
              )}
            </p>
          ) : null}
          {!props.localAvailable ? (
            <p className="muted-copy">
              {t(
                'Private local requires local `IndexedDB` storage, so work data cannot be safely persisted in this environment.',
              )}
            </p>
          ) : null}
          {props.error ? <div className="inline-error">{props.error}</div> : null}
        </div>
        <AuthStorySlider />
        <LanguagePicker />
      </section>
      {showDemo ? <AuthDemo onClose={() => setShowDemo(false)} /> : null}
    </main>
  );
}

function CloudModeShell(props: {
  autoStartSignIn?: boolean;
  onExitCloudMode: () => void;
  onChooseLocalMode: () => void;
  startupError: string | null;
}) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexAuthProvider client={convex} storage={browserStorage} shouldHandleCode={false}>
      <CloudApp
        autoStartSignIn={props.autoStartSignIn}
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
  const [autoStartCloudSignIn, setAutoStartCloudSignIn] = useState(false);
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
          setAutoStartCloudSignIn(false);
        }}
      />
    );
  }

  if (mode === 'cloud' && cloudAvailable) {
    return (
      <CloudModeShell
        autoStartSignIn={autoStartCloudSignIn}
        onExitCloudMode={() => {
          writeStorageMode(null);
          setMode(null);
          setAutoStartCloudSignIn(false);
        }}
        onChooseLocalMode={() => {
          writeStorageMode('local');
          setMode('local');
          setAutoStartCloudSignIn(false);
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
        setAutoStartCloudSignIn(true);
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
        setAutoStartCloudSignIn(false);
        writeStorageMode('local');
        setMode('local');
      }}
    />
  );
}

const renderApp = (startupError: string | null = null) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LanguageProvider>
        <RootApp startupError={startupError} />
      </LanguageProvider>
    </StrictMode>,
  );
};

void registerServiceWorker();

void finishOAuthRedirect().then((startupError) => {
  renderApp(startupError ?? null);
});
