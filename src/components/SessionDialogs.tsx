import { type ChangeEvent, type ReactNode, useState } from 'react';
import { Download, LogOut, MoonStar, Settings2, Smartphone, SunMedium } from 'lucide-react';
import {
  buildReviewedStopNote,
  categories,
  formatDurationHms,
  formatDurationPrecise,
  formatDurationPretty,
  type ReviewedStopBlockKind,
  type ReviewedStopFocusSummary,
  type SessionDraft,
  type StopFocusSummary,
  type StopReviewEntryDraft,
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
        <div className="dialog-body">{children}</div>
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
  onOpenSettings: () => void;
  signOutLabel: string;
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
  onOpenSettings,
  signOutLabel,
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
        <button className="chip-btn" onClick={onOpenSettings} type="button">
          <Settings2 size={15} />
          Settings
        </button>
        <div className="status-pill">
          <span className={`status-dot ${active ? 'is-active' : 'is-paused'}`}></span>
          {active ? 'Pracuję' : 'Pauza'}
        </div>
        <div className="user-pill">{user?.name ?? user?.email ?? 'Konto Google'}</div>
        <button className="chip-btn" onClick={onSignOut} type="button">
          <LogOut size={15} />
          {signOutLabel}
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
  reviewedEntries: StopReviewEntryDraft[];
  reviewedFocusSummary: ReviewedStopFocusSummary | null;
  reviewedBlockKinds: Record<string, ReviewedStopBlockKind>;
  soundEnabled: boolean;
  splitIntoEntries: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onNoteChange: (value: string) => void;
  onToggleSplitIntoEntries: (checked: boolean) => void;
  onUpdateReviewedEntry: (
    blockId: string,
    patch: Partial<Pick<StopReviewEntryDraft, 'category' | 'description' | 'projectName'>>,
  ) => void;
  onSetReviewedBlockKind: (blockId: string, kind: ReviewedStopBlockKind) => void;
  onUseReviewedSummaryNote: () => void;
  onSoundChange: (checked: boolean) => void;
};

const reviewedKindOptions: Array<{ label: string; value: ReviewedStopBlockKind }> = [
  { label: 'Praca', value: 'work' },
  { label: 'Rozpraszacz', value: 'distraction' },
  { label: 'Prywatne', value: 'private' },
];

function formatReviewBlockDuration(seconds: number) {
  return formatDurationPrecise(seconds);
}

