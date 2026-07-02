import { type ChangeEvent, type ReactNode } from 'react';
import { Goal, Layers3, LogOut, MoonStar, Pause, Play, SunMedium, Timer, TimerReset, TrendingUp } from 'lucide-react';
import {
  categories,
  formatDurationHms,
  formatDurationPretty,
  formatGoalHours,
  type ActiveSession,
  type SessionDraft,
  type SessionRecord,
  type TrackerBootstrap,
  type TrackerPreferences,
  type TrackerSummary,
} from '../lib/tracker.ts';

type BaseDialogProps = {
  children: ReactNode;
  open: boolean;
  title: string;
  onClose: () => void;
};

function DialogShell({ children, open, title, onClose }: BaseDialogProps) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="dialog-header">
          <h3>{title}</h3>
          <button className="text-btn" onClick={onClose} type="button">
            Zamknij
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type AppHeaderProps = {
  active: boolean;
  focusMode: boolean;
  user: TrackerBootstrap['user'];
  onSignOut: () => void;
  onToggleFocusMode: () => void;
};

export function AppHeader({
  active,
  focusMode,
  user,
  onSignOut,
  onToggleFocusMode,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-dot"></div>
        <div>
          <div className="eyebrow">PoprostuKoduj</div>
          <h1>Time Tracker</h1>
        </div>
      </div>
      <div className="header-controls">
        <button
          className={`chip-btn ${focusMode ? 'is-active' : ''}`}
          onClick={onToggleFocusMode}
          type="button"
        >
          {focusMode ? <SunMedium size={15} /> : <MoonStar size={15} />}
          {focusMode ? 'Wyłącz focus mode' : 'Włącz focus mode'}
        </button>
        <div className="status-pill">
          <span className={`status-dot ${active ? 'is-active' : 'is-paused'}`}></span>
          {active ? 'Pracuję' : 'Pauza'}
        </div>
        <div className="user-pill">{user?.name ?? user?.email ?? 'Użytkownik'}</div>
        <button className="chip-btn" onClick={onSignOut} type="button">
          <LogOut size={15} />
          Wyloguj
        </button>
      </div>
    </header>
  );
}

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

type StopDialogProps = {
  activeDescription: string;
  elapsedSeconds: number;
  note: string;
  open: boolean;
  soundEnabled: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onNoteChange: (value: string) => void;
  onSoundChange: (checked: boolean) => void;
};

export function StopDialog({
  activeDescription,
  elapsedSeconds,
  note,
  open,
  soundEnabled,
  submitting,
  onClose,
  onConfirm,
  onNoteChange,
  onSoundChange,
}: StopDialogProps) {
  return (
    <DialogShell open={open} title="Zakończ sesję pracy" onClose={onClose}>
      <p className="dialog-summary">
        Sesja trwa {formatDurationHms(elapsedSeconds)}. Dopisz konkretny efekt,
        żeby historia pracy nie była pusta.
      </p>
      <label className="field">
        <span>Co zostało zrobione?</span>
        <textarea
          rows={4}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={activeDescription}
        />
      </label>
      <label className="checkbox-row">
        <input
          checked={soundEnabled}
          onChange={(event) => onSoundChange(event.target.checked)}
          type="checkbox"
        />
        Odtwórz krótki sygnał po zapisaniu sesji
      </label>
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          Anuluj
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? 'Zapisywanie…' : 'Zapisz sesję'}
        </button>
      </div>
    </DialogShell>
  );
}

type SessionFormProps = {
  draft: SessionDraft;
  onChange: (field: keyof SessionDraft, value: string) => void;
};

function SessionForm({ draft, onChange }: SessionFormProps) {
  const update =
    (field: keyof SessionDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(field, event.target.value);

  return (
    <div className="dialog-form-grid">
      <label className="field">
        <span>Data</span>
        <input type="date" value={draft.date} onChange={update('date')} />
      </label>
      <label className="field">
        <span>Start</span>
        <input type="time" value={draft.startTime} onChange={update('startTime')} />
      </label>
      <label className="field">
        <span>Koniec</span>
        <input type="time" value={draft.stopTime} onChange={update('stopTime')} />
      </label>
      <label className="field field-wide">
        <span>Kategoria</span>
        <select value={draft.category} onChange={update('category')}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="field field-wide">
        <span>Opis sesji</span>
        <input value={draft.description} onChange={update('description')} />
      </label>
      <label className="field field-wide">
        <span>Co zostało zrobione?</span>
        <textarea rows={4} value={draft.whatIsDone} onChange={update('whatIsDone')} />
      </label>
    </div>
  );
}

type ManualDialogProps = {
  draft: SessionDraft;
  open: boolean;
  submitting: boolean;
  onChange: (field: keyof SessionDraft, value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ManualDialog({
  draft,
  open,
  submitting,
  onChange,
  onClose,
  onConfirm,
}: ManualDialogProps) {
  return (
    <DialogShell open={open} title="Dodaj sesję ręcznie" onClose={onClose}>
      <SessionForm draft={draft} onChange={onChange} />
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          Anuluj
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? 'Dodawanie…' : 'Dodaj sesję'}
        </button>
      </div>
    </DialogShell>
  );
}

type EditDialogProps = {
  draft: SessionDraft;
  open: boolean;
  session: SessionRecord | null;
  submitting: boolean;
  onChange: (field: keyof SessionDraft, value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function EditDialog({
  draft,
  open,
  session,
  submitting,
  onChange,
  onClose,
  onConfirm,
}: EditDialogProps) {
  return (
    <DialogShell open={open} title="Edytuj sesję" onClose={onClose}>
      {session ? <p className="dialog-summary">Modyfikujesz wpis: {session.description}</p> : null}
      <SessionForm draft={draft} onChange={onChange} />
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          Anuluj
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? 'Zapisywanie…' : 'Zapisz zmiany'}
        </button>
      </div>
    </DialogShell>
  );
}

type DeleteDialogProps = {
  open: boolean;
  session: SessionRecord | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteDialog({
  open,
  session,
  submitting,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <DialogShell open={open} title="Usuń sesję" onClose={onClose}>
      <p className="dialog-summary">
        {session
          ? `Usunąć wpis "${session.description}" z dnia ${session.date}?`
          : 'Usunąć wybraną sesję?'}
      </p>
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          Anuluj
        </button>
        <button className="btn btn-danger" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? 'Usuwanie…' : 'Usuń sesję'}
        </button>
      </div>
    </DialogShell>
  );
}
