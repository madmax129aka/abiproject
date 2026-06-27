import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Chatbot = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('chatbot.welcome') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        messages: newMessages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (error) {
      toast.error('Failed to get response');
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later!" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="text-primary" size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-white">{t('chatbot.title')}</h1>
              <p className="text-xs text-slate-400">Ask me about learning paths, resources, and more</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-secondary/20' : 'bg-primary/20'
              }`}>
                {msg.role === 'user' 
                  ? <User size={16} className="text-secondary" />
                  : <Bot size={16} className="text-primary" />
                }
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-secondary/20 text-white rounded-br-md'
                  : 'bg-dark-surface border border-dark-border text-slate-200 rounded-bl-md'
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content.split('\n').map((line, li) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={li} className="font-semibold text-white">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('- ') || line.startsWith('• ')) {
                      return <p key={li} className="ml-3">• {line.slice(2)}</p>;
                    }
                    if (line.match(/^\d+\./)) {
                      return <p key={li} className="ml-3">{line}</p>;
                    }
                    return <p key={li}>{line || <br />}</p>;
                  })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-dark-surface border border-dark-border rounded-bl-md">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-dark-border bg-dark-surface/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.placeholder')}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-primary hover:bg-primary/80 text-white rounded-xl transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
