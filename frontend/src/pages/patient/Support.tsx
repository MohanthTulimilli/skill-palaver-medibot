import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Phone, MessageSquare, Bot } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import QuickQuestions from '@/components/chat/QuickQuestions';

const QUICK_QUESTIONS = [
  'How do I submit a new claim?',
  'When will my claim be processed?',
  'How do I update my insurance information?',
];

function InlineChat() {
  const { messages, input, setInput, isLoading, send, bottomRef } = useChat(
    "Hi! I'm MediBots Assistant 🤖 Ask me anything about your claims, payments, or account."
  );

  const handleSend = async (text: string) => {
    try { await send(text); } catch { toast.error('Failed to get response'); }
  };

  return (
    <div className="kpi-card flex flex-col h-[420px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Assistant</p>
          <p className="text-[10px] text-muted-foreground">Get instant answers</p>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <ChatMessages messages={messages} isLoading={isLoading} avatarSize="sm" />
        {messages.length <= 1 && <QuickQuestions questions={QUICK_QUESTIONS} onSelect={handleSend} />}
        <div ref={bottomRef} />
      </ScrollArea>

      <ChatInput input={input} setInput={setInput} onSend={handleSend} isLoading={isLoading} className="mt-3" />
    </div>
  );
}

const Support: React.FC = () => (
  <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
        <p className="text-muted-foreground text-sm mt-1">Get help with your account</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            { icon: Mail, title: 'Email Support', desc: 'support@medibots.com', action: 'Send Email' },
            { icon: Phone, title: 'Phone Support', desc: '1-800-MEDIBOTS', action: 'Call Now' },
            { icon: MessageSquare, title: 'Live Chat', desc: 'Available Mon-Fri 9AM-5PM', action: 'Start Chat' },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                  <item.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-all duration-200 hover-lift">
                {item.action}
              </button>
            </motion.div>
          ))}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card">
            <div className="flex items-center gap-2 text-primary mb-4">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-semibold text-foreground">FAQ</h3>
            </div>
            <div className="space-y-3">
              {[
                'How do I submit a new claim?',
                'When will my claim be processed?',
                'How do I update my insurance information?',
              ].map(q => (
                <details key={q} className="group">
                  <summary className="text-sm font-medium text-foreground cursor-pointer py-2 hover:text-primary transition-colors">{q}</summary>
                  <p className="text-xs text-muted-foreground pb-2 pl-4">Please contact support for assistance with this question.</p>
                </details>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <InlineChat />
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default Support;
