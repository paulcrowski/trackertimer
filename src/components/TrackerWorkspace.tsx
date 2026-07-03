import { useState } from 'react';
import { ActivityCharts } from './ActivityCharts.tsx';
import {
  AppHeader,
  DeleteDialog,
  EditDialog,
  ManualDialog,
  StopDialog,
} from './SessionDialogs.tsx';
import {
  DesktopHelperPanel,
  PomodoroPanel,
  StatsGrid,
  TimerPanel,
} from './TrackerPanels.tsx';
import { SessionsPanel } from './SessionsPanel.tsx';
import { usePomodoro } from '../lib/pomodoro.ts';
import { usePwaInstall } from '../lib/pwa.ts';
import {
  useTrackerWorkspaceController,
  type TrackerBootstrap,
  type TrackerWorkspaceHandlers,
} from '../lib/tracker.ts';

type TrackerWorkspaceProps = {
  data: TrackerBootstrap;
  error: string | null;
  onAddManualSession: TrackerWorkspaceHandlers['onAddManualSession'];
  onClearError: () => void;
  onDeleteTrackingRule: TrackerWorkspaceHandlers['onDeleteTrackingRule'];
  onDeleteSession: TrackerWorkspaceHandlers['onDeleteSession'];
  onIssueDesktopHelperKey: TrackerWorkspaceHandlers['onIssueDesktopHelperKey'];
  onPauseSession: TrackerWorkspaceHandlers['onPauseSession'];
  onResumeSession: TrackerWorkspaceHandlers['onResumeSession'];
  onSavePreferences: TrackerWorkspaceHandlers['onSavePreferences'];
  onSaveTrackingRule: TrackerWorkspaceHandlers['onSaveTrackingRule'];
  onSignOut: TrackerWorkspaceHandlers['onSignOut'];
  onStartSession: TrackerWorkspaceHandlers['onStartSession'];
  onStopSession: TrackerWorkspaceHandlers['onStopSession'];
  onUpdateSession: TrackerWorkspaceHandlers['onUpdateSession'];
};

