#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const macBrowserApps = new Set(['Google Chrome', 'Brave Browser', 'Arc', 'Safari']);
const defaultIntervalMs = 5000;
const minIntervalMs = 1000;
const maxIntervalMs = 10 * 60 * 1000;
const helperRequestTimeoutMs = 10_000;
const inactiveProbeIntervalMs = 60_000;
const batchFlushIntervalMs = 2 * 60_000;
const activityHeartbeatIntervalMs = 60_000;
const maxBatchSize = 32;
const localHelperPort = 32145;
const localLeaseMs = 30_000;
const localCheckpointIntervalMs = 15 * 60_000;
const localPersistIntervalMs = 30_000;
const localRetryIntervalMs = 30_000;
const localBlockMergeGapMs = 15_000;
const localDataDirectory =
  process.platform === 'win32'
    ? join(process.env.APPDATA ?? homedir(), 'Worktimer')
    : join(homedir(), 'Library', 'Application Support', 'Worktimer');
const localBufferPath = join(localDataDirectory, 'helper-buffer.json');
const localAllowedOrigins = new Set([
  'https://worktimer-5gn.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ingestUrl = args.url ?? process.env.WORKTIMER_INGEST_URL;
  const helperKey = args.key ?? process.env.WORKTIMER_HELPER_KEY;
  const intervalMs = normalizeIntervalMs(args.intervalMs ?? defaultIntervalMs);

  if (!ingestUrl || !helperKey) {
    console.error(
      'Usage: node scripts/desktop-helper.mjs --url <ingest-url> --key <helper-key> [--interval-ms 5000]',
    );
    process.exit(1);
  }

  if (!['darwin', 'win32'].includes(process.platform)) {
    console.error(
      `Desktop helper currently supports macOS and Windows. Current platform: ${process.platform}`,
    );
    process.exit(1);
  }

  if (intervalMs === null) {
    console.error(`Interval must be between ${minIntervalMs}ms and ${maxIntervalMs}ms.`);
    process.exit(1);
  }

  console.log(
    `Desktop helper started. Platform: ${process.platform}. Poll interval: ${intervalMs}ms`,
  );

  const localBridge = await startLocalHelperBridge({ helperKey, ingestUrl });
  await loop({ helperKey, ingestUrl, intervalMs, localBridge });
}

async function loop({ helperKey, ingestUrl, intervalMs, localBridge }) {
  let trackingActive = false;
  let nextInactiveProbeAt = 0;
  let pendingSamples = [];
  let pendingBatchId = null;
  let lastQueuedSample = null;
  let lastQueuedAt = 0;
  let lastFlushAt = 0;

  while (true) {
    const now = Date.now();
    try {
      const sample = captureDesktopSample();

      if (localBridge.isCapturing()) {
        if (sample) {
          localBridge.recordSample(sample);
          if (localBridge.shouldCheckpoint(now)) {
            await localBridge.flushSummary(now, false);
          }
        }
        await sleep(intervalMs);
        continue;
      }

      if (!trackingActive) {
        if (sample && now >= nextInactiveProbeAt) {
          const result = await postSamples([sample], { helperKey, ingestUrl });
          trackingActive = result.trackingActive;
          nextInactiveProbeAt = now + (trackingActive ? 0 : inactiveProbeIntervalMs);
          if (trackingActive) {
            lastQueuedSample = sample;
            lastQueuedAt = now;
            lastFlushAt = now;
            console.log(
              `[${new Date().toISOString()}] Timer active; local activity buffering started.`,
            );
          }
        }
      } else if (sample) {
        if (
          shouldQueueDesktopSample(sample, {
            previousSample: lastQueuedSample,
            previousAt: lastQueuedAt,
            now,
          })
        ) {
          pendingBatchId ??= crypto.randomUUID();
          pendingSamples.push(sample);
          lastQueuedSample = sample;
          lastQueuedAt = now;
        }

        if (
          pendingSamples.length >= maxBatchSize ||
          (pendingSamples.length > 0 && now - lastFlushAt >= batchFlushIntervalMs)
        ) {
          const result = await postSamples(pendingSamples, {
            batchId: pendingBatchId,
            helperKey,
            ingestUrl,
          });
          trackingActive = result.trackingActive;
          pendingSamples = [];
          pendingBatchId = null;
          lastFlushAt = now;
          if (!trackingActive) {
            nextInactiveProbeAt = now + inactiveProbeIntervalMs;
            lastQueuedSample = null;
            lastQueuedAt = 0;
            console.log(
              `[${new Date().toISOString()}] Timer stopped; local activity buffering paused.`,
            );
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Desktop helper error: ${message}`);
    }

    await sleep(intervalMs);
  }
}

function captureDesktopSample() {
  if (process.platform === 'win32') {
    return captureWindowsSample();
  }

  return captureMacOsSample();
}

function captureMacOsSample() {
  const appMeta = runAppleScript(`
    tell application "System Events"
      set frontProcess to first application process whose frontmost is true
      set frontApp to name of frontProcess
      set frontBundle to ""
      try
        set frontBundle to bundle identifier of frontProcess
      end try
    end tell
    return frontApp & linefeed & frontBundle
  `);

  if (!appMeta) {
    return null;
  }

  const [processName = '', bundleIdentifier = ''] = appMeta.split('\n');
  const windowTitle = getWindowTitle(processName);
  const appName = normalizeMacOsAppName(processName, bundleIdentifier, windowTitle);
  const browserMeta = macBrowserApps.has(processName) ? getBrowserMetadata(processName) : null;

  if (!appName) {
    return null;
  }

  return {
    appName,
    capturedAt: Date.now(),
    domain: browserMeta?.domain ?? null,
    platform: 'macos',
    windowTitle: browserMeta?.title ?? windowTitle,
  };
}

function captureWindowsSample() {
  const raw = runPowerShell(`
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class User32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@

$handle = [User32]::GetForegroundWindow()
if ($handle -eq [IntPtr]::Zero) { return }

$title = New-Object System.Text.StringBuilder 1024
[void][User32]::GetWindowText($handle, $title, $title.Capacity)

$processId = 0
[void][User32]::GetWindowThreadProcessId($handle, [ref]$processId)
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
if ($null -eq $process) { return }

Write-Output $process.ProcessName
Write-Output $title.ToString()
  `);

  if (!raw) {
    return null;
  }

  const [processName = '', windowTitle = ''] = raw.split('\n');
  const appName = normalizeWindowsAppName(processName);

  if (!appName) {
    return null;
  }

  const browserMeta = getWindowsBrowserMetadata(windowTitle);

  return {
    appName,
    capturedAt: Date.now(),
    domain: browserMeta?.domain ?? null,
    platform: 'windows',
    windowTitle: browserMeta?.title ?? (windowTitle.trim() || null),
  };
}

function getWindowTitle(appName) {
  return runAppleScript(`
    tell application "System Events"
      tell process ${toAppleScriptString(appName)}
        if exists front window then
          return name of front window
        end if
      end tell
    end tell
    return ""
  `);
}

function getBrowserMetadata(appName) {
  const raw = runAppleScript(browserAppleScript(appName));
  if (!raw) {
    return null;
  }

  const [url = '', title = ''] = raw.split('\n');
  const domain = normalizeDomain(url);

  return {
    domain,
    title: title.trim() || null,
  };
}

function browserAppleScript(appName) {
  if (appName === 'Safari') {
    return `
      tell application "Safari"
        if not (exists front window) then return ""
        set currentTab to current tab of front window
        return (URL of currentTab) & linefeed & (name of currentTab)
      end tell
    `;
  }

  return `
    tell application ${toAppleScriptString(appName)}
      if not (exists front window) then return ""
      set currentTab to active tab of front window
      return (URL of currentTab) & linefeed & (title of currentTab)
    end tell
  `;
}

function getWindowsBrowserMetadata(windowTitle) {
  const rawUrl = runPowerShell(`
Add-Type -AssemblyName UIAutomationClient
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class User32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
}
"@

$handle = [User32]::GetForegroundWindow()
if ($handle -eq [IntPtr]::Zero) { return }
$root = [System.Windows.Automation.AutomationElement]::FromHandle($handle)
if ($null -eq $root) { return }

$editCondition = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::Edit
)
$edits = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCondition)

foreach ($edit in $edits) {
  $pattern = $null
  if ($edit.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) {
    $value = $pattern.Current.Value
    if (-not [string]::IsNullOrWhiteSpace($value) -and $value.Length -lt 2048) {
      Write-Output $value
      break
    }
  }
}
  `);

  return {
    domain: normalizeDomain(rawUrl) ?? inferKnownWebDomainFromWindowTitle(windowTitle),
    title: windowTitle.trim() || null,
  };
}

export function normalizeDomain(url) {
  const normalized = String(url ?? '').trim();
  if (!normalized) {
    return null;
  }

  const directUrlMatch = normalized.match(/https?:\/\/\S+/i);
  const bareDomainMatch = normalized.match(/\b(?:[\w-]+\.)+[a-z]{2,}\b/i);
  const candidate =
    directUrlMatch?.[0] ?? (bareDomainMatch ? `https://${bareDomainMatch[0]}` : normalized);

  try {
    return new URL(candidate).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

export function inferKnownWebDomainFromWindowTitle(windowTitle) {
  const normalized = String(windowTitle ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes('chatgpt')) return 'chatgpt.com';
  if (normalized.includes('canva')) return 'canva.com';
  if (normalized.includes('github')) return 'github.com';
  if (normalized.includes('figma')) return 'figma.com';
  if (normalized.includes('notion')) return 'notion.so';

  return null;
}

export function normalizeWindowsAppName(processName) {
  const normalized = processName.trim().toLowerCase();

  switch (normalized) {
    case 'chrome':
      return 'Google Chrome';
    case 'msedge':
      return 'Microsoft Edge';
    case 'brave':
      return 'Brave Browser';
    case 'arc':
      return 'Arc';
    case 'obs64':
    case 'obs':
      return 'OBS';
    case 'resolve':
      return 'DaVinci Resolve';
    case 'code':
      return 'VS Code';
    case 'cursor':
      return 'Cursor';
    case 'windsurf':
      return 'Windsurf';
    case 'zed':
      return 'Zed';
    case 'codex':
      return 'Codex';
    case 'chatgpt':
      return 'ChatGPT';
    case 'windowsterminal':
    case 'wt':
    case 'openconsole':
      return 'Windows Terminal';
    case 'powershell':
    case 'powershell_ise':
    case 'pwsh':
      return 'PowerShell';
    case 'cmd':
      return 'Command Prompt';
    case 'conhost':
      return 'Windows Console';
    case 'wsl':
    case 'wslhost':
      return 'WSL';
    case 'mintty':
      return 'Git Bash';
    default:
      return processName.trim() || null;
  }
}

export function normalizeMacOsAppName(appName, bundleIdentifier = '', windowTitle = '') {
  const normalizedAppName = String(appName ?? '').trim();
  const normalizedBundleIdentifier = String(bundleIdentifier ?? '')
    .trim()
    .toLowerCase();
  const normalizedWindowTitle = String(windowTitle ?? '')
    .trim()
    .toLowerCase();

  const bundleAliases = new Map([
    ['com.openai.codex', 'Codex'],
    ['com.apple.terminal', 'Terminal'],
    ['com.googlecode.iterm2', 'iTerm2'],
    ['dev.warp.warp-stable', 'Warp'],
    ['com.mitchellh.ghostty', 'Ghostty'],
    ['org.alacritty', 'Alacritty'],
    ['net.kovidgoyal.kitty', 'kitty'],
    ['com.github.wez.wezterm', 'WezTerm'],
    ['co.zeit.hyper', 'Hyper'],
    ['com.microsoft.vscode', 'VS Code'],
    ['dev.zcode.app', 'ZCode'],
    ['com.apple.dt.xcode', 'Xcode'],
  ]);
  const aliasedAppName = bundleAliases.get(normalizedBundleIdentifier);
  if (aliasedAppName) {
    return aliasedAppName;
  }

  if (normalizedAppName.toLowerCase() === 'app_mode_loader') {
    if (normalizedWindowTitle.includes('worktimer')) return 'Worktimer';
    if (
      normalizedWindowTitle.includes('poprostukoduj') ||
      normalizedWindowTitle.includes('po prostu koduj')
    ) {
      return 'PoprostuKoduj';
    }
    return 'Chrome app';
  }

  return normalizedAppName || null;
}

export function normalizeIntervalMs(value) {
  const intervalMs = Number(value);
  return Number.isFinite(intervalMs) && intervalMs >= minIntervalMs && intervalMs <= maxIntervalMs
    ? Math.round(intervalMs)
    : null;
}

export function shouldQueueDesktopSample(sample, { previousSample, previousAt, now }) {
  if (!previousSample) return true;
  if (now - previousAt >= activityHeartbeatIntervalMs) return true;
  return (
    sample.appName !== previousSample.appName ||
    sample.domain !== previousSample.domain ||
    sample.platform !== previousSample.platform ||
    sample.windowTitle !== previousSample.windowTitle
  );
}

export async function postSample(sample, { helperKey, ingestUrl }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), helperRequestTimeoutMs);
  let response;
  try {
    response = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${helperKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(sample),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
}

export async function postSamples(
  samples,
  { batchId = crypto.randomUUID(), helperKey, ingestUrl },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), helperRequestTimeoutMs);
  let response;
  try {
    response = await fetch(ingestUrl.replace(/\/?$/, '/batch'), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${helperKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ activities: samples, batchId }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  return { trackingActive: payload?.trackingActive === true };
}

async function postSummary(summary, { helperKey, ingestUrl }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), helperRequestTimeoutMs);
  let response;
  try {
    response = await fetch(
      ingestUrl.replace(/\/api\/desktop\/activity\/?$/, '/api/desktop/summary'),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${helperKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(summary),
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

async function startLocalHelperBridge({ helperKey, ingestUrl }) {
  const state = await loadLocalBridgeState();
  const bridge = createLocalBridge({ helperKey, ingestUrl, state });
  const server = createServer((request, response) => {
    void handleLocalBridgeRequest(bridge, request, response);
  });

  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(localHelperPort, '127.0.0.1', resolve);
    });
  } catch (error) {
    if (error?.code !== 'EADDRINUSE') throw error;
    console.error(`Local helper bridge is already running on port ${localHelperPort}.`);
    return {
      isCapturing: () => false,
    };
  }

  console.log(`Local helper bridge listening on http://127.0.0.1:${localHelperPort}`);
  return bridge;
}

function createLocalBridge({ helperKey, ingestUrl, state }) {
  let current = normalizeLocalState(state);
  let lastPersistAt = 0;
  let persistInFlight = null;

  const persist = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastPersistAt < localPersistIntervalMs) return;
    lastPersistAt = now;
    const snapshot = JSON.stringify(current);
    persistInFlight ??= persistLocalBridgeState(snapshot).finally(() => {
      persistInFlight = null;
    });
    await persistInFlight;
  };

  const active = () =>
    Boolean(current.sessionId && current.leaseExpiresAt > Date.now() && current.startedAt !== null);

  return {
    isCapturing: active,
    hasSession(sessionId) {
      return active() && current.sessionId === sessionId;
    },
    getStatus() {
      return {
        connected: true,
        trackingActive: active(),
        sessionId: current.sessionId,
        startedAt: current.startedAt,
        lastSeenAt: current.lastSeenAt,
        lastAppName: current.lastAppName,
        lastDomain: current.lastDomain,
        lastWindowTitle: current.lastWindowTitle,
        platform: current.platform,
        blocks: current.blocks,
        lastSyncedAt: current.lastSyncedAt,
        syncError: current.syncError,
      };
    },
    startSession(payload) {
      current = {
        ...createEmptyLocalState(),
        sessionId: payload.sessionId,
        startedAt: payload.startedAt,
        leaseExpiresAt: Date.now() + localLeaseMs,
        privacyLevel: payload.privacyLevel,
        privateDomainsText: payload.privateDomainsText,
      };
      void persist(true);
      return this.getStatus();
    },
    heartbeat(sessionId) {
      if (current.sessionId === sessionId) {
        current.leaseExpiresAt = Date.now() + localLeaseMs;
      }
      return this.getStatus();
    },
    recordSample(sample) {
      if (!active()) return;
      const masked = maskLocalSample(sample, current);
      current.blocks = mergeLocalSampleIntoBlocks(current.blocks, masked);
      current.lastSeenAt = masked.capturedAt;
      current.lastAppName = masked.appName;
      current.lastDomain = masked.domain;
      current.lastWindowTitle = masked.windowTitle;
      current.platform = masked.platform;
      void persist();
    },
    shouldCheckpoint(now) {
      const lastCheckpointAt = current.lastSyncedAt ?? current.startedAt ?? now;
      const lastAttemptAt = current.lastAttemptAt ?? current.startedAt ?? now;
      return (
        active() &&
        now - lastCheckpointAt >= localCheckpointIntervalMs &&
        now - lastAttemptAt >= localRetryIntervalMs
      );
    },
    async flushSummary(endedAt, final) {
      if (!current.sessionId || current.startedAt === null || !current.blocks.length) return;
      const revision = current.revision + 1;
      current.lastAttemptAt = endedAt;
      const summary = {
        blocks: current.blocks.map((block, index) => ({
          ...block,
          endTime: index === current.blocks.length - 1 ? endedAt : block.endTime,
          durationSeconds: Math.max(
            0,
            Math.round(
              ((index === current.blocks.length - 1 ? endedAt : block.endTime) - block.startTime) /
                1000,
            ),
          ),
        })),
        endedAt,
        final,
        revision,
        sessionId: current.sessionId,
        startedAt: current.startedAt,
      };
      try {
        await postSummary(summary, { helperKey, ingestUrl });
        current.revision = revision;
        current.lastSyncedAt = endedAt;
        current.syncError = null;
        await persist(true);
      } catch (error) {
        current.syncError = error instanceof Error ? error.message : String(error);
        await persist(true);
        throw error;
      }
    },
    async stopSession(sessionId, endedAt) {
      if (!this.hasSession(sessionId)) return this.getStatus();
      await this.flushSummary(endedAt, true);
      current = createEmptyLocalState();
      await persistLocalBridgeState(current);
      return this.getStatus();
    },
  };
}

async function handleLocalBridgeRequest(bridge, request, response) {
  const origin = request.headers.origin ?? '';
  if (origin && !localAllowedOrigins.has(origin)) {
    response.writeHead(403);
    response.end('Origin not allowed.');
    return;
  }
  const corsHeaders = {
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-origin': origin || 'null',
    'access-control-allow-private-network': 'true',
    'access-control-request-private-network': 'true',
    'content-type': 'application/json',
    vary: 'Origin',
  };
  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  try {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    if (request.method === 'GET' && path === '/status') {
      response.writeHead(200, corsHeaders);
      response.end(JSON.stringify(bridge.getStatus()));
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405, corsHeaders);
      response.end(JSON.stringify({ error: 'Method not allowed.' }));
      return;
    }
    const payload = await readJsonRequest(request);
    if (path === '/session/start') {
      if (typeof payload.sessionId !== 'string' || typeof payload.startedAt !== 'number') {
        throw new Error('Invalid start payload.');
      }
      response.writeHead(200, corsHeaders);
      response.end(JSON.stringify(bridge.startSession(payload)));
      return;
    }
    if (path === '/session/heartbeat') {
      if (typeof payload.sessionId !== 'string') throw new Error('Invalid heartbeat payload.');
      response.writeHead(200, corsHeaders);
      response.end(JSON.stringify(bridge.heartbeat(payload.sessionId)));
      return;
    }
    if (path === '/session/stop') {
      if (typeof payload.sessionId !== 'string' || typeof payload.endedAt !== 'number') {
        throw new Error('Invalid stop payload.');
      }
      const status = await bridge.stopSession(payload.sessionId, payload.endedAt);
      response.writeHead(200, corsHeaders);
      response.end(JSON.stringify(status));
      return;
    }
    response.writeHead(404, corsHeaders);
    response.end(JSON.stringify({ error: 'Not found.' }));
  } catch (error) {
    response.writeHead(400, corsHeaders);
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  }
}

function readJsonRequest(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 256_000) reject(new Error('Request too large.'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    request.on('error', reject);
  });
}

