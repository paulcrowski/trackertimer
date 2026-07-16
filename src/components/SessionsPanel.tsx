import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  deriveHistoryCategories,
  buildSessionActivityBlocks,
  filterHistoryGroups,
  formatDurationHms,
  formatDurationPretty,
  formatCategoryLabel,
  formatPolishDate,
  formatWeekdayShort,
  type SessionDayGroup,
  type SessionCleanupGroup,
  type DesktopHelperActivity,
  type DesktopTrackingRule,
  type SessionRecord,
} from '../lib/tracker.ts';
import { useLanguage } from '../lib/i18n.tsx';

type SessionsPanelProps = {
  cleanupGroups?: SessionCleanupGroup[];
  history?: {
    groups: SessionDayGroup[];
    isTruncated: boolean;
    totalAvailableSessions: number | null;
    totalShownDays: number;
    totalShownSessions: number;
  };
  onAddManual: () => void;
  onDelete: (session: SessionRecord) => void;
  onEdit: (session: SessionRecord) => void;
  onExportCsv: () => void;
  onMerge: (group: SessionCleanupGroup) => void | Promise<void>;
  activities?: DesktopHelperActivity[];
  privateDomainsText?: string;
  trackingRules?: DesktopTrackingRule[];
};

export function SessionsPanel({
  cleanupGroups = [],
  history = {
    groups: [],
    isTruncated: false,
    totalAvailableSessions: 0,
    totalShownDays: 0,
    totalShownSessions: 0,
  },
  onAddManual,
  onDelete,
  onEdit,
  onExportCsv,
  onMerge,
  activities = [],
  privateDomainsText = '',
  trackingRules = [],
}: SessionsPanelProps) {
  const { t, language } = useLanguage();
  const safeHistoryGroups = (Array.isArray(history.groups) ? history.groups : []).map((group) => ({
    ...group,
    sessions: Array.isArray(group.sessions) ? group.sessions : [],
  }));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expandedActivitySessions, setExpandedActivitySessions] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedFullActivitySessions, setExpandedFullActivitySessions] = useState<Set<string>>(
    () => new Set(),
  );
  const sessionActivityPreviewLimit = 8;
  const categories = useMemo(() => deriveHistoryCategories(safeHistoryGroups), [safeHistoryGroups]);
  const filteredGroups = useMemo(
    () => filterHistoryGroups(safeHistoryGroups, { category, query }),
    [category, safeHistoryGroups, query],
  );
  const filteredSessionCount = filteredGroups.reduce((sum, group) => sum + group.sessionCount, 0);
  const exportLabel = history.isTruncated ? t('Full CSV export') : t('Export CSV');

  return (
    <section className="sessions-panel">
      <div className="sessions-header">
        <div>
          <span className="eyebrow">{t('Session history')}</span>
          <h2>
            {history.isTruncated
              ? t('Last 100 sessions')
              : t('Workdays with editing, filtering, and export')}
          </h2>
          {history.isTruncated ? (
            <p className="muted-copy">
              This view shows only the last 100 sessions. Full CSV export downloads your entire
              account history
              {history.totalAvailableSessions === null
                ? '.'
                : `: ${history.totalAvailableSessions} sessions available.`}
            </p>
          ) : null}
        </div>
        <div className="header-actions">
          <button className="chip-btn" onClick={onAddManual} type="button">
            <Plus size={15} />
            {t('Add manually')}
          </button>
          <button className="chip-btn" onClick={onExportCsv} type="button">
            <Download size={15} />
            {exportLabel}
          </button>
        </div>
      </div>
      <div className="history-toolbar">
        <div className="history-filter">
          <span>{t('Search')}</span>
          <input
            placeholder={t('description, note, category...')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <label className="history-filter">
          <span>{t('Category')}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">{t('All')}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {formatCategoryLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <div className="history-summary">
          <strong>{filteredSessionCount}</strong>
          <span>
            {t('of {sessions} loaded sessions across {days} days')
              .replace('{sessions}', String(history.totalShownSessions))
              .replace('{days}', String(history.totalShownDays))}
          </span>
        </div>
      </div>
      {cleanupGroups.length ? (
        <div className="cleanup-panel" role="status">
          <div>
            <strong>{t('Short helper fragments found')}</strong>
            <p>
              {t(
                'These entries share the same context and are close together. Review before merging; nothing is changed automatically.',
              )}
            </p>
          </div>
          <div className="cleanup-list">
            {cleanupGroups.slice(0, 5).map((group) => (
              <div className="cleanup-row" key={group.id}>
                <div>
                  <strong>{group.description}</strong>
                  <span>
                    {group.sessionCount} {t('sessions')} ·{' '}
                    {formatDurationPretty(group.totalSeconds)} · {group.date}
                  </span>
                </div>
                <button
                  className="chip-btn"
                  onClick={() => {
                    const result = onMerge(group);
                    if (result instanceof Promise) void result.catch(() => undefined);
                  }}
                  type="button"
                >
                  {t('Merge fragments')}
                </button>
              </div>
            ))}
          </div>
          {cleanupGroups.length > 5 ? (
            <p className="muted-copy">{t('Showing the first 5 cleanup suggestions.')}</p>
          ) : null}
        </div>
      ) : null}
      {filteredGroups.length ? (
        <div className="history-day-list">
          {filteredGroups.map((group) => (
            <article className="history-day-card" key={group.date}>
              <div className="history-day-header">
                <div>
                  <span className="eyebrow">
                    {formatWeekdayShort(group.date, language === 'pl' ? 'pl-PL' : 'en-US')}
                  </span>
                  <h3>{formatPolishDate(group.date, language === 'pl' ? 'pl-PL' : 'en-US')}</h3>
                </div>
                <div className="history-day-totals">
                  <strong>{formatDurationPretty(group.totalSeconds)}</strong>
                  <span>
                    {group.sessionCount} {t('sessions')}
                  </span>
                </div>
              </div>
              <div className="history-session-list">
                {group.sessions.map((session) => (
                  <div className="history-session-card" key={session._id}>
                    <div className="history-session-main">
                      <div className="history-session-row">
                        <span className="category-pill">
                          {formatCategoryLabel(session.category)}
                        </span>
                        <strong>{session.description}</strong>
                      </div>
                      <p>{session.whatIsDone}</p>
                    </div>
                    <div className="history-session-meta">
                      <strong>{formatDurationHms(session.duration)}</strong>
                      <span>
                        {session.startTime} - {session.stopTime}
                      </span>
                    </div>
                    {(() => {
                      const activityBlocks = buildSessionActivityBlocks({
                        activities,
                        privateDomainsText,
                        rules: trackingRules,
                        session,
                      });
                      return activityBlocks.length ? (
                        <div className="session-activity-row">
                          <button
                            className="text-btn"
                            onClick={() =>
                              setExpandedActivitySessions((current) => {
                                const next = new Set(current);
                                if (next.has(session._id)) next.delete(session._id);
                                else next.add(session._id);
                                return next;
                              })
                            }
                            type="button"
                          >
                            {expandedActivitySessions.has(session._id)
                              ? 'Hide activity'
                              : `Show activity (${activityBlocks.length})`}
                          </button>
                          {expandedActivitySessions.has(session._id) ? (
                            <>
                              <div className="session-activity-timeline">
                                {(expandedFullActivitySessions.has(session._id)
                                  ? activityBlocks
                                  : activityBlocks.slice(0, sessionActivityPreviewLimit)
                                ).map((block) => (
                                  <div
                                    className="session-activity-block"
                                    key={`${session._id}-${block.startTime}`}
                                  >
                                    <strong>{block.label}</strong>
                                    <span>
                                      {formatDurationPretty(block.durationSeconds)} •{' '}
                                      {formatCategoryLabel(block.category ?? session.category)} •{' '}
                                      {block.kind}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {activityBlocks.length > sessionActivityPreviewLimit ? (
                                <button
                                  className="text-btn"
                                  onClick={() =>
                                    setExpandedFullActivitySessions((current) => {
                                      const next = new Set(current);
                                      if (next.has(session._id)) next.delete(session._id);
                                      else next.add(session._id);
                                      return next;
                                    })
                                  }
                                  type="button"
                                >
                                  {expandedFullActivitySessions.has(session._id)
                                    ? 'Show less'
                                    : `Show full timeline (${activityBlocks.length})`}
                                </button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      ) : null;
                    })()}
                    <div className="row-actions">
                      <button
                        aria-label={`${t('Edit session')} ${session.description}`}
                        className="icon-btn"
                        onClick={() => onEdit(session)}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`${t('Delete session')} ${session.description}`}
                        className="icon-btn danger"
                        onClick={() => onDelete(session)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : safeHistoryGroups.length ? (
        <div className="empty-copy big">
          {t('No sessions match these filters. Clear the search or choose a different category.')}
        </div>
      ) : (
        <div className="empty-copy big">
          {t('No saved sessions for this account yet. Start by entering a focused block of work.')}
        </div>
      )}
    </section>
  );
}
