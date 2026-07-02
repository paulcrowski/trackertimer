import {
  formatDurationPretty,
  formatShortDate,
  type CategoryPoint,
  type TrendPoint,
} from '../lib/tracker.ts';

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
      const y =
        chartHeight -
        padding -
        (point.seconds / maxSeconds) * (chartHeight - padding * 2);
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

export function ActivityCharts({
  categories,
  trend,
}: ActivityChartsProps) {
  const maxCategorySeconds = Math.max(...categories.map((item) => item.seconds), 1);
  const maxTrendSeconds = Math.max(...trend.map((item) => item.seconds), 1);

  return (
    <section className="insight-grid">
      <article className="insight-panel">
        <div className="panel-heading">
          <span className="eyebrow">Ostatnie 7 dni</span>
          <h3>Rozkład czasu wg kategorii</h3>
        </div>
        {categories.length ? (
          <div className="bar-list">
            {categories.map((item) => (
              <div className="bar-row" key={item.category}>
                <div className="bar-copy">
                  <strong>{item.category}</strong>
                  <span>{formatDurationPretty(item.seconds)}</span>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div
                    className="bar-fill"
                    style={{ width: `${(item.seconds / maxCategorySeconds) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-copy">Brak danych z ostatnich 7 dni.</p>
        )}
      </article>
      <article className="insight-panel">
        <div className="panel-heading">
          <span className="eyebrow">Ostatnie 30 dni</span>
          <h3>Trend dziennej aktywności</h3>
        </div>
        {trend.length ? (
          <div className="trend-card">
            <svg
              className="trend-chart"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label="Trend aktywności z ostatnich 30 dni"
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
              <span>{formatShortDate(trend[0].date)}</span>
              <strong>Maks: {formatDurationPretty(maxTrendSeconds)}</strong>
              <span>{formatShortDate(trend[trend.length - 1].date)}</span>
            </div>
          </div>
        ) : (
          <p className="empty-copy">Brak danych trendu do narysowania.</p>
        )}
      </article>
    </section>
  );
}