function createEmptyLocalState() {
  return {
    blocks: [],
    lastAttemptAt: null,
    lastAppName: null,
    lastDomain: null,
    lastSeenAt: null,
    lastSyncedAt: null,
    lastWindowTitle: null,
    leaseExpiresAt: 0,
    platform: null,
    privateDomainsText: '',
    privacyLevel: 'standard',
    revision: 0,
    sessionId: null,
    startedAt: null,
    syncError: null,
  };
}

function normalizeLocalState(value) {
  const base = createEmptyLocalState();
  if (!value || typeof value !== 'object') return base;
  return {
    ...base,
    ...value,
    blocks: Array.isArray(value.blocks) ? value.blocks.slice(-2048) : [],
  };
}

async function loadLocalBridgeState() {
  try {
    return JSON.parse(await readFile(localBufferPath, 'utf8'));
  } catch {
    return createEmptyLocalState();
  }
}

async function persistLocalBridgeState(stateOrSnapshot) {
  await mkdir(localDataDirectory, { recursive: true });
  const temporaryPath = `${localBufferPath}.tmp`;
  const snapshot =
    typeof stateOrSnapshot === 'string' ? stateOrSnapshot : JSON.stringify(stateOrSnapshot);
  await writeFile(temporaryPath, snapshot, 'utf8');
  await rename(temporaryPath, localBufferPath);
}

