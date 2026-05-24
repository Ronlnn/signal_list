'use server';

import {connectToDatabase} from "@/database/mongoose";

type NotificationPreference = {
    userId: string;
    telegramChatId?: number;
    telegramEnabled?: boolean;
    emailEnabled?: boolean;
    notificationTime?: string;
    notificationTimezone?: string;
    lastScheduledSummaryDate?: string;
};

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();

        const normalizedUsers = users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }));

        const userIds = normalizedUsers.map((user) => user.id).filter(Boolean);
        const preferences = await db.collection<NotificationPreference>('notification_preferences')
            .find({ userId: { $in: userIds } })
            .toArray();

        const preferencesByUserId = new Map(
            preferences.map((preference) => [preference.userId, preference])
        );

        return normalizedUsers.map((user) => {
            const preference = preferencesByUserId.get(user.id);

            return {
                ...user,
                emailEnabled: preference?.emailEnabled !== false,
                telegramEnabled: Boolean(preference?.telegramEnabled && preference.telegramChatId),
                telegramChatId: preference?.telegramChatId,
                notificationTime: preference?.notificationTime || '12:00',
                notificationTimezone: preference?.notificationTimezone || 'Europe/Moscow',
                lastScheduledSummaryDate: preference?.lastScheduledSummaryDate || '',
            };
        });
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export const markScheduledSummarySent = async (
    userId: string,
    email: string,
    localDate: string
) => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        await db.collection('notification_preferences').updateOne(
            { userId },
            {
                $set: {
                    userId,
                    email,
                    emailEnabled: true,
                    lastScheduledSummaryDate: localDate,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    telegramEnabled: false,
                    notificationTime: '12:00',
                    notificationTimezone: 'Europe/Moscow',
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );
    } catch (e) {
        console.error('markScheduledSummarySent error:', e);
    }
}
