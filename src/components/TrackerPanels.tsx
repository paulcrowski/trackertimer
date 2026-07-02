import { Goal, Layers3, Pause, Play, Timer, TimerReset, TrendingUp } from 'lucide-react';
import {
  categories,
  formatDurationHms,
  formatDurationPretty,
  formatGoalHours,
  type ActiveSession,
  type TrackerPreferences,
  type TrackerSummary,
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

type StatsGridProps = {
  preferences: TrackerPreferences;
  summary: TrackerSummary;
  onChangeDailyGoal: (delta: number) => void;
};

export function StatsGrid({
  preferences,
  summary,
  onChangeDailyGoal,
}: StatsGridProps) {
  return (
    <section className="stats-section">
      <div className="stats-header">
        <div>
          <span className="eyebrow">Puls pracy</span>
          <h2>Najważniejsze liczby bez przeładowanego dashboardu</h2>
        </div>
        <div className="goal-control">
          <span>Cel dzienny</span>
          <div className="goal-actions">
            <button onClick={() => onChangeDailyGoal(-0.5)} type="button">
              -
            </button>
            <strong>{formatGoalHours(preferences.dailyGoalHours)}</strong>
            <button onClick={() => onChangeDailyGoal(0.5)} type="button">
              +
            </button>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <article className="metric-block">
          <div className="metric-label">
            <Timer size={15} />
            Dzisiaj
          </div>
          <div className="metric-value">{formatDurationPretty(summary.todaySeconds)}</div>
          <p>
            Postęp: {summary.goalProgressPercent}% • Do celu:{' '}
            {formatDurationPretty(summary.goalRemainingSeconds)}
          </p>
          <div className="progress-track compact" aria-hidden="true">
            <div
              className="progress-fill"
              style={{ width: `${summary.goalProgressPercent}%` }}
            ></div>
          </div>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <TrendingUp size={15} />
            Ten tydzień
          </div>
          <div className="metric-value">{formatDurationPretty(summary.weekSeconds)}</div>
          <p>Liczone od poniedziałku lokalnego czasu użytkownika.</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Goal size={15} />
            Ten miesiąc
          </div>
          <div className="metric-value">{formatDurationPretty(summary.monthSeconds)}</div>
          <p>Pomaga złapać tempo publikacji i pracy głębokiej.</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Layers3 size={15} />
            Łącznie
          </div>
          <div className="metric-value">{formatDurationPretty(summary.totalSeconds)}</div>
          <p>{summary.sessionCount} zapisanych sesji w bazie.</p>
        </article>
      </div>
    </section>
  );
}
