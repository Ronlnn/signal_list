'use client';

import { useTransition } from 'react';
import { Send, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createTelegramLink, disconnectTelegram } from '@/lib/actions/telegram.actions';
import { t } from '@/lib/i18n';

type TelegramConnectButtonProps = {
  isConnected: boolean;
};

const TelegramConnectButton = ({ isConnected }: TelegramConnectButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConnect = () => {
    startTransition(async () => {
      const result = await createTelegramLink();

      if (!result.success || !result.url) {
        toast.error(result.error || t('telegram.connectFailed'));
        return;
      }

      window.open(result.url, '_blank', 'noopener,noreferrer');
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectTelegram();

      if (!result.success) {
        toast.error(result.error || t('telegram.disconnectFailed'));
        return;
      }

      toast.success(t('telegram.disconnectedToast'));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" className="yellow-btn gap-2" onClick={handleConnect} disabled={isPending}>
        <Send className="h-4 w-4" />
        {isPending ? t('telegram.connecting') : isConnected ? t('telegram.reconnect') : t('telegram.connect')}
      </Button>

      {isConnected ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 gap-2 border-gray-600 bg-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-100"
          onClick={handleDisconnect}
          disabled={isPending}
        >
          <Unplug className="h-4 w-4" />
          {isPending ? t('telegram.disconnecting') : t('telegram.disconnect')}
        </Button>
      ) : null}
    </div>
  );
};

export default TelegramConnectButton;
