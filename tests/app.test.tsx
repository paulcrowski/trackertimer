import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthScreen } from '../src/App.tsx';
import {
  buildSessionsCsv,
  createSessionDraft,
  createSessionDraftFromRecord,
  filterHistoryGroups,
  formatDurationHms,
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
  sortSessionsDesc,
  type SessionDoc,
} from '../convex/trackerModel.ts';

test('AuthScreen renders primary CTA and branding', () => {
  const html = renderToStaticMarkup(
    <AuthScreen error={null} isLoading={false} onSignIn={() => undefined} />,
  );
  assert.match(html, /worktimer/);
  assert.match(html, /Zaloguj przez Google/);
  assert.match(html, /To samo konto dziala na wielu urzadzeniach/);
});

test('tracker helpers produce stable defaults and formatting', () => {
  const draft = createSessionDraft();
  assert.equal(draft.category, 'kodowanie');
  assert.equal(draft.startTime, '09:00');
  assert.equal(formatDurationHms(3661), '01:01:01');
});

test('session drafts and CSV export preserve session content', () => {
  const record: SessionRecord = {
    _id: 'session_1',
    category: 'kodowanie',
    date: '2026-07-02',
    description: 'Refactor tracker',
    duration: 5400,
    startTime: '09:00',
    stopTime: '10:30',
    whatIsDone: 'Moved shell out of index.html',
  };
  const draft = createSessionDraftFromRecord(record);
  assert.equal(draft.description, 'Refactor tracker');
  const csv = buildSessionsCsv([record]);
  assert.match(csv, /Refactor tracker/);
  assert.match(csv, /Moved shell out of index\.html/);
});

test('history helpers sort real session chronology and preserve grouped totals', () => {
  const sessions: SessionDoc[] = [
    {
      category: 'administracja',
      date: '2026-07-01',
      description: 'Inbox zero',
      duration: 1800,
      startTime: '11:00',
      stopTime: '11:30',
      whatIsDone: 'Cleared inbox',
    },
    {
      category: 'kodowanie',
      date: '2026-07-02',
      description: 'Dashboard slice',
      duration: 5400,
      startTime: '09:00',
      stopTime: '10:30',
      whatIsDone: 'Built dashboard',
    },
    {
      category: 'kodowanie',
      date: '2026-07-02',
      description: 'Fix history order',
      duration: 2700,
      startTime: '07:30',
      stopTime: '08:15',
      whatIsDone: 'Sorted session groups',
    },
  ];

  const sorted = sortSessionsDesc(sessions);
  assert.equal(sorted[0]?.description, 'Dashboard slice');
  assert.equal(sorted[1]?.description, 'Fix history order');

  const history = buildSessionHistory(
    sorted.map((session, index) => ({
      ...session,
      _creationTime: 0,
      _id: `session_${index}` as never,
      userId: `user_1` as never,
    })),
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

test('pomodoro helpers restore finished cycle and format countdown', () => {
  const idle = createPomodoroState({ presetId: 'classic' });
  const running = startPomodoroCycle(idle, 'focus', 25, 1_000);
  const resolved = resolvePomodoroState(running, 1_000 + 25 * 60_000 + 500);
  assert.equal(resolved.status, 'completed');
  assert.equal(resolved.completedAt, running.endsAt);
  assert.equal(formatPomodoroClock(125_000), '02:05');
});
