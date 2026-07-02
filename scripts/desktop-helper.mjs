#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const args = parseArgs(process.argv.slice(2));
const ingestUrl = args.url ?? process.env.WORKTIMER_INGEST_URL;
const helperKey = args.key ?? process.env.WORKTIMER_HELPER_KEY;
const intervalMs = Number(args.intervalMs ?? 5000);

if (!ingestUrl || !helperKey) {
  console.error(
    'Usage: node scripts/desktop-helper.mjs --url <ingest-url> --key <helper-key> [--interval-ms 5000]',
  );
  process.exit(1);
}

const browserApps = new Set([
  'Google Chrome',
  'Brave Browser',
  'Arc',
  'Safari',
]);

console.log(`Desktop helper started. Poll interval: ${intervalMs}ms`);

void loop();

async function loop() {
  while (true) {
    try {
      const sample = captureDesktopSample();
      if (sample) {
        await postSample(sample);
        console.log(
          `[${new Date().toISOString()}] ${sample.appName}${sample.domain ? ` • ${sample.domain}` : ''}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Desktop helper error: ${message}`);
    }

    await sleep(intervalMs);
  }
}

function captureDesktopSample() {
  const appName = runAppleScript(`
    tell application "System Events"
      set frontApp to name of first application process whose frontmost is true
    end tell
    return frontApp
  `);

  if (!appName) {
    return null;
  }

  const windowTitle = getWindowTitle(appName);
  const browserMeta = browserApps.has(appName) ? getBrowserMetadata(appName) : null;

  return {
    appName,
    capturedAt: Date.now(),
    domain: browserMeta?.domain ?? null,
    platform: 'macos',
    windowTitle: browserMeta?.title ?? windowTitle,
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

function normalizeDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

async function postSample(sample) {
  const response = await fetch(ingestUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${helperKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(sample),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
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
