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
  { app: 'Codex', context: 'back to focused work', tone: 'gold' },
];

export function AuthDemo({ onClose }: { onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const activeCount = Math.min(demoActivities.length, Math.floor(elapsed / 900) + 1);
  const isSummaryVisible = elapsed >= 3900;

  useEffect(() => {
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.min(performance.now() - startedAt, 6200));
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
              <span className="auth-demo-live-dot" /> Auto tracking preview
            </span>
            <span className="auth-demo-time">
              <Clock3 size={14} /> 00:24
            </span>
          </div>
          <div className="auth-demo-activity-list">
            {demoActivities.map((activity, index) => {
              const isVisible = index < activeCount;
              return (
                <div
                  className={`auth-demo-activity ${isVisible ? 'is-visible' : ''} tone-${activity.tone}`}
                  key={`${activity.app}-${index}`}
                >
                  <span className="auth-demo-activity-marker" />
                  <span className="auth-demo-activity-copy">
                    <strong>{activity.app}</strong>
                    <small>{activity.context}</small>
                  </span>
                  {isVisible && index === activeCount - 1 && !isSummaryVisible ? (
                    <span className="auth-demo-detected">detected automatically</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className={`auth-demo-summary ${isSummaryVisible ? 'is-visible' : ''}`}>
            <div className="auth-demo-summary-title">
              <span>
                <Check size={15} /> Session summary ready
              </span>
              <span className="auth-demo-editable">
                <Eye size={14} /> editable
              </span>
            </div>
            <div className="auth-demo-stats">
              <span>
                <strong>18m</strong> focused
              </span>
              <span>
                <strong>3</strong> context switches
              </span>
              <span>
                <strong>1</strong> short distraction
              </span>
            </div>
          </div>
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
