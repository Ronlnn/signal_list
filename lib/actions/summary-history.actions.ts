'use server';

import { connectToDatabase } from '@/database/mongoose';
import { SummaryHistory } from '@/database/models/summary-history.model';
import { getAuth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

type SummaryHistoryLeanItem = {
  _id: string;
  userId: string;
  email: string;
  symbol: string;
  company: string;
  price: string;
  shortSummary: string;
  generatedAt: Date;
};

type SaveSummaryHistoryParams = {
  userId: string;
  email: string;
  generatedAt: Date;
  stocks: StockWithData[];
  articles: MarketNewsArticle[];
  summaryHtml: string;
};

function normalizeText(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, maxLength = 240) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function getRelatedArticle(stock: StockWithData, articles: MarketNewsArticle[]) {
  const symbol = stock.symbol.toUpperCase();
  const company = stock.company.toLowerCase();

  return articles.find((article) => {
    const related = article.related?.toUpperCase() || '';
    const headline = article.headline?.toLowerCase() || '';
    const summary = article.summary?.toLowerCase() || '';

    return (
      related.split(',').map((item) => item.trim()).includes(symbol) ||
      headline.includes(symbol.toLowerCase()) ||
      headline.includes(company) ||
      summary.includes(symbol.toLowerCase()) ||
      summary.includes(company)
    );
  });
}

function buildCompanySummary(
  stock: StockWithData,
  articles: MarketNewsArticle[],
  summaryHtml: string
) {
  const relatedArticle = getRelatedArticle(stock, articles);

  if (relatedArticle) {
    return truncate(
      normalizeText(`${relatedArticle.headline}. ${relatedArticle.summary}`)
    );
  }

  const overallSummary = normalizeText(summaryHtml);
  if (overallSummary) return truncate(overallSummary);

  return 'Сводка сохранена, но отдельного вывода по компании не сформировано.';
}

async function getCurrentUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function saveSummaryHistory({
  userId,
  email,
  generatedAt,
  stocks,
  articles,
  summaryHtml,
}: SaveSummaryHistoryParams) {
  if (!userId || !email || !stocks.length) return;

  try {
    await connectToDatabase();

    await SummaryHistory.insertMany(
      stocks.map((stock) => ({
        userId,
        email,
        symbol: stock.symbol,
        company: stock.company || stock.symbol,
        price: stock.priceFormatted || 'Нет данных',
        shortSummary: buildCompanySummary(stock, articles, summaryHtml),
        generatedAt,
      }))
    );

    revalidatePath('/summaries');
  } catch (err) {
    console.error('saveSummaryHistory error:', err);
  }
}

export async function getCurrentUserSummaryHistory(limit = 100) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    await connectToDatabase();

    const items = await SummaryHistory.find({ userId })
      .sort({ generatedAt: -1, symbol: 1 })
      .limit(limit)
      .lean<SummaryHistoryLeanItem[]>();

    return items.map((item) => ({
      id: String(item._id),
      generatedAt: item.generatedAt.toISOString(),
      date: new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Moscow',
      }).format(item.generatedAt),
      company: item.company,
      symbol: item.symbol,
      price: item.price,
      shortSummary: item.shortSummary,
    }));
  } catch (err) {
    console.error('getCurrentUserSummaryHistory error:', err);
    return [];
  }
}
