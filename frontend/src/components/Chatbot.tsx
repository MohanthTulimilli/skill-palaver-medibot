import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import QuickQuestions from '@/components/chat/QuickQuestions';

const CHATBOT_ICON_SRC = '/medibot-chatbot-icon.png';

const QUICK_QUESTIONS = [
  'How do I submit a claim?',
  'What does the AI risk score mean?',
  'How do I check payment history?',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const { messages, input, setInput, isLoading, send, bottomRef } = useChat(
    "Hi! I'm MediBots Assistant 🤖 How can I help you today?"
  );

  const handleSend = async (text: string) => {
    try { await send(text); } catch { toast.error('Failed to get response'); }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            style={{ perspective: 1200 }}
          >
            <motion.button
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.06, 1],
                y: [0, -8, 0],
                rotateY: [0, 8, -8, 0],
                boxShadow: [
                  '0 12px 28px -6px hsl(var(--primary) / 0.4), 0 6px 16px -8px hsl(var(--primary) / 0.25), 0 0 0 1px hsl(var(--primary) / 0.15), inset 0 2px 0 0 hsl(0 0% 100% / 0.25), inset 0 -2px 8px -2px hsl(0 0 0 / 0.2)',
                  '0 20px 40px -8px hsl(var(--primary) / 0.5), 0 10px 24px -10px hsl(var(--primary) / 0.3), 0 0 0 1px hsl(var(--primary) / 0.2), inset 0 2px 0 0 hsl(0 0% 100% / 0.3), inset 0 -2px 8px -2px hsl(0 0 0 / 0.25)',
                  '0 12px 28px -6px hsl(var(--primary) / 0.4), 0 6px 16px -8px hsl(var(--primary) / 0.25), 0 0 0 1px hsl(var(--primary) / 0.15), inset 0 2px 0 0 hsl(0 0% 100% / 0.25), inset 0 -2px 8px -2px hsl(0 0 0 / 0.2)',
                ],
              }}
              transition={{
                scale: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                y: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
                rotateY: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                boxShadow: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
              }}
              exit={{ scale: 0 }}
              whileHover={{
                scale: 1.1,
                y: -6,
                rotateY: 12,
                boxShadow: '0 24px 48px -12px hsl(var(--primary) / 0.5), 0 12px 28px -12px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.2), inset 0 2px 0 0 hsl(0 0% 100% / 0.35)',
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.96, y: 0 }}
              onClick={() => setOpen(true)}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center overflow-hidden cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
            >
            <motion.span
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="relative w-full h-full flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <img
                src={CHATBOT_ICON_SRC}
                alt="MediBots Assistant"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Bot className="w-7 h-7 hidden text-primary-foreground" aria-hidden />
            </motion.span>
          </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={CHATBOT_ICON_SRC}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <Bot className="w-4 h-4 hidden text-primary-foreground" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">MediBots Assistant</p>
                  <p className="text-[10px] text-muted-foreground">AI-powered help</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <ChatMessages messages={messages} isLoading={isLoading} />
              {messages.length <= 1 && <QuickQuestions questions={QUICK_QUESTIONS} onSelect={handleSend} />}
              <div ref={bottomRef} />
            </ScrollArea>

            {/* Input */}
            <ChatInput input={input} setInput={setInput} onSend={handleSend} isLoading={isLoading} className="p-3 border-t border-border" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
