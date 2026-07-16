import { useEffect, useState } from 'react';
import { Check, CircleDot, Eye, MousePointer2, Radar, TimerReset } from 'lucide-react';

const storySteps = [
  {
    eyebrow: '01 / START',
    title: 'You choose when work begins.',
    copy: 'A simple manual timer stays the source of truth.',
    icon: TimerReset,
  },
  {
    eyebrow: '02 / NOTICE',
    title: 'Automatic tracking notices context.',
    copy: 'Worktimer recognizes the apps and browser context around your session.',
    icon: Radar,
  },
  {
    eyebrow: '03 / REVIEW',
    title: 'You decide what the day meant.',
    copy: 'At STOP, the activity becomes an editable summary — not a verdict.',
    icon: Eye,
  },
] as const;

export function AuthStorySlider() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % storySteps.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const step = storySteps[activeStep];
  const Icon = step.icon;

  return (
    <div className="auth-story" aria-label="How Worktimer works">
      <div className="auth-story-topline">
        <span>How Worktimer works</span>
        <span>{String(activeStep + 1).padStart(2, '0')} / 03</span>
      </div>
      <div className="auth-story-progress" aria-hidden="true">
        <span style={{ width: `${((activeStep + 1) / storySteps.length) * 100}%` }} />
      </div>
      <div className="auth-story-content" key={activeStep}>
        <div className="auth-story-icon">
          <Icon size={26} />
        </div>
        <span className="auth-story-eyebrow">{step.eyebrow}</span>
        <h2>{step.title}</h2>
        <p>{step.copy}</p>
        <StoryVisual step={activeStep} />
      </div>
      <div className="auth-story-dots" role="tablist" aria-label="Worktimer steps">
        {storySteps.map((item, index) => (
          <button
            aria-label={`Show step ${index + 1}: ${item.eyebrow}`}
            aria-selected={activeStep === index}
            className={activeStep === index ? 'is-active' : ''}
            key={item.eyebrow}
            onClick={() => setActiveStep(index)}
            role="tab"
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

function StoryVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="auth-story-visual auth-story-start">
        <MousePointer2 size={18} />
        <span>Manual control</span>
        <strong>START</strong>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="auth-story-visual auth-story-detection">
        <span>
          <CircleDot size={13} /> Codex <small>detected automatically</small>
        </span>
        <span>
          <CircleDot size={13} /> Chrome <small>detected automatically</small>
        </span>
        <span>
          <CircleDot size={13} /> Calculator <small>context switch</small>
        </span>
      </div>
    );
  }
  return (
    <div className="auth-story-visual auth-story-review">
      <span>
        <Check size={15} /> Session summary ready
      </span>
      <strong>18m focused · 3 context switches</strong>
      <small>
        <Eye size={13} /> Review, edit, or delete before saving
      </small>
    </div>
  );
}
