import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { escapeTelegramHtml, sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number;
    };
    from?: {
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

type TelegramLinkToken = {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  usedAt?: Date | null;
};

function verifyTelegramSecret(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get('x-telegram-bot-api-secret-token');

  if (!expected) return true;
  return received === expected;
}

function getStartToken(text?: string) {
  if (!text) return '';

  const [command, token] = text.trim().split(/\s+/);
  if (!command.startsWith('/start')) return '';

  return token || '';
}

export async function POST(request: NextRequest) {
  if (!verifyTelegramSecret(request)) {
    console.warn('[telegram-webhook] rejected request: invalid secret token');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  const token = getStartToken(update?.message?.text);

  console.log('[telegram-webhook] update received', {
    hasChatId: Boolean(chatId),
    hasStartToken: Boolean(token),
    text: update?.message?.text,
  });

  if (!chatId || !token) {
    return NextResponse.json({ ok: true });
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const link = await db.collection<TelegramLinkToken>('telegram_link_tokens').findOne({
      token,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!link) {
      try {
        await sendTelegramMessage(
          chatId,
          'Ссылка для подключения устарела или уже была использована. Создайте новую ссылку в Signalist.'
        );
      } catch (sendError) {
        console.error('telegram webhook notification error:', sendError);
      }

      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const username = update.message?.from?.username || '';

    await db.collection('notification_preferences').updateOne(
      { userId: link.userId },
      {
        $set: {
          userId: link.userId,
          email: link.email,
          telegramChatId: chatId,
          telegramUsername: username,
          telegramEnabled: true,
          emailEnabled: true,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    await db.collection('telegram_link_tokens').updateOne(
      { token },
      { $set: { usedAt: now } }
    );

    try {
      await sendTelegramMessage(
        chatId,
        `Telegram подключен к аккаунту <b>${escapeTelegramHtml(link.email)}</b>. Теперь дневные сводки Signalist будут приходить сюда.`
      );
    } catch (sendError) {
      console.error('telegram webhook confirmation error:', sendError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('telegram webhook error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
