import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Calendar, Star, BookOpen, ArrowRight, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getInitials, formatDateTime } from '../utils/helpers';

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-5 border border-dark-border hover:border-primary/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">
            {typeof value === 'number' && value % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}
          </p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ matches: 0, sessions: 0, reputation: 0, teaching: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [matchRes, skillsRes] = await Promise.all([
        api.get('/matches').catch(() => ({ data: { matches: [] } })),
        api.get(`/users/${user._id}/skills`).catch(() => ({ data: { teachSkills: [], learnSkills: [] } }))
      ]);

      const matches = matchRes.data.matches || [];
      const teachSkills = skillsRes.data.teachSkills || [];
      
      setStats({
        matches: matches.length,
        sessions: 0,
        reputation: user.reputationScore || 0,
        teaching: teachSkills.filter(s => s.isVerified).length
      });
      
      setRecentMatches(matches.slice(0, 3));
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text={t('common.loading')} />;

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {t('dashboard.welcome')}, <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-400 mt-1">Here's your skill exchange overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label={t('dashboard.active_matches')} value={stats.matches} color="bg-primary/20" delay={0} />
          <StatCard icon={Calendar} label={t('dashboard.sessions_week')} value={stats.sessions} color="bg-blue-500/20" delay={0.1} />
          <StatCard icon={Star} label={t('dashboard.reputation')} value={stats.reputation} color="bg-yellow-500/20" delay={0.2} />
          <StatCard icon={BookOpen} label={t('dashboard.skills_teaching')} value={stats.teaching} color="bg-success/20" delay={0.3} />
        </div>

        {/* Find Matches CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="glass rounded-2xl p-8 border border-dark-border bg-gradient-to-r from-primary/5 to-secondary/5 hover:border-primary/30 transition-all">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{t('dashboard.find_matches')}</h2>
                <p className="text-slate-400 mt-1">{t('dashboard.find_matches_desc')}</p>
              </div>
              <Link
                to="/matches"
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-105 glow-primary whitespace-nowrap"
              >
                {t('dashboard.find_matches')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Matches & Sessions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 border border-dark-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">{t('dashboard.recent_matches')}</h3>
              <Link to="/matches" className="text-xs text-primary hover:underline">{t('common.view_all')}</Link>
            </div>
            
            {recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-slate-600 mb-3" size={40} />
                <p className="text-slate-400 text-sm">{t('dashboard.no_matches')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map(match => {
                  const other = match.userA?._id === user._id ? match.userB : match.userA;
                  return (
                    <div key={match._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-surface/50 hover:bg-dark-surface transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                        {getInitials(other?.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{other?.fullName}</p>
                        <p className="text-xs text-slate-400">{match.matchPercentage}% match</p>
                      </div>
                      <button
                        onClick={() => navigate(`/chat/${match._id}`)}
                        className="p-2 rounded-lg hover:bg-primary/20 text-slate-400 hover:text-primary transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 border border-dark-border"
          >
            <h3 className="font-semibold text-white mb-4">{t('dashboard.upcoming_sessions')}</h3>
            
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-slate-600 mb-3" size={40} />
                <p className="text-slate-400 text-sm">{t('dashboard.no_sessions')}</p>
                <p className="text-xs text-slate-500 mt-1">Schedule sessions with your matches</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map(session => (
                  <div key={session._id} className="p-3 rounded-xl bg-dark-surface/50">
                    <p className="text-sm font-medium text-white">{session.skillName}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(session.scheduledAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