export function StopDialog({
  activeDescription,
  elapsedSeconds,
  focusSummary,
  note,
  open,
  reviewedEntries,
  reviewedFocusSummary,
  reviewedBlockKinds,
  soundEnabled,
  splitIntoEntries,
  submitting,
  onClose,
  onConfirm,
  onNoteChange,
  onToggleSplitIntoEntries,
  onUpdateReviewedEntry,
  onSetReviewedBlockKind,
  onUseReviewedSummaryNote,
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
            <strong>Podgląd helpera:</strong> helper potwierdził {formatDurationPrecise(focusSummary.trackedSeconds)}.
            Praca: {formatDurationPrecise(focusSummary.workSeconds)}. Prywatne:{' '}
            {formatDurationPrecise(focusSummary.privateSeconds)}. Rozpraszacze:{' '}
            {formatDurationPrecise(focusSummary.distractionSeconds)}.
          </p>
          {focusSummary.isPartial ? (
            <p>
              Timer pokazuje teraz {formatDurationPrecise(elapsedSeconds)}. Helper nie potwierdził{' '}
              {formatDurationPrecise(focusSummary.missingSeconds)} tej sesji, więc traktuj to jako szkic,
              a nie pełny zapis całego timera.
            </p>
          ) : null}
          <p>
            To jest tylko kontekst do notatki poniżej. Do historii tej sesji zapisze się jeden końcowy wpis, nie cały timeline helpera.
          </p>
          <div className="stop-review">
            <p>
              <strong>1. Oznacz bloki po ludzku:</strong> wybierz, czy dany blok był pracą, rozpraszaczem czy prywatną sprawą.
            </p>
            <div className="stop-review-summary">
              <span className="chip-btn is-active">Praca {formatDurationPretty(reviewedFocusSummary?.workSeconds ?? 0)}</span>
              <span className="chip-btn">Rozpraszacze {formatDurationPretty(reviewedFocusSummary?.distractionSeconds ?? 0)}</span>
              <span className="chip-btn">Prywatne {formatDurationPretty(reviewedFocusSummary?.privateSeconds ?? 0)}</span>
            </div>
            <div className="stop-review-list">
              {focusSummary.blocks.map((block) => (
                <div key={block.id} className="stop-review-row">
                  <div className="stop-review-row-main">
                    <div>
                      <strong>{block.label}</strong>
                      <div className="stop-review-meta">
                        {formatReviewBlockDuration(block.durationSeconds)} • helper sugeruje:{' '}
                        {block.kind === 'work'
                          ? 'pracę'
                          : block.kind === 'private'
                            ? 'prywatne'
                            : 'rozpraszacz'}
                      </div>
                      {block.contextTitles.length ? (
                        <div className="stop-review-context">
                          {block.contextTitles.map((title) => (
                            <span key={title}>{title}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="stop-review-toggle-group" role="group" aria-label={`Typ bloku ${block.label}`}>
                      {reviewedKindOptions.map((option) => {
                        const active = (reviewedBlockKinds[block.id] ?? block.kind) === option.value;
                        return (
                          <button
                            key={option.value}
                            className={`chip-btn ${active ? 'is-active' : ''}`}
                            onClick={() => onSetReviewedBlockKind(block.id, option.value)}
                            type="button"
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {reviewedFocusSummary ? (
              <p>
                <strong>2. Krótki wynik:</strong> praca {formatDurationPrecise(reviewedFocusSummary.workSeconds)}.
                Poza pracą {formatDurationPrecise(reviewedFocusSummary.nonWorkSeconds)}.
                Utraty koncentracji {reviewedFocusSummary.focusLossCount}.
              </p>
            ) : null}
            {reviewedEntries.length ? (
              <div className="stop-split-section">
                <label className="checkbox-row">
                  <input
                    checked={splitIntoEntries}
                    onChange={(event) => onToggleSplitIntoEntries(event.target.checked)}
                    type="checkbox"
                  />
                  Zapisz pracę jako kilka wpisów ({reviewedEntries.length})
                </label>
                {splitIntoEntries ? (
                  <div className="stop-split-list">
                    {reviewedEntries.map((entry, index) => (
                      <div key={entry.blockId} className="stop-split-row">
                        <div className="stop-split-row-header">
                          <strong>Wpis {index + 1}</strong>
                          <span className="chip-btn is-active">{formatDurationPrecise(entry.durationSeconds)}</span>
                        </div>
                        <div className="dialog-form-grid">
                          <label className="field">
                            <span>Kategoria</span>
                            <select
                              value={entry.category}
                              onChange={(event) =>
                                onUpdateReviewedEntry(entry.blockId, { category: event.target.value })
                              }
                            >
                              {categories.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Projekt</span>
                            <input
                              value={entry.projectName ?? ''}
                              onChange={(event) =>
                                onUpdateReviewedEntry(entry.blockId, {
                                  projectName: event.target.value.trim() || null,
                                })
                              }
                            />
                          </label>
                          <label className="field field-wide">
                            <span>Opis wpisu</span>
                            <input
                              value={entry.description}
                              onChange={(event) =>
                                onUpdateReviewedEntry(entry.blockId, {
                                  description: event.target.value,
                                })
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>
                    Zostanie zapisany jeden końcowy wpis dla całej sesji. Włącz tę opcję tylko wtedy,
                    gdy chcesz rozbić pracę na kilka osobnych rekordów.
                  </p>
                )}
              </div>
            ) : null}
            <button className="chip-btn" onClick={onUseReviewedSummaryNote} type="button">
              Wstaw prosty szkic notatki
            </button>
            {reviewedFocusSummary ? (
              <pre className="stop-review-note-preview">{buildReviewedStopNote(reviewedFocusSummary)}</pre>
            ) : null}
          </div>
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
  recentProjects?: string[];
  onChange: (field: keyof SessionDraft, value: string | null) => void;
};

function SessionForm({ draft, recentProjects = [], onChange }: SessionFormProps) {
  const update =
    (field: keyof SessionDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(field, event.target.value);
  const projectSuggestionsId = 'session-project-suggestions';

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
      <p className="dialog-summary">
        Jeśli praca przeszła przez północ, zapis utworzy dwa osobne wpisy dla kolejnych dni.
      </p>
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
        <input
          list={projectSuggestionsId}
          value={draft.projectName ?? ''}
          onChange={update('projectName')}
        />
      </label>
      {recentProjects.length ? (
        <datalist id={projectSuggestionsId}>
          {recentProjects.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      ) : null}
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
  recentProjects?: string[];
  submitting: boolean;
  onChange: (field: keyof SessionDraft, value: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ManualDialog({
  draft,
  open,
  recentProjects,
  submitting,
  onChange,
  onClose,
  onConfirm,
}: ManualDialogProps) {
  return (
    <DialogShell open={open} title="Dodaj sesję ręcznie" onClose={onClose}>
      <SessionForm draft={draft} recentProjects={recentProjects} onChange={onChange} />
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
  recentProjects?: string[];
  session: SessionRecord | null;
  submitting: boolean;
  onChange: (field: keyof SessionDraft, value: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function EditDialog({
  draft,
  open,
  recentProjects,
  session,
  submitting,
  onChange,
  onClose,
  onConfirm,
}: EditDialogProps) {
  return (
    <DialogShell open={open} title="Edytuj sesję" onClose={onClose}>
      {session ? <p className="dialog-summary">Modyfikujesz wpis: {session.description}</p> : null}
      <SessionForm draft={draft} recentProjects={recentProjects} onChange={onChange} />
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

type SettingsDialogProps = {
  dataDeleteBusy: boolean;
  accountDeleteBusy: boolean;
  open: boolean;
  storageMode: 'cloud' | 'local';
  user: TrackerBootstrap['user'];
  onClose: () => void;
  onDeleteAccount: () => void;
  onDeleteAllData: () => void;
};

export function SettingsDialog({
  accountDeleteBusy,
  dataDeleteBusy,
  open,
  storageMode,
  user,
  onClose,
  onDeleteAccount,
  onDeleteAllData,
}: SettingsDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const canDeleteData = confirmation.trim().toUpperCase() === 'USUN DANE';
  const canDeleteAccount = confirmation.trim().toUpperCase() === 'USUN KONTO';

  return (
    <DialogShell open={open} title="Settings i prywatność" onClose={onClose}>
      <p className="dialog-summary">
        {storageMode === 'cloud'
          ? 'Worktimer zapisuje dane trackera w Convexie dla konta '
          : 'Worktimer działa w Private local dla profilu '}
        <strong>{user?.email ?? user?.name ?? 'Google user'}</strong>.
      </p>
      <p className="dialog-summary">
        {storageMode === 'cloud'
          ? 'Wpisz `USUN DANE`, żeby skasować historię, aktywną sesję, reguły helpera i preferencje. Wpisz `USUN KONTO`, żeby dodatkowo usunąć konto i sesje auth.'
          : 'Wpisz `USUN DANE`, żeby skasować lokalną historię, aktywną sesję i preferencje zapisane na tym urządzeniu.'}
      </p>
      <label className="field">
        <span>Potwierdzenie</span>
        <input
          placeholder={storageMode === 'cloud' ? 'USUN DANE albo USUN KONTO' : 'USUN DANE'}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>
      <div className="dialog-actions">
        <button
          className="btn btn-danger"
          disabled={!canDeleteData || dataDeleteBusy || accountDeleteBusy}
          onClick={() => {
            void Promise.resolve(onDeleteAllData()).then(() => setConfirmation(''));
          }}
          type="button"
        >
          {dataDeleteBusy
            ? 'Usuwanie danych…'
            : storageMode === 'cloud'
              ? 'Usuń dane z chmury'
              : 'Usuń dane lokalne'}
        </button>
        {storageMode === 'cloud' ? (
          <button
            className="btn btn-danger"
            disabled={!canDeleteAccount || dataDeleteBusy || accountDeleteBusy}
            onClick={() => {
              void onDeleteAccount();
            }}
            type="button"
          >
            {accountDeleteBusy ? 'Usuwanie konta…' : 'Usuń konto'}
          </button>
        ) : null}
        <button className="chip-btn" onClick={onClose} type="button">
          Zamknij
        </button>
      </div>
    </DialogShell>
  );
}
