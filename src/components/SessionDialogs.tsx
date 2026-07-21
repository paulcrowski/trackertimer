import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import { Download, LogOut, MoonStar, Settings2, Smartphone, SunMedium } from 'lucide-react';
import {
  categories,
  formatCategoryLabel,
  formatDurationHms,
  formatDurationPrecise,
  formatDurationPretty,
  type ActivityKind,
  type ReviewedStopBlockKind,
  type ReviewedStopFocusSummary,
  type SessionDraft,
  type StopFocusSummary,
  type StopReviewEntryDraft,
  type SessionRecord,
  type TrackerBootstrap,
  type TrackerPreferences,
} from '../lib/tracker.ts';
import { LanguagePicker, useLanguage } from '../lib/i18n.tsx';

type BaseDialogProps = {
  children: ReactNode;
  className?: string;
  open: boolean;
  title: string;
  onClose: () => void;
};

function DialogShell({ children, className, open, title, onClose }: BaseDialogProps) {
  const { t } = useLanguage();
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className={`dialog-panel ${className ?? ''}`.trim()}
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
        <div className="user-pill">
          {user?.name === 'Private local'
            ? t('Private local')
            : (user?.name ?? user?.email ?? t('Google account'))}
        </div>
        <LanguagePicker />
        <button className="chip-btn" onClick={onSignOut} type="button">
          <LogOut size={15} />
          {signOutLabel === 'Return to mode picker'
            ? t('Return to the mode picker')
            : t(signOutLabel)}
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
    patch: Partial<
      Pick<StopReviewEntryDraft, 'category' | 'description' | 'projectName' | 'whatIsDone'>
    >,
  ) => void;
  onSetReviewedBlockKind: (blockId: string, kind: ReviewedStopBlockKind) => void;
  onSetReviewedEntryKind: (entryId: string, kind: ReviewedStopBlockKind) => void;
  onSaveTrackingRule: (rule: {
    category: string | null;
    kind: ActivityKind | null;
    matchAppName: string | null;
    matchDomain: string | null;
    matchWindowTitle: string | null;
    projectName: string;
  }) => Promise<unknown>;
  onUseReviewedSummaryNote: () => void;
  onSoundChange: (checked: boolean) => void;
};

const reviewedKindOptions: Array<{
  label: string;
  value: ReviewedStopBlockKind;
}> = [
  { label: 'Work', value: 'work' },
  { label: 'Distraction', value: 'distraction' },
  { label: 'Private', value: 'private' },
];

