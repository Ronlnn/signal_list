import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';
import { callGemini } from '@/lib/ai/gemini';
import { getNews, getStockProfile, getWatchlistStocksData } from '@/lib/actions/finnhub.actions';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AiChatRequestBody = {
  message?: string;
  symbol?: string;
  company?: string;
  history?: ChatMessage[];
};

type WatchlistLeanItem = {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
};

function trimText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function serializeHistory(history?: ChatMessage[]) {
  return (history || [])
    .slice(-6)
    .map((message) => `${message.role === 'user' ? 'Пользователь' : 'AI'}: ${trimText(message.content, 900)}`)
    .join('\n');
}

function buildPrompt({
  question,
  symbol,
  company,
  watchlistData,
  candidateData,
  newsData,
  history,
}: {
  question: string;
  symbol?: string;
  company?: string;
  watchlistData: StockWithData[];
  candidateData: StockWithData[];
  newsData: MarketNewsArticle[];
  history?: ChatMessage[];
}) {
  return `Ты AI-аналитик сервиса Signalist. Отвечай на русском языке, ясно и практически, но не давай прямых инвестиционных рекомендаций "покупать", "продавать", "держать".

Контекст страницы:
${symbol ? `Пользователь смотрит компанию: ${symbol}${company ? ` (${company})` : ''}` : 'Пользователь находится в разделе watchlist.'}

Компании из списка пользователя с актуальными данными:
${JSON.stringify(watchlistData, null, 2)}

Дополнительные популярные компании, которые можно предложить только для изучения и сравнения:
${JSON.stringify(candidateData, null, 2)}

Свежие новости и рыночный контекст:
${JSON.stringify(newsData.slice(0, 6), null, 2)}

История короткого диалога:
${serializeHistory(history) || 'Истории пока нет.'}

Вопрос пользователя:
${question}

Правила ответа:
- Не выдумывай данных, которых нет в контексте.
- Если данных недостаточно, честно скажи, чего не хватает.
- Если пользователь просит "что еще рассмотреть", "какие акции добавить", "альтернативы" или похожий вопрос, можно предложить 3-5 компаний из блока "Дополнительные популярные компании".
- Такие варианты называй "идеи для изучения" или "кандидаты для наблюдения", а не инвестиционные рекомендации.
- Для каждой предложенной компании кратко объясни, почему ее стоит сравнить с текущим списком, используя доступные цену, изменение, капитализацию, P/E или новости.
- Не ограничивайся только watchlist, если вопрос явно просит новые компании.
- Используй тикеры и названия компаний как есть.
- Ответ структурируй короткими блоками.
- Объясняй финансовые термины простыми словами.
- В конце добавь короткую строку: "Не является инвестиционной рекомендацией."`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as AiChatRequestBody | null;
    const question = trimText(body?.message || '', 1500);
    const symbol = body?.symbol ? trimText(body.symbol, 20).toUpperCase() : '';
    const company = body?.company ? trimText(body.company, 120) : '';

    if (!question) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectToDatabase();
    const watchlistItems = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean<WatchlistLeanItem[]>();

    const normalizedItems = watchlistItems.map((item) => ({
      userId: item.userId,
      symbol: item.symbol,
      company: item.company,
      addedAt: item.addedAt,
    }));

    const contextSymbols = Array.from(
      new Set([
        ...(symbol ? [symbol] : []),
        ...normalizedItems.map((item) => item.symbol),
      ])
    ).slice(0, 8);
    const candidateItems = POPULAR_STOCK_SYMBOLS
      .filter((candidateSymbol) => !contextSymbols.includes(candidateSymbol))
      .slice(0, 8)
      .map((candidateSymbol) => ({
        userId: session.user.id,
        symbol: candidateSymbol,
        company: candidateSymbol,
        addedAt: new Date(),
      }));

    const [watchlistData, candidateData, stockProfile, newsData] = await Promise.all([
      getWatchlistStocksData(normalizedItems),
      getWatchlistStocksData(candidateItems),
      symbol ? getStockProfile(symbol) : Promise.resolve(null),
      getNews(contextSymbols),
    ]);

    const prompt = buildPrompt({
      question,
      symbol,
      company: company || stockProfile?.name,
      watchlistData,
      candidateData,
      newsData,
      history: body?.history,
    });

    const answer = await callGemini(prompt);

    return NextResponse.json({
      answer: answer || 'Не удалось сформировать ответ. Попробуйте переформулировать вопрос.',
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json(
      { error: 'Не удалось получить ответ AI. Попробуйте повторить позже.' },
      { status: 500 }
    );
  }
}
