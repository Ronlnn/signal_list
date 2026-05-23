'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';
import { getWatchlistStocksData } from '@/lib/actions/finnhub.actions';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

type WatchlistLeanItem = {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
};

async function getCurrentUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  const items = await getWatchlistItemsByEmail(email);
  return items.map((item) => item.symbol);
}

export async function getWatchlistItemsByEmail(email: string): Promise<WatchlistLeanItem[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId })
      .sort({ addedAt: -1 })
      .lean<WatchlistLeanItem[]>();

    return items.map((item) => ({
      userId: item.userId,
      symbol: item.symbol,
      company: item.company,
      addedAt: item.addedAt,
    }));
  } catch (err) {
    console.error('getWatchlistItemsByEmail error:', err);
    return [];
  }
}

export async function addToWatchlist(symbol: string, company: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Пользователь не авторизован' };

    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return { success: false, error: 'Тикер не указан' };

    await connectToDatabase();
    await Watchlist.updateOne(
      { userId, symbol: normalizedSymbol },
      {
        $setOnInsert: {
          userId,
          symbol: normalizedSymbol,
          company: company?.trim() || normalizedSymbol,
          addedAt: new Date(),
        },
      },
      { upsert: true }
    );

    revalidatePath('/watchlist');
    revalidatePath(`/stocks/${normalizedSymbol}`);

    return { success: true };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    return { success: false, error: 'Не удалось добавить акцию в список' };
  }
}

export async function removeFromWatchlist(symbol: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Пользователь не авторизован' };

    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return { success: false, error: 'Тикер не указан' };

    await connectToDatabase();
    await Watchlist.deleteOne({ userId, symbol: normalizedSymbol });

    revalidatePath('/watchlist');
    revalidatePath(`/stocks/${normalizedSymbol}`);

    return { success: true };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    return { success: false, error: 'Не удалось удалить акцию из списка' };
  }
}

export async function isInCurrentUserWatchlist(symbol: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return false;

    await connectToDatabase();
    const item = await Watchlist.exists({ userId, symbol: normalizedSymbol });
    return Boolean(item);
  } catch (err) {
    console.error('isInCurrentUserWatchlist error:', err);
    return false;
  }
}

export async function getCurrentUserWatchlist() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    await connectToDatabase();
    const items = await Watchlist.find({ userId })
      .sort({ addedAt: -1 })
      .lean<WatchlistLeanItem[]>();

    return items.map((item) => ({
      userId: item.userId,
      symbol: item.symbol,
      company: item.company,
      addedAt: item.addedAt,
    }));
  } catch (err) {
    console.error('getCurrentUserWatchlist error:', err);
    return [];
  }
}

export async function getCurrentUserWatchlistWithData(): Promise<StockWithData[]> {
  const items = await getCurrentUserWatchlist();
  if (!items.length) return [];

  return getWatchlistStocksData(items);
}
