import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, Calendar, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getInitials, timeAgo } from '../utils/helpers';

const Chat = () => {
  const { t } = useTranslation();
  const { matchId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ skillName: '', scheduledAt: '' });
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find(m => m._id === matchId);
      if (match) {
        setActiveMatch(match);
        fetchMessages(matchId);
      }
    }
  }, [matchId, matches]);

  useEffect(() => {
    if (socket && matchId) {
      socket.emit('join-match', matchId);

      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      socket.on('user-typing', () => setTyping(true));
      socket.on('user-stop-typing', () => setTyping(false));
      socket.on('spam-warning', (data) => toast.error(data.message));

      return () => {
        socket.emit('leave-match', matchId);
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
        socket.off('spam-warning');
      };
    }
  }, [socket, matchId]);

  const fetchMatches = async () => {
    try {
      const res = await api.get('/matches');
      setMatches(res.data.matches || []);
    } catch (error) {
      console.error('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await api.get(`/chat/${id}/messages`);
      setMessages(res.data.messages || []);
      scrollToBottom();
      // Mark as read
      if (socket) socket.emit('read-messages', { matchId: id });
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId) return;

    const otherUser = activeMatch?.userA?._id === user._id ? activeMatch?.userB : activeMatch?.userA;

    if (socket) {
      socket.emit('send-message', {
        matchId,
        receiverId: otherUser?._id,
        content: newMessage.trim(),
        type: 'text'
      });
    } else {
      // Fallback to API
      try {
        await api.post(`/chat/${matchId}/messages`, { content: newMessage.trim() });
        fetchMessages(matchId);
      } catch (err) {
        toast.error('Failed to send message');
      }
    }

    setNewMessage('');
  };

  const handleTyping = () => {
    if (socket && matchId) {
      socket.emit('typing', { matchId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { matchId });
      }, 2000);
    }
  };

  const scheduleSession = async () => {
    if (!scheduleForm.skillName || !scheduleForm.scheduledAt) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await api.post(`/chat/${matchId}/session`, scheduleForm);
      toast.success('Session scheduled!');
      setShowSchedule(false);
      setScheduleForm({ skillName: '', scheduledAt: '' });
      fetchMessages(matchId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule');
    }
  };

  const getOtherUser = (match) => {
    return match?.userA?._id === user._id ? match?.userB : match?.userA;
  };

  if (loading) return <div className="min-h-screen bg-dark-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Conversations */}
        <div className={`${matchId ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-dark-border bg-dark-surface/30 overflow-y-auto`}>
          <div className="p-4 border-b border-dark-border">
            <h2 className="font-semibold text-white">{t('chat.title')}</h2>
          </div>
          
          {matches.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No conversations yet. Find matches first!
            </div>
          ) : (
            matches.map(match => {
              const other = getOtherUser(match);
              return (
                <button
                  key={match._id}
                  onClick={() => navigate(`/chat/${match._id}`)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-dark-border/50 ${
                    match._id === matchId ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {getInitials(other?.fullName)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">{other?.fullName}</p>
                    <p className="text-xs text-slate-400">{match.matchPercentage}% match</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat Area */}
        <div className={`${!matchId ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
          {!matchId ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400">{t('chat.select_chat')}</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-dark-border bg-dark-surface/50">
                <button onClick={() => navigate('/chat')} className="md:hidden text-slate-400 hover:text-white">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {getInitials(getOtherUser(activeMatch)?.fullName)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{getOtherUser(activeMatch)?.fullName}</p>
                  {typing && <p className="text-xs text-primary animate-pulse">{t('chat.typing')}</p>}
                </div>
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-primary transition-colors"
                  title={t('chat.schedule_session')}
                >
                  <Calendar size={18} />
                </button>
              </div>

              {/* Schedule Modal */}
              {showSchedule && (
                <div className="p-4 border-b border-dark-border bg-dark-surface/80 space-y-3">
                  <h3 className="text-sm font-medium text-white">{t('chat.schedule_session')}</h3>
                  <input
                    type="text"
                    value={scheduleForm.skillName}
                    onChange={(e) => setScheduleForm(p => ({ ...p, skillName: e.target.value }))}
                    placeholder="Skill name (e.g., JavaScript)"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm(p => ({ ...p, scheduledAt: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button onClick={scheduleSession} className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/80">Schedule</button>
                    <button onClick={() => setShowSchedule(false)} className="px-4 py-2 text-slate-400 text-sm hover:text-white">Cancel</button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm">{t('chat.no_messages')}</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = msg.senderId?._id === user._id || msg.senderId === user._id;
                    const isSystem = msg.type === 'system';
                    
                    if (isSystem) {
                      return (
                        <div key={msg._id || i} className="text-center">
                          <span className="inline-block px-3 py-1.5 rounded-full text-xs bg-dark-surface text-slate-400 border border-dark-border">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <motion.div
                        key={msg._id || i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-dark-surface text-slate-200 border border-dark-border rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-slate-500'}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-dark-border bg-dark-surface/50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    placeholder={t('chat.type_message')}
                    className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary hover:bg-primary/80 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
