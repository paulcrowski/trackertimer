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

type TimerPanelProps = {
  activeSession: ActiveSession | null;
  autoPauseEnabled: boolean;
  autoPauseMinutes: number;
  category: string;
  description: string;
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
        <span className="eyebrow">Aktywna sesja</span>
        <div className="timer-line">
          <span className="timer-value">
            {activeSession ? formatDurationHms(elapsedSeconds) : '00:00:00'}
          </span>
          <span className="timer-subtitle">
            {activeSession
              ? isPaused
                ? `Sesja w pauzie po ${formatDurationPretty(elapsedSeconds)} pracy.`
                : `Minęło ${formatDurationPretty(elapsedSeconds)}`
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
              <strong>Auto-pauza po bezczynności.</strong>
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
          <label className="field">
            <span>Projekt</span>
            <input
              list={projectSuggestionsId}
              disabled={Boolean(activeSession)}
              placeholder="Np. Po prostu Koduj"
              value={activeSession?.projectName ?? projectName ?? ''}
              onChange={(event) => onProjectChange(event.target.value)}
            />
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
        {recentProjects.length ? (
          <datalist id={projectSuggestionsId}>
            {recentProjects.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        ) : null}
        <div className="cta-row">
          {activeSession ? (
            <>
              {isPaused ? (
                <button className="btn btn-primary" onClick={onResume} type="button">
                  <Play size={18} />
                  WZNOW
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
            Timer zatrzymujesz recznie, pomodoro tylko daje sygnal.
          </div>
        </div>
        <button
          className={`chip-btn ${autoPauseEnabled ? 'is-active' : ''}`}
          onClick={onToggleAutoPause}
          type="button"
        >
          {helperAutoPauseMode
            ? autoPauseEnabled
              ? 'Auto-pauza helpera: wlaczona'
              : 'Auto-pauza helpera: wylaczona'
            : autoPauseEnabled
              ? 'Auto-pauza: wlaczona'
              : 'Auto-pauza: wylaczona'}
        </button>
        <label className="field">
          <span>{helperAutoPauseMode ? 'Cisza helpera' : 'Bezczynnosc'}</span>
          <select
            value={autoPauseMinutes}
            onChange={(event) => onAutoPauseMinutesChange(Number(event.target.value))}
          >
            {autoPauseMinuteOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
        <div className="ghost-metric">
          <TimerReset size={16} />
          {describeAutoPauseSetting(autoPauseEnabled, autoPauseMinutes, workspaceMode)}
        </div>
        {autoPauseEnabled || helperAutoPauseMode ? (
          <div className="ghost-metric">
            <Pause size={16} />
            {describeAutoPauseReason(workspaceMode)}
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
}: DesktopHelperPanelProps) {
  const [projectName, setProjectName] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleAppName, setRuleAppName] = useState<string | null>(status.lastAppName);
  const [ruleDomain, setRuleDomain] = useState<string | null>(status.lastDomain);
  const [privateDomainsText, setPrivateDomainsText] = useState(preferences.privateDomainsText);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
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
      ? `WORKTIMER HELPER WINDOWS\n\n1. Zapisz wszystkie pobrane pliki w jednym folderze.\n2. Upewnij sie, ze masz zainstalowanego Node.js.\n3. Uruchom worktimer-helper-windows.cmd.\n\nKlucz helpera jest juz wpisany w launcherze.\n`
      : `WORKTIMER HELPER MACOS\n\n1. Zapisz pobrany plik worktimer-helper.mjs w dowolnym folderze.\n2. Upewnij sie, ze masz zainstalowanego Node.js.\n3. W terminalu wejdz do tego folderu i uruchom:\n\n${portableCommand}\n`;

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
    <section className="stats-section">
      <div className="stats-header">
        <div>
          <span className="eyebrow">Desktop helper</span>
          <h2>Polaczenie z aktywna appka poza oknem worktimera</h2>
        </div>
        <button className="btn btn-primary" disabled={submitting} onClick={onGenerateKey} type="button">
          {submitting ? 'Generowanie…' : 'Generuj klucz helpera'}
        </button>
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
            Ostatnia aktywnosc
          </div>
          <p>
            {status.lastAppName ?? 'brak'}{status.lastDomain ? ` • ${status.lastDomain}` : ''}
          </p>
          <p>{status.lastWindowTitle ?? 'Brak tytulu okna.'}</p>
        </article>
        <article className="metric-block" hidden={!showAdvancedControls}>
          <div className="metric-label">
            <Bell size={15} />
            Sugestia projektu
          </div>
          <p>
            {suggestion
              ? `Sugestia: ${suggestion.projectName} z ${suggestion.domain ?? suggestion.appName ?? 'helpera'}.`
              : 'Brak aktywnej sugestii projektu z helpera.'}
          </p>
        </article>
      </div>
      <div className="dashboard-grid">
        <article className="metric-block">
          <div className="metric-label">
            <Timer size={15} />
            Automatyczne wylapywanie aktywnosci
          </div>
          <p>Helper sam wykrywa aktywna appke i tytul okna poza worktimerem. Nie trzeba miec lokalnie repo.</p>
          <div className="cta-row">
            <button
              className="btn btn-primary"
              disabled={!helperKey || !ingestUrl}
              onClick={() => {
                void downloadStarterPack('macos');
              }}
              type="button"
            >
              Pobierz starter Mac
            </button>
            <button
              className="btn btn-primary"
              disabled={!helperKey || !ingestUrl}
              onClick={() => {
                void downloadStarterPack('windows');
              }}
              type="button"
            >
              Pobierz starter Windows
            </button>
          </div>
          <p>{helperKey ? 'Starter zawiera aktualny klucz helpera.' : 'Najpierw wygeneruj klucz helpera, wtedy pobierzesz gotowy starter.'}</p>
        </article>
      </div>
      <div className="ghost-metric">
        <TimerReset size={16} />
        {ingestUrl
          ? `Helper wysyla aktywna appke i tytul okna do ${ingestUrl}.`
          : 'Brak skonfigurowanego URL do ingestu helpera.'}
      </div>
      <div className="ghost-metric" hidden={!showAdvancedControls}>
        <BellOff size={16} />
        {!preferences.desktopTrackingEnabled
          ? 'Tracking helpera jest wylaczony.'
          : trackingPaused
            ? 'Tracking helpera jest chwilowo spauzowany.'
            : privateDomainsCount
              ? `Tracking helpera jest aktywny. Prywatne domeny na blackliscie: ${privateDomainsCount}.`
              : 'Tracking helpera jest aktywny. Brak prywatnych domen na blackliscie.'}
      </div>
      <div className="cta-row">
        <button className="btn btn-primary" disabled={!quickStartEnabled} onClick={onQuickStart} type="button">
          Start z helpera
        </button>
        <button
          className={`chip-btn ${showAdvancedControls ? 'is-active' : ''}`}
          onClick={() => setShowAdvancedControls((current) => !current)}
          type="button"
        >
          {showAdvancedControls ? 'Ukryj ustawienia zaawansowane' : 'Pokaz ustawienia zaawansowane'}
        </button>
      </div>
      {helperKey ? (
        <label className="field" hidden={!showAdvancedControls}>
          <span>Klucz helpera (pokazywany po wygenerowaniu)</span>
          <input readOnly value={helperKey} />
        </label>
      ) : null}
      {portableCommand ? (
        <label className="field" hidden={!showAdvancedControls}>
          <span>Komenda po pobraniu helpera</span>
          <textarea readOnly rows={3} value={portableCommand} />
        </label>
      ) : null}
      {activities.length ? (
        <div className="dashboard-grid" hidden={!showAdvancedControls}>
          {activities.map((activity) => (
            <article key={activity.id} className="metric-block">
              <div className="metric-label">
                <Timer size={15} />
                {describeDesktopHelperActivityTime(activity)}
              </div>
              <p>{describeDesktopHelperActivityContext(activity)}</p>
              <p>{activity.windowTitle ?? 'Brak tytulu okna.'}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="ghost-metric" hidden={!showAdvancedControls}>
          <Layers3 size={16} />
          Brak historii helpera. Po uruchomieniu zobaczysz tu ostatnie konteksty pracy.
        </div>
      )}
      <div className="cta-row" hidden={!showAdvancedControls}>
        <button className={`chip-btn ${preferences.desktopTrackingEnabled ? 'is-active' : ''}`} onClick={onToggleTracking} type="button">
          {preferences.desktopTrackingEnabled ? 'Tracking helpera: wlaczony' : 'Tracking helpera: wylaczony'}
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={() => onPauseTracking(15)} type="button">
          Pauza 15 min
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={() => onPauseTracking(60)} type="button">
          Pauza 60 min
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={() => onPauseTracking(null)} type="button">
          Pauza do wznowienia
        </button>
        <button className="text-btn" disabled={privacyBusy} onClick={onResumeTracking} type="button">
          Wznow helper
        </button>
      </div>
      <label className="field" hidden={!showAdvancedControls}>
        <span>Prywatne domeny, po jednej w linii</span>
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
          {privacyBusy ? 'Zapisywanie…' : 'Zapisz prywatne domeny'}
        </button>
      </div>
      <label className="field" hidden={!showAdvancedControls}>
        <span>{editingRuleId ? 'Edytowany projekt reguly' : 'Projekt dla aktywnosci helpera'}</span>
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
          {savingRule ? 'Zapisywanie…' : editingRuleId ? 'Zapisz zmiany reguly' : 'Zapisz regule z tej aktywnosci'}
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
            Anuluj edycje
          </button>
        ) : null}
        <div className="ghost-metric">
          <BellOff size={16} />
          Regula: {ruleAppName ?? 'brak'}{ruleDomain ? ` • ${ruleDomain}` : ''}.
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
              <p>{rule.matchAppName ?? 'brak appki'}{rule.matchDomain ? ` • ${rule.matchDomain}` : ''}</p>
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
                  Edytuj
                </button>
                <button
                  className="text-btn"
                  disabled={deletingRuleId === rule.id}
                  onClick={() => onDeleteRule(rule.id)}
                  type="button"
                >
                  {deletingRuleId === rule.id ? 'Usuwanie…' : 'Usun'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <div className="ghost-metric" hidden={showAdvancedControls}>
        <Layers3 size={16} />
        Zostawilem tu tylko automatyczne wyłapywanie aktywnosci. Reszta ustawien helpera jest schowana w sekcji zaawansowanej.
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
  const maxRecentDaySeconds = Math.max(
    ...dashboard.recentDays.map((point) => point.seconds),
    1,
  );

  return (
    <section className="stats-section dashboard-section">
      <div className="stats-header">
        <div>
          <span className="eyebrow">Dashboard pracy</span>
          <h2>Tempo dnia, seria i najmocniejsze sygnały z sesji</h2>
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
      <div className="dashboard-grid">
        <article className="metric-block metric-block-primary">
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
            <TrendingUp size={15} />
            Ostatnia seria
          </div>
          <div className="metric-value">{dashboard.streakDays} dni</div>
          <p>
            Liczone po kolejnych dniach z przynajmniej jedną zapisaną sesją.
          </p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Coffee size={15} />
            Średnia sesja
          </div>
          <div className="metric-value">
            {formatDurationPretty(dashboard.averageSessionSeconds)}
          </div>
          <p>Wyliczone na bazie wszystkich zapisanych wejść w pracę.</p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Layers3 size={15} />
            Najmocniejszy dzień
          </div>
          <div className="metric-value">
            {dashboard.bestDay
              ? formatDurationPretty(dashboard.bestDay.seconds)
              : '0h 0m'}
          </div>
          <p>
            {dashboard.bestDay
              ? formatPolishDate(dashboard.bestDay.date)
              : 'Pojawi się po pierwszej zapisanej sesji.'}
          </p>
        </article>
        <article className="metric-block">
          <div className="metric-label">
            <Goal size={15} />
            Top projekt
          </div>
          <div className="metric-value metric-value-category">
            {projectSummaries[0]?.projectName ?? 'brak'}
          </div>
          <p>
            {projectSummaries[0]
              ? `${formatDurationPretty(projectSummaries[0].seconds)} • ${projectSummaries[0].sessionCount} sesji.`
              : 'Przypisz sesję do projektu, a zobaczysz osobny licznik.'}
          </p>
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
      <div className="dashboard-heatmap">
        <div className="dashboard-heatmap-copy">
          <span className="eyebrow">Ostatnie 14 dni</span>
          <h3>Rytm pracy dzień po dniu</h3>
        </div>
        <div className="heatmap-grid" aria-label="Aktywność z ostatnich 14 dni">
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
                <span className="heatmap-meta">{day.sessionCount} sesji</span>
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
  const phaseLabel = state.phase === 'focus' ? 'Focus' : 'Przerwa';
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
          <span className="eyebrow">Pomodoro</span>
          <h2>Cykl skupienia i przerwy bez dodatkowej apki</h2>
        </div>
        <div className="pomodoro-clock-row">
          <div>
            <div className="pomodoro-phase">{phaseLabel}</div>
            <div className="pomodoro-clock">{remainingLabel}</div>
          </div>
          <div className="pomodoro-status-card">
            <span className={`pomodoro-badge is-${state.status}`}>
              {state.status === 'running'
                ? 'Trwa cykl'
                : state.status === 'completed'
                  ? 'Cykl zakonczony'
                  : 'Gotowy do startu'}
            </span>
            <p>{statusMessage}</p>
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
            Start {selectedPreset.focusMinutes} min
          </button>
          <button className="chip-btn" onClick={onStartBreak} type="button">
            <Coffee size={16} />
            {state.status === 'completed' ? nextPhaseLabel : `Przerwa ${selectedPreset.breakMinutes} min`}
          </button>
          <button className="chip-btn" onClick={onReset} type="button">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <div className="pomodoro-meta-row">
          <div className="ghost-metric">
            {notificationIcon}
            {notificationPermission === 'granted'
              ? 'Powiadomienie systemowe wlaczone'
              : notificationPermission === 'denied'
                ? 'Powiadomienia zablokowane'
                : notificationPermission === 'unsupported'
                  ? 'Brak wsparcia Notification API'
                  : 'Powiadomienia czekaja na zgode'}
          </div>
          {canRequestPermission ? (
            <button className="chip-btn" onClick={onRequestPermission} type="button">
              <Bell size={16} />
              Wlacz powiadomienia
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
