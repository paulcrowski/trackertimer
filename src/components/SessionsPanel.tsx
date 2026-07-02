import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  deriveHistoryCategories,
  filterHistoryGroups,
  formatDurationHms,
  formatDurationPretty,
  formatPolishDate,
  formatWeekdayShort,
  type SessionDayGroup,
  type SessionRecord,
} from '../lib/tracker.ts';

type SessionsPanelProps = {
  history: {
    groups: SessionDayGroup[];
    totalShownDays: number;
    totalShownSessions: number;
  };
  onAddManual: () => void;
  onDelete: (session: SessionRecord) => void;
  onEdit: (session: SessionRecord) => void;
  onExportCsv: () => void;
};

export function SessionsPanel({
  history,
  onAddManual,
  onDelete,
  onEdit,
  onExportCsv,
}: SessionsPanelProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = useMemo(
    () => deriveHistoryCategories(history.groups),
    [history.groups],
  );
  const filteredGroups = useMemo(
    () => filterHistoryGroups(history.groups, { category, query }),
    [category, history.groups, query],
  );
  const filteredSessionCount = filteredGroups.reduce(
    (sum, group) => sum + group.sessionCount,
    0,
  );

  return (
    <section className="sessions-panel">
      <div className="sessions-header">
        <div>
          <span className="eyebrow">Historia sesji</span>
          <h2>Dni pracy z możliwością korekty, filtrowania i eksportu</h2>
        </div>
        <div className="header-actions">
          <button className="chip-btn" onClick={onAddManual} type="button">
            <Plus size={15} />
            Dodaj ręcznie
          </button>
          <button className="chip-btn" onClick={onExportCsv} type="button">
            <Download size={15} />
            Eksport CSV
          </button>
        </div>
      </div>
      <div className="history-toolbar">
        <div className="history-filter">
          <span>Szukaj</span>
          <input
            placeholder="opis, notatka, kategoria..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <label className="history-filter">
          <span>Kategoria</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Wszystkie</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="history-summary">
          <strong>{filteredSessionCount}</strong>
          <span>
            z {history.totalShownSessions} sesji w {history.totalShownDays} dniach
          </span>
        </div>
      </div>
      {filteredGroups.length ? (
        <div className="history-day-list">
          {filteredGroups.map((group) => (
            <article className="history-day-card" key={group.date}>
              <div className="history-day-header">
                <div>
                  <span className="eyebrow">{formatWeekdayShort(group.date)}</span>
                  <h3>{formatPolishDate(group.date)}</h3>
                </div>
                <div className="history-day-totals">
                  <strong>{formatDurationPretty(group.totalSeconds)}</strong>
                  <span>{group.sessionCount} sesji</span>
                </div>
              </div>
              <div className="history-session-list">
                {group.sessions.map((session) => (
                  <div className="history-session-card" key={session._id}>
                    <div className="history-session-main">
                      <div className="history-session-row">
                        <span className="category-pill">{session.category}</span>
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
                    <div className="row-actions">
                      <button
                        aria-label={`Edytuj sesję ${session.description}`}
                        className="icon-btn"
                        onClick={() => onEdit(session)}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`Usuń sesję ${session.description}`}
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
      ) : history.groups.length ? (
        <div className="empty-copy big">
          Filtry nie zwróciły żadnych sesji. Wyczyść wyszukiwanie albo zmień
          kategorię.
        </div>
      ) : (
        <div className="empty-copy big">
          Brak zapisanych sesji dla tego konta. Zacznij od pierwszego wejścia w
          konkretny blok pracy.
        </div>
      )}
    </section>
  );
}
