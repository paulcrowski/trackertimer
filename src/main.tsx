import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexHttpClient } from 'convex/browser';
import { ConvexReactClient } from 'convex/react';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pwa.ts';

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
const convex = new ConvexReactClient(convexUrl);
const storageNamespace = convexUrl.replace(/[^a-zA-Z0-9]/g, '');
const storageKey = (key: string) => `${key}_${storageNamespace}`;
const verifierStorageKey = storageKey('__convexAuthOAuthVerifier');
const jwtStorageKey = storageKey('__convexAuthJWT');
const refreshTokenStorageKey = storageKey('__convexAuthRefreshToken');

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

const finishOAuthRedirect = async () => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return;

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
  }

  url.searchParams.delete('code');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
};

const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConvexAuthProvider client={convex} storage={browserStorage} shouldHandleCode={false}>
        <App />
      </ConvexAuthProvider>
    </StrictMode>,
  );
};

void registerServiceWorker();

void finishOAuthRedirect()
  .catch((error) => {
    console.error('Failed to finish Convex auth callback.', error);
  })
  .finally(renderApp);
