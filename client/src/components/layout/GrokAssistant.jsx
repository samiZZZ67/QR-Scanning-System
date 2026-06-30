import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, RotateCcw } from 'lucide-react';
import { api } from '../../api/client.js';

const TAB_CONTEXT = {
  dashboard: 'the admin dashboard showing today\'s revenue, order counts, and analytics.',
  menu: 'the menu items management section for adding or editing food items.',
  categories: 'the menu categories section for organizing food categories.',
  floors: 'the floors management section.',
  tables: 'the tables and QR code management section.',
  rooms: 'the rooms management section.',
  staff: 'the staff management section for managing hotel employees.',
  manager: 'the manager calls section showing staff escalations.',
  orders: 'the orders log section for monitoring and updating order statuses.',
  feedback: 'the customer feedback and reviews section.',
  assets: 'the assets management section for hotel media and branding.',
  ai: 'the AI assistant tab for generating menu copy and food graphics.',
};

const QUICK_PROMPTS = [
  'Summarize what I can do on this page',
  'Write a premium description for today\'s special',
  'How do I resolve a manager call?',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="shrink-0 w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mt-0.5">
          <Bot size={13} className="text-gold" />
        </div>
      )}
      <div
        className={[
          'max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
          isUser
            ? 'bg-gold text-pale-light rounded-tr-sm ml-auto'
            : 'bg-surface border border-gold-muted/30 text-rough rounded-tl-sm',
        ].join(' ')}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function GrokAssistant({ activeTab }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your Habesha Grand AI assistant. Ask me anything — I\'m aware of what page you\'re on.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const context = TAB_CONTEXT[activeTab] || 'the admin panel.';
    const systemPrompt = `You are a helpful AI assistant for Habesha Grand Hotel's admin panel. The admin is currently on ${context} Keep responses concise, practical, and friendly. You can help with menu copywriting, explaining features, generating descriptions, or operational guidance.`;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const historyForApi = newMessages.slice(-8); // last 8 messages for context
      const prompt = historyForApi
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const data = await api('/ai/groq', {
        method: 'POST',
        body: {
          task: 'content',
          prompt: `System: ${systemPrompt}\n\n${prompt}\nAssistant:`,
          tone: 'warm',
        },
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.text || 'Sorry, I couldn\'t generate a response.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.message || 'Failed to reach AI service.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Chat cleared! How can I help you?',
      },
    ]);
  }

  const panelWidth = expanded ? 'w-[480px]' : 'w-[340px]';
  const panelHeight = expanded ? 'h-[560px]' : 'h-[420px]';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className={[
              'flex flex-col rounded-2xl border border-gold-muted/40 shadow-lifted overflow-hidden',
              'bg-pale-light/95 backdrop-blur-md',
              panelWidth,
              panelHeight,
              'transition-all duration-200',
            ].join(' ')}
            style={{ boxShadow: '0 20px 60px rgba(26, 14, 5, 0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-rough border-b border-rough-light/20 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center">
                <span className="text-sm" aria-hidden="true">🏨</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-pale text-sm leading-tight">
                  Habesha Grand AI
                </p>
                <p className="text-[10px] text-gold-muted truncate capitalize">
                  {activeTab ? `📍 ${activeTab} tab` : 'Admin Panel'}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="p-1.5 rounded-lg text-pale/50 hover:text-pale hover:bg-rough-light/30 transition-colors"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  title={expanded ? 'Compact' : 'Expand'}
                  className="p-1.5 rounded-lg text-pale/50 hover:text-pale hover:bg-rough-light/30 transition-colors"
                >
                  {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg text-pale/50 hover:text-pale hover:bg-rough-light/30 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-gold" />
                  </div>
                  <div className="bg-surface border border-gold-muted/30 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 bg-gold-muted rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts — only shown when no user messages yet */}
            {messages.length === 1 && !loading && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="text-[10px] px-2.5 py-1 bg-surface border border-gold-muted/40 rounded-full text-rough hover:border-gold/60 hover:bg-gold/5 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-gold-muted/25 shrink-0 flex gap-2 items-end bg-pale">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask anything… (Enter to send)"
                disabled={loading}
                className="flex-1 resize-none bg-surface border border-gold-muted/50 rounded-xl px-3 py-2 text-xs text-rough placeholder:text-gold-muted focus:outline-none focus:border-gold transition-colors max-h-24 min-h-[36px]"
                style={{ fieldSizing: 'content' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-gold hover:bg-gold-hover disabled:opacity-40 rounded-xl text-pale transition-colors"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-13 h-13 rounded-2xl bg-rough border border-rough-light/20 shadow-lifted flex items-center justify-center text-pale hover:bg-rough/90 transition-colors"
        style={{ width: 52, height: 52 }}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        title="Habesha Grand AI Assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-xl"
              aria-hidden="true"
            >
              🏨
            </motion.span>
          )}
        </AnimatePresence>
        {/* Pulse ring when closed */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-2xl border-2 border-gold/40"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.button>
    </div>
  );
}
