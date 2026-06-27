import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const RateSession = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // For now, we'll allow rating without fetching session details
    setLoading(false);
  }, [sessionId]);

  const handleSubmit = async () => {
    if (stars === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/ratings', {
        sessionId,
        rateeId: session?.teacherId || session?.learnerId,
        role: 'teacher',
        stars,
        feedback
      });
      toast.success(t('rating.thanks'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-2xl p-8 border border-dark-border"
      >
        <h1 className="text-2xl font-bold text-white text-center mb-2">{t('rating.title')}</h1>
        <p className="text-slate-400 text-center text-sm mb-8">How was your learning session?</p>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setStars(s)}
              className="transition-transform hover:scale-125"
            >
              <Star
                size={36}
                className={`transition-colors ${
                  s <= (hoveredStar || stars) ? 'text-yellow-400' : 'text-slate-600'
                }`}
                fill={s <= (hoveredStar || stars) ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>

        {stars > 0 && (
          <p className="text-center text-sm text-slate-300 mb-6">
            {stars === 5 ? 'Excellent!' : stars === 4 ? 'Great!' : stars === 3 ? 'Good' : stars === 2 ? 'Fair' : 'Poor'}
          </p>
        )}

        {/* Feedback */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t('rating.feedback')}
          className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none mb-6"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || stars === 0}
          className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] glow-primary disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : t('rating.submit')}
        </button>
      </motion.div>
    </div>
  );
};

export default RateSession;
