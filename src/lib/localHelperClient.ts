import type { DesktopHelperActivity, TrackerPreferences } from './trackerTypes.ts';

export const localHelperOrigin = 'http://127.0.0.1:32145';

export type LocalHelperBlock = {
  appName: string;
  capturedAt: number;
  domain: string | null;
  endTime: number;
  platform: string;
  startTime: number;
  windowTitle: string | null;
};

export type LocalHelperStatus = {
  blocks: LocalHelperBlock[];
  connected: boolean;
  lastAppName: string | null;
  lastDomain: string | null;
  lastSeenAt: number | null;
  lastSyncedAt: number | null;
  lastWindowTitle: string | null;
  platform: string | null;
  sessionId: string | null;
  startedAt: number | null;
  syncError: string | null;
  trackingActive: boolean;
};

const requestTimeoutMs = 1500;

export function localStatusToDesktopStatus(status: LocalHelperStatus) {
  return {
    configured: true,
    connected: status.connected,
    lastAppName: status.lastAppName,
    lastDomain: status.lastDomain,
    lastSeenAt: status.lastSeenAt,
    lastWindowTitle: status.lastWindowTitle,
    platform: status.platform,
  };
}

export function localStatusToActivities(status: LocalHelperStatus): DesktopHelperActivity[] {
  return status.blocks.map((block, index) => ({
    id: `local-block-${status.sessionId ?? 'none'}-${index}-${block.startTime}`,
    appName: block.appName,
    capturedAt: block.startTime,
    deviceId: 'local-helper',
    domain: block.domain,
    platform: block.platform,
    windowTitle: block.windowTitle,
  }));
}

export async function readLocalHelperStatus(): Promise<LocalHelperStatus | null> {
  return request<LocalHelperStatus>('/status', { method: 'GET' });
}

export async function startLocalHelperSession(args: {
  preferences: TrackerPreferences;
  sessionId: string;
  startedAt: number;
}) {
  return request<LocalHelperStatus>('/session/start', {
    body: JSON.stringify({
      privateDomainsText: args.preferences.privateDomainsText,
      privacyLevel: args.preferences.desktopPrivacyLevel,
      sessionId: args.sessionId,
      startedAt: args.startedAt,
    }),
    method: 'POST',
  });
}

export async function heartbeatLocalHelperSession(sessionId: string) {
  return request<LocalHelperStatus>('/session/heartbeat', {
    body: JSON.stringify({ sessionId }),
    method: 'POST',
  });
}

export async function stopLocalHelperSession(sessionId: string, endedAt: number) {
  return request<LocalHelperStatus>('/session/stop', {
    body: JSON.stringify({ endedAt, sessionId }),
    method: 'POST',
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(`${localHelperOrigin}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...init.headers,
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}
