import { useEffect, useState } from 'react';
import { Check, CircleDot, Eye, Gauge, MousePointer2, Radar, TimerReset } from 'lucide-react';
import { useLanguage } from '../lib/i18n.tsx';

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
  {
    eyebrow: '04 / RHYTHM',
    title: 'Work in cycles. Stop before you overwork.',
    copy: 'Focus cycles show the progress you made and when it is time to take a break.',
    icon: Gauge,
  },
] as const;

export function AuthStorySlider() {
  const { t } = useLanguage();
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
    <div className="auth-story" aria-label={t('How Worktimer works')}>
      <div className="auth-story-topline">
        <span>{t('How Worktimer works')}</span>
        <span>{String(activeStep + 1).padStart(2, '0')} / 04</span>
      </div>
      <div className="auth-story-progress" aria-hidden="true">
        <span style={{ width: `${((activeStep + 1) / storySteps.length) * 100}%` }} />
      </div>
      <div className="auth-story-content" key={activeStep}>
        <div className="auth-story-icon">
          <Icon size={26} />
        </div>
        <span className="auth-story-eyebrow">{t(step.eyebrow)}</span>
        <h2>{t(step.title)}</h2>
        <p>{t(step.copy)}</p>
        <StoryVisual step={activeStep} />
      </div>
      <div className="auth-story-dots" role="tablist" aria-label={t('Worktimer steps')}>
        {storySteps.map((item, index) => (
          <button
            aria-label={`${t('Show step')} ${index + 1}: ${t(item.eyebrow)}`}
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
  const { t } = useLanguage();
  if (step === 0) {
    return (
      <div className="auth-story-visual auth-story-start">
        <MousePointer2 size={18} />
        <span>{t('Manual control')}</span>
        <strong>START</strong>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="auth-story-visual auth-story-detection">
        <span>
          <CircleDot size={13} /> Codex <small>{t('detected automatically')}</small>
        </span>
        <span>
          <CircleDot size={13} /> Chrome <small>{t('detected automatically')}</small>
        </span>
        <span>
          <CircleDot size={13} /> Calculator <small>{t('context switch')}</small>
        </span>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="auth-story-visual auth-story-review">
        <span>
          <Check size={15} /> {t('Session summary ready')}
        </span>
        <strong>{t('18m focused · 3 context switches')}</strong>
        <small>
          <Eye size={13} /> {t('Review, edit, or delete before saving')}
        </small>
      </div>
    );
  }
  return (
    <div className="auth-story-visual auth-story-rhythm">
      <span>
        <Gauge size={15} /> {t('Focus cycle in progress')}
      </span>
      <div className="auth-story-rhythm-row">
        <strong>24:18</strong>
        <span>{t('of 25:00')}</span>
        <em>{t('+1 focus win')}</em>
      </div>
      <small>{t('See your rhythm, then stop on time.')}</small>
    </div>
  );
}
