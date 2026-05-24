'use client';

import { type FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { CheckCircle2, Clock, Globe2, Pencil, Save, X } from 'lucide-react';
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

const TIME_OPTIONS = Array.from({ length: 24 * 12 }, (_, index) => {
  const totalMinutes = index * 5;
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

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
  const [savedTime, setSavedTime] = useState(initialTime);
  const [savedTimezone, setSavedTimezone] = useState(initialTimezone);
  const [isConfigured, setIsConfigured] = useState(isScheduleConfigured);
  const [isEditing, setIsEditing] = useState(!isScheduleConfigured);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isScheduleConfigured) return;

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detectedTimezone) {
      setNotificationTimezone(detectedTimezone);
      setSavedTimezone(detectedTimezone);
    }
  }, [isScheduleConfigured]);

  const timezoneOptions = useMemo(() => {
    return Array.from(new Set([notificationTimezone, savedTimezone, ...BASE_TIMEZONES].filter(Boolean)));
  }, [notificationTimezone, savedTimezone]);
  const timeOptions = useMemo(() => {
    return Array.from(new Set([notificationTime, savedTime, ...TIME_OPTIONS].filter(Boolean))).sort();
  }, [notificationTime, savedTime]);

  const hasChanges = notificationTime !== savedTime || notificationTimezone !== savedTimezone;
  const canSave = hasChanges || !isConfigured;

  const handleCancel = () => {
    setNotificationTime(savedTime);
    setNotificationTimezone(savedTimezone);
    setIsEditing(false);
    setSaveStatus('idle');
  };

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

      setSavedTime(notificationTime);
      setSavedTimezone(notificationTimezone);
      setIsConfigured(true);
      setIsEditing(false);
      setSaveStatus('saved');
      toast.success(t('notifications.scheduleSavedToast'));
    });
  };

  return (
    <form
      className="border-t border-gray-600 p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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

          {!isEditing ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2 border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700 hover:text-gray-100"
              onClick={() => {
                setIsEditing(true);
                setSaveStatus('idle');
              }}
            >
              <Pencil className="h-4 w-4" />
              {t('notifications.changeSchedule')}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-lg border border-gray-600 bg-gray-900/50 p-4 md:grid-cols-[minmax(180px,220px)_1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-gray-500">
                {isConfigured ? t('notifications.currentSchedule') : t('notifications.defaultSchedule')}
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-100">{savedTime}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Globe2 className="h-4 w-4 shrink-0 text-gray-500" />
            <span>{getTimezoneLabel(savedTimezone)}</span>
          </div>

          {saveStatus === 'saved' ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {t('notifications.scheduleSavedInline')}
            </div>
          ) : null}
        </div>

        {isEditing ? (
          <div className="grid gap-3 rounded-lg border border-gray-600 bg-gray-900/40 p-4 sm:grid-cols-[160px_minmax(240px,1fr)_auto_auto] sm:items-end">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-400">{t('notifications.timeLabel')}</span>
              <select
                value={notificationTime}
                onChange={(event) => {
                  setNotificationTime(event.target.value);
                  setSaveStatus('idle');
                }}
                className="h-11 rounded-lg border border-gray-600 bg-gray-900 px-3 text-sm font-semibold text-gray-100 outline-none transition-colors focus:border-yellow-500"
                required
              >
                {timeOptions.map((time) => (
                  <option value={time} key={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-400">{t('notifications.timezoneLabel')}</span>
              <select
                value={notificationTimezone}
                onChange={(event) => {
                  setNotificationTimezone(event.target.value);
                  setSaveStatus('idle');
                }}
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

            <Button type="submit" className="yellow-btn gap-2" disabled={isPending || !canSave}>
              <Save className="h-4 w-4" />
              {isPending ? t('notifications.savingSchedule') : t('notifications.saveSchedule')}
            </Button>

            {isConfigured ? (
              <Button
                type="button"
                variant="outline"
                className="h-12 gap-2 border-gray-600 bg-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-100"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
                {t('notifications.cancelSchedule')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
};

export default NotificationScheduleForm;
