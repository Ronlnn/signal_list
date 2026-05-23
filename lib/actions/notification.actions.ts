'use server';

import { headers } from 'next/headers';
import { getAuth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';

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