export function TrackerWorkspace({
  data,
  error,
  onAddManualSession,
  onClearError,
  onDeleteTrackingRule,
  onDeleteSession,
  onIssueDesktopHelperKey,
  onPauseSession,
  onResumeSession,
  onSavePreferences,
  onSaveTrackingRule,
  onSignOut,
  onStartSession,
  onStopSession,
  onUpdateSession,
}: TrackerWorkspaceProps) {
  const [workspaceMode, setWorkspaceMode] = useState<'simple' | 'advanced'>('simple');
  const pwa = usePwaInstall();
  const pomodoro = usePomodoro();
  const controller = useTrackerWorkspaceController({
    data,
    onAddManualSession,
    onDeleteTrackingRule,
    onDeleteSession,
    onIssueDesktopHelperKey,
    onPauseSession,
    onResumeSession,
    onSavePreferences,
    onSaveTrackingRule,
    onSignOut,
    onStartSession,
    onStopSession,
    onUpdateSession,
  });

  return (
    <div className={`app-shell ${controller.preferences.focusMode ? 'focus-mode' : ''}`}>
      <AppHeader
        active={Boolean(controller.activeSession)}
        canInstall={pwa.canInstall}
        focusMode={controller.preferences.focusMode}
        isInstalled={pwa.isInstalled}
        onInstall={() => {
          void pwa.promptInstall();
        }}
        user={data.user}
        onSignOut={() => {
          void controller.handleSignOut();
        }}
        onToggleFocusMode={() => controller.toggleFocusMode()}
      />

      {error ? (
        <div className="inline-error sticky-error">
          <span>{error}</span>
          <button className="text-btn" onClick={onClearError} type="button">
            Zamknij
          </button>
        </div>
      ) : null}

      {controller.activeSessionNotice ? (
        <div className="idle-banner sticky-error">
          <span>{controller.activeSessionNotice}</span>
        </div>
      ) : null}

      <section className="stats-section">
        <div className="stats-header">
          <div>
            <span className="eyebrow">Tryb pracy</span>
            <h2>{workspaceMode === 'simple' ? 'Prosty timer bez helpera' : 'Zaawansowany helper i automatyzacja'}</h2>
          </div>
          <div className="cta-row">
            <button
              className={`chip-btn ${workspaceMode === 'simple' ? 'is-active' : ''}`}
              onClick={() => setWorkspaceMode('simple')}
              type="button"
            >
              Prosty timer
            </button>
            <button
              className={`chip-btn ${workspaceMode === 'advanced' ? 'is-active' : ''}`}
              onClick={() => setWorkspaceMode('advanced')}
              type="button"
            >
              Zaawansowany helper
            </button>
          </div>
        </div>
        <div className="ghost-metric">
          <span>
            {workspaceMode === 'simple'
              ? 'Tu masz zwykly start, pauze, stop, pomodoro, historie i raporty bez automatyki desktopowej.'
              : 'Tu wlaczasz helper, pobierasz starter bez repo i dopinasz auto-rozpoznawanie kontekstu pracy.'}
          </span>
        </div>
      </section>

      <TimerPanel
        activeSession={controller.activeSession}
        autoPauseEnabled={controller.preferences.autoPauseEnabled}
        autoPauseMinutes={controller.preferences.autoPauseMinutes}
        category={controller.category}
        description={controller.description}
        elapsedSeconds={controller.elapsedSeconds}
        idleNotice={controller.idleNotice}
        onAutoPauseMinutesChange={(value) => controller.changeAutoPauseMinutes(value)}
        onCategoryChange={controller.setCategory}
        onDescriptionChange={controller.setDescription}
        onDismissIdleNotice={controller.dismissIdleNotice}
        onProjectChange={controller.handleCurrentProjectNameChange}
        onResume={() => {
          void controller.handleResumeSession();
        }}
        onOpenStopDialog={controller.openStopDialog}
        onStart={() => {
          void controller.handleStartSession();
        }}
        onToggleAutoPause={() => controller.toggleAutoPause()}
        projectName={controller.currentProjectName}
      />

      {workspaceMode === 'advanced' ? (
        <DesktopHelperPanel
          activities={data.desktopHelperActivities}
          deletingRuleId={
            controller.busyAction?.startsWith('desktop-rule-delete:')
              ? controller.busyAction.replace('desktop-rule-delete:', '')
              : null
          }
          helperKey={controller.desktopHelperKey}
          privacyBusy={controller.busyAction === 'desktop-helper-privacy'}
          preferences={controller.preferences}
          rules={controller.desktopTrackingRules}
          status={controller.desktopHelperStatus}
          savingRule={controller.busyAction === 'desktop-rule-save'}
          suggestion={controller.desktopProjectSuggestion}
          submitting={controller.busyAction === 'desktop-helper-key'}
          onDeleteRule={controller.handleDeleteTrackingRule}
          onGenerateKey={() => {
            void controller.handleIssueDesktopHelperKey();
          }}
          onPauseTracking={controller.pauseDesktopTracking}
          onQuickStart={controller.handleQuickStartFromHelper}
          onResumeTracking={controller.resumeDesktopTracking}
          onSaveRule={(rule) => controller.handleSaveTrackingRule(rule)}
          onSavePrivateDomains={controller.handleSavePrivateDomains}
          onToggleTracking={controller.toggleDesktopTracking}
        />
      ) : null}

      <PomodoroPanel
        canRequestPermission={pomodoro.canRequestPermission}
        nextPhaseLabel={pomodoro.nextPhaseLabel}
        notificationPermission={pomodoro.permission}
        presets={pomodoro.presets}
        progressPercent={pomodoro.progressPercent}
        remainingLabel={pomodoro.remainingLabel}
        selectedPreset={pomodoro.selectedPreset}
        state={pomodoro.state}
        statusMessage={pomodoro.statusMessage}
        onRequestPermission={() => {
          void pomodoro.requestPermission();
        }}
        onReset={pomodoro.reset}
        onSelectPreset={pomodoro.selectPreset}
        onStartBreak={pomodoro.startBreak}
        onStartFocus={pomodoro.startFocus}
      />

      <StatsGrid
        dashboard={data.dashboard}
        projectSummaries={controller.projectSummaries}
        preferences={controller.preferences}
        summary={controller.summary}
        onChangeDailyGoal={(delta) => controller.changeDailyGoal(delta)}
      />

      <ActivityCharts
        categories={data.charts.categories}
        trend={data.charts.trend}
      />

      <SessionsPanel
        history={data.history}
        onAddManual={controller.openManualDialog}
        onDelete={controller.openDeleteDialog}
        onEdit={controller.openEditDialog}
        onExportCsv={controller.exportSessions}
      />

      <StopDialog
        activeDescription={controller.activeSession?.description ?? ''}
        elapsedSeconds={controller.elapsedSeconds}
        note={controller.stopNote}
        open={controller.stopDialogOpen}
        soundEnabled={controller.stopSoundEnabled}
        submitting={controller.busyAction === 'stop'}
        onClose={controller.closeStopDialog}
        onConfirm={() => {
          void controller.handleStopConfirm();
        }}
        onNoteChange={controller.setStopNote}
        onSoundChange={controller.setStopSoundEnabled}
      />

      <ManualDialog
        draft={controller.manualDraft}
        open={controller.manualDialogOpen}
        submitting={controller.busyAction === 'manual'}
        onChange={controller.updateManualDraft}
        onClose={controller.closeManualDialog}
        onConfirm={() => {
          void controller.handleManualAdd();
        }}
      />

      <EditDialog
        draft={controller.editDraft}
        open={Boolean(controller.editingSession)}
        session={controller.editingSession}
        submitting={controller.busyAction === 'edit'}
        onChange={controller.updateEditDraft}
        onClose={controller.closeEditDialog}
        onConfirm={() => {
          void controller.handleEditSave();
        }}
      />

      <DeleteDialog
        open={Boolean(controller.deletingSession)}
        session={controller.deletingSession}
        submitting={controller.busyAction === 'delete'}
        onClose={controller.closeDeleteDialog}
        onConfirm={() => {
          void controller.handleDeleteConfirm();
        }}
      />
    </div>
  );
}
