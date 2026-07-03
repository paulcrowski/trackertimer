import { type ChangeEvent, type ReactNode } from 'react';
import { Download, LogOut, MoonStar, Smartphone, SunMedium } from 'lucide-react';
import {
  categories,
  formatDurationHms,
  formatDurationPretty,
  type SessionDraft,
  type StopFocusSummary,
  type SessionRecord,
  type TrackerBootstrap,
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
  canInstall: boolean;
  focusMode: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  user: TrackerBootstrap['user'];
  onSignOut: () => void;
  onToggleFocusMode: () => void;
};

export function AppHeader({
  active,
  canInstall,
  focusMode,
  isInstalled,
  onInstall,
  user,
  onSignOut,
  onToggleFocusMode,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-dot"></div>
        <div>
          <div className="eyebrow">worktimer</div>
          <h1>Time tracker</h1>
        </div>
      </div>
      <div className="header-controls">
        {canInstall || isInstalled ? (
          <button
            className={`chip-btn ${isInstalled ? 'is-active' : ''}`}
            disabled={isInstalled}
            onClick={onInstall}
            type="button"
          >
            {isInstalled ? <Smartphone size={15} /> : <Download size={15} />}
            {isInstalled ? 'Zainstalowana PWA' : 'Zainstaluj appke'}
          </button>
        ) : null}
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
        <div className="user-pill">{user?.name ?? user?.email ?? 'Konto Google'}</div>
        <button className="chip-btn" onClick={onSignOut} type="button">
          <LogOut size={15} />
          Zmień sesję
        </button>
      </div>
    </header>
  );
}

type StopDialogProps = {
  activeDescription: string;
  elapsedSeconds: number;
  focusSummary: StopFocusSummary | null;
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
  focusSummary,
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
      {focusSummary ? (
        <div className="dialog-summary">
          <p>
            <strong>Helper:</strong> {formatDurationPretty(focusSummary.trackedSeconds)}. Praca: {formatDurationPretty(focusSummary.workSeconds)}. Prywatne: {formatDurationPretty(focusSummary.privateSeconds)}. Rozpraszacze: {formatDurationPretty(focusSummary.distractionSeconds)}.
          </p>
          <p>
            Utraty koncentracji: {focusSummary.focusLossCount}. Timeline:{' '}
            {focusSummary.blocks
              .slice(0, 4)
              .map((block) => `${block.label} ${formatDurationPretty(block.durationSeconds)}`)
              .join(' • ')}
          </p>
        </div>
      ) : null}
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
  onChange: (field: keyof SessionDraft, value: string | null) => void;
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
        <span>Projekt</span>
        <input value={draft.projectName ?? ''} onChange={update('projectName')} />
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
  onChange: (field: keyof SessionDraft, value: string | null) => void;
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
  onChange: (field: keyof SessionDraft, value: string | null) => void;
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
