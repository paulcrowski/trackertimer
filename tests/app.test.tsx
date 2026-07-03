import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  inferKnownWebDomainFromWindowTitle,
  normalizeDomain,
} from '../scripts/desktop-helper.mjs';
import { AuthScreen } from '../src/App.tsx';
import { SettingsDialog } from '../src/components/SessionDialogs.tsx';
import {
  buildDesktopHelperCommand,
  buildDesktopHelperIngestUrl,
  buildStopFocusSummary,
  buildSessionsCsv,
  createActiveSessionSnapshot,
  createSessionDraft,
  createSessionDraftFromRecord,
  defaultPreferences,
  describeDesktopHelperActivityContext,
  describeDesktopHelperActivityTime,
  describeDesktopHelperLastSeen,
  describeDesktopHelperStatus,
  describeAutoPauseReason,
  describeAutoPauseSetting,
  filterHistoryGroups,
  formatDurationHms,
  getActiveElapsedSeconds,
  getActiveSessionSnapshotKey,
  parseActiveSessionSnapshot,
  resolveActiveSessionState,
  type SessionDayGroup,
  type SessionRecord,
} from '../src/lib/tracker.ts';
import {
  createPomodoroState,
  formatPomodoroClock,
  resolvePomodoroState,
  startPomodoroCycle,
} from '../src/lib/pomodoro.ts';
import {
  buildDashboard,
  buildSessionHistory,
  computeSummary,
  sortSessionsDesc,
  type SessionDoc,
} from '../convex/trackerModel.ts';
import type { Doc } from '../convex/_generated/dataModel.js';

test('AuthScreen renders primary CTA and branding', () => {
  const html = renderToStaticMarkup(
    <AuthScreen error={null} isLoading={false} onSignIn={() => undefined} />,
  );
  assert.match(html, /worktimer/);
  assert.match(html, /Zaloguj przez Google/);
  assert.match(html, /To samo konto dziala na wielu urzadzeniach/);
});

test('SettingsDialog renders danger zone actions', () => {
  const html = renderToStaticMarkup(
    <SettingsDialog
      accountDeleteBusy={false}
      dataDeleteBusy={false}
      open
      storageMode="cloud"
      user={{ id: 'user_1', email: 'paul@example.com' }}
      onClose={() => undefined}
      onDeleteAccount={() => undefined}
      onDeleteAllData={() => undefined}
    />,
  );
  assert.match(html, /Settings i prywatność/);
  assert.match(html, /Usuń dane z chmury/);
  assert.match(html, /Usuń konto/);
  assert.match(html, /USUN DANE albo USUN KONTO/);
});

test('tracker helpers produce stable defaults and formatting', () => {
  const draft = createSessionDraft();
  assert.equal(draft.category, 'kodowanie');
  assert.equal(draft.projectName, null);
  assert.equal(draft.startTime, '09:00');
  assert.equal(formatDurationHms(3661), '01:01:01');
});

test('active session elapsed excludes paused time', () => {
  assert.equal(
    getActiveElapsedSeconds(
      {
        pausedAt: null,
        pausedSeconds: 0,
        startTime: 10_000,
      },
      16_000,
    ),
    6,
  );
  assert.equal(
    getActiveElapsedSeconds(
      {
        pausedAt: 20_000,
        pausedSeconds: 5,
        startTime: 10_000,
      },
      40_000,
    ),
    5,
  );
});

test('auto-pause helper copy explains manual and paused behavior', () => {
  assert.match(describeAutoPauseSetting(false, 7), /w pelni recznie/i);
  assert.match(describeAutoPauseSetting(true, 7), /Po 7 min/i);
  assert.match(describeAutoPauseSetting(true, 7), /Pauza zamraza czas/i);
  assert.match(describeAutoPauseReason(), /Codexie, Canva albo OBS/i);
});

test('desktop helper helpers build ingest url, command and status copy', () => {
  const ingestUrl = buildDesktopHelperIngestUrl('https://bold-lyrebird-441.convex.cloud/');
  assert.equal(ingestUrl, 'https://bold-lyrebird-441.convex.site/api/desktop/activity');
  assert.match(
    buildDesktopHelperCommand({
      helperKey: 'abc123',
      ingestUrl,
    }),
    /desktop-helper\.mjs/,
  );
  assert.match(
    describeDesktopHelperStatus({
      configured: true,
      connected: true,
      lastAppName: 'Codex',
      lastDomain: null,
      lastSeenAt: Date.now(),
      lastWindowTitle: 'trackertimer',
      platform: 'macos',
    }),
    /Polaczony/i,
  );
  assert.match(
    describeDesktopHelperLastSeen({
      configured: true,
      connected: false,
      lastAppName: 'Codex',
      lastDomain: null,
      lastSeenAt: 10_000,
      lastWindowTitle: 'trackertimer',
      platform: 'macos',
    }, 40_000),
    /30s temu/i,
  );
});

