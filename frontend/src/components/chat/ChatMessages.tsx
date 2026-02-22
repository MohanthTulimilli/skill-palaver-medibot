import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/hooks/useChat';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  avatarSize?: 'sm' | 'md';
}

const sizes = { sm: 'w-5 h-5', md: 'w-6 h-6' };
const iconSizes = 'w-3 h-3';

export default function ChatMessages({ messages, isLoading, avatarSize = 'md' }: Props) {
  const sz = sizes[avatarSize];

  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {m.role === 'assistant' && (
            <div className={`${sz} rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1`}>
              <Bot className={iconSizes + ' text-primary'} />
            </div>
          )}
          <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
            m.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}>
            {m.role === 'assistant' ? (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ol]:mt-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : m.content}
          </div>
          {m.role === 'user' && (
            <div className={`${sz} rounded-full bg-primary flex items-center justify-center shrink-0 mt-1`}>
              <User className={iconSizes + ' text-primary-foreground'} />
            </div>
          )}
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex gap-2">
          <div className={`${sz} rounded-full bg-primary/10 flex items-center justify-center shrink-0`}>
            <Bot className={iconSizes + ' text-primary'} />
          </div>
          <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">
            <span className="animate-pulse">Thinking…</span>
          </div>
        </div>
      )}
    </div>
  );
}
