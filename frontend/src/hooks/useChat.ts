import { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE } from '@/lib/api';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${API_BASE}/api/chat`;

export function useChat(initialMessage: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: initialMessage },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = '';
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: allMessages.filter(m => m.content) }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((err as any).error || `Error ${resp.status}`);
      }
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        const msg = (data as { message?: string }).message || 'No response.';
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
        return;
      }
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && prev.length > allMessages.length) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      let done = false;
      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
        throw e;
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { messages, input, setInput, isLoading, send, cancel, bottomRef };
}
