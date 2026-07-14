import { type ChangeEvent, type ReactNode, useState } from 'react';
import { Download, LogOut, MoonStar, Settings2, Smartphone, SunMedium } from 'lucide-react';
import {
  buildReviewedStopNote,
  categories,
  formatCategoryLabel,
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
import { LanguagePicker, useLanguage } from '../lib/i18n.tsx';

type BaseDialogProps = {
  children: ReactNode;
  open: boolean;
  title: string;
  onClose: () => void;
};

function DialogShell({ children, open, title, onClose }: BaseDialogProps) {
  const { t } = useLanguage();
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
            {t('Close')}
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
  const { t } = useLanguage();
  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-dot"></div>
        <div>
          <div className="eyebrow">worktimer</div>
          <h1>{t('Time tracker')}</h1>
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
            {isInstalled ? t('PWA installed') : t('Install app')}
          </button>
        ) : null}
        <button
          className={`chip-btn ${focusMode ? 'is-active' : ''}`}
          onClick={onToggleFocusMode}
          type="button"
        >
          {focusMode ? <SunMedium size={15} /> : <MoonStar size={15} />}
          {focusMode ? t('Turn off focus mode') : t('Turn on focus mode')}
        </button>
        <button className="chip-btn" onClick={onOpenSettings} type="button">
          <Settings2 size={15} />
          {t('Settings')}
        </button>
        <div className="status-pill">
          <span className={`status-dot ${active ? 'is-active' : 'is-paused'}`}></span>
          {active ? t('Working') : t('Paused')}
        </div>
        <div className="user-pill">{user?.name === 'Private local' ? t('Private local') : user?.name ?? user?.email ?? t('Google account')}</div>
        <LanguagePicker />
        <button className="chip-btn" onClick={onSignOut} type="button">
          <LogOut size={15} />
          {signOutLabel === 'Return to mode picker' ? t('Return to the mode picker') : signOutLabel}
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
  { label: 'Work', value: 'work' },
  { label: 'Distraction', value: 'distraction' },
  { label: 'Private', value: 'private' },
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
  const { t } = useLanguage();
  return (
    <DialogShell open={open} title={t('End work session')} onClose={onClose}>
      <p className="dialog-summary">
        This session has lasted {formatDurationHms(elapsedSeconds)}. Add a concrete outcome
        so your work history is not empty.
      </p>
      {focusSummary ? (
        <div className="dialog-summary">
          <p>
            <strong>Helper preview:</strong> the helper confirmed {formatDurationPrecise(focusSummary.trackedSeconds)}.
            Work: {formatDurationPrecise(focusSummary.workSeconds)}. Private:{' '}
            {formatDurationPrecise(focusSummary.privateSeconds)}. Distractions:{' '}
            {formatDurationPrecise(focusSummary.distractionSeconds)}.
          </p>
          {focusSummary.isPartial ? (
            <p>
              The timer currently shows {formatDurationPrecise(elapsedSeconds)}. The helper did not confirm{' '}
              {formatDurationPrecise(focusSummary.missingSeconds)} of this session, so treat this as a draft,
              not a complete record of the timer.
            </p>
          ) : null}
          <p>
            This is context for the note below. One final entry will be saved to this session's history, not the helper's entire timeline.
          </p>
          <div className="stop-review">
            <p>
              <strong>1. Label the blocks:</strong> choose whether each block was work, a distraction, or private time.
            </p>
            <div className="stop-review-summary">
              <span className="chip-btn is-active">Work {formatDurationPretty(reviewedFocusSummary?.workSeconds ?? 0)}</span>
              <span className="chip-btn">Distractions {formatDurationPretty(reviewedFocusSummary?.distractionSeconds ?? 0)}</span>
              <span className="chip-btn">Private {formatDurationPretty(reviewedFocusSummary?.privateSeconds ?? 0)}</span>
            </div>
            <div className="stop-review-list">
              {focusSummary.blocks.map((block) => (
                <div key={block.id} className="stop-review-row">
                  <div className="stop-review-row-main">
                    <div>
                      <strong>{block.label}</strong>
                      <div className="stop-review-meta">
                        {formatReviewBlockDuration(block.durationSeconds)} • helper suggests:{' '}
                        {block.kind === 'work'
                          ? 'work'
                          : block.kind === 'private'
                            ? 'private time'
                            : 'a distraction'}
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
                <strong>2. Quick result:</strong> work {formatDurationPrecise(reviewedFocusSummary.workSeconds)}.
                Outside work {formatDurationPrecise(reviewedFocusSummary.nonWorkSeconds)}.
                Focus losses {reviewedFocusSummary.focusLossCount}.
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
                  Save work as multiple entries ({reviewedEntries.length})
                </label>
                {splitIntoEntries ? (
                  <div className="stop-split-list">
                    {reviewedEntries.map((entry, index) => (
                      <div key={entry.blockId} className="stop-split-row">
                        <div className="stop-split-row-header">
                          <strong>Entry {index + 1}</strong>
                          <span className="chip-btn is-active">{formatDurationPrecise(entry.durationSeconds)}</span>
                        </div>
                        <div className="dialog-form-grid">
                          <label className="field">
                            <span>Category</span>
                            <select
                              value={entry.category}
                              onChange={(event) =>
                                onUpdateReviewedEntry(entry.blockId, { category: event.target.value })
                              }
                            >
                              {categories.map((item) => (
                                <option key={item} value={item}>
                                  {formatCategoryLabel(item)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Project</span>
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
                            <span>Entry description</span>
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
                    One final entry will be saved for the whole session. Enable this only when
                    you want to split the work into separate records.
                  </p>
                )}
              </div>
            ) : null}
            <button className="chip-btn" onClick={onUseReviewedSummaryNote} type="button">
              Insert a simple note draft
            </button>
            {reviewedFocusSummary ? (
              <pre className="stop-review-note-preview">{buildReviewedStopNote(reviewedFocusSummary)}</pre>
            ) : null}
          </div>
        </div>
      ) : null}
      <label className="field">
        <span>{t('What did you get done?')}</span>
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
        {t('Play a short sound after saving the session')}
      </label>
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          {t('Cancel')}
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? t('Saving…') : t('Save session')}
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
  const { t } = useLanguage();
  const update =
    (field: keyof SessionDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(field, event.target.value);
  const projectSuggestionsId = 'session-project-suggestions';

  return (
    <div className="dialog-form-grid">
      <label className="field">
        <span>{t('Date')}</span>
        <input type="date" value={draft.date} onChange={update('date')} />
      </label>
      <label className="field">
        <span>{t('Start')}</span>
        <input type="time" value={draft.startTime} onChange={update('startTime')} />
      </label>
      <label className="field">
        <span>{t('End')}</span>
        <input type="time" value={draft.stopTime} onChange={update('stopTime')} />
      </label>
      <p className="dialog-summary">
        {t('If work crosses midnight, saving will create two separate entries for the two days.')}
      </p>
      <label className="field field-wide">
        <span>{t('Category')}</span>
        <select value={draft.category} onChange={update('category')}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {formatCategoryLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <label className="field field-wide">
        <span>{t('Project')}</span>
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
        <span>{t('Session description')}</span>
        <input value={draft.description} onChange={update('description')} />
      </label>
      <label className="field field-wide">
        <span>{t('What did you get done?')}</span>
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
  const { t } = useLanguage();
  return (
    <DialogShell open={open} title={t('Add session manually')} onClose={onClose}>
      <SessionForm draft={draft} recentProjects={recentProjects} onChange={onChange} />
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          {t('Cancel')}
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? t('Adding…') : t('Add session')}
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
  const { t } = useLanguage();
  return (
    <DialogShell open={open} title={t('Edit session')} onClose={onClose}>
      {session ? <p className="dialog-summary">Editing entry: {session.description}</p> : null}
      <SessionForm draft={draft} recentProjects={recentProjects} onChange={onChange} />
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          {t('Cancel')}
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? t('Saving…') : t('Save changes')}
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
  const { t } = useLanguage();
  return (
    <DialogShell open={open} title={t('Delete session')} onClose={onClose}>
      <p className="dialog-summary">
        {session
          ? `Delete the entry "${session.description}" from ${session.date}?`
          : 'Delete the selected session?'}
      </p>
      <div className="dialog-actions">
        <button className="chip-btn" onClick={onClose} type="button">
          {t('Cancel')}
        </button>
        <button className="btn btn-danger" disabled={submitting} onClick={onConfirm} type="button">
          {submitting ? t('Deleting…') : t('Delete session')}
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
  const { t } = useLanguage();
  const [confirmation, setConfirmation] = useState('');
  const canDeleteData = confirmation.trim().toUpperCase() === 'DELETE DATA';
  const canDeleteAccount = confirmation.trim().toUpperCase() === 'DELETE ACCOUNT';

  return (
    <DialogShell open={open} title={t('Settings and privacy')} onClose={onClose}>
      <p className="dialog-summary">
        {storageMode === 'cloud'
          ? 'Worktimer stores timer data in Convex for '
          : 'Worktimer runs in Private local for '}
        <strong>{user?.email ?? user?.name ?? 'Google user'}</strong>.
      </p>
      <p className="dialog-summary">
        {storageMode === 'cloud'
          ? 'Type `DELETE DATA` to remove history, the active session, helper rules, and preferences. Type `DELETE ACCOUNT` to also remove your account and auth sessions.'
          : 'Type `DELETE DATA` to remove local history, the active session, and preferences saved on this device.'}
      </p>
      <label className="field">
        <span>{t('Confirmation')}</span>
        <input
          placeholder={storageMode === 'cloud' ? 'DELETE DATA or DELETE ACCOUNT' : 'DELETE DATA'}
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
            ? t('Deleting data…')
            : storageMode === 'cloud'
              ? t('Delete cloud data')
              : t('Delete local data')}
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
            {accountDeleteBusy ? t('Deleting account…') : t('Delete account')}
          </button>
        ) : null}
        <button className="chip-btn" onClick={onClose} type="button">
          {t('Close')}
        </button>
      </div>
    </DialogShell>
  );
}
