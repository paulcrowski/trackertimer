#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const macBrowserApps = new Set([
  'Google Chrome',
  'Brave Browser',
  'Arc',
  'Safari',
]);

export async function main() {
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

  if (!['darwin', 'win32'].includes(process.platform)) {
    console.error(
      `Desktop helper currently supports macOS and Windows. Current platform: ${process.platform}`,
    );
    process.exit(1);
  }

  console.log(
    `Desktop helper started. Platform: ${process.platform}. Poll interval: ${intervalMs}ms`,
  );

  await loop({ helperKey, ingestUrl, intervalMs });
}

async function loop({ helperKey, ingestUrl, intervalMs }) {
  while (true) {
    try {
      const sample = captureDesktopSample();
      if (sample) {
        await postSample(sample, { helperKey, ingestUrl });
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
    domain:
      normalizeDomain(rawUrl) ?? inferKnownWebDomainFromWindowTitle(windowTitle),
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
    directUrlMatch?.[0] ??
    (bareDomainMatch ? `https://${bareDomainMatch[0]}` : normalized);

  try {
    return new URL(candidate).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

export function inferKnownWebDomainFromWindowTitle(windowTitle) {
  const normalized = String(windowTitle ?? '').trim().toLowerCase();
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
  const normalizedBundleIdentifier = String(bundleIdentifier ?? '').trim().toLowerCase();
  const normalizedWindowTitle = String(windowTitle ?? '').trim().toLowerCase();

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

async function postSample(sample, { helperKey, ingestUrl }) {
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