test('desktop helper activity helpers format context and relative time', () => {
  assert.equal(
    describeDesktopHelperActivityContext({
      id: 'activity_1',
      appName: 'Google Chrome',
      capturedAt: 10_000,
      domain: 'chatgpt.com',
      platform: 'macos',
      windowTitle: 'ChatGPT',
    }),
    'Google Chrome • chatgpt.com',
  );
  assert.equal(
    describeDesktopHelperActivityTime(
      {
        capturedAt: 10_000,
      },
      40_000,
    ),
    '30s temu',
  );
});

test('stop focus summary masks private contexts and counts focus loss', () => {
  const activity = (id: string, appName: string, capturedAt: number, domain: string | null, platform: 'macos' | 'windows') => ({ id, appName, capturedAt, domain, platform, windowTitle: appName });
  const summary = buildStopFocusSummary({
    activeSession: {
      _id: 'active_1',
      category: 'kodowanie',
      description: 'Pisanie',
      pausedAt: null,
      pausedSeconds: 0,
      projectName: 'poprostukoduj',
      startTime: 100_000,
    },
    activities: [
      activity('activity_1', 'Codex', 100_000, null, 'macos'),
      activity('activity_2', 'Signal', 220_000, null, 'macos'),
      activity('activity_3', 'Codex', 340_000, null, 'macos'),
      activity('activity_4', 'Google Chrome', 430_000, 'allegro.pl', 'windows'),
    ],
    now: 610_000,
    preferences: { ...defaultPreferences, privateDomainsText: '' },
    status: {
      configured: true,
      connected: true,
      lastAppName: 'Codex',
      lastDomain: null,
      lastSeenAt: 520_000,
      lastWindowTitle: 'Codex',
      platform: 'windows',
    },
  });

  assert(summary);
  assert.equal(summary.blocks[1]?.label, 'Prywatna aplikacja');
  assert.equal(summary.focusLossCount, 2);
});

test('desktop helper windows v2 extracts browser domains from url or title fallback', () => {
  assert.equal(normalizeDomain('https://www.chatgpt.com/c/123'), 'chatgpt.com');
  assert.equal(normalizeDomain('canva.com/design/abc'), 'canva.com');
  assert.equal(
    inferKnownWebDomainFromWindowTitle('ChatGPT - Google Chrome'),
    'chatgpt.com',
  );
  assert.equal(
    inferKnownWebDomainFromWindowTitle('Canva Visual Suite - Microsoft Edge'),
    'canva.com',
  );
});

test('session drafts and CSV export preserve session content', () => {
  const record: SessionRecord = {
    _id: 'session_1',
    category: 'kodowanie',
    date: '2026-07-02',
    description: 'Refactor tracker',
    duration: 5400,
    projectName: 'Po prostu Koduj',
    startTime: '09:00',
    stopTime: '10:30',
    whatIsDone: 'Moved shell out of index.html',
  };
  const draft = createSessionDraftFromRecord(record);
  assert.equal(draft.description, 'Refactor tracker');
  assert.equal(draft.projectName, 'Po prostu Koduj');
  const csv = buildSessionsCsv([record]);
  assert.match(csv, /Refactor tracker/);
  assert.match(csv, /Po prostu Koduj/);
  assert.match(csv, /Moved shell out of index\.html/);
});

test('history helpers sort real session chronology and preserve grouped totals', () => {
  const sessions: SessionDoc[] = [
    {
      category: 'administracja',
      date: '2026-07-01',
      description: 'Inbox zero',
      duration: 1800,
      projectName: null,
      startTime: '11:00',
      stopTime: '11:30',
      whatIsDone: 'Cleared inbox',
    },
    {
      category: 'kodowanie',
      date: '2026-07-02',
      description: 'Dashboard slice',
      duration: 5400,
      projectName: 'Po prostu Koduj',
      startTime: '09:00',
      stopTime: '10:30',
      whatIsDone: 'Built dashboard',
    },
    {
      category: 'kodowanie',
      date: '2026-07-02',
      description: 'Fix history order',
      duration: 2700,
      projectName: 'Po prostu Koduj',
      startTime: '07:30',
      stopTime: '08:15',
      whatIsDone: 'Sorted session groups',
    },
  ];

  const sorted = sortSessionsDesc(sessions);
  assert.equal(sorted[0]?.description, 'Dashboard slice');
  assert.equal(sorted[1]?.description, 'Fix history order');

  const history = buildSessionHistory(
    sorted.map(
      (session, index) =>
        ({
          ...session,
          projectName: session.projectName ?? null,
          _creationTime: 0,
          _id: `session_${index}` as never,
          userId: `user_1` as never,
        }) as Doc<'sessions'>,
    ),
  );
  assert.equal(history.groups[0]?.date, '2026-07-02');
  assert.equal(history.groups[0]?.sessionCount, 2);
  assert.equal(history.groups[0]?.totalSeconds, 8100);

  const dashboard = buildDashboard(sorted);
  assert.equal(dashboard.topCategory?.category, 'kodowanie');
  assert.equal(dashboard.averageSessionSeconds, 3300);
});

