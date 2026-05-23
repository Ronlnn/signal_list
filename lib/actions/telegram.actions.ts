'use server';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/database/mongoose';
import { getAuth } from '@/lib/better-auth/auth';
import { escapeTelegramHtml, sendTelegramMessage } from '@/lib/telegram';

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

type TelegramPreference = {
  userId: string;
  email: string;
  telegramChatId?: number;
  telegramUsername?: string;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function getCurrentUser() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}

function getBotUsername() {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  return username?.replace(/^@/, '') || '';
}

export async function getCurrentTelegramPreference() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return null;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const preference = await db
      .collection<TelegramPreference>('notification_preferences')
      .findOne({ userId: user.id });

    if (!preference) return null;

    return {
      telegramEnabled: Boolean(preference.telegramEnabled && preference.telegramChatId),
      telegramUsername: preference.telegramUsername || '',
      telegramChatId: preference.telegramChatId || null,
    };
  } catch (err) {
    console.error('getCurrentTelegramPreference error:', err);
    return null;
  }
}

export async function createTelegramLink() {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user.email) {
      return { success: false, error: 'Пользователь не авторизован' };
    }

    const botUsername = getBotUsername();
    if (!botUsername) {
      return { success: false, error: 'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME не задан' };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const existingPreference = await db
      .collection<TelegramPreference>('notification_preferences')
      .findOne({ userId: user.id });

    if (existingPreference?.telegramChatId) {
      await db.collection('notification_preferences').updateOne(
        { userId: user.id },
        {
          $set: {
            email: user.email,
            telegramEnabled: true,
            emailEnabled: existingPreference.emailEnabled !== false,
            updatedAt: new Date(),
          },
        }
      );

      try {
        await sendTelegramMessage(
          existingPreference.telegramChatId,
          `Telegram снова подключен к аккаунту <b>${escapeTelegramHtml(user.email)}</b>.`
        );
      } catch (sendError) {
        console.error('telegram reconnect notification error:', sendError);
      }

      revalidatePath('/watchlist');

      return {
        success: true,
        reconnected: true,
      };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const now = new Date();

    await db.collection('telegram_link_tokens').insertOne({
      token,
      userId: user.id,
      email: user.email,
      expiresAt: new Date(now.getTime() + LINK_TOKEN_TTL_MS),
      usedAt: null,
      createdAt: now,
    });

    return {
      success: true,
      url: `https://t.me/${botUsername}?start=${token}`,
    };
  } catch (err) {
    console.error('createTelegramLink error:', err);
    return { success: false, error: 'Не удалось создать ссылку Telegram' };
  }
}

export async function disconnectTelegram() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: 'Пользователь не авторизован' };

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    await db.collection('notification_preferences').updateOne(
      { userId: user.id },
      {
        $set: {
          telegramEnabled: false,
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath('/watchlist');

    return { success: true };
  } catch (err) {
    console.error('disconnectTelegram error:', err);
    return { success: false, error: 'Не удалось отключить Telegram' };
  }
}
