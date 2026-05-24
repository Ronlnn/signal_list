import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";
import TelegramConnectButton from "@/components/TelegramConnectButton";
import NotificationTriggerButton from "@/components/NotificationTriggerButton";
import NotificationScheduleForm from "@/components/NotificationScheduleForm";
import AiChatPanel from "@/components/AiChatPanel";
import WatchlistButton from "@/components/WatchlistButton";
import { getCurrentUserWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { getCurrentTelegramPreference } from "@/lib/actions/telegram.actions";
import { getCurrentNotificationSettings } from "@/lib/actions/notification.actions";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getChangeColorClass } from "@/lib/utils";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const [watchlist, initialStocks, telegramPreference, notificationSettings] = await Promise.all([
    getCurrentUserWatchlistWithData(),
    searchStocks(),
    getCurrentTelegramPreference(),
    getCurrentNotificationSettings(),
  ]);
  const isTelegramConnected = Boolean(telegramPreference?.telegramEnabled);
  const telegramUsername = telegramPreference?.telegramUsername
    ? ` (@${telegramPreference.telegramUsername})`
    : "";

  const notificationControlsPanel = (
    <div className="rounded-lg border border-gray-600 bg-gray-800">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-5 lg:border-r lg:border-gray-600">
          <div className="min-h-[92px]">
            <h2 className="text-lg font-semibold text-gray-100">{t("telegram.title")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              {isTelegramConnected
                ? t("telegram.connected", { username: telegramUsername })
                : t("telegram.disconnected")}
            </p>
          </div>
          <TelegramConnectButton isConnected={isTelegramConnected} />
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-600 p-5 lg:border-t-0">
          <div className="min-h-[92px]">
            <h2 className="text-lg font-semibold text-gray-100">{t("notifications.title")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              {t("notifications.description")}
            </p>
          </div>
          <NotificationTriggerButton />
        </div>
      </div>

      <NotificationScheduleForm
        initialTime={notificationSettings.notificationTime}
        initialTimezone={notificationSettings.notificationTimezone}
        isScheduleConfigured={notificationSettings.isScheduleConfigured}
      />
    </div>
  );

  if (!watchlist.length) {
    return (
      <section className="flex flex-col gap-6">
        {notificationControlsPanel}
        <div className="watchlist-empty-container flex">
          <div className="watchlist-empty">
            <div className="watchlist-icon">
              <span className="star-icon text-yellow-500">★</span>
            </div>
            <h1 className="empty-title">{t("watchlist.emptyTitle")}</h1>
            <p className="empty-description">{t("watchlist.emptyDescription")}</p>
            <SearchCommand initialStocks={initialStocks} label={t("search.addStock")} />
          </div>
        </div>
        <AiChatPanel mode="watchlist" />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="watchlist-title">{t("watchlist.pageTitle")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            {t("watchlist.pageDescription")}
          </p>
        </div>
        <SearchCommand initialStocks={initialStocks} label={t("search.addStock")} />
      </div>

      {notificationControlsPanel}

      <div className="watchlist-table overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="table-header-row">
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.company")}</th>
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.symbol")}</th>
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.price")}</th>
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.change")}</th>
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.marketCap")}</th>
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.pe")}</th>
              <th className="table-header px-4 py-4 text-left">{t("watchlist.table.action")}</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((stock) => (
              <tr className="table-row" key={stock.symbol}>
                <td className="table-cell px-4 py-4">
                  <Link href={`/stocks/${stock.symbol}`} className="text-gray-100 hover:text-yellow-500">
                    {stock.company}
                  </Link>
                </td>
                <td className="table-cell px-4 py-4 text-gray-400">{stock.symbol}</td>
                <td className="table-cell px-4 py-4 text-gray-100">{stock.priceFormatted}</td>
                <td className={`table-cell px-4 py-4 ${getChangeColorClass(stock.changePercent)}`}>
                  {stock.changeFormatted}
                </td>
                <td className="table-cell px-4 py-4 text-gray-400">{stock.marketCap}</td>
                <td className="table-cell px-4 py-4 text-gray-400">{stock.peRatio}</td>
                <td className="table-cell px-4 py-4">
                  <div className="w-32">
                    <WatchlistButton
                      symbol={stock.symbol}
                      company={stock.company}
                      isInWatchlist
                      showTrashIcon
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AiChatPanel mode="watchlist" />
    </section>
  );
}