test('history filters keep day grouping while narrowing matching sessions', () => {
  const groups: SessionDayGroup[] = [
    {
      date: '2026-07-02',
      sessionCount: 2,
      totalSeconds: 8100,
      sessions: [
        {
          _id: 's1',
          category: 'kodowanie',
          date: '2026-07-02',
          description: 'Dashboard',
          duration: 5400,
          projectName: 'Po prostu Koduj',
          startTime: '09:00',
          stopTime: '10:30',
          whatIsDone: 'Built cards',
        },
        {
          _id: 's2',
          category: 'administracja',
          date: '2026-07-02',
          description: 'Inbox',
          duration: 2700,
          projectName: null,
          startTime: '11:00',
          stopTime: '11:45',
          whatIsDone: 'Cleared mail',
        },
      ],
    },
  ];

  const filtered = filterHistoryGroups(groups, {
    category: 'kodowanie',
    query: 'cards',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.sessionCount, 1);
  assert.equal(filtered[0]?.totalSeconds, 5400);
  assert.equal(filtered[0]?.sessions[0]?.description, 'Dashboard');
});

test('computeSummary and dashboard ignore private helper blocks', () => {
  const sessions: SessionDoc[] = [
    {
      category: 'kodowanie',
      date: '2026-07-02',
      description: 'Praca',
      duration: 3600,
      projectName: 'Worktimer',
      startTime: '09:00',
      stopTime: '10:00',
      whatIsDone: 'Feature done',
    },
    {
      category: 'prywatne',
      date: '2026-07-02',
      description: 'Prywatna aplikacja',
      duration: 1200,
      projectName: null,
      startTime: '10:00',
      stopTime: '10:20',
      whatIsDone: 'Automatyczny blok helpera: Prywatna aplikacja',
    },
  ];

  const summary = computeSummary(sessions, 4);
  assert.equal(summary.totalSeconds, 3600);
  assert.equal(summary.sessionCount, 1);

  const dashboard = buildDashboard(sessions);
  assert.equal(dashboard.averageSessionSeconds, 3600);
  assert.equal(dashboard.topCategory?.category, 'kodowanie');
});

test('active session snapshot helpers restore same user session after reload', () => {
  const snapshot = createActiveSessionSnapshot(
    'user_1',
    {
      category: 'kodowanie',
      description: 'Tracker persistence',
      startTime: 10_000,
    },
    11_000,
  );
  assert.equal(getActiveSessionSnapshotKey('user_1'), 'worktimer.active-session:user_1');
  assert.deepEqual(
    parseActiveSessionSnapshot(JSON.stringify(snapshot)),
    snapshot,
  );

  const resolved = resolveActiveSessionState({
    userId: 'user_1',
    serverActiveSession: null,
    snapshot,
    latestSession: null,
    now: 12_000,
  });
  assert.equal(resolved.source, 'local');
  assert.equal(resolved.activeSession?.startTime, 10_000);
  assert.equal(resolved.activeSession?.projectName, null);
  assert.match(resolved.notice ?? '', /Przywrócono aktywną sesję/);
});

test('server state wins over local snapshot and completed session invalidates stale snapshot', () => {
  const snapshotStartTime = new Date(2026, 6, 2, 9, 0, 0, 0).getTime();
  const snapshot = createActiveSessionSnapshot(
    'user_1',
    {
      category: 'kodowanie',
      description: 'Old local',
      startTime: snapshotStartTime,
    },
    snapshotStartTime + 1_000,
  );

  const serverResolved = resolveActiveSessionState({
    userId: 'user_1',
    serverActiveSession: {
      _id: 'active_1',
      category: 'research',
      description: 'Server truth',
      pausedAt: null,
      pausedSeconds: 0,
      projectName: null,
      startTime: 20_000,
    },
    snapshot,
    latestSession: null,
    now: snapshotStartTime + 2_000,
  });
  assert.equal(serverResolved.source, 'server');
  assert.equal(serverResolved.activeSession?.description, 'Server truth');

  const invalidated = resolveActiveSessionState({
    userId: 'user_1',
    serverActiveSession: null,
    snapshot,
    latestSession: {
      date: '2026-07-02',
      startTime: '09:00',
    },
    now: snapshotStartTime + 2_000,
  });
  assert.equal(invalidated.source, null);
  assert.equal(invalidated.activeSession, null);
});

test('pomodoro helpers restore finished cycle and format countdown', () => {
  const idle = createPomodoroState({ presetId: 'classic' });
  const running = startPomodoroCycle(idle, 'focus', 25, 1_000);
  const resolved = resolvePomodoroState(running, 1_000 + 25 * 60_000 + 500);
  assert.equal(resolved.status, 'completed');
  assert.equal(resolved.completedAt, running.endsAt);
  assert.equal(formatPomodoroClock(125_000), '02:05');
});
