import { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  Coffee,
  Goal,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Timer,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import {
  autoPauseMinuteOptions,
  categories,
  buildDesktopHelperIngestUrl,
  canQuickStartFromHelper,
  describeDesktopHelperActivityContext,
  describeDesktopHelperActivityTime,
  describeAutoPauseReason,
  describeAutoPauseSetting,
  describeDesktopHelperLastSeen,
  describeDesktopHelperStatus,
  formatDurationHms,
  formatDurationPretty,
  formatCategoryLabel,
  formatGoalHours,
  formatPolishDate,
  formatWeekdayShort,
  type ActiveSession,
  type DesktopHelperActivity,
  type DesktopHelperStatus,
  type DesktopProjectSuggestion,
  type DesktopTrackingRule,
  type TrackerProjectSummary,
  type TrackerDashboard,
  type TrackerPreferences,
  type TrackerSummary,
} from '../lib/tracker.ts';
import type {
  PomodoroPermission,
  PomodoroPreset,
  PomodoroState,
} from '../lib/pomodoro.ts';
import { useLanguage } from '../lib/i18n.tsx';

type TimerPanelProps = {
  activeSession: ActiveSession | null;
  autoPauseEnabled: boolean;
  autoPauseMinutes: number;
  category: string;
  description: string;
  desktopHelperStatus?: DesktopHelperStatus;
  elapsedSeconds: number;
  idleNotice: string | null;
  recentProjects: string[];
  workspaceMode: 'simple' | 'advanced';
  onAutoPauseMinutesChange: (value: number) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDismissIdleNotice: () => void;
  onProjectChange: (value: string) => void;
  onResume: () => void;
  onStart: () => void;
  onOpenStopDialog: () => void;
  onToggleAutoPause: () => void;
  projectName: string | null;
};

export function TimerPanel({
  activeSession,
  autoPauseEnabled,
  autoPauseMinutes,
  category,
  description,
  desktopHelperStatus,
  elapsedSeconds,
  idleNotice,
  recentProjects,
  workspaceMode,
  onAutoPauseMinutesChange,
  onCategoryChange,
  onDescriptionChange,
  onDismissIdleNotice,
  onProjectChange,
  onResume,
  onStart,
  onOpenStopDialog,
  onToggleAutoPause,
  projectName,
}: TimerPanelProps) {
  const { t } = useLanguage();
  const activeDescription = activeSession?.description ?? description;
  const isPaused = activeSession?.pausedAt !== null;
  const helperAutoPauseMode = workspaceMode === 'advanced';
  const cyclePercent = activeSession
    ? Math.min(100, ((elapsedSeconds % 3600) / 3600) * 100)
    : 0;
  const projectSuggestionsId = 'timer-project-suggestions';

  return (
    <section className="hero-panel">
      <div className="panel-copy">
        <span className="eyebrow">{t('Active session')}</span>
        <div className="timer-line">
          <span className="timer-value">
            {activeSession ? formatDurationHms(elapsedSeconds) : '00:00:00'}
          </span>
          <span className="timer-subtitle">
            {activeSession
              ? isPaused
                ? t('Session paused after {duration} of work.').replace('{duration}', formatDurationPretty(elapsedSeconds))
                : t('{duration} elapsed').replace('{duration}', formatDurationPretty(elapsedSeconds))
              : t('Start the timer when you begin a focused piece of work.')}
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
              <strong>{t('Auto-paused after inactivity.')}</strong>
              <p>{idleNotice}</p>
            </div>
            <button className="text-btn" onClick={onDismissIdleNotice} type="button">
              {t('Dismiss')}
            </button>
          </div>
        ) : null}
      </div>
      <div className="hero-controls">
        <div className="field-grid">
          <label className="field">
            <span>{t('Work category')}</span>
            <select
              disabled={Boolean(activeSession)}
              value={activeSession?.category ?? category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {formatCategoryLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('Project')}</span>
            <input
              list={projectSuggestionsId}
              disabled={Boolean(activeSession)}
              placeholder="Np. Po prostu Koduj"
              value={activeSession?.projectName ?? projectName ?? ''}
              onChange={(event) => onProjectChange(event.target.value)}
            />
          </label>
          <label className="field field-wide">
            <span>{activeSession ? t('Active session') : t('What are you working on?')}</span>
            <input
              disabled={Boolean(activeSession)}
              placeholder={t('Enter a short task description...')}
              value={activeDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>
        </div>
        {recentProjects.length ? (
          <datalist id={projectSuggestionsId}>
            {recentProjects.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        ) : null}
        {helperAutoPauseMode && desktopHelperStatus ? (
          <div
            className={`helper-live-status ${desktopHelperStatus.connected ? 'is-connected' : ''}`}
            role="status"
            aria-live="polite"
          >
            <div className="helper-live-status-heading">
              <span className="helper-status-dot" aria-hidden="true" />
              <div>
                <span className="eyebrow">{t('Auto status')}</span>
                <strong>
                  {desktopHelperStatus.connected
                    ? t('Auto is running')
                    : desktopHelperStatus.lastSeenAt
                      ? t('Auto is offline')
                      : t('Waiting for helper')}
                </strong>
              </div>
            </div>
            <p>{t('Scanning active app and window title outside this window.')}</p>
            <div className="helper-live-status-context">
              <span>{desktopHelperStatus.lastAppName ?? t('No app yet')}</span>
              {desktopHelperStatus.lastDomain ? <span>{desktopHelperStatus.lastDomain}</span> : null}
              <span>{desktopHelperStatus.lastWindowTitle ?? t('No window title yet')}</span>
            </div>
            <small>{describeDesktopHelperLastSeen(desktopHelperStatus)}</small>
          </div>
        ) : null}
        <div className="cta-row">
          {activeSession ? (
            <>
              {isPaused ? (
                <button className="btn btn-primary" onClick={onResume} type="button">
                  <Play size={18} />
                  {t('Resume')}
                </button>
              ) : null}
              <button className="btn btn-danger" onClick={onOpenStopDialog} type="button">
                <Pause size={18} />
                STOP
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onStart} type="button">
              <Play size={18} />
              START
            </button>
          )}
          <div className="ghost-metric">
            <TimerReset size={16} />
            {t('You stop the timer manually; Pomodoro only provides a signal.')}
          </div>
        </div>
        <button
          className={`chip-btn ${autoPauseEnabled ? 'is-active' : ''}`}
          onClick={onToggleAutoPause}
          type="button"
        >
          {helperAutoPauseMode
            ? autoPauseEnabled
              ? t('Helper auto-pause: on')
              : t('Helper auto-pause: off')
            : autoPauseEnabled
              ? t('Auto-pause: on')
              : t('Auto-pause: off')}
        </button>
        <label className="field">
          <span>{helperAutoPauseMode ? t('Helper silence') : t('Inactivity')}</span>
          <select
            value={autoPauseMinutes}
            onChange={(event) => onAutoPauseMinutesChange(Number(event.target.value))}
          >
            {autoPauseMinuteOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} {t('min')}
              </option>
            ))}
          </select>
        </label>
        <div className="ghost-metric">
          <TimerReset size={16} />
          {t(describeAutoPauseSetting(autoPauseEnabled, autoPauseMinutes, workspaceMode))}
        </div>
        {autoPauseEnabled || helperAutoPauseMode ? (
          <div className="ghost-metric">
            <Pause size={16} />
            {t(describeAutoPauseReason(workspaceMode))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type DesktopHelperPanelProps = {
  activities: DesktopHelperActivity[];
  deletingRuleId: string | null;
  helperKey: string | null;
  privacyBusy: boolean;
  preferences: TrackerPreferences;
  rules: DesktopTrackingRule[];
  status: DesktopHelperStatus;
  savingRule: boolean;
  suggestion: DesktopProjectSuggestion;
  submitting: boolean;
  onDeleteRule: (ruleId: string) => void;
  onGenerateKey: () => void;
  onPauseTracking: (minutes: number | null) => void;
  onQuickStart: () => void;
  onResumeTracking: () => void;
  onSaveRule: (rule: {
    matchAppName: string | null;
    matchDomain: string | null;
    projectName: string;
  }) => Promise<unknown>;
  onSavePrivateDomains: (privateDomainsText: string) => void;
  onToggleTracking: () => void;
  onExpandedChange?: (expanded: boolean) => void;
};

export function DesktopHelperPanel({
  activities,
  deletingRuleId,
  helperKey,
  onDeleteRule,
  onPauseTracking,
  onQuickStart,
  onResumeTracking,
  onSaveRule,
  onSavePrivateDomains,
  onToggleTracking,
  preferences,
  privacyBusy,
  rules,
  savingRule,
  status,
  suggestion,
  submitting,
  onGenerateKey,
  onExpandedChange,
}: DesktopHelperPanelProps) {
  const [projectName, setProjectName] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleAppName, setRuleAppName] = useState<string | null>(status.lastAppName);
  const [ruleDomain, setRuleDomain] = useState<string | null>(status.lastDomain);
  const [privateDomainsText, setPrivateDomainsText] = useState(preferences.privateDomainsText);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const saveDisabled =
    savingRule || !projectName.trim() || (!ruleAppName && !ruleDomain);
  const trackingPaused =
    preferences.desktopTrackingManualPause ||
    (preferences.desktopTrackingPausedUntil !== null &&
      preferences.desktopTrackingPausedUntil > Date.now());
  const quickStartEnabled = canQuickStartFromHelper({
    preferences,
    status,
  });
  const privateDomainsCount = privateDomainsText
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;
  const convexUrl = import.meta.env?.VITE_CONVEX_URL as string | undefined;
  const ingestUrl = convexUrl ? buildDesktopHelperIngestUrl(convexUrl) : null;
  const portableCommand = helperKey && ingestUrl
    ? `node worktimer-helper.mjs --url "${ingestUrl}" --key "${helperKey}"`
    : null;

  useEffect(() => {
    setPrivateDomainsText(preferences.privateDomainsText);
  }, [preferences.privateDomainsText]);

  useEffect(() => {
    if (editingRuleId) {
      return;
    }
    setRuleAppName(status.lastAppName);
    setRuleDomain(status.lastDomain);
  }, [editingRuleId, status.lastAppName, status.lastDomain]);

  useEffect(() => {
    onExpandedChange?.(panelExpanded);
  }, [onExpandedChange, panelExpanded]);

  const downloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadStarterPack = async (platform: 'macos' | 'windows') => {
    if (!helperKey || !ingestUrl) {
      return;
    }
    const { default: helperSource } = await import('../../scripts/desktop-helper.mjs?raw');

    const readme = platform === 'windows'
      ? `WORKTIMER HELPER WINDOWS\n\n1. Save all downloaded files in one folder.\n2. Make sure Node.js is installed.\n3. Run worktimer-helper-windows.cmd.\n\nThe helper key is already included in the launcher.\n`
      : `WORKTIMER HELPER MACOS\n\n1. Save worktimer-helper.mjs in any folder.\n2. Make sure Node.js is installed.\n3. In Terminal, open that folder and run:\n\n${portableCommand}\n`;

    const windowsLauncher = `@echo off\r\nsetlocal\r\nnode "%~dp0worktimer-helper.mjs" --url "${ingestUrl.replace(/"/g, '""')}" --key "${helperKey.replace(/"/g, '""')}"\r\npause\r\n`;
    const files =
      platform === 'windows'
        ? [
            ['worktimer-helper.mjs', helperSource],
            ['worktimer-helper-windows.cmd', windowsLauncher],
            ['worktimer-helper-README.txt', readme],
          ]
        : [
            ['worktimer-helper.mjs', helperSource],
            ['worktimer-helper-README.txt', readme],
          ];

    files.forEach(([fileName, content], index) => {
      window.setTimeout(() => downloadFile(fileName, content), index * 120);
    });
  };

  return (
    <section className={`helper-section ${panelExpanded ? 'is-expanded' : ''}`}>
      <button
        aria-expanded={panelExpanded}
        className="helper-section-toggle"
        onClick={() => setPanelExpanded((current) => !current)}
        type="button"
      >
        <div>
          <span className="eyebrow">Automatic activity detection</span>
          <strong>{status.connected ? 'Helper connected' : 'Mac and Windows share one session'}</strong>
        </div>
        <span className="helper-section-action">{panelExpanded ? 'Collapse' : 'Expand'}</span>
      </button>
      <div className="helper-section-body" hidden={!panelExpanded}>
      <div className="helper-setup-header">
        <div>
          <span className="eyebrow">Desktop helper setup</span>
          <h2>Desktop helper</h2>
          <p className="helper-setup-summary" aria-live="polite">
            {submitting
              ? 'Generating a secure key… keep this page open.'
              : helperKey
                ? 'Key ready. Download one starter for each computer and run it next to your timer.'
                : 'Generate one key first. It connects the helper on your Mac or Windows computer to this account.'}
          </p>
        </div>
        <button className="btn btn-primary" disabled={submitting} onClick={onGenerateKey} type="button">
          {submitting ? 'Generating…' : helperKey ? 'Generate new key' : 'Generate helper key'}
        </button>
      </div>
      <div className={`helper-key-status ${helperKey ? 'is-ready' : ''}`} aria-live="polite" role="status">
        <div>
          <span className="eyebrow">Step 1 · key</span>
          <strong>{submitting ? 'Generating key…' : helperKey ? 'Key generated' : 'Generate your key'}</strong>
          <p>{helperKey ? 'This key is included in the starter downloads below.' : 'Nothing is downloaded until you click the button above.'}</p>
        </div>
        {helperKey ? (
          <label className="field helper-key-field">
            <span>Helper key</span>
            <input readOnly value={helperKey} />
          </label>
        ) : null}
      </div>
      <div className="dashboard-grid">
        <article className="metric-block" hidden={!showAdvancedControls}>
          <div className="metric-label">
            <Timer size={15} />
            Status
          </div>
          <p>{describeDesktopHelperStatus(status)}</p>
          <p>{describeDesktopHelperLastSeen(status)}</p>
        </article>
        <article className="metric-block" hidden={!showAdvancedControls}>
          <div className="metric-label">
            <Layers3 size={15} />
            Last activity
          </div>
          <p>
            {status.lastAppName ?? 'none'}{status.lastDomain ? ` • ${status.lastDomain}` : ''}
          </p>
          <p>{status.lastWindowTitle ?? 'No window title.'}</p>
        </article>
        <article className="metric-block" hidden={!showAdvancedControls}>
          <div className="metric-label">
            <Bell size={15} />
            Sugestia projektu
          </div>
          <p>
            {suggestion
              ? `Suggestion: ${suggestion.projectName} from ${suggestion.domain ?? suggestion.appName ?? 'the helper'}.`
              : 'No active project suggestion from the helper.'}
          </p>
        </article>
      </div>
      <div className="dashboard-grid">
        <article className="metric-block">
          <div className="metric-label">
            <Timer size={15} />
            <span><span className="eyebrow">Step 2 · download</span>Automatic activity capture</span>
          </div>
          <p>The helper detects the active app and window title outside worktimer. You do not need a local copy of the repository.</p>
          <p>Each computer gets its own starter and key. The helper sees the foreground app; a recorder running only in the background does not replace the active context.</p>
          <div className="cta-row">
            <button
              className="btn btn-primary"
              disabled={!helperKey || !ingestUrl}
              onClick={() => {
                void downloadStarterPack('macos');
              }}
              type="button"
            >
              Download Mac starter
            </button>
            <button
              className="btn btn-primary"
              disabled={!helperKey || !ingestUrl}
              onClick={() => {
                void downloadStarterPack('windows');
              }}
              type="button"
            >
              Download Windows starter
            </button>
          </div>
          <p>{helperKey ? 'The starter includes the current helper key.' : 'Generate a helper key first to download a ready-to-run starter.'}</p>
        </article>
      </div>
      <div className="ghost-metric">
        <TimerReset size={16} />
        {ingestUrl
          ? `The helper sends the active app and window title to ${ingestUrl}.`
          : 'No helper ingest URL is configured.'}
      </div>
      {portableCommand ? (
        <div className="helper-command-card">
          <div>
            <span className="eyebrow">Step 3 · run</span>
            <strong>Start the helper beside your timer</strong>
            <p>Run this command after downloading the starter. Keep the helper window running while you work.</p>
          </div>
          <textarea aria-label="Helper start command" readOnly rows={2} value={portableCommand} />
        </div>
      ) : null}
      <div className="ghost-metric" hidden={!showAdvancedControls}>
        <BellOff size={16} />
        {!preferences.desktopTrackingEnabled
          ? 'Helper tracking is off.'
          : trackingPaused
            ? 'Helper tracking is temporarily paused.'
            : privateDomainsCount
              ? `Helper tracking is on. Private domains masked: ${privateDomainsCount}.`
              : 'Helper tracking is on. No private domains are configured.'}
      </div>
      <div className="cta-row">
        <button className="btn btn-primary" disabled={!quickStartEnabled} onClick={onQuickStart} type="button">
          Start from helper
        </button>
        <button
          className={`chip-btn ${showAdvancedControls ? 'is-active' : ''}`}
          onClick={() => setShowAdvancedControls((current) => !current)}
          type="button"
        >
          {showAdvancedControls ? 'Hide advanced settings' : 'Show advanced settings'}
        </button>
      </div>
      {activities.length ? (
        <div className="dashboard-grid" hidden={!showAdvancedControls}>
          {activities.map((activity) => (
            <article key={activity.id} className="metric-block">
              <div className="metric-label">
                <Timer size={15} />
                {describeDesktopHelperActivityTime(activity)}
              </div>
              <p>{describeDesktopHelperActivityContext(activity)}</p>
              <p>{activity.windowTitle ?? 'No window title.'}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="ghost-metric" hidden={!showAdvancedControls}>
          <Layers3 size={16} />
          No helper history yet. After you start it, recent work contexts will appear here.
        </div>
      )}
      <div className="cta-row" hidden={!showAdvancedControls}>
        <button className={`chip-btn ${preferences.desktopTrackingEnabled ? 'is-active' : ''}`} onClick={onToggleTracking} type="button">
          {preferences.desktopTrackingEnabled ? 'Helper tracking: on' : 'Helper tracking: off'}
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={() => onPauseTracking(15)} type="button">
          Pause for 15 min
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={() => onPauseTracking(60)} type="button">
          Pause for 60 min
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={() => onPauseTracking(null)} type="button">
          Pause until resumed
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={onResumeTracking} type="button">
          Resume helper
        </button>
      </div>
      <label className="field" hidden={!showAdvancedControls}>
        <span>Private domains, one per line</span>
        <textarea
          rows={4}
          value={privateDomainsText}
          onChange={(event) => setPrivateDomainsText(event.target.value)}
        />
      </label>
      <div className="cta-row" hidden={!showAdvancedControls}>
        <button
          className="btn btn-primary"
          disabled={privacyBusy}
          onClick={() => onSavePrivateDomains(privateDomainsText)}
          type="button"
        >
          {privacyBusy ? 'Saving…' : 'Save private domains'}
        </button>
      </div>
      <label className="field" hidden={!showAdvancedControls}>
        <span>{editingRuleId ? 'Rule project being edited' : 'Project for helper activity'}</span>
        <input
          placeholder="Np. PoprostuKoduj"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
        />
      </label>
      <div className="cta-row" hidden={!showAdvancedControls}>
        <button
          className="btn btn-primary"
          disabled={saveDisabled}
          onClick={() => {
            void onSaveRule({
              matchAppName: ruleAppName,
              matchDomain: ruleDomain,
              projectName,
            }).then(() => {
              setEditingRuleId(null);
              setProjectName('');
              setRuleAppName(status.lastAppName);
              setRuleDomain(status.lastDomain);
            });
          }}
          type="button"
        >
          {savingRule ? 'Saving…' : editingRuleId ? 'Save rule changes' : 'Save a rule from this activity'}
        </button>
        {editingRuleId ? (
          <button
            className="text-btn"
            onClick={() => {
              setEditingRuleId(null);
              setProjectName('');
              setRuleAppName(status.lastAppName);
              setRuleDomain(status.lastDomain);
            }}
            type="button"
          >
            Cancel editing
          </button>
        ) : null}
        <div className="ghost-metric">
          <BellOff size={16} />
          Rule: {ruleAppName ?? 'none'}{ruleDomain ? ` • ${ruleDomain}` : ''}.
        </div>
      </div>
      {rules.length ? (
        <div className="dashboard-grid" hidden={!showAdvancedControls}>
          {rules.map((rule) => (
            <article key={rule.id} className="metric-block">
              <div className="metric-label">
                <Layers3 size={15} />
                {rule.projectName}
              </div>
              <p>{rule.matchAppName ?? 'no app'}{rule.matchDomain ? ` • ${rule.matchDomain}` : ''}</p>
              <div className="cta-row">
                <button
                  className="text-btn"
                  onClick={() => {
                    setEditingRuleId(rule.id);
                    setProjectName(rule.projectName);
                    setRuleAppName(rule.matchAppName);
                    setRuleDomain(rule.matchDomain);
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-btn"
                  disabled={deletingRuleId === rule.id}
                  onClick={() => onDeleteRule(rule.id)}
                  type="button"
                >
                  {deletingRuleId === rule.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <div className="ghost-metric" hidden={showAdvancedControls}>
        <Layers3 size={16} />
        Automatic activity capture stays here. The rest of the helper settings are under Advanced.
      </div>
      </div>
    </section>
  );
}

type StatsGridProps = {
  dashboard: TrackerDashboard;
  projectSummaries: TrackerProjectSummary[];
  preferences: TrackerPreferences;
  summary: TrackerSummary;
  onChangeDailyGoal: (delta: number) => void;
};

export function StatsGrid({
  dashboard,
  projectSummaries,
  preferences,
  summary,
  onChangeDailyGoal,
}: StatsGridProps) {
  const { t } = useLanguage();
  const maxRecentDaySeconds = Math.max(
    ...dashboard.recentDays.map((point) => point.seconds),
    1,
  );

  return (
    <section className="stats-section dashboard-section">
      <div className="stats-header">
        <div>
          <span className="eyebrow">{t('Work dashboard')}</span>
          <h2>{t('Daily pace, streaks, and your strongest session signals')}</h2>
        </div>
        <div className="goal-control">
          <span>{t('Daily goal')}</span>
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
      <div className="dashboard-grid">
        <article className="metric-block metric-block-primary">
          <div className="metric-label">
            <Timer size={15} />
            {t('Today')}
          </div>
          <div className="metric-value">{formatDurationPretty(summary.todaySeconds)}</div>
          <p>
            {t('Progress:')} {summary.goalProgressPercent}% • {t('Remaining:')}{' '}
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
            {t('This week')}
          </div>
          <div className="metric-value">{formatDurationPretty(summary.weekSeconds)}</div>
          <p>{t('Measured from Monday in your local time.')}</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Goal size={15} />
            {t('This month')}
          </div>
          <div className="metric-value">{formatDurationPretty(summary.monthSeconds)}</div>
          <p>{t('Useful for tracking your publishing and deep-work pace.')}</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <TrendingUp size={15} />
            {t('Current streak')}
          </div>
          <div className="metric-value">{dashboard.streakDays} {t('days')}</div>
          <p>{t('Consecutive days with at least one saved session.')}</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Coffee size={15} />
            {t('Average session')}
          </div>
          <div className="metric-value">
            {formatDurationPretty(dashboard.averageSessionSeconds)}
          </div>
          <p>{t('Calculated from all saved work sessions.')}</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Layers3 size={15} />
            {t('Best day')}
          </div>
          <div className="metric-value">
            {dashboard.bestDay
              ? formatDurationPretty(dashboard.bestDay.seconds)
              : '0h 0m'}
          </div>
          <p>
            {dashboard.bestDay
              ? formatPolishDate(dashboard.bestDay.date)
              : t('It will appear after your first saved session.')}
          </p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Goal size={15} />
            {t('Top project')}
          </div>
          <div className="metric-value metric-value-category">
            {projectSummaries[0]?.projectName ?? t('none')}
          </div>
          <p>
            {projectSummaries[0]
              ? `${formatDurationPretty(projectSummaries[0].seconds)} • ${projectSummaries[0].sessionCount} sessions.`
              : t('Assign a session to a project to see a separate total.')}
          </p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Layers3 size={15} />
            {t('Total')}
          </div>
          <div className="metric-value">{formatDurationPretty(summary.totalSeconds)}</div>
          <p>{summary.sessionCount} {t('saved sessions in the database.')}</p>
        </article>
      </div>
      <div className="dashboard-heatmap">
        <div className="dashboard-heatmap-copy">
          <span className="eyebrow">{t('Last 14 days')}</span>
          <h3>{t('Work rhythm, day by day')}</h3>
        </div>
        <div className="heatmap-grid" aria-label={t('Activity for the last 14 days')}>
          {dashboard.recentDays.map((day) => {
            const intensity = Math.min(1, day.seconds / maxRecentDaySeconds);
            return (
              <div className="heatmap-day" key={day.date}>
                <span className="heatmap-label">{formatWeekdayShort(day.date)}</span>
                <div
                  aria-hidden="true"
                  className="heatmap-tile"
                  style={{
                    opacity: day.seconds ? 0.28 + intensity * 0.72 : 0.14,
                  }}
                ></div>
                <strong>{formatDurationPretty(day.seconds)}</strong>
                <span className="heatmap-meta">{day.sessionCount} {t('sessions')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type PomodoroPanelProps = {
  canRequestPermission: boolean;
  nextPhaseLabel: string;
  notificationPermission: PomodoroPermission;
  presets: PomodoroPreset[];
  progressPercent: number;
  remainingLabel: string;
  selectedPreset: PomodoroPreset;
  state: PomodoroState;
  statusMessage: string;
  onRequestPermission: () => void;
  onReset: () => void;
  onSelectPreset: (presetId: string) => void;
  onStartBreak: () => void;
  onStartFocus: () => void;
};

export function PomodoroPanel({
  canRequestPermission,
  nextPhaseLabel,
  notificationPermission,
  presets,
  progressPercent,
  remainingLabel,
  selectedPreset,
  state,
  statusMessage,
  onRequestPermission,
  onReset,
  onSelectPreset,
  onStartBreak,
  onStartFocus,
}: PomodoroPanelProps) {
  const { t } = useLanguage();
  const phaseLabel = state.phase === 'focus' ? t('Focus') : t('Break');
  const notificationIcon =
    notificationPermission === 'granted' ? (
      <Bell size={16} />
    ) : (
      <BellOff size={16} />
    );

  return (
    <section className="pomodoro-panel">
      <div className="pomodoro-copy">
        <div>
          <span className="eyebrow">{t('Pomodoro')}</span>
          <h2>{t('A focus and break cycle without another app')}</h2>
        </div>
        <div className="pomodoro-clock-row">
          <div>
            <div className="pomodoro-phase">{phaseLabel}</div>
            <div className="pomodoro-clock">{remainingLabel}</div>
          </div>
          <div className="pomodoro-status-card">
            <span className={`pomodoro-badge is-${state.status}`}>
              {state.status === 'running'
                ? t('Cycle running')
                : state.status === 'completed'
                  ? t('Cycle complete')
                  : t('Ready to start')}
            </span>
            <p>{t(statusMessage)}</p>
          </div>
        </div>
        <div className="progress-track compact" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="pomodoro-actions">
        <div className="preset-grid">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className={`preset-chip ${preset.id === selectedPreset.id ? 'is-active' : ''}`}
              onClick={() => onSelectPreset(preset.id)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="pomodoro-cta-row">
          <button className="btn btn-primary" onClick={onStartFocus} type="button">
            <Play size={18} />
            {t('Start {minutes} min').replace('{minutes}', String(selectedPreset.focusMinutes))}
          </button>
          <button className="chip-btn" onClick={onStartBreak} type="button">
            <Coffee size={16} />
            {state.status === 'completed' ? nextPhaseLabel : t('Break {minutes} min').replace('{minutes}', String(selectedPreset.breakMinutes))}
          </button>
          <button className="chip-btn" onClick={onReset} type="button">
            <RotateCcw size={16} />
            {t('Reset')}
          </button>
        </div>

        <div className="pomodoro-meta-row">
          <div className="ghost-metric">
            {notificationIcon}
            {notificationPermission === 'granted'
              ? t('System notifications on')
              : notificationPermission === 'denied'
                ? t('Notifications blocked')
                : notificationPermission === 'unsupported'
                  ? t('Notification API not supported')
                  : t('Notifications are waiting for permission')}
          </div>
          {canRequestPermission ? (
            <button className="chip-btn" onClick={onRequestPermission} type="button">
              <Bell size={16} />
              {t('Enable notifications')}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
