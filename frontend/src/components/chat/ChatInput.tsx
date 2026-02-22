import React from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
  isLoading: boolean;
  className?: string;
}

export default function ChatInput({ input, setInput, onSend, isLoading, className = '' }: Props) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSend(input); }}
      className={`flex items-center gap-2 ${className}`}
    >
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask a question…"
        className="flex-1 h-9 text-sm"
        disabled={isLoading}
      />
      <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !input.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
