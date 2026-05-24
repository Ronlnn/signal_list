import { inngest } from "@/lib/inngest/client";
import { callGemini } from "@/lib/ai/gemini";

import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  NEWS_SUMMARY_TELEGRAM_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";

import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistItemsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews, getWatchlistStocksData } from "@/lib/actions/finnhub.actions";
import { saveSummaryHistory } from "@/lib/actions/summary-history.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import {t} from "@/lib/i18n";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/telegram";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getNotificationTimestamp() {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date());
}

function serializeWatchlistData(stocks: StockWithData[]) {
  return JSON.stringify(
    stocks.map((stock) => ({
      symbol: stock.symbol,
      company: stock.company,
      price: stock.priceFormatted || "Нет данных",
      change: stock.changeFormatted || "Нет данных",
      marketCap: stock.marketCap || "Нет данных",
      peRatio: stock.peRatio || "Нет данных",
    })),
    null,
    2
  );
}

function buildWatchlistEmailBlock(stocks: StockWithData[], capturedAt: string) {
  if (!stocks.length) return "";

  const rows = stocks
    .map((stock) => {
      const isNegative = stock.changeFormatted?.trim().startsWith("-");
      const changeColor = isNegative ? "#FCA5A5" : "#86EFAC";

      return `
<tr>
  <td style="padding: 12px 10px; border-bottom: 1px solid #374151;">
    <strong style="color: #FFFFFF;">${escapeHtml(stock.symbol)}</strong>
    <div style="color: #9CA3AF; font-size: 13px; line-height: 1.4;">${escapeHtml(stock.company)}</div>
  </td>
  <td style="padding: 12px 10px; border-bottom: 1px solid #374151; color: #CCDADC; text-align: right;">${escapeHtml(stock.priceFormatted || "Нет данных")}</td>
  <td style="padding: 12px 10px; border-bottom: 1px solid #374151; color: ${changeColor}; text-align: right;">${escapeHtml(stock.changeFormatted || "Нет данных")}</td>
</tr>`;
    })
    .join("");

  return `
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 18px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">📌 Мой список: актуальные цены</h3>
<p class="mobile-text dark-text-secondary" style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.5; color: #9CA3AF;">Данные зафиксированы на момент отправки: ${escapeHtml(capturedAt)} МСК.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #212328; border-radius: 8px; overflow: hidden; margin: 0 0 24px 0;">
  <thead>
    <tr>
      <th align="left" style="padding: 12px 10px; border-bottom: 1px solid #374151; color: #FDD458; font-size: 13px;">Компания</th>
      <th align="right" style="padding: 12px 10px; border-bottom: 1px solid #374151; color: #FDD458; font-size: 13px;">Цена</th>
      <th align="right" style="padding: 12px 10px; border-bottom: 1px solid #374151; color: #FDD458; font-size: 13px;">День</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div style="border-top: 1px solid #374151; margin: 28px 0 24px 0;"></div>`;
}

function buildWatchlistTelegramBlock(stocks: StockWithData[], capturedAt: string) {
  const divider = "━━━━━━━━━━━━━━━━";

  if (!stocks.length) {
    return [
      "<b>📊 Signalist</b>",
      "<i>Персональная дневная сводка</i>",
      divider,
      "",
    ].join("\n");
  }

  const rows = stocks
    .map((stock) => {
      const isNegative = stock.changeFormatted?.trim().startsWith("-");
      const marker = isNegative ? "🔴" : "🟢";
      const symbol = escapeTelegramHtml(stock.symbol);
      const company = escapeTelegramHtml(stock.company);
      const price = escapeTelegramHtml(stock.priceFormatted || "Нет данных");
      const change = escapeTelegramHtml(stock.changeFormatted || "Нет данных");

      return [
        `${marker} <b>${symbol}</b> · ${price} · ${change}`,
        `<i>${company}</i>`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "<b>📊 Signalist</b>",
    "<i>Персональная дневная сводка</i>",
    divider,
    "",
    "<b>📌 Мой список</b>",
    rows,
    "",
    `<i>Цены зафиксированы: ${escapeTelegramHtml(capturedAt)} МСК</i>`,
    divider,
    "",
  ].join("\n");
}

/* =========================
   1. WELCOME EMAIL
========================= */
export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event }) => {
    try {
      console.log("🔥 [sign-up-email] START");
      console.log("📦 EVENT:", JSON.stringify(event, null, 2));

      const userProfile = `
- Страна: ${event.data.country}
- Инвестиционные цели: ${event.data.investmentGoals}
- Готовность к риску: ${event.data.riskTolerance}
- Предпочитаемая отрасль: ${event.data.preferredIndustry}
      `;

      const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
        "{{userProfile}}",
        userProfile
      );

      console.log("🤖 calling Gemini for welcome email...");

      const introText =
        (await callGemini(prompt)) ||
        t('fallbacks.welcomeIntro');

      console.log("✅ Gemini response:", introText);

      const { email, name } = event.data;

      console.log("📧 sending welcome email to:", email);

      await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });

      console.log("✅ welcome email SENT");

      return { success: true };
    } catch (err) {
      console.error("💥 [sign-up-email] ERROR:");
      console.error(err);
      throw err;
    }
  }
);

