'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AiChatPanelProps = {
  symbol?: string;
  company?: string;
  mode?: 'watchlist' | 'stock';
};

const AiChatPanel = ({ symbol, company, mode = 'watchlist' }: AiChatPanelProps) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = useMemo(() => {
    if (mode === 'stock' && symbol) {
      return [
        t('aiChat.quick.stockSummary', { symbol }),
        t('aiChat.quick.stockRisks', { symbol }),
        t('aiChat.quick.newsImpact', { symbol }),
      ];
    }

    return [
      t('aiChat.quick.watchlistSummary'),
      t('aiChat.quick.mainRisks'),
      t('aiChat.quick.whatChanged'),
    ];
  }, [mode, symbol]);

  const sendMessage = async (messageText: string) => {
    const normalizedMessage = messageText.trim();
    if (!normalizedMessage || isLoading) return;

    const nextMessages: AiChatMessage[] = [
      ...messages,
      { role: 'user', content: normalizedMessage },
    ];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: normalizedMessage,
          symbol,
          company,
          history: messages,
        }),
      });

      const data = (await res.json().catch(() => null)) as { answer?: string; error?: string } | null;

      if (!res.ok || !data?.answer) {
        throw new Error(data?.error || t('aiChat.error'));
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : t('aiChat.error'),
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <section className="ai-chat-panel">
      <div className="ai-chat-header">
        <div className="ai-chat-icon">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="ai-chat-title">{t('aiChat.title')}</h2>
          <p className="ai-chat-subtitle">
            {mode === 'stock' && symbol
              ? t('aiChat.stockSubtitle', { symbol })
              : t('aiChat.watchlistSubtitle')}
          </p>
        </div>
      </div>

      <div className="ai-chat-quick">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="ai-chat-chip"
            disabled={isLoading}
            onClick={() => void sendMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <Bot className="h-6 w-6 text-yellow-500" />
            <p>{t('aiChat.empty')}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`ai-chat-message ${message.role === 'user' ? 'ai-chat-message-user' : 'ai-chat-message-assistant'}`}
            >
              <div className="ai-chat-avatar">
                {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <p className="ai-chat-bubble">{message.content}</p>
            </div>
          ))
        )}

        {isLoading ? (
          <div className="ai-chat-message ai-chat-message-assistant">
            <div className="ai-chat-avatar">
              <Bot className="h-4 w-4" />
            </div>
            <p className="ai-chat-bubble ai-chat-loading">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('aiChat.thinking')}
            </p>
          </div>
        ) : null}
      </div>

      <form className="ai-chat-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="ai-chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('aiChat.placeholder')}
          rows={2}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(input);
            }
          }}
        />
        <Button type="submit" className="ai-chat-send" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
          {t('aiChat.send')}
        </Button>
      </form>
    </section>
  );
};

export default AiChatPanel;
