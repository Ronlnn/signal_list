'use server';

import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';
import { callGemini } from '@/lib/ai/gemini';
import { formatPrice } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const STOOQ_BASE_URL = 'https://stooq.com/q/d/l/';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';
const MAX_SERIES_TO_FETCH = 12;
const MAX_NEWS_MARKERS = 8;
const BENCHMARK_SYMBOL = 'SPY';

const SERIES_COLORS = [
  '#FDD458',
  '#38BDF8',
  '#34D399',
  '#F87171',
  '#A78BFA',
  '#FB923C',
  '#2DD4BF',
  '#F472B6',
  '#A3E635',
  '#60A5FA',
  '#FACC15',
  '#C084FC',
];

const RANGE_CONFIG: Record<PriceChartRange, { days: number; label: string }> = {
  '7d': { days: 14, label: '7 дней' },
  '1m': { days: 40, label: '1 месяц' },
  '3m': { days: 100, label: '3 месяца' },
  '6m': { days: 190, label: '6 месяцев' },
  '1y': { days: 370, label: '1 год' },
};

const RANGE_POINT_LIMIT: Record<PriceChartRange, number> = {
  '7d': 8,
  '1m': 24,
  '3m': 70,
  '6m': 135,
  '1y': 260,
};

type WatchlistLeanItem = {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
};

type FinnhubCandleResponse = {
  c?: number[];
  t?: number[];
  s?: string;
};

type FinnhubNewsArticle = {
  id?: number;
  headline?: string;
  url?: string;
  datetime?: number;
  related?: string;
};

async function getCurrentUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

function getFinnhubToken() {
  return process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
}

