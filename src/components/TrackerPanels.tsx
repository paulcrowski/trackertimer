import { Pause, Play, TimerReset } from 'lucide-react';
import {
  categories,
  formatDurationHms,
  formatDurationPretty,
  type ActiveSession,
} from '../lib/tracker.ts';

type TimerPanelProps = {
  activeSession: ActiveSession | null;
  category: string;
  description: string;
  elapsedSeconds: number;
  idleNotice: string | null;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDismissIdleNotice: () => void;
  onStart: () => void;
  onOpenStopDialog: () => void;
};

export function TimerPanel({
  activeSession,
  category,
  description,
  elapsedSeconds,
  idleNotice,
  onCategoryChange,
  onDescriptionChange,
  onDismissIdleNotice,
  onStart,
  onOpenStopDialog,
}: TimerPanelProps) {
  const activeDescription = activeSession?.description ?? description;
  const cyclePercent = activeSession
    ? Math.min(100, ((elapsedSeconds % 3600) / 3600) * 100)
    : 0;

  return (
    <section className="hero-panel">
      <div className="panel-copy">
        <span className="eyebrow">Aktywna sesja</span>
        <div className="timer-line">
          <span className="timer-value">
            {activeSession ? formatDurationHms(elapsedSeconds) : '00:00:00'}
          </span>
          <span className="timer-subtitle">
            {activeSession
              ? `Minęło ${formatDurationPretty(elapsedSeconds)}`
              : 'Uruchom licznik, kiedy wchodzisz w konkretną pracę.'}
          </span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: activeSession ? `${cyclePercent}%` : '0%' }}
          ></div>
        </div>
        {idleNotice ? (
          <div className="idle-banner">
            <div>
              <strong>Auto-stop po bezczynności.</strong>
              <p>{idleNotice}</p>
            </div>
            <button className="text-btn" onClick={onDismissIdleNotice} type="button">
              Zamknij
            </button>
          </div>
        ) : null}
      </div>
      <div className="hero-controls">
        <div className="field-grid">
          <label className="field">
            <span>Kategoria pracy</span>
            <select
              disabled={Boolean(activeSession)}
              value={activeSession?.category ?? category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>{activeSession ? 'Aktywna sesja' : 'Co robisz?'}</span>
            <input
              disabled={Boolean(activeSession)}
              placeholder="Wpisz krótki opis zadania..."
              value={activeDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>
        </div>
        <div className="cta-row">
          {activeSession ? (
            <button className="btn btn-danger" onClick={onOpenStopDialog} type="button">
              <Pause size={18} />
              STOP
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onStart} type="button">
              <Play size={18} />
              START
            </button>
          )}
          <div className="ghost-metric">
            <TimerReset size={16} />
            Jeden klik uruchamia licznik, modale domykają resztę flow.
          </div>
        </div>
      </div>
    </section>
  );
}
