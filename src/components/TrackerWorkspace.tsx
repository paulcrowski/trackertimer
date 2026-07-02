import { ActivityCharts } from './ActivityCharts.tsx';
import {
  AppHeader,
  DeleteDialog,
  EditDialog,
  ManualDialog,
  StopDialog,
} from './SessionDialogs.tsx';
import { PomodoroPanel, StatsGrid, TimerPanel } from './TrackerPanels.tsx';
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
  onDeleteSession: TrackerWorkspaceHandlers['onDeleteSession'];
  onSavePreferences: TrackerWorkspaceHandlers['onSavePreferences'];
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
  onDeleteSession,
  onSavePreferences,
  onSignOut,
  onStartSession,
  onStopSession,
  onUpdateSession,
}: TrackerWorkspaceProps) {
  const pwa = usePwaInstall();
  const pomodoro = usePomodoro();
  const controller = useTrackerWorkspaceController({
    data,
    onAddManualSession,
    onDeleteSession,
    onSavePreferences,
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

      <TimerPanel
        activeSession={controller.activeSession}
        category={controller.category}
        description={controller.description}
        elapsedSeconds={controller.elapsedSeconds}
        idleNotice={controller.idleNotice}
        onCategoryChange={controller.setCategory}
        onDescriptionChange={controller.setDescription}
        onDismissIdleNotice={controller.dismissIdleNotice}
        onOpenStopDialog={controller.openStopDialog}
        onStart={() => {
          void controller.handleStartSession();
        }}
      />

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
