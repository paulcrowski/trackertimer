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
  const [elapsed, setElapsed] = useState(0);
  const phase = Math.min(3, Math.floor(elapsed / 1600));
  const phaseLabels = ['Manual timer', 'Automatic detection', 'You press STOP', 'Editable summary'];

  useEffect(() => {
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.min(performance.now() - startedAt, 6400));
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  const replay = () => setElapsed(0);

  return (
    <div className="dialog-backdrop auth-demo-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Automatic tracking demo"
        aria-modal="true"
        className="auth-demo-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="auth-demo-header">
          <div>
            <div className="auth-demo-kicker">
              <CircleDot size={14} /> Sample session · no data collected
            </div>
            <h2>See automatic tracking in action</h2>
            <p>
              Worktimer notices context while you work, then gives you a summary you can correct.
            </p>
          </div>
          <button aria-label="Close demo" className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="auth-demo-stage">
          <div className="auth-demo-stage-header">
            <span>
              <span className="auth-demo-live-dot" /> {phaseLabels[phase]}
            </span>
            <span className="auth-demo-time">
              <Clock3 size={14} /> {phase === 0 ? '00:00' : '00:24'}
            </span>
          </div>
          <DemoStage phase={phase} />
        </div>

        <footer className="auth-demo-footer">
          <span>
            <ShieldCheck size={15} /> Private by design · review before saving
          </span>
          <button className="text-btn" onClick={replay} type="button">
            <RotateCcw size={15} /> Replay
          </button>
        </footer>
      </section>
    </div>
  );
}

function DemoStage({ phase }: { phase: number }) {
  if (phase === 0) {
    return (
      <div className="auth-demo-frame auth-demo-start-frame">
        <span className="auth-demo-frame-label">You choose when work begins</span>
        <strong className="auth-demo-timer">00:00:00</strong>
        <span className="auth-demo-fake-button">START SESSION</span>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="auth-demo-frame auth-demo-detection-frame">
        <span className="auth-demo-frame-label">Worktimer notices context automatically</span>
        <div className="auth-demo-detection-list">
          {demoActivities.map((activity) => (
            <div className={`auth-demo-detection-row tone-${activity.tone}`} key={activity.app}>
              <span className="auth-demo-activity-marker" />
              <strong>{activity.app}</strong>
              <small>{activity.context}</small>
              <em>detected</em>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="auth-demo-frame auth-demo-stop-frame">
        <span className="auth-demo-frame-label">When you are done, you press STOP</span>
        <strong className="auth-demo-stop-button">STOP</strong>
        <span className="auth-demo-stop-note">No silent session. No guesswork.</span>
      </div>
    );
  }

  return (
    <div className="auth-demo-frame auth-demo-summary-frame">
      <div className="auth-demo-summary-title">
        <span>
          <Check size={15} /> Session summary ready
        </span>
        <span className="auth-demo-editable">
          <Eye size={14} /> editable
        </span>
      </div>
      <div className="auth-demo-summary-grid">
        <span>
          <strong>18m</strong> focused work
        </span>
        <span>
          <strong>3</strong> contexts detected
        </span>
        <span>
          <strong>1</strong> short distraction
        </span>
      </div>
      <small className="auth-demo-summary-note">Review, edit, or delete before saving.</small>
    </div>
  );
}

export function AuthDemoTrigger({ onClick }: { onClick: () => void }) {
  return (
    <div className="auth-demo-callout">
      <div className="auth-demo-callout-label">
        <ArrowDownRight size={20} /> Try this first
      </div>
      <div className="auth-demo-callout-copy">
        <strong>See how automatic tracking works</strong>
        <span>No helper installation · no data collected</span>
      </div>
      <button className="auth-demo-trigger" onClick={onClick} type="button">
        <Play size={15} fill="currentColor" /> Watch the 8-second demo <ArrowRight size={15} />
      </button>
    </div>
  );
}
