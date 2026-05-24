import Link from 'next/link';
import { getCurrentUserSummaryHistory } from '@/lib/actions/summary-history.actions';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const sentimentClassNames = {
  positive: 'border-green-500/30 bg-green-500/10 text-green-400',
  neutral: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
  negative: 'border-red-500/30 bg-red-500/10 text-red-400',
  mixed: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
} as const;

export default async function SummaryHistoryPage() {
  const summaries = await getCurrentUserSummaryHistory();
  const sentimentLabels = {
    positive: t('summaryHistory.sentiment.positive'),
    neutral: t('summaryHistory.sentiment.neutral'),
    negative: t('summaryHistory.sentiment.negative'),
    mixed: t('summaryHistory.sentiment.mixed'),
  } as const;

  if (!summaries.length) {
    return (
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="watchlist-title">{t('summaryHistory.pageTitle')}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            {t('summaryHistory.pageDescription')}
          </p>
        </div>

        <div className="watchlist-empty-container flex">
          <div className="watchlist-empty">
            <div className="watchlist-icon">
              <span className="star-icon text-yellow-500">★</span>
            </div>
            <h2 className="empty-title">{t('summaryHistory.emptyTitle')}</h2>
            <p className="empty-description">{t('summaryHistory.emptyDescription')}</p>
            <Link
              href="/watchlist"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-yellow-500 px-5 text-sm font-semibold text-gray-950 transition-colors hover:bg-yellow-400"
            >
              {t('summaryHistory.openWatchlist')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="watchlist-title">{t('summaryHistory.pageTitle')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
          {t('summaryHistory.pageDescription')}
        </p>
      </div>

      <div className="watchlist-table overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse">
          <thead>
            <tr className="table-header-row">
              <th className="table-header w-44 px-4 py-4 text-left">
                {t('summaryHistory.table.date')}
              </th>
              <th className="table-header w-64 px-4 py-4 text-left">
                {t('summaryHistory.table.company')}
              </th>
              <th className="table-header px-4 py-4 text-left">
                {t('summaryHistory.table.summary')}
              </th>
              <th className="table-header w-32 px-4 py-4 text-center">
                {t('summaryHistory.table.rating')}
              </th>
              <th className="table-header w-40 px-4 py-4 text-left">
                {t('summaryHistory.table.sentiment')}
              </th>
              <th className="table-header w-80 px-4 py-4 text-left">
                {t('summaryHistory.table.impact')}
              </th>
              <th className="table-header w-36 px-4 py-4 text-right">
                {t('summaryHistory.table.price')}
              </th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr className="table-row cursor-default" key={summary.id}>
                <td className="table-cell px-4 py-4 text-sm text-gray-400">
                  {summary.date}
                </td>
                <td className="table-cell px-4 py-4">
                  <div className="font-semibold text-gray-100">{summary.company}</div>
                  <div className="mt-1 text-sm text-gray-500">{summary.symbol}</div>
                </td>
                <td className="table-cell px-4 py-4 text-sm leading-6 text-gray-300">
                  {summary.shortSummary}
                </td>
                <td className="table-cell px-4 py-4 text-center">
                  <span className="inline-flex h-9 min-w-14 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 text-sm font-semibold text-yellow-400">
                    {summary.impactRating}/5
                  </span>
                </td>
                <td className="table-cell px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold ${
                      sentimentClassNames[summary.sentiment]
                    }`}
                  >
                    {sentimentLabels[summary.sentiment]}
                  </span>
                </td>
                <td className="table-cell px-4 py-4 text-sm leading-6 text-gray-300">
                  <div>{summary.priceImpact}</div>
                  <div className="mt-2 text-gray-500">{summary.businessImpact}</div>
                </td>
                <td className="table-cell px-4 py-4 text-right text-gray-100">
                  {summary.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