export function maskLocalSample(sample, state) {
  const domain = normalizeDomain(sample.domain);
  const privateDomains = normalizePrivateDomains(state.privateDomainsText);
  const privateDomain = domain && privateDomains.some((entry) => domainMatches(entry, domain));
  if (privateDomain) {
    return {
      ...sample,
      appName: 'Private domain',
      domain: null,
      windowTitle: null,
    };
  }
  return {
    ...sample,
    domain: state.privacyLevel === 'high' ? null : domain,
    windowTitle: sanitizeLocalWindowTitle(sample.windowTitle, state.privacyLevel),
  };
}

function sanitizeLocalWindowTitle(value, privacyLevel) {
  const normalized = String(value ?? '').trim();
  if (!normalized || privacyLevel === 'high') return null;
  if (privacyLevel === 'low') return normalized.slice(0, 120);
  return normalized
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b(password|hasło|token|secret|key)\s*[:=]\s*[^\s|]+/gi, '$1: [hidden]')
    .replace(/\b(?:https?:\/\/|www\.)[^\s|]+/gi, '[link]')
    .slice(0, 120);
}

export function mergeLocalSampleIntoBlocks(blocks, sample) {
  const nextBlocks = [...blocks];
  const lastBlock = nextBlocks.at(-1);
  if (
    lastBlock &&
    lastBlock.appName === sample.appName &&
    lastBlock.domain === sample.domain &&
    lastBlock.platform === sample.platform &&
    lastBlock.windowTitle === sample.windowTitle &&
    sample.capturedAt - lastBlock.endTime <= localBlockMergeGapMs
  ) {
    lastBlock.endTime = sample.capturedAt;
    return nextBlocks;
  }
  nextBlocks.push({
    appName: sample.appName,
    capturedAt: sample.capturedAt,
    domain: sample.domain,
    endTime: sample.capturedAt,
    platform: sample.platform,
    startTime: sample.capturedAt,
    windowTitle: sample.windowTitle,
  });
  return nextBlocks;
}

function normalizePrivateDomains(value) {
  return [
    ...new Set(
      String(value ?? '')
        .split(/[\n,]+/)
        .map((entry) => normalizeDomain(entry))
        .filter(Boolean),
    ),
  ].slice(0, 50);
}

function domainMatches(ruleDomain, currentDomain) {
  return currentDomain === ruleDomain || currentDomain.endsWith(`.${ruleDomain}`);
}

function runAppleScript(script) {
  try {
    return execFileSync('osascript', ['-e', script], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function runPowerShell(script) {
  try {
    return execFileSync(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        script,
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim();
  } catch {
    return '';
  }
}

function toAppleScriptString(value) {
  return JSON.stringify(value);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) continue;
    const key = current.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    parsed[key] = argv[index + 1];
    index += 1;
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
