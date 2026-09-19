import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api/client';
import { ChatMessage } from '../../types';
import { Send, Bot, User, Sparkles, Compass, ShieldCheck, DollarSign, Clock } from 'lucide-react';

interface RydoAIAssistantProps {
  onQuickBook?: (destination: string) => void;
}

export const RydoAIAssistant: React.FC<RydoAIAssistantProps> = ({ onQuickBook }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am your **RYDO AI Concierge**. How may I assist your journey today? Ask me about fare estimates, vehicle tiers, safety policies, or driver operations.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Estimate fare to SFO Airport",
    "Explain RYDO vehicle tiers",
    "How does the security PIN work?",
    "How do driver payouts work?"
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', { message: textToSend });
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I am momentarily recalibrating. Please ask again or reach out to RYDO Support.",
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-luxury overflow-hidden flex flex-col h-[600px]">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-pearl-100/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-electric-600 to-electric-400 flex items-center justify-center text-white shadow-md shadow-electric-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-navy-900 text-sm">RYDO AI Concierge</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-electric-50 text-electric-600 border border-electric-200">
                Active Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous route pricing, safety verification & fleet guidance</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-electric-500" />
          <span className="text-[10px] font-bold text-navy-900">v1.2 Mobility Core</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-pearl-50 to-pearl-100/40">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-electric-50 border border-electric-200 flex items-center justify-center text-electric-600 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-md rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-electric-600 to-electric-500 text-white shadow-md shadow-electric-500/20 font-medium'
                  : 'bg-white border border-slate-200/80 text-navy-800 shadow-sm whitespace-pre-line'
              }`}
            >
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-navy-900 flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 pl-11">
            <div className="w-2 h-2 rounded-full bg-electric-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-electric-400 animate-bounce delay-100" />
            <div className="w-2 h-2 rounded-full bg-electric-400 animate-bounce delay-200" />
            <span className="text-[11px] text-slate-400 font-medium">RYDO AI is reasoning...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && (
        <div className="px-6 py-2 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Prompts:</span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(sug)}
              className="px-3 py-1 rounded-full bg-pearl-200 hover:bg-electric-50 text-slate-600 hover:text-electric-600 border border-slate-200 hover:border-electric-200 text-[11px] font-semibold transition shrink-0 cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-slate-200/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask RYDO AI anything about routes, rates, or policies..."
            className="flex-1 bg-pearl-100 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-electric-500 hover:bg-electric-600 text-white flex items-center justify-center transition shadow-md shadow-electric-500/20 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default RydoAIAssistant;
