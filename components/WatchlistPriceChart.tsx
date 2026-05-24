'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { BarChart3, Brain, Loader2, Newspaper, RefreshCw, TrendingUp } from 'lucide-react';
import { getWatchlistPriceChartData } from '@/lib/actions/price-history.actions';
import { t } from '@/lib/i18n';

const RANGES: Array<{ value: PriceChartRange; label: string }> = [
  { value: '7d', label: '7 дней' },
  { value: '1m', label: '1 месяц' },
  { value: '3m', label: '3 месяца' },
  { value: '6m', label: '6 месяцев' },
  { value: '1y', label: '1 год' },
];

const CHART_WIDTH = 920;
const CHART_HEIGHT = 380;
const MARGIN = { top: 26, right: 34, bottom: 46, left: 70 };
const MAX_SELECTED_SERIES = 6;

const formatAxisDate = (timestamp: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(timestamp));

function formatChartValue(value: number, mode: PriceChartMode) {
  if (mode === 'percent') {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function getPointValue(point: PriceChartPoint, mode: PriceChartMode) {
  return mode === 'percent' ? point.changePercent : point.price;
}

function getDomain(values: number[]) {
  if (!values.length) return { min: 0, max: 1 };

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const pad = Math.abs(min || 1) * 0.08;
    min -= pad;
    max += pad;
  } else {
    const pad = (max - min) * 0.12;
    min -= pad;
    max += pad;
  }

  return { min, max };
}

function nearestPoint(points: PriceChartPoint[], timestamp: number) {
  if (!points.length) return null;

  return points.reduce((closest, point) => {
    return Math.abs(point.timestamp - timestamp) < Math.abs(closest.timestamp - timestamp)
      ? point
      : closest;
  }, points[0]);
}

function getPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

const WatchlistPriceChart = () => {
  const [range, setRange] = useState<PriceChartRange>('1m');
  const [mode, setMode] = useState<PriceChartMode>('percent');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [data, setData] = useState<PriceChartData | null>(null);
  const [hoverTimestamp, setHoverTimestamp] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const savedRange = window.localStorage.getItem('signalist-chart-range') as PriceChartRange | null;
    const savedMode = window.localStorage.getItem('signalist-chart-mode') as PriceChartMode | null;
    const savedBenchmark = window.localStorage.getItem('signalist-chart-benchmark');

    if (savedRange && RANGES.some((item) => item.value === savedRange)) setRange(savedRange);
    if (savedMode === 'price' || savedMode === 'percent') setMode(savedMode);
    if (savedBenchmark === '0') setShowBenchmark(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('signalist-chart-range', range);
    window.localStorage.setItem('signalist-chart-mode', mode);
    window.localStorage.setItem('signalist-chart-benchmark', showBenchmark ? '1' : '0');
  }, [range, mode, showBenchmark]);

  useEffect(() => {
    startTransition(async () => {
      const result = await getWatchlistPriceChartData(range);
      setData(result);
      setHoverTimestamp(null);
      setSelectedSymbols((current) => {
        const availableSymbols = result.series.map((item) => item.symbol);
        const next = current.filter((symbol) => availableSymbols.includes(symbol));
        return next.length ? next.slice(0, MAX_SELECTED_SERIES) : availableSymbols.slice(0, MAX_SELECTED_SERIES);
      });
    });
  }, [range]);

  const visibleSeries = useMemo(() => {
    const selected = data?.series.filter((item) => selectedSymbols.includes(item.symbol)) || [];
    if (showBenchmark && data?.benchmark) return [...selected, data.benchmark];
    return selected;
  }, [data, selectedSymbols, showBenchmark]);

  const chartState = useMemo(() => {
    const allPoints = visibleSeries.flatMap((item) => item.points);
    const timestamps = Array.from(new Set(allPoints.map((point) => point.timestamp))).sort((a, b) => a - b);

    if (!timestamps.length) {
      return null;
    }

    const xMin = timestamps[0];
    const xMax = timestamps[timestamps.length - 1];
    const yValues = allPoints.map((point) => getPointValue(point, mode));
    const yDomain = getDomain(yValues);
    const plotWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
    const xScale = (timestamp: number) => {
      if (xMin === xMax) return MARGIN.left + plotWidth / 2;
      return MARGIN.left + ((timestamp - xMin) / (xMax - xMin)) * plotWidth;
    };
    const yScale = (value: number) => {
      return MARGIN.top + ((yDomain.max - value) / (yDomain.max - yDomain.min)) * plotHeight;
    };
    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const value = yDomain.min + ((yDomain.max - yDomain.min) / 4) * index;
      return {
        value,
        y: yScale(value),
      };
    }).reverse();
    const xTicks = Array.from({ length: Math.min(5, timestamps.length) }, (_, index) => {
      const timestamp = timestamps[Math.round((index / (Math.min(5, timestamps.length) - 1 || 1)) * (timestamps.length - 1))];
      return {
        timestamp,
        x: xScale(timestamp),
      };
    });

    return {
      timestamps,
      xMin,
      xMax,
      xScale,
      yScale,
      yTicks,
      xTicks,
      plotTop: MARGIN.top,
      plotBottom: CHART_HEIGHT - MARGIN.bottom,
      plotLeft: MARGIN.left,
      plotRight: CHART_WIDTH - MARGIN.right,
    };
  }, [mode, visibleSeries]);

  const hoverData = useMemo(() => {
    if (!chartState || hoverTimestamp === null) return null;

    const timestamp = chartState.timestamps.reduce((closest, item) => {
      return Math.abs(item - hoverTimestamp) < Math.abs(closest - hoverTimestamp) ? item : closest;
    }, chartState.timestamps[0]);

    return {
      timestamp,
      date: formatAxisDate(timestamp),
      x: chartState.xScale(timestamp),
      rows: visibleSeries.map((series) => ({
        series,
        point: nearestPoint(series.points, timestamp),
      })),
    };
  }, [chartState, hoverTimestamp, visibleSeries]);

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((current) => {
      if (current.includes(symbol)) return current.filter((item) => item !== symbol);
      if (current.length >= MAX_SELECTED_SERIES) return current;
      return [...current, symbol];
    });
  };

  const refresh = () => {
    startTransition(async () => {
      const result = await getWatchlistPriceChartData(range);
      setData(result);
      setHoverTimestamp(null);
    });
  };

  const hasData = Boolean(data?.series.length);

  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500 text-gray-950">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{t('priceChart.title')}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              {t('priceChart.description')}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-gray-600 px-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={refresh}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {t('priceChart.refresh')}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button
              type="button"
              key={item.value}
              className={`h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                range === item.value
                  ? 'border-yellow-500 bg-yellow-500 text-gray-950'
                  : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-500'
              }`}
              onClick={() => setRange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['percent', 'price'] as PriceChartMode[]).map((item) => (
            <button
              type="button"
              key={item}
              className={`h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                mode === item
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                  : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-500'
              }`}
              onClick={() => setMode(item)}
            >
              {item === 'percent' ? t('priceChart.modePercent') : t('priceChart.modePrice')}
            </button>
          ))}

          <button
            type="button"
            className={`h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${
              showBenchmark
                ? 'border-gray-400 bg-gray-500/10 text-gray-200'
                : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setShowBenchmark((value) => !value)}
          >
            {t('priceChart.benchmark')}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {data?.series.map((series) => {
          const isSelected = selectedSymbols.includes(series.symbol);
          const isDisabled = !isSelected && selectedSymbols.length >= MAX_SELECTED_SERIES;

          return (
            <button
              type="button"
              key={series.symbol}
              disabled={isDisabled}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? 'border-gray-500 bg-gray-700 text-gray-100'
                  : 'border-gray-600 bg-gray-900/40 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
              onClick={() => handleToggleSymbol(series.symbol)}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              {series.symbol}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg border border-gray-600 bg-gray-900/50 p-3">
        {isPending && !data ? (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('priceChart.loading')}
          </div>
        ) : !hasData || !chartState ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
            <BarChart3 className="h-8 w-8 text-gray-600" />
            <p className="max-w-md text-sm leading-6 text-gray-500">
              {data?.aiInsight || t('priceChart.empty')}
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="min-w-[760px] select-none"
                role="img"
                aria-label={t('priceChart.title')}
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
                  const ratio = Math.min(
                    1,
                    Math.max(0, (x - chartState.plotLeft) / (chartState.plotRight - chartState.plotLeft))
                  );
                  setHoverTimestamp(chartState.xMin + ratio * (chartState.xMax - chartState.xMin));
                }}
                onMouseLeave={() => setHoverTimestamp(null)}
              >
                <rect
                  x={chartState.plotLeft}
                  y={chartState.plotTop}
                  width={chartState.plotRight - chartState.plotLeft}
                  height={chartState.plotBottom - chartState.plotTop}
                  fill="transparent"
                />

                {chartState.yTicks.map((tick) => (
                  <g key={tick.value}>
                    <line
                      x1={chartState.plotLeft}
                      x2={chartState.plotRight}
                      y1={tick.y}
                      y2={tick.y}
                      stroke="#374151"
                      strokeDasharray="4 6"
                    />
                    <text x={14} y={tick.y + 4} fill="#9CA3AF" fontSize="12">
                      {formatChartValue(tick.value, mode)}
                    </text>
                  </g>
                ))}

                {chartState.xTicks.map((tick) => (
                  <text
                    key={tick.timestamp}
                    x={tick.x}
                    y={CHART_HEIGHT - 14}
                    fill="#9CA3AF"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {formatAxisDate(tick.timestamp)}
                  </text>
                ))}

                {data?.newsMarkers
                  .filter((marker) => marker.timestamp >= chartState.xMin && marker.timestamp <= chartState.xMax)
                  .map((marker) => {
                    const x = chartState.xScale(marker.timestamp);
                    return (
                      <g key={marker.id}>
                        <line
                          x1={x}
                          x2={x}
                          y1={chartState.plotTop}
                          y2={chartState.plotBottom}
                          stroke="#FDD458"
                          strokeOpacity="0.35"
                          strokeDasharray="2 8"
                        />
                        <circle cx={x} cy={chartState.plotTop + 8} r="4" fill="#FDD458">
                          <title>{`${marker.symbol}: ${marker.headline}`}</title>
                        </circle>
                      </g>
                    );
                  })}

                {visibleSeries.map((series) => {
                  const coords = series.points.map((point) => ({
                    x: chartState.xScale(point.timestamp),
                    y: chartState.yScale(getPointValue(point, mode)),
                  }));

                  return (
                    <path
                      key={series.symbol}
                      d={getPath(coords)}
                      fill="none"
                      stroke={series.color}
                      strokeWidth={series.isBenchmark ? 2 : 2.8}
                      strokeOpacity={series.isBenchmark ? 0.65 : 1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

                {hoverData ? (
                  <g>
                    <line
                      x1={hoverData.x}
                      x2={hoverData.x}
                      y1={chartState.plotTop}
                      y2={chartState.plotBottom}
                      stroke="#E5E7EB"
                      strokeOpacity="0.35"
                    />
                    <circle cx={hoverData.x} cy={chartState.plotTop} r="3" fill="#E5E7EB" />
                  </g>
                ) : null}
              </svg>
            </div>

            {hoverData ? (
              <div className="mt-3 rounded-lg border border-gray-600 bg-gray-800 p-3">
                <div className="text-sm font-semibold text-gray-100">{hoverData.date}</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {hoverData.rows.map(({ series, point }) => (
                    <div className="flex items-center justify-between gap-3 text-sm" key={series.symbol}>
                      <span className="inline-flex items-center gap-2 text-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                        {series.symbol}
                      </span>
                      <span className="font-semibold text-gray-100">
                        {point ? formatChartValue(getPointValue(point, mode), mode) : 'Нет данных'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {data ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-gray-600 bg-gray-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
              <Brain className="h-4 w-4 text-yellow-500" />
              {t('priceChart.aiInsight')}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-400">{data.aiInsight}</p>
          </div>

          <div className="rounded-lg border border-gray-600 bg-gray-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
              <Newspaper className="h-4 w-4 text-yellow-500" />
              {t('priceChart.newsMarkers')}
            </div>
            {data.newsMarkers.length ? (
              <div className="mt-3 grid gap-3">
                {data.newsMarkers.slice(0, 3).map((marker) => (
                  <a
                    href={marker.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-gray-700 bg-gray-800/70 p-3 transition-colors hover:border-yellow-500"
                    key={marker.id}
                  >
                    <div className="text-xs font-semibold text-yellow-500">
                      {marker.symbol} · {formatAxisDate(marker.timestamp)}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm leading-5 text-gray-300">{marker.headline}</div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-gray-500">{t('priceChart.noNewsMarkers')}</p>
            )}
          </div>
        </div>
      ) : null}

      {data?.unavailableSymbols.length || data?.skippedSymbols.length ? (
        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm leading-6 text-yellow-200">
          {data.unavailableSymbols.length ? (
            <div>{t('priceChart.unavailable', { symbols: data.unavailableSymbols.join(', ') })}</div>
          ) : null}
          {data.skippedSymbols.length ? (
            <div>{t('priceChart.skipped', { symbols: data.skippedSymbols.join(', ') })}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default WatchlistPriceChart;
