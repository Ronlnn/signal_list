'use client';

import { type FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { updateNotificationSchedule } from '@/lib/actions/notification.actions';
import { t } from '@/lib/i18n';

type NotificationScheduleFormProps = {
  initialTime: string;
  initialTimezone: string;
  isScheduleConfigured: boolean;
};

const BASE_TIMEZONES = [
  'Europe/Moscow',
  'Europe/Kaliningrad',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Bishkek',
  'Asia/Almaty',
  'Asia/Tashkent',
  'Asia/Dubai',
  'Asia/Tbilisi',
  'Asia/Yerevan',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
];

function getTimezoneLabel(timezone: string) {
  try {
    const date = new Date();
    const shortOffset = new Intl.DateTimeFormat('ru-RU', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;

    return shortOffset ? `${timezone} (${shortOffset})` : timezone;
  } catch {
    return timezone;
  }
}

const NotificationScheduleForm = ({
  initialTime,
  initialTimezone,
  isScheduleConfigured,
}: NotificationScheduleFormProps) => {
  const [notificationTime, setNotificationTime] = useState(initialTime);
  const [notificationTimezone, setNotificationTimezone] = useState(initialTimezone);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isScheduleConfigured) return;

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detectedTimezone) setNotificationTimezone(detectedTimezone);
  }, [isScheduleConfigured]);

  const timezoneOptions = useMemo(() => {
    return Array.from(new Set([notificationTimezone, ...BASE_TIMEZONES].filter(Boolean)));
  }, [notificationTimezone]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateNotificationSchedule({
        notificationTime,
        notificationTimezone,
      });

      if (!result.success) {
        toast.error(result.error || t('notifications.scheduleSaveFailed'));
        return;
      }

      toast.success(t('notifications.scheduleSavedToast'));
    });
  };

  return (
    <form
      className="border-t border-gray-600 p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-yellow-500">
            <Clock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-100">
              {t('notifications.scheduleTitle')}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              {t('notifications.scheduleDescription')}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[150px_minmax(240px,1fr)_auto] sm:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-400">{t('notifications.timeLabel')}</span>
            <input
              type="time"
              value={notificationTime}
              onChange={(event) => setNotificationTime(event.target.value)}
              className="h-11 rounded-lg border border-gray-600 bg-gray-900 px-3 text-sm font-medium text-gray-100 outline-none transition-colors focus:border-yellow-500"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-400">{t('notifications.timezoneLabel')}</span>
            <select
              value={notificationTimezone}
              onChange={(event) => setNotificationTimezone(event.target.value)}
              className="h-11 rounded-lg border border-gray-600 bg-gray-900 px-3 text-sm font-medium text-gray-100 outline-none transition-colors focus:border-yellow-500"
              required
            >
              {timezoneOptions.map((timezone) => (
                <option value={timezone} key={timezone}>
                  {getTimezoneLabel(timezone)}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" className="yellow-btn gap-2" disabled={isPending}>
            <Save className="h-4 w-4" />
            {isPending ? t('notifications.savingSchedule') : t('notifications.saveSchedule')}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default NotificationScheduleForm;
