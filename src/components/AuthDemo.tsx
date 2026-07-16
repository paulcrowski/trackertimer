import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CircleDot,
  Clock3,
  Eye,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useLanguage } from '../lib/i18n.tsx';

type DemoActivity = {
  app: string;
  context: string;
  tone: 'gold' | 'blue' | 'green';
};

const demoActivities: DemoActivity[] = [
  { app: 'Codex', context: 'building the next feature', tone: 'gold' },
  { app: 'Chrome', context: 'checking the live app', tone: 'blue' },
  { app: 'Calculator', context: 'a short context switch', tone: 'green' },
];

export function AuthDemo({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [elapsed, setElapsed] = useState(0);
  const phase = Math.min(3, Math.floor(elapsed / 3000));
  const phaseLabels = [
    'Step 1 · Manual timer',
    'Step 2 · Automatic detection',
    'Step 3 · You press STOP',
    'Step 4 · Editable summary',
  ];

  useEffect(() => {
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.min(performance.now() - startedAt, 12000));
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  const replay = () => setElapsed(0);

  return (
    <div className="dialog-backdrop auth-demo-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label={t('Automatic tracking demo')}
        aria-modal="true"
        className="auth-demo-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="auth-demo-header">
          <div>
            <div className="auth-demo-kicker">
              <CircleDot size={14} /> {t('Sample session · no data collected')}
            </div>
            <h2>{t('See automatic tracking in action')}</h2>
            <p>
              {t(
                'Worktimer notices context while you work, then gives you a summary you can correct.',
              )}
            </p>
          </div>
          <button aria-label={t('Close demo')} className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="auth-demo-stage">
          <div className="auth-demo-stage-header">
            <span>
              <span className="auth-demo-live-dot" /> {t(phaseLabels[phase])}
            </span>
            <span className="auth-demo-time">
              <Clock3 size={14} /> {phase === 0 ? '00:00' : '00:24'}
            </span>
          </div>
          <DemoStage elapsed={elapsed} phase={phase} />
        </div>

        <footer className="auth-demo-footer">
          <span>
            <ShieldCheck size={15} /> {t('Private by design · review before saving')}
          </span>
          <button className="text-btn" onClick={replay} type="button">
            <RotateCcw size={15} /> {t('Replay')}
          </button>
        </footer>
      </section>
    </div>
  );
}

function DemoStage({ elapsed, phase }: { elapsed: number; phase: number }) {
  const { t } = useLanguage();
  if (phase === 0) {
    return (
      <div className="auth-demo-frame auth-demo-start-frame">
        <span className="auth-demo-frame-label">{t('You choose when work begins')}</span>
        <strong className="auth-demo-timer">00:00:00</strong>
        <span className="auth-demo-fake-button">{t('START SESSION')}</span>
      </div>
    );
  }

  if (phase === 1) {
    const detectionElapsed = elapsed - 3000;
    return (
      <div className="auth-demo-frame auth-demo-detection-frame">
        <span className="auth-demo-frame-label">
          {t('The helper notices context automatically — no typing required')}
        </span>
        <div className="auth-demo-detection-list">
          {demoActivities.map((activity, index) => (
            <div
              className={`auth-demo-detection-row tone-${activity.tone} ${detectionElapsed >= index * 700 ? 'is-detected' : ''}`}
              key={activity.app}
            >
              <span className="auth-demo-activity-marker" />
              <strong>{activity.app}</strong>
              <small>{t(activity.context)}</small>
              <em>{t('detected')}</em>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="auth-demo-frame auth-demo-stop-frame">
        <span className="auth-demo-frame-label">
          {t('When you are done, you press STOP — Worktimer has the context')}
        </span>
        <strong className="auth-demo-stop-button">STOP</strong>
        <span className="auth-demo-stop-note">{t('No silent session. No guesswork.')}</span>
      </div>
    );
  }

  return (
    <div className="auth-demo-frame auth-demo-summary-frame">
      <div className="auth-demo-summary-title">
        <span>
          <Check size={15} /> {t('Session summary ready')}
        </span>
        <span className="auth-demo-editable">
          <Eye size={14} /> {t('editable')}
        </span>
      </div>
      <div className="auth-demo-summary-grid">
        <span>
          <strong>18m</strong> {t('focused work')}
          <br />
          <small>Codex / Worktimer</small>
        </span>
        <span>
          <strong>4m</strong> {t('context switch')}
          <br />
          <small>Calculator</small>
        </span>
        <span>
          <strong>2m</strong> {t('review needed')}
          <br />
          <small>Chrome activity</small>
        </span>
      </div>
      <small className="auth-demo-summary-note">
        {t('Review, edit, or delete the automatically created blocks before saving.')}
      </small>
    </div>
  );
}

export function AuthDemoTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="auth-demo-callout">
      <div className="auth-demo-callout-label">
        <ArrowDownRight size={16} /> {t('Quick preview')}
      </div>
      <div className="auth-demo-callout-copy">
        <strong>{t('Automatic tracking, in 12 seconds')}</strong>
        <span>{t('No helper installation · no data collected')}</span>
      </div>
      <button className="auth-demo-trigger" onClick={onClick} type="button">
        <Play size={14} fill="currentColor" /> {t('Preview the flow')} <ArrowRight size={14} />
      </button>
    </div>
  );
}