/* =========================
   2. DAILY NEWS SUMMARY
========================= */
export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [
    { event: "app/send.daily.news" },
    { cron: "0 12 * * *" },
  ],
  async ({ event }) => {
    try {
      console.log("🔥 [daily-news-summary] START");

      // 1. users
      console.log("👥 fetching users...");
      let users = await getAllUsersForNewsEmail();
      const targetUserId = event.data?.userId ? String(event.data.userId) : "";
      const targetEmail = event.data?.email ? String(event.data.email) : "";

      if (targetUserId || targetEmail) {
        users = users.filter((user) => {
          return (
            (targetUserId && user.id === targetUserId) ||
            (targetEmail && user.email === targetEmail)
          );
        });
      }

      console.log("👥 users loaded:", users?.length);

      if (!users?.length) {
        console.log("⚠️ no users found");
        return { success: false };
      }

      // 2. fetch news
      const results = [];

      for (const user of users) {
        try {
          console.log("📰 processing user:", user.email);

          const watchlistItems = await getWatchlistItemsByEmail(user.email);
          const symbols = watchlistItems.map((item) => item.symbol);
          console.log("📊 symbols:", symbols);

          const [articlesResult, watchlistStocks] = await Promise.all([
            getNews(symbols),
            getWatchlistStocksData(watchlistItems),
          ]);

          let articles = (articlesResult || []).slice(0, 6);

          if (!articles.length) {
            console.log("⚠️ fallback to general news");
            articles = (await getNews())?.slice(0, 6) || [];
          }

          console.log("📰 articles:", articles.length);
          console.log("💵 watchlist prices:", watchlistStocks.length);

          results.push({ user, articles, watchlistStocks });
        } catch (e) {
          console.error("❌ news fetch error:", user.email, e);
          results.push({ user, articles: [], watchlistStocks: [] });
        }
      }

      // 3. summarize with Gemini
      const summaries = [];

      for (const { user, articles, watchlistStocks } of results) {
        try {
          console.log("🤖 summarizing for:", user.email);

          const date = getFormattedTodayDate();
          const generatedAt = new Date();
          const capturedAt = getNotificationTimestamp();
          const serializedArticles = JSON.stringify(articles, null, 2);
          const serializedWatchlist = serializeWatchlistData(watchlistStocks);
          const emailWatchlistBlock = buildWatchlistEmailBlock(watchlistStocks, capturedAt);
          const telegramWatchlistBlock = buildWatchlistTelegramBlock(watchlistStocks, capturedAt);
          const prompt = NEWS_SUMMARY_EMAIL_PROMPT
            .replace("{{newsData}}", serializedArticles)
            .replace("{{watchlistData}}", serializedWatchlist);

          const generatedEmailContent = await callGemini(prompt);
          const newsContent = generatedEmailContent
            ? `${emailWatchlistBlock}${generatedEmailContent}`
            : emailWatchlistBlock;
          let telegramContent: string | null = null;

          if (user.telegramEnabled && user.telegramChatId) {
            const telegramPrompt = NEWS_SUMMARY_TELEGRAM_PROMPT
              .replace("{{newsData}}", serializedArticles)
              .replace("{{watchlistData}}", serializedWatchlist)
              .replace("{{date}}", date);

            const generatedTelegramContent = await callGemini(telegramPrompt);
            telegramContent = generatedTelegramContent
              ? `${telegramWatchlistBlock}${generatedTelegramContent}`
              : telegramWatchlistBlock;
          }

          console.log("✅ AI result:", newsContent?.slice?.(0, 100));

          await saveSummaryHistory({
            userId: user.id,
            email: user.email,
            generatedAt,
            stocks: watchlistStocks,
            articles,
            summaryHtml: generatedEmailContent || newsContent || "",
          });

          summaries.push({
            user,
            newsContent: newsContent || buildWatchlistEmailBlock(watchlistStocks, getNotificationTimestamp()) || t('fallbacks.noMarketNews'),
            telegramContent: telegramContent || t('fallbacks.telegramNoMarketNews'),
          });

          await new Promise((r) => setTimeout(r, 3000));
        } catch (e) {
          console.error("❌ AI error:", user.email, e);
          const fallbackEmailContent =
            buildWatchlistEmailBlock(watchlistStocks, getNotificationTimestamp()) ||
            t('fallbacks.noMarketNews');

          await saveSummaryHistory({
            userId: user.id,
            email: user.email,
            generatedAt: new Date(),
            stocks: watchlistStocks,
            articles,
            summaryHtml: fallbackEmailContent,
          });

          summaries.push({
            user,
            newsContent: fallbackEmailContent,
            telegramContent: buildWatchlistTelegramBlock(watchlistStocks, getNotificationTimestamp()) || t('fallbacks.telegramNoMarketNews'),
          });
        }
      }

      // 4. send notifications
      console.log("📧 sending notifications...");

      await Promise.all(
        summaries.map(async ({ user, newsContent, telegramContent }) => {
          try {
            if (user.emailEnabled !== false) {
              console.log("📨 sending email to:", user.email);

              await sendNewsSummaryEmail({
                email: user.email,
                date: getFormattedTodayDate(),
                newsContent,
              });

              console.log("✅ email sent:", user.email);
            }
          } catch (e) {
            console.error("❌ email error:", user.email, e);
          }

          try {
            if (user.telegramEnabled && user.telegramChatId) {
              console.log("📨 sending telegram to:", user.email);

              await sendTelegramMessage(user.telegramChatId, telegramContent);

              console.log("✅ telegram sent:", user.email);
            }
          } catch (e) {
            console.error("❌ telegram error:", user.email, e);
          }
        })
      );

      console.log("🎉 DONE");

      return {
        success: true,
        message: "Daily news sent",
      };
    } catch (err) {
      console.error("💥 [daily-news-summary] FATAL ERROR:");
      console.error(err);
      throw err;
    }
  }
);