const stopReviewGroups: Array<{
  label: string;
  value: ReviewedStopBlockKind;
}> = [
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
  onSetReviewedEntryKind,
  onSaveTrackingRule,
  onUseReviewedSummaryNote,
  onSoundChange,
}: StopDialogProps) {
  const { t } = useLanguage();
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [savedRuleIds, setSavedRuleIds] = useState<Set<string>>(() => new Set());
  const workEntries = reviewedEntries.filter((entry) => entry.kind === 'work');
  const privateEntries = reviewedEntries.filter((entry) => entry.kind === 'private');
  const distractionEntries = reviewedEntries.filter((entry) => entry.kind === 'distraction');
  const groupedBlocks = stopReviewGroups.map((group) => ({
    ...group,
    blocks:
      focusSummary?.blocks.filter(
        (block) => (reviewedBlockKinds[block.id] ?? block.kind) === group.value,
      ) ?? [],
    seconds:
      group.value === 'work'
        ? (reviewedFocusSummary?.workSeconds ?? 0)
        : group.value === 'distraction'
          ? (reviewedFocusSummary?.distractionSeconds ?? 0)
          : (reviewedFocusSummary?.privateSeconds ?? 0),
  }));

  return (
    <DialogShell
      className="stop-dialog-panel"
      open={open}
      title={t('End work session')}
      onClose={submitting ? () => undefined : onClose}
    >
      <div className="stop-dialog-stack">
        <section className="stop-at-a-glance" aria-label="Session summary">
          <div className="stop-duration-block">
            <span className="eyebrow">Session duration</span>
            <strong>{formatDurationHms(elapsedSeconds)}</strong>
            <span>
              {focusSummary
                ? `${formatDurationPrecise(focusSummary.trackedSeconds)} reviewed by helper`
                : 'Add a concrete outcome before saving.'}
            </span>
          </div>
          {focusSummary ? (
            <div className={`stop-helper-summary ${focusSummary.isPartial ? 'is-partial' : ''}`}>
              <div className="stop-helper-summary-heading">
                <span className="status-dot is-active" aria-hidden="true" />
                <div>
                  <span className="eyebrow">Time classification</span>
                  <strong>Review before saving</strong>
                </div>
              </div>
              <div className="stop-summary-grid">
                <span>
                  <b>Work</b>
                  {formatDurationPretty(
                    reviewedFocusSummary?.workSeconds ?? focusSummary.workSeconds,
                  )}
                </span>
                <span>
                  <b>Distractions</b>
                  {formatDurationPretty(
                    reviewedFocusSummary?.distractionSeconds ?? focusSummary.distractionSeconds,
                  )}
                </span>
                <span>
                  <b>Private</b>
                  {formatDurationPretty(
                    reviewedFocusSummary?.privateSeconds ?? focusSummary.privateSeconds,
                  )}
                </span>
              </div>
              {focusSummary.isPartial ? (
                <p>
                  {formatDurationPrecise(focusSummary.missingSeconds)} has no helper coverage and is
                  kept as an unconfirmed work suggestion.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {reviewedEntries.length > 1 ? (
          <section className={`stop-plan-section ${splitIntoEntries ? 'is-active' : ''}`}>
            <div className="stop-section-heading stop-plan-heading">
              <div>
                <span className="eyebrow">Suggested split</span>
                <h4>
                  {workEntries.length} {workEntries.length === 1 ? 'work result' : 'work results'}
                  {privateEntries.length ? ' + private time' : ''}
                  {distractionEntries.length ? ' + distractions' : ''}
                </h4>
                <p>
                  The helper grouped {focusSummary?.blocks.length ?? 0} raw blocks into{' '}
                  {reviewedEntries.length} useful entries. Edit the result, not every browser
                  switch.
                </p>
              </div>
              <button
                className={`btn stop-split-action ${splitIntoEntries ? 'is-active' : ''}`}
                onClick={() => onToggleSplitIntoEntries(!splitIntoEntries)}
                type="button"
              >
                {splitIntoEntries
                  ? `Using ${reviewedEntries.length} entries`
                  : `Use ${reviewedEntries.length} suggested entries`}
              </button>
            </div>
            <div className="stop-suggestion-list">
              {reviewedEntries.map((entry, index) => (
                <article key={entry.blockId} className={`stop-suggestion-row is-${entry.kind}`}>
                  <div className="stop-suggestion-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="stop-suggestion-main">
                    <div className="stop-suggestion-meta">
                      <span>{entry.kind === 'work' ? 'Work' : entry.kind}</span>
                      <strong>{formatDurationPrecise(entry.durationSeconds)}</strong>
                    </div>
                    {entry.matchWindowTitle || entry.matchDomain || entry.matchAppName ? (
                      <span className="stop-suggestion-source">
                        Suggested from{' '}
                        {entry.matchWindowTitle
                          ? 'window title'
                          : entry.matchDomain
                            ? 'domain'
                            : 'app name'}
                      </span>
                    ) : null}
                    <label className="field stop-suggestion-result">
                      <span>{entry.kind === 'work' ? 'Result' : 'Label'}</span>
                      <input
                        value={entry.whatIsDone}
                        onChange={(event) =>
                          onUpdateReviewedEntry(entry.blockId, {
                            whatIsDone: event.target.value,
                          })
                        }
                      />
                    </label>
                    <details className="stop-suggestion-fields">
                      <summary>Edit project and category</summary>
                      <div className="dialog-form-grid">
                        <label className="field">
                          <span>Category</span>
                          <select
                            value={entry.category}
                            onChange={(event) =>
                              onUpdateReviewedEntry(entry.blockId, {
                                category: event.target.value,
                              })
                            }
                          >
                            {categories.map((item) => (
                              <option key={item} value={item}>
                                {t(formatCategoryLabel(item))}
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
                          <span>Context label</span>
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
                    </details>
                    <div className="stop-suggestion-actions">
                      <div
                        className="stop-review-toggle-group"
                        role="group"
                        aria-label={`Classification for ${entry.description}`}
                      >
                        {reviewedKindOptions.map((option) => (
                          <button
                            key={option.value}
                            className={`chip-btn ${entry.kind === option.value ? 'is-active' : ''}`}
                            onClick={() => onSetReviewedEntryKind(entry.blockId, option.value)}
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {entry.sourceBlockIds.length &&
                      (entry.matchAppName || entry.matchDomain || entry.matchWindowTitle) ? (
                        <button
                          className="text-btn"
                          disabled={
                            savingRuleId === entry.blockId || savedRuleIds.has(entry.blockId)
                          }
                          onClick={() => {
                            setSavingRuleId(entry.blockId);
                            void onSaveTrackingRule({
                              category: entry.category || null,
                              kind: entry.kind,
                              matchAppName: entry.matchAppName,
                              matchDomain: entry.matchDomain,
                              matchWindowTitle: entry.matchWindowTitle,
                              projectName:
                                entry.projectName?.trim() ||
                                (entry.kind === 'private'
                                  ? 'Private time'
                                  : entry.kind === 'distraction'
                                    ? 'Distractions'
                                    : entry.whatIsDone.trim() || entry.description),
                            })
                              .then((saved) => {
                                if (saved) {
                                  setSavedRuleIds((current) => new Set(current).add(entry.blockId));
                                }
                                setSavingRuleId(null);
                              })
                              .catch(() => {
                                setSavingRuleId(null);
                              });
                          }}
                          type="button"
                        >
                          {savingRuleId === entry.blockId
                            ? 'Saving…'
                            : savedRuleIds.has(entry.blockId)
                              ? 'Remembered'
                              : 'Remember this match'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="stop-outcome-section">
          <div className="stop-section-heading">
            <div>
              <span className="eyebrow">{splitIntoEntries ? 'Optional' : 'Result'}</span>
              <h4>{splitIntoEntries ? 'Session note' : 'What did you get done?'}</h4>
              <p>
                {splitIntoEntries
                  ? 'Each suggested entry has its own result above. Add a shared note only if useful.'
                  : 'This result will appear as one entry in your work history.'}
              </p>
            </div>
            {reviewedFocusSummary ? (
              <button className="chip-btn" onClick={onUseReviewedSummaryNote} type="button">
                Insert note draft
              </button>
            ) : null}
          </div>
          <label className="field">
            <span className="sr-only">{t('What did you get done?')}</span>
            <textarea
              rows={splitIntoEntries ? 2 : 3}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={activeDescription}
            />
          </label>
        </section>

        {focusSummary ? (
          <section className="stop-details-section">
            <p className="stop-details-copy">
              {splitIntoEntries
                ? `${reviewedEntries.length} entries will be saved with ${formatDurationPrecise(
                    reviewedFocusSummary?.workSeconds ?? 0,
                  )} of work.`
                : 'One entry will be saved. The suggestions above remain a preview until enabled.'}{' '}
              {focusSummary.isPartial
                ? `${formatDurationPrecise(focusSummary.missingSeconds)} is unconfirmed.`
                : 'Helper coverage is complete.'}
            </p>
            <details className="stop-review-disclosure">
              <summary>
                <span>
                  <strong>Correct helper classifications</strong>
                  <small>{focusSummary.blocks.length} raw blocks · change only mistakes</small>
                </span>
                <span className="disclosure-action">Open details</span>
              </summary>
              <div className="stop-review">
                <div className="stop-review-summary">
                  {groupedBlocks.map((group) => (
                    <span key={group.value} className={`stop-review-total is-${group.value}`}>
                      <b>{group.label}</b>
                      {formatDurationPretty(group.seconds)}
                    </span>
                  ))}
                </div>
                <div className="stop-review-groups">
                  {groupedBlocks.map((group) => (
                    <section key={group.value} className={`stop-review-group is-${group.value}`}>
                      <div className="stop-review-group-heading">
                        <div>
                          <span className="eyebrow">{group.label}</span>
                          <strong>{formatDurationPrecise(group.seconds)}</strong>
                        </div>
                        <span>
                          {group.blocks.length} {group.blocks.length === 1 ? 'block' : 'blocks'}
                        </span>
                      </div>
                      {group.blocks.length ? (
                        <div className="stop-review-list">
                          {group.blocks.map((block) => (
                            <div key={block.id} className="stop-review-row">
                              <div className="stop-review-row-main">
                                <div className="stop-review-row-copy">
                                  <strong>{block.label}</strong>
                                  <div className="stop-review-meta">
                                    {formatReviewBlockDuration(block.durationSeconds)} · helper
                                    suggests:{' '}
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
                                <div
                                  className="stop-review-toggle-group"
                                  role="group"
                                  aria-label={`Typ bloku ${block.label}`}
                                >
                                  {reviewedKindOptions.map((option) => {
                                    const active =
                                      (reviewedBlockKinds[block.id] ?? block.kind) === option.value;
                                    return (
                                      <button
                                        key={option.value}
                                        className={`chip-btn ${active ? 'is-active' : ''}`}
                                        onClick={() =>
                                          onSetReviewedBlockKind(block.id, option.value)
                                        }
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
                      ) : (
                        <p className="stop-review-empty">No blocks in this group.</p>
                      )}
                    </section>
                  ))}
                </div>
                {reviewedFocusSummary ? (
                  <p className="stop-quick-result">
                    <strong>Quick result:</strong> work{' '}
                    {formatDurationPrecise(reviewedFocusSummary.workSeconds)} · outside work{' '}
                    {formatDurationPrecise(reviewedFocusSummary.nonWorkSeconds)} · focus losses{' '}
                    {reviewedFocusSummary.focusLossCount}.
                  </p>
                ) : null}
              </div>
            </details>
          </section>
        ) : null}

        <label className="checkbox-row stop-sound-option">
          <input
            checked={soundEnabled}
            onChange={(event) => onSoundChange(event.target.checked)}
            type="checkbox"
          />
          {t('Play a short sound after saving the session')}
        </label>
        <div className="dialog-actions stop-dialog-actions">
          {submitting ? (
            <span className="stop-saving-status" role="status" aria-live="polite">
              <span className="button-spinner" aria-hidden="true" />
              {t('Saving…')}
            </span>
          ) : null}
          <button className="chip-btn" disabled={submitting} onClick={onClose} type="button">
            {t('Cancel')}
          </button>
          <button
            className="btn btn-primary stop-save-button"
            aria-busy={submitting}
            disabled={submitting}
            onClick={onConfirm}
            type="button"
          >
            {submitting ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                {t('Saving…')}
              </>
            ) : splitIntoEntries ? (
              `Save ${reviewedEntries.length} entries`
            ) : (
              t('Save session')
            )}
          </button>
        </div>
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
              {t(formatCategoryLabel(item))}
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

export function DeleteDialog({ open, session, submitting, onClose, onConfirm }: DeleteDialogProps) {
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
  preferences: TrackerPreferences;
  storageMode: 'cloud' | 'local';
  user: TrackerBootstrap['user'];
  onClose: () => void;
  onDeleteAccount: () => void;
  onDeleteAllData: () => void;
  onSavePreferences: (patch: Partial<TrackerPreferences>) => Promise<unknown>;
};

export function SettingsDialog({
  accountDeleteBusy,
  dataDeleteBusy,
  open,
  preferences,
  storageMode,
  user,
  onClose,
  onDeleteAccount,
  onDeleteAllData,
  onSavePreferences,
}: SettingsDialogProps) {
  const { t } = useLanguage();
  const [confirmation, setConfirmation] = useState('');
  const [autoSplitMode, setAutoSplitMode] = useState(preferences.autoSplitMode);
  const canDeleteData = confirmation.trim().toUpperCase() === 'DELETE DATA';
  const canDeleteAccount = confirmation.trim().toUpperCase() === 'DELETE ACCOUNT';

  useEffect(() => {
    setAutoSplitMode(preferences.autoSplitMode);
  }, [preferences.autoSplitMode]);

  return (
    <DialogShell open={open} title={t('Settings and privacy')} onClose={onClose}>
      <p className="dialog-summary">
        {storageMode === 'cloud'
          ? 'Worktimer stores timer data in Convex for '
          : 'Worktimer runs in Private local for '}
        <strong>{user?.email ?? user?.name ?? 'Google user'}</strong>.
      </p>
      <label className="field">
        <span>{t('Session split when saving')}</span>
        <select
          value={autoSplitMode}
          onChange={(event) => {
            const next = event.target.value as TrackerPreferences['autoSplitMode'];
            setAutoSplitMode(next);
            void onSavePreferences({ autoSplitMode: next });
          }}
        >
          <option value="private-distraction">
            {t('Only private time and distractions (recommended)')}
          </option>
          <option value="all-contexts">{t('Every helper context')}</option>
          <option value="never">{t('Never split automatically')}</option>
        </select>
      </label>
      <p className="dialog-summary">
        {t(
          'This prepares separate entries in the stop dialog; nothing is saved until you confirm.',
        )}
      </p>
      <label className="field">
        <span>{t('Helper privacy level')}</span>
        <select
          value={preferences.desktopPrivacyLevel}
          onChange={(event) => {
            const next = event.target.value as TrackerPreferences['desktopPrivacyLevel'];
            void onSavePreferences({ desktopPrivacyLevel: next });
          }}
        >
          <option value="low">{t('Low — store app, domain, and window title')}</option>
          <option value="standard">{t('Standard — mask sensitive text in window titles')}</option>
          <option value="high">{t('High — store app only')}</option>
        </select>
      </label>
      <p className="dialog-summary">{t('Private domains always hide their domain and title.')}</p>
      <p className="dialog-summary">
        {t(
          'At High privacy, browser domains are hidden, so YouTube, Instagram and similar sites cannot be identified as distractions.',
        )}
      </p>
      <p className="dialog-summary">
        {t(
          'Signal is treated as private time. YouTube, Instagram, Tinder, Reddit, Wykop and X are treated as distractions and count as focus losses. You can still correct every block before saving.',
        )}
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
