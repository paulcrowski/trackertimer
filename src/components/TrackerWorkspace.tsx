import { useState } from 'react';
import { ActivityCharts } from './ActivityCharts.tsx';
import {
  AppHeader,
  DeleteDialog,
  EditDialog,
  ManualDialog,
  SettingsDialog,
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
import { useLanguage } from '../lib/i18n.tsx';
import {
  clearActiveSessionSnapshot,
  useTrackerWorkspaceController,
  type TrackerBootstrap,
  type TrackerWorkspaceHandlers,
} from '../lib/tracker.ts';

type TrackerWorkspaceProps = {
  allowDesktopHelper?: boolean;
  data: TrackerBootstrap;
  error: string | null;
  onAddManualSession: TrackerWorkspaceHandlers['onAddManualSession'];
  onClearError: () => void;
  onDeleteAccount: () => Promise<unknown>;
  onDeleteAllUserData: () => Promise<unknown>;
  onDeleteTrackingRule: TrackerWorkspaceHandlers['onDeleteTrackingRule'];
  onDeleteSession: TrackerWorkspaceHandlers['onDeleteSession'];
  onMergeSessions: TrackerWorkspaceHandlers['onMergeSessions'];
  onExportSessions: TrackerWorkspaceHandlers['onExportSessions'];
  onIssueDesktopHelperKey: TrackerWorkspaceHandlers['onIssueDesktopHelperKey'];
  onPauseSession: TrackerWorkspaceHandlers['onPauseSession'];
  onResumeSession: TrackerWorkspaceHandlers['onResumeSession'];
  onSavePreferences: TrackerWorkspaceHandlers['onSavePreferences'];
  onSaveTrackingRule: TrackerWorkspaceHandlers['onSaveTrackingRule'];
  onSignOut: TrackerWorkspaceHandlers['onSignOut'];
  onStartSession: TrackerWorkspaceHandlers['onStartSession'];
  onStopSession: TrackerWorkspaceHandlers['onStopSession'];
  onUpdateSession: TrackerWorkspaceHandlers['onUpdateSession'];
  signOutLabel: string;
  storageMode: 'cloud' | 'local';
};

export function getSignOutGuardError(args: {
  hasActiveSession: boolean;
  storageMode: 'cloud' | 'local';
}) {
  if (args.storageMode === 'cloud' && args.hasActiveSession) {
    return 'End the active timer session before signing out or switching accounts.';
  }
  if (args.storageMode === 'local' && args.hasActiveSession) {
    return 'End the active local timer session before returning to the mode picker.';
  }
  return null;
}

export function TrackerWorkspace({
  allowDesktopHelper = true,
  data,
  error,
  onAddManualSession,
  onClearError,
  onDeleteAccount,
  onDeleteAllUserData,
  onDeleteTrackingRule,
  onDeleteSession,
  onMergeSessions,
  onExportSessions,
  onIssueDesktopHelperKey,
  onPauseSession,
  onResumeSession,
  onSavePreferences,
  onSaveTrackingRule,
  onSignOut,
  onStartSession,
  onStopSession,
  onUpdateSession,
  signOutLabel,
  storageMode,
}: TrackerWorkspaceProps) {
  const { t } = useLanguage();
  const [workspaceMode, setWorkspaceMode] = useState<'simple' | 'advanced'>('simple');
  const [guardError, setGuardError] = useState<string | null>(null);
  const autoPauseMode =
    allowDesktopHelper && workspaceMode === 'advanced' ? 'advanced' : 'simple';
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dangerBusy, setDangerBusy] = useState<'delete-data' | 'delete-account' | null>(null);
  const pwa = usePwaInstall();
  const pomodoro = usePomodoro();
  const controller = useTrackerWorkspaceController({
    autoPauseMode,
    data,
    onAddManualSession,
    onDeleteTrackingRule,
    onDeleteSession,
    onExportSessions,
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
  const clearConvexAuthStorage = () => {
    const convexUrl = import.meta.env?.VITE_CONVEX_URL as string | undefined;
    if (!convexUrl || typeof window === 'undefined') {
      return;
    }
    const storageNamespace = convexUrl.replace(/[^a-zA-Z0-9]/g, '');
    for (const key of [
      `__convexAuthOAuthVerifier_${storageNamespace}`,
      `__convexAuthJWT_${storageNamespace}`,
      `__convexAuthRefreshToken_${storageNamespace}`,
    ]) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
      document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  };
  const displayError = error ?? guardError;

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
        onOpenSettings={() => setSettingsDialogOpen(true)}
        signOutLabel={signOutLabel}
        user={data.user}
        onSignOut={() => {
          const signOutGuardError = getSignOutGuardError({
            hasActiveSession: Boolean(controller.activeSession),
            storageMode,
          });
          if (signOutGuardError) {
            setGuardError(signOutGuardError);
            return;
          }
          setGuardError(null);
          void controller.handleSignOut();
        }}
        onToggleFocusMode={() => controller.toggleFocusMode()}
      />

      {displayError ? (
        <div className="inline-error sticky-error">
          <span>{displayError}</span>
          <button
            className="text-btn"
            onClick={() => {
              setGuardError(null);
              if (error) {
                onClearError();
              }
            }}
            type="button"
          >
            {t('Dismiss')}
          </button>
        </div>
      ) : null}

      {controller.activeSessionNotice ? (
        <div className="idle-banner sticky-error">
          <span>{controller.activeSessionNotice}</span>
        </div>
      ) : null}

      {controller.recoveryNotice ? (
        <div className="idle-banner sticky-error">
          <div>
            <strong>{t('Recover the restored local session.')}</strong>
            <p>{controller.recoveryNotice}</p>
          </div>
          <div className="cta-row">
            {controller.recoveredSessionCanBeSavedManually ? (
              <button
                className="chip-btn"
                onClick={() => {
                  setGuardError(null);
                  if (error) {
                    onClearError();
                  }
                  controller.openRecoveredSessionAsManual();
                }}
                type="button"
              >
                {t('Save manually')}
              </button>
            ) : null}
            <button
              className="text-btn"
              onClick={() => {
                setGuardError(null);
                if (error) {
                  onClearError();
                }
                controller.discardRecoveredSession();
              }}
              type="button"
            >
                {t('Discard recovery')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="workspace-mode-switcher" role="group" aria-label={t('Tracking mode')}>
        <div>
          <span className="eyebrow">{t('Tracking mode')}</span>
          <strong>{workspaceMode === 'advanced' ? t('Automatic helper') : t('Basic timer')}</strong>
        </div>
        <div className="workspace-mode-options">
          <button
            className={`chip-btn ${workspaceMode === 'simple' ? 'is-active' : ''}`}
            onClick={() => setWorkspaceMode('simple')}
            type="button"
          >
            {t('Basic')}
          </button>
          <button
            aria-describedby={!allowDesktopHelper ? 'auto-mode-note' : undefined}
            className={`chip-btn ${workspaceMode === 'advanced' ? 'is-active' : ''}`}
            disabled={!allowDesktopHelper}
            onClick={() => setWorkspaceMode('advanced')}
            type="button"
          >
            {t('Auto')}
          </button>
        </div>
      </div>
      {!allowDesktopHelper ? (
        <p className="workspace-mode-note" id="auto-mode-note">
          {t('Auto requires Cloud sync. Basic works locally on this device.')}
        </p>
      ) : null}

      <TimerPanel
        activeSession={controller.activeSession}
        autoPauseEnabled={controller.preferences.autoPauseEnabled}
        autoPauseMinutes={controller.preferences.autoPauseMinutes}
        category={controller.category}
        description={controller.description}
        desktopHelperStatus={controller.desktopHelperStatus}
        elapsedSeconds={controller.elapsedSeconds}
        idleNotice={controller.idleNotice}
        sessionNotice={controller.sessionNotice}
        recentProjects={data.recentProjects}
        workspaceMode={autoPauseMode}
        onAutoPauseMinutesChange={(value) => controller.changeAutoPauseMinutes(value)}
        onCategoryChange={controller.setCategory}
        onDescriptionChange={controller.setDescription}
        onDismissIdleNotice={controller.dismissIdleNotice}
        onDismissSessionNotice={controller.dismissSessionNotice}
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

      {allowDesktopHelper && workspaceMode === 'advanced' ? (
        <DesktopHelperPanel
          activities={data.desktopHelperActivities}
          deletingRuleId={controller.busyAction?.startsWith('desktop-rule-delete:') ? controller.busyAction.replace('desktop-rule-delete:', '') : null}
          helperKey={controller.desktopHelperKey}
          privacyBusy={controller.busyAction === 'desktop-helper-privacy'}
          preferences={controller.preferences}
          rules={controller.desktopTrackingRules}
          status={controller.desktopHelperStatus}
          savingRule={controller.busyAction === 'desktop-rule-save'}
          suggestion={controller.desktopProjectSuggestion}
          submitting={controller.busyAction === 'desktop-helper-key'}
          onDeleteRule={controller.handleDeleteTrackingRule}
          onExpandedChange={() => undefined}
          onGenerateKey={() => { void controller.handleIssueDesktopHelperKey(); }}
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
        cleanupGroups={data.cleanupGroups ?? []}
        history={data.history}
        onAddManual={controller.openManualDialog}
        onDelete={controller.openDeleteDialog}
        onEdit={controller.openEditDialog}
        onExportCsv={controller.exportSessions}
        onMerge={async (group) => {
          const confirmed = window.confirm(
            `Scalić ${group.sessionCount} krótkich wpisów „${group.description}” w jeden wpis?`,
          );
          if (!confirmed) return;
          await onMergeSessions({ sessionIds: group.sessionIds });
        }}
      />

      <StopDialog
        activeDescription={controller.activeSession?.description ?? ''}
        elapsedSeconds={controller.elapsedSeconds}
        note={controller.stopNote}
        open={controller.stopDialogOpen}
        reviewedEntries={controller.stopReviewEntries}
        focusSummary={controller.stopFocusSummary}
        reviewedFocusSummary={controller.reviewedStopFocusSummary}
        reviewedBlockKinds={controller.stopReviewedBlockKinds}
        soundEnabled={controller.stopSoundEnabled}
        splitIntoEntries={controller.stopSplitIntoEntries}
        submitting={controller.busyAction === 'stop'}
        onClose={controller.closeStopDialog}
        onConfirm={() => {
          void controller.handleStopConfirm();
        }}
        onNoteChange={controller.setStopNote}
        onToggleSplitIntoEntries={controller.setStopSplitIntoEntries}
        onUpdateReviewedEntry={controller.updateStopReviewEntry}
        onSetReviewedBlockKind={controller.setStopReviewedBlockKind}
        onUseReviewedSummaryNote={controller.useReviewedStopSummaryNote}
        onSoundChange={controller.setStopSoundEnabled}
      />

      <ManualDialog
        draft={controller.manualDraft}
        open={controller.manualDialogOpen}
        recentProjects={data.recentProjects}
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
        recentProjects={data.recentProjects}
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

      <SettingsDialog
        accountDeleteBusy={dangerBusy === 'delete-account'}
        dataDeleteBusy={dangerBusy === 'delete-data'}
        open={settingsDialogOpen}
        preferences={controller.preferences}
        storageMode={storageMode}
        user={data.user}
        onClose={() => setSettingsDialogOpen(false)}
        onDeleteAccount={() => {
          setDangerBusy('delete-account');
          void onDeleteAccount()
            .then(() => {
              if (data.user) {
                clearActiveSessionSnapshot(data.user.id);
              }
              clearConvexAuthStorage();
              window.location.replace(window.location.pathname);
            })
            .finally(() => setDangerBusy(null));
        }}
        onDeleteAllData={() => {
          setDangerBusy('delete-data');
          void onDeleteAllUserData()
            .then(() => {
              if (data.user) {
                clearActiveSessionSnapshot(data.user.id);
              }
              setSettingsDialogOpen(false);
              window.alert(t('All cloud data for this account has been deleted.'));
            })
            .finally(() => setDangerBusy(null));
        }}
        onSavePreferences={controller.savePreferences}
      />
    </div>
  );
}
