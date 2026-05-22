import { inngest } from "@/lib/inngest/client";
import { callGemini } from "@/lib/ai/gemini";

import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  NEWS_SUMMARY_TELEGRAM_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";

import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import {t} from "@/lib/i18n";
import { sendTelegramMessage } from "@/lib/telegram";

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
  async () => {
    try {
      console.log("🔥 [daily-news-summary] START");

      // 1. users
      console.log("👥 fetching users...");
      const users = await getAllUsersForNewsEmail();

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

          const symbols = await getWatchlistSymbolsByEmail(user.email);
          console.log("📊 symbols:", symbols);

          let articles = await getNews(symbols);
          articles = (articles || []).slice(0, 6);

          if (!articles.length) {
            console.log("⚠️ fallback to general news");
            articles = (await getNews())?.slice(0, 6) || [];
          }

          console.log("📰 articles:", articles.length);

          results.push({ user, articles });
        } catch (e) {
          console.error("❌ news fetch error:", user.email, e);
          results.push({ user, articles: [] });
        }
      }

      // 3. summarize with Gemini
      const summaries = [];

      for (const { user, articles } of results) {
        try {
          console.log("🤖 summarizing for:", user.email);

          const date = getFormattedTodayDate();
          const serializedArticles = JSON.stringify(articles, null, 2);
          const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
            "{{newsData}}",
            serializedArticles
          );

          const newsContent = await callGemini(prompt);
          let telegramContent: string | null = null;

          if (user.telegramEnabled && user.telegramChatId) {
            const telegramPrompt = NEWS_SUMMARY_TELEGRAM_PROMPT
              .replace("{{newsData}}", serializedArticles)
              .replace("{{date}}", date);

            telegramContent = await callGemini(telegramPrompt);
          }

          console.log("✅ AI result:", newsContent?.slice?.(0, 100));

          summaries.push({
            user,
            newsContent: newsContent || t('fallbacks.noMarketNews'),
            telegramContent: telegramContent || t('fallbacks.telegramNoMarketNews'),
          });

          await new Promise((r) => setTimeout(r, 3000));
        } catch (e) {
          console.error("❌ AI error:", user.email, e);
          summaries.push({
            user,
            newsContent: t('fallbacks.noMarketNews'),
            telegramContent: t('fallbacks.telegramNoMarketNews'),
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
