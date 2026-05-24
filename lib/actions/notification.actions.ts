'use server';

import { headers } from 'next/headers';
import { getAuth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';
import { connectToDatabase } from '@/database/mongoose';
import { revalidatePath } from 'next/cache';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_NOTIFICATION_TIME = '12:00';
const DEFAULT_NOTIFICATION_TIMEZONE = 'Europe/Moscow';

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function triggerDailyNewsSummary() {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id || !session.user.email) {
      return { success: false, error: 'Пользователь не авторизован' };
    }

    await inngest.send({
      name: 'app/send.daily.news',
      data: {
        userId: session.user.id,
        email: session.user.email,
        source: 'manual',
      },
    });

    return { success: true };
  } catch (err) {
    console.error('triggerDailyNewsSummary error:', err);
    return { success: false, error: 'Не удалось запустить отправку сводки' };
  }
}

export async function getCurrentNotificationSettings() {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return {
        notificationTime: DEFAULT_NOTIFICATION_TIME,
        notificationTimezone: DEFAULT_NOTIFICATION_TIMEZONE,
        isScheduleConfigured: false,
      };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const preference = await db
      .collection<{ notificationTime?: string; notificationTimezone?: string }>('notification_preferences')
      .findOne({ userId: session.user.id });

    return {
      notificationTime: preference?.notificationTime || DEFAULT_NOTIFICATION_TIME,
      notificationTimezone: preference?.notificationTimezone || DEFAULT_NOTIFICATION_TIMEZONE,
      isScheduleConfigured: Boolean(preference?.notificationTime || preference?.notificationTimezone),
    };
  } catch (err) {
    console.error('getCurrentNotificationSettings error:', err);
    return {
      notificationTime: DEFAULT_NOTIFICATION_TIME,
      notificationTimezone: DEFAULT_NOTIFICATION_TIMEZONE,
      isScheduleConfigured: false,
    };
  }
}

export async function updateNotificationSchedule({
  notificationTime,
  notificationTimezone,
}: {
  notificationTime: string;
  notificationTimezone: string;
}) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id || !session.user.email) {
      return { success: false, error: 'Пользователь не авторизован' };
    }

    const normalizedTime = notificationTime.trim();
    const normalizedTimezone = notificationTimezone.trim();

    if (!TIME_PATTERN.test(normalizedTime)) {
      return { success: false, error: 'Укажите время в формате ЧЧ:ММ' };
    }

    if (!isValidTimezone(normalizedTimezone)) {
      return { success: false, error: 'Некорректный часовой пояс' };
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    await db.collection('notification_preferences').updateOne(
      { userId: session.user.id },
      {
        $set: {
          userId: session.user.id,
          email: session.user.email,
          notificationTime: normalizedTime,
          notificationTimezone: normalizedTimezone,
          emailEnabled: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          telegramEnabled: false,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    revalidatePath('/watchlist');

    return { success: true };
  } catch (err) {
    console.error('updateNotificationSchedule error:', err);
    return { success: false, error: 'Не удалось сохранить время уведомлений' };
  }
}
