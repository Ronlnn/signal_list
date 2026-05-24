import Link from 'next/link';
import { getCurrentUserSummaryHistory } from '@/lib/actions/summary-history.actions';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function SummaryHistoryPage() {
  const summaries = await getCurrentUserSummaryHistory();

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
        <table className="w-full min-w-[900px] border-collapse">
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
