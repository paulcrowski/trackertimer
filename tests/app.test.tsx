import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthScreen } from '../src/App.tsx';
import {
  buildSessionsCsv,
  createSessionDraft,
  createSessionDraftFromRecord,
  formatDurationHms,
  type SessionRecord,
} from '../src/lib/tracker.ts';

test('AuthScreen renders primary CTA and branding', () => {
  const html = renderToStaticMarkup(
    <AuthScreen error={null} isLoading={false} onSignIn={() => undefined} />,
  );
  assert.match(html, /PoprostuKoduj/);
  assert.match(html, /Zaloguj przez Google/);
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
