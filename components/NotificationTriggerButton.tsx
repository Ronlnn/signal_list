'use client';

import { useTransition } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { triggerDailyNewsSummary } from '@/lib/actions/notification.actions';
import { t } from '@/lib/i18n';

const NotificationTriggerButton = () => {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await triggerDailyNewsSummary();

      if (!result.success) {
        toast.error(result.error || t('notifications.triggerFailed'));
        return;
      }

      toast.success(t('notifications.triggeredToast'));
    });
  };

  return (
    <Button type="button" className="yellow-btn gap-2" onClick={handleClick} disabled={isPending}>
      <Send className="h-4 w-4" />
      {isPending ? t('notifications.triggering') : t('notifications.trigger')}
    </Button>
  );
};

export default NotificationTriggerButton;
