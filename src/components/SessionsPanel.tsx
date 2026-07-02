import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  formatDurationHms,
  formatPolishDate,
  type SessionRecord,
} from '../lib/tracker.ts';

type SessionsPanelProps = {
  sessions: SessionRecord[];
  onAddManual: () => void;
  onDelete: (session: SessionRecord) => void;
  onEdit: (session: SessionRecord) => void;
  onExportCsv: () => void;
};

export function SessionsPanel({
  sessions,
  onAddManual,
  onDelete,
  onEdit,
  onExportCsv,
}: SessionsPanelProps) {
  return (
    <section className="sessions-panel">
      <div className="sessions-header">
        <div>
          <span className="eyebrow">Historia sesji</span>
          <h2>Ostatnie wpisy z możliwością korekty</h2>
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
      {sessions.length ? (
        <div className="sessions-table-wrap">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Kategoria</th>
                <th>Czas</th>
                <th>Opis</th>
                <th>Notatka</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session._id}>
                  <td>
                    <div className="table-title">{formatPolishDate(session.date)}</div>
                    <div className="table-subtle">
                      {session.startTime} - {session.stopTime}
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">{session.category}</span>
                  </td>
                  <td>{formatDurationHms(session.duration)}</td>
                  <td>{session.description}</td>
                  <td>{session.whatIsDone}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