async function fetchJSON<T>(url: string, revalidateSeconds = 3600): Promise<T> {
  const res = await fetch(url, {
    cache: 'force-cache',
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

function getUnixRange(range: PriceChartRange) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - RANGE_CONFIG[range].days * 24 * 60 * 60;

  return { from, to };
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function normalizeRange(value: PriceChartRange): PriceChartRange {
  return value in RANGE_CONFIG ? value : '1m';
}

function normalizeFinnhubSymbol(symbol: string) {
  const cleaned = symbol.trim().toUpperCase();
  if (cleaned.includes(':')) return cleaned.split(':').pop() || cleaned;
  return cleaned;
}

function normalizeStooqSymbol(symbol: string) {
  const normalized = normalizeFinnhubSymbol(symbol).toLowerCase();
  if (normalized.includes('.')) return normalized;
  return `${normalized}.us`;
}

function getStooqSymbolCandidates(symbol: string) {
  const normalized = normalizeFinnhubSymbol(symbol).toLowerCase();
  const withUsSuffix = normalizeStooqSymbol(symbol);
  const withPlSuffix = normalized.includes('.') ? normalized : `${normalized}.pl`;

  return Array.from(new Set([withUsSuffix, withPlSuffix, normalized]));
}

function formatStooqDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getCandleUnavailableReason(candles?: FinnhubCandleResponse) {
  if (!candles) return 'Нет ответа от источника исторических данных';
  if (candles.s === 'no_data') return 'Stooq не вернул исторические цены для доступных вариантов тикера';
  if (candles.s && candles.s !== 'ok') return `Статус источника исторических данных: ${candles.s}`;
  if (!Array.isArray(candles.c) || !Array.isArray(candles.t)) return 'Некорректный формат свечей';
  if (candles.c.length < 2 || candles.t.length < 2) return 'Недостаточно точек для графика';
  return 'Не удалось построить серию';
}

function mapCandlesToSeries({
  item,
  candles,
  color,
  isBenchmark = false,
}: {
  item: Pick<WatchlistLeanItem, 'symbol' | 'company'>;
  candles: FinnhubCandleResponse;
  color: string;
  isBenchmark?: boolean;
}): PriceChartSeries | null {
  if (candles.s !== 'ok' || !Array.isArray(candles.c) || !Array.isArray(candles.t)) {
    return null;
  }

  const rawPoints = candles.c
    .map((price, index) => ({
      price,
      timestamp: (candles.t?.[index] || 0) * 1000,
    }))
    .filter((point) => Number.isFinite(point.price) && point.price > 0 && point.timestamp > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (rawPoints.length < 2) return null;

  const startPrice = rawPoints[0].price;
  const points = rawPoints.map((point) => ({
    ...point,
    date: new Date(point.timestamp).toISOString().slice(0, 10),
    changePercent: ((point.price - startPrice) / startPrice) * 100,
  }));
  const lastPoint = points[points.length - 1];

  return {
    symbol: item.symbol,
    company: item.company,
    color,
    currentPriceFormatted: formatPrice(lastPoint.price),
    periodChangePercent: lastPoint.changePercent,
    periodChangeFormatted: formatPercent(lastPoint.changePercent),
    points,
    isBenchmark,
  };
}

async function getCandles(symbol: string, range: PriceChartRange) {
  return getStooqDailyCandles(symbol, range);
}

async function getStooqDailyCandles(symbol: string, range: PriceChartRange): Promise<FinnhubCandleResponse> {
  const { from, to } = getUnixRange(range);
  const extendedFrom = to - 3 * 365 * 24 * 60 * 60;
  const rangeAttempts = [
    { from, to },
    { from: extendedFrom, to },
  ];
  const symbolCandidates = getStooqSymbolCandidates(symbol);

  for (const candidate of symbolCandidates) {
    for (const attempt of rangeAttempts) {
      const candles = await fetchStooqCandidate(candidate, attempt.from, attempt.to);
      if (candles.s === 'ok') return trimCandlesToRange(candles, range);
    }
  }

  return { s: 'no_data' };
}

function trimCandlesToRange(
  candles: FinnhubCandleResponse,
  range: PriceChartRange
): FinnhubCandleResponse {
  if (!Array.isArray(candles.c) || !Array.isArray(candles.t)) return candles;

  const limit = RANGE_POINT_LIMIT[range];
  return {
    ...candles,
    c: candles.c.slice(-limit),
    t: candles.t.slice(-limit),
  };
}

async function fetchStooqCandidate(
  stooqSymbol: string,
  from: number,
  to: number
): Promise<FinnhubCandleResponse> {
  const fromDate = formatStooqDate(new Date(from * 1000));
  const toDate = formatStooqDate(new Date(to * 1000));
  const url = `${STOOQ_BASE_URL}?s=${encodeURIComponent(stooqSymbol)}&d1=${fromDate}&d2=${toDate}&i=d`;
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stooq fetch failed ${res.status}: ${text}`);
  }

  const csv = await res.text();
  const lines = csv.trim().split(/\r?\n/);

  if (lines.length < 2 || lines[0]?.toLowerCase().startsWith('no data')) {
    return { s: 'no_data' };
  }

  const timestamps: number[] = [];
  const closePrices: number[] = [];

  for (const line of lines.slice(1)) {
    const [date, , , , close] = line.split(',');
    const closePrice = Number(close);
    const timestamp = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);

    if (!date || !Number.isFinite(closePrice) || !Number.isFinite(timestamp)) continue;

    timestamps.push(timestamp);
    closePrices.push(closePrice);
  }

  if (closePrices.length < 2) return { s: 'no_data' };

  return {
    s: 'ok',
    c: closePrices,
    t: timestamps,
  };
}

async function getNewsMarkers(
  items: WatchlistLeanItem[],
  range: PriceChartRange,
  token: string
): Promise<PriceChartNewsMarker[]> {
  if (!token) return [];

  const { from, to } = getUnixRange(range);
  const fromDate = new Date(from * 1000).toISOString().slice(0, 10);
  const toDate = new Date(to * 1000).toISOString().slice(0, 10);
  const markers: PriceChartNewsMarker[] = [];

  await Promise.all(
    items.slice(0, 6).map(async (item) => {
      try {
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(item.symbol)}&from=${fromDate}&to=${toDate}&token=${token}`;
        const articles = await fetchJSON<FinnhubNewsArticle[]>(url, 3600);

        for (const article of articles || []) {
          if (!article.headline || !article.url || !article.datetime) continue;
          markers.push({
            id: `${item.symbol}-${article.id || article.datetime}`,
            symbol: item.symbol,
            headline: article.headline,
            url: article.url,
            date: new Date(article.datetime * 1000).toISOString().slice(0, 10),
            timestamp: article.datetime * 1000,
          });
        }
      } catch (err) {
        console.error('getNewsMarkers error:', item.symbol, err);
      }
    })
  );

  const seen = new Set<string>();

  return markers
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((marker) => {
      const key = `${marker.symbol}-${marker.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_NEWS_MARKERS)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function buildFallbackInsight(series: PriceChartSeries[], range: PriceChartRange) {
  if (!series.length) return 'Недостаточно исторических данных для вывода по динамике списка.';

  const sorted = [...series].sort((a, b) => b.periodChangePercent - a.periodChangePercent);
  const leader = sorted[0];
  const laggard = sorted[sorted.length - 1];

  if (leader.symbol === laggard.symbol) {
    return `${leader.symbol} за период "${RANGE_CONFIG[range].label}" изменился на ${leader.periodChangeFormatted}. Следите за новостями и волатильностью вокруг этой компании.`;
  }

  return `${leader.symbol} выглядит сильнее остальных за период "${RANGE_CONFIG[range].label}" (${leader.periodChangeFormatted}), а ${laggard.symbol} показывает самую слабую динамику (${laggard.periodChangeFormatted}).`;
}

async function buildAiInsight(series: PriceChartSeries[], range: PriceChartRange) {
  if (!series.length) return buildFallbackInsight(series, range);

  const compact = series.map((item) => ({
    symbol: item.symbol,
    company: item.company,
    periodChange: item.periodChangeFormatted,
    currentPrice: item.currentPriceFormatted,
  }));

  try {
    const result = await callGemini(`Сделай короткий аналитический вывод на русском языке по динамике watchlist за период ${RANGE_CONFIG[range].label}.

Данные:
${JSON.stringify(compact, null, 2)}

Требования:
- 2 коротких предложения.
- Не советуй покупать или продавать.
- Отметь лидера, отстающего и общий риск/контекст.
- Верни только текст.`);

    return result?.trim() || buildFallbackInsight(series, range);
  } catch (err) {
    console.error('buildAiInsight error:', err);
    return buildFallbackInsight(series, range);
  }
}

export async function getWatchlistPriceChartData(
  requestedRange: PriceChartRange = '1m'
): Promise<PriceChartData> {
  const range = normalizeRange(requestedRange);
  const token = getFinnhubToken();

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        range,
        generatedAt: new Date().toISOString(),
        series: [],
        benchmark: null,
        newsMarkers: [],
      aiInsight: 'Войдите в аккаунт, чтобы увидеть динамику компаний из списка.',
      unavailableSymbols: [],
      unavailableReasons: {},
      attemptedSymbols: {},
      skippedSymbols: [],
      };
    }

    await connectToDatabase();

    const watchlistItems = await Watchlist.find({ userId })
      .sort({ addedAt: -1 })
      .lean<WatchlistLeanItem[]>();
    const itemsToFetch = watchlistItems.slice(0, MAX_SERIES_TO_FETCH);
    const skippedSymbols = watchlistItems
      .slice(MAX_SERIES_TO_FETCH)
      .map((item) => item.symbol);

    if (!itemsToFetch.length) {
      return {
        range,
        generatedAt: new Date().toISOString(),
        series: [],
        benchmark: null,
        newsMarkers: [],
        aiInsight: 'Добавьте компании в список, чтобы увидеть динамику цен.',
        unavailableSymbols: [],
        unavailableReasons: {},
        attemptedSymbols: {},
        skippedSymbols,
      };
    }

    const candlesResults = await Promise.allSettled(
      itemsToFetch.map(async (item, index) => ({
        item,
        candles: await getCandles(item.symbol, range),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }))
    );
    const unavailableSymbols: string[] = [];
    const unavailableReasons: Record<string, string> = {};
    const attemptedSymbols: Record<string, string[]> = {};
    const series: PriceChartSeries[] = [];

    candlesResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const symbol = itemsToFetch[index].symbol;
        unavailableSymbols.push(symbol);
        attemptedSymbols[symbol] = getStooqSymbolCandidates(symbol);
        unavailableReasons[symbol] = result.reason instanceof Error
          ? result.reason.message
          : 'Ошибка загрузки candles';
        return;
      }

      const mapped = mapCandlesToSeries(result.value);
      if (!mapped) {
        unavailableSymbols.push(result.value.item.symbol);
        attemptedSymbols[result.value.item.symbol] = getStooqSymbolCandidates(result.value.item.symbol);
        unavailableReasons[result.value.item.symbol] = getCandleUnavailableReason(result.value.candles);
        return;
      }

      series.push(mapped);
    });

    const [benchmarkResult, newsMarkers, aiInsight] = await Promise.all([
      getCandles(BENCHMARK_SYMBOL, range)
        .then((candles) =>
          mapCandlesToSeries({
            item: { symbol: BENCHMARK_SYMBOL, company: 'S&P 500 ETF' },
            candles,
            color: '#94A3B8',
            isBenchmark: true,
          })
        )
        .catch((err) => {
          console.error('benchmark candles error:', err);
          return null;
        }),
      getNewsMarkers(itemsToFetch, range, token),
      buildAiInsight(series, range),
    ]);

    return {
      range,
      generatedAt: new Date().toISOString(),
      series,
      benchmark: benchmarkResult,
      newsMarkers,
      aiInsight,
      unavailableSymbols,
      unavailableReasons,
      attemptedSymbols,
      skippedSymbols,
    };
  } catch (err) {
    console.error('getWatchlistPriceChartData error:', err);

    return {
      range,
      generatedAt: new Date().toISOString(),
      series: [],
      benchmark: null,
      newsMarkers: [],
      aiInsight: 'Не удалось загрузить исторические цены. Попробуйте позже.',
      unavailableSymbols: [],
      unavailableReasons: {},
      attemptedSymbols: {},
      skippedSymbols: [],
      error: 'Failed to load price history',
    };
  }
}
