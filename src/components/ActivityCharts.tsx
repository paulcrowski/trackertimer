import {
  formatDurationPretty,
  formatCategoryLabel,
  formatShortDate,
  type CategoryPoint,
  type TrendPoint,
} from '../lib/tracker.ts';
import { useLanguage } from '../lib/i18n.tsx';

type ActivityChartsProps = {
  categories: CategoryPoint[];
  trend: TrendPoint[];
};

const chartWidth = 640;
const chartHeight = 220;
const padding = 24;

function buildTrendPath(trend: TrendPoint[]) {
  const maxSeconds = Math.max(...trend.map((point) => point.seconds), 1);
  const step = trend.length > 1 ? (chartWidth - padding * 2) / (trend.length - 1) : 0;

  return trend
    .map((point, index) => {
      const x = padding + step * index;
      const y = chartHeight - padding - (point.seconds / maxSeconds) * (chartHeight - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(trend: TrendPoint[]) {
  if (!trend.length) return '';
  const linePath = buildTrendPath(trend);
  const step = trend.length > 1 ? (chartWidth - padding * 2) / (trend.length - 1) : 0;
  const lastX = padding + step * (trend.length - 1);
  const baseline = chartHeight - padding;
  return `${linePath} L ${lastX} ${baseline} L ${padding} ${baseline} Z`;
}

export function ActivityCharts({ categories, trend }: ActivityChartsProps) {
  const { t, language } = useLanguage();
  const maxCategorySeconds = Math.max(...categories.map((item) => item.seconds), 1);
  const maxTrendSeconds = Math.max(...trend.map((item) => item.seconds), 1);

  return (
    <section className="insight-grid">
      <article className="insight-panel">
        <div className="panel-heading">
          <span className="eyebrow">{t('Last 7 days')}</span>
          <h3>{t('Time by category')}</h3>
        </div>
        {categories.length ? (
          <div className="bar-list">
            {categories.map((item) => (
              <div className="bar-row" key={item.category}>
                <div className="bar-copy">
                  <strong>{t(formatCategoryLabel(item.category))}</strong>
                  <span>{formatDurationPretty(item.seconds)}</span>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(item.seconds / maxCategorySeconds) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-copy">{t('No data from the last 7 days.')}</p>
        )}
      </article>
      <article className="insight-panel">
        <div className="panel-heading">
          <span className="eyebrow">{t('Last 30 days')}</span>
          <h3>{t('Daily activity trend')}</h3>
        </div>
        {trend.length ? (
          <div className="trend-card">
            <svg
              className="trend-chart"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={t('Activity trend for the last 30 days')}
            >
              <defs>
                <linearGradient id="trendFill" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(212, 175, 55, 0.38)" />
                  <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
                </linearGradient>
              </defs>
              <path className="trend-area" d={buildAreaPath(trend)} fill="url(#trendFill)" />
              <path className="trend-line" d={buildTrendPath(trend)} />
            </svg>
            <div className="trend-meta">
              <span>{formatShortDate(trend[0].date, language === 'pl' ? 'pl-PL' : 'en-US')}</span>
              <strong>
                {t('Max:')} {formatDurationPretty(maxTrendSeconds)}
              </strong>
              <span>
                {formatShortDate(
                  trend[trend.length - 1].date,
                  language === 'pl' ? 'pl-PL' : 'en-US',
                )}
              </span>
            </div>
          </div>
        ) : (
          <p className="empty-copy">{t('There is no trend data to draw yet.')}</p>
        )}
      </article>
    </section>
  );
}
