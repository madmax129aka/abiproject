import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Zap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Matches = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

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

  const runMatching = async () => {
    setRunning(true);
    try {
      const res = await api.post('/matches/run');
      toast.success(res.data.message || 'Matching complete!');
      await fetchMatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Matching failed');
    } finally {
      setRunning(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (!filter) return true;
    const other = match.userA?._id === user._id ? match.userB : match.userA;
    const name = other?.fullName?.toLowerCase() || '';
    const skills = [...(match.userATeaches || []), ...(match.userBTeaches || [])].join(' ').toLowerCase();
    return name.includes(filter.toLowerCase()) || skills.includes(filter.toLowerCase());
  });

  if (loading) return <LoadingSpinner text={t('common.loading')} />;

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t('matches.title')}</h1>
          <p className="text-slate-400 mt-1">Find people who complement your skills</p>
        </motion.div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
          <button
            onClick={runMatching}
            disabled={running}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-105 glow-primary disabled:opacity-50 disabled:hover:scale-100"
          >
            {running ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('matches.finding')}
              </>
            ) : (
              <>
                <Zap size={18} />
                {t('matches.run_matching')}
              </>
            )}
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Results */}
        {filteredMatches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Users className="mx-auto text-slate-600 mb-4" size={60} />
            <h2 className="text-xl font-semibold text-white mb-2">{t('matches.no_matches')}</h2>
            <p className="text-slate-400">{t('matches.no_matches_desc')}</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredMatches.map((match, index) => (
              <MatchCard
                key={match._id}
                match={match}
                currentUserId={user._id}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
