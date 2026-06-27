import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Star, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SkillBadge from './SkillBadge';
import { getInitials } from '../utils/helpers';

const MatchPercentRing = ({ percent }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="transform -rotate-90" width="80" height="80">
        <circle
          cx="40" cy="40" r={radius}
          stroke="rgba(108, 99, 255, 0.2)"
          strokeWidth="6"
          fill="none"
        />
        <motion.circle
          cx="40" cy="40" r={radius}
          stroke="#6C63FF"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-primary">{percent}%</span>
    </div>
  );
};

const MatchCard = ({ match, currentUserId, index = 0 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const otherUser = match.otherUser || 
    (match.userA?._id === currentUserId ? match.userB : match.userA);
  
  const theyTeach = match.userA?._id === currentUserId 
    ? match.userBTeaches 
    : match.userATeaches;
  
  const youTeach = match.userA?._id === currentUserId 
    ? match.userATeaches 
    : match.userBTeaches;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass dark:glass glass-light rounded-2xl p-6 border border-dark-border dark:border-dark-border border-light-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar & Match Ring */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {getInitials(otherUser?.fullName)}
          </div>
          <MatchPercentRing percent={match.matchPercentage || 0} />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg truncate">
            {otherUser?.fullName || 'Unknown User'}
          </h3>
          
          <div className="flex items-center gap-3 mt-1">
            {otherUser?.location && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} />
                {otherUser.location}
              </span>
            )}
            {otherUser?.reputationScore > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star size={12} fill="currentColor" />
                {otherUser.reputationScore.toFixed(1)}
              </span>
            )}
          </div>

          {/* Skills they can teach you */}
          {theyTeach && theyTeach.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1.5">{t('matches.they_teach')}</p>
              <div className="flex flex-wrap gap-1.5">
                {theyTeach.map(skill => (
                  <SkillBadge key={skill} skill={skill} type="learn" />
                ))}
              </div>
            </div>
          )}

          {/* Skills you can teach them */}
          {youTeach && youTeach.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1.5">{t('matches.you_teach')}</p>
              <div className="flex flex-wrap gap-1.5">
                {youTeach.map(skill => (
                  <SkillBadge key={skill} skill={skill} type="teach" />
                ))}
              </div>
            </div>
          )}

          {/* Common Interests */}
          {match.commonInterests && match.commonInterests.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1.5">{t('matches.common_interests')}</p>
              <div className="flex flex-wrap gap-1.5">
                {match.commonInterests.map(interest => (
                  <span key={interest} className="px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chat Button */}
          <button
            onClick={() => navigate(`/chat/${match._id}`)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 glow-primary"
          >
            <MessageCircle size={16} />
            {t('matches.chat_now')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;
