import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, MapPin, Edit, Flag, Ban, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import SkillBadge from '../components/SkillBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { getInitials } from '../utils/helpers';

const Profile = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  const profileId = userId || currentUser?._id;
  const isOwn = profileId === currentUser?._id;

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${profileId}`);
      setProfile(res.data.user);
      setEditForm({
        fullName: res.data.user.fullName,
        mobile: res.data.user.mobile || '',
        location: res.data.user.location || '',
        preferredLanguage: res.data.user.preferredLanguage || 'en'
      });
    } catch (error) {
      toast.error('Failed to load profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/users/${profileId}`, editForm);
      toast.success('Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleBlock = async () => {
    if (!confirm('Are you sure you want to block this user?')) return;
    try {
      await api.post(`/users/${profileId}/block`);
      toast.success('User blocked');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await api.post(`/users/${profileId}/report`, { reason: reportReason });
      toast.success('Report submitted');
      setShowReport(false);
      setReportReason('');
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-dark-border mb-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                {getInitials(profile.fullName)}
              </div>
              {profile.reputationScore >= 4 && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-dark-bg">
                  <Star size={14} className="text-white" fill="white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                  className="text-2xl font-bold bg-dark-surface border border-dark-border rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <h1 className="text-2xl font-bold text-white">{profile.fullName}</h1>
              )}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                {profile.location && (
                  <span className="flex items-center gap-1 text-sm text-slate-400">
                    <MapPin size={14} />
                    {editing ? (
                      <input
                        value={editForm.location}
                        onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))}
                        className="bg-dark-surface border border-dark-border rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                      />
                    ) : profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-yellow-400">
                  <Star size={14} fill="currentColor" />
                  {profile.reputationScore?.toFixed(1) || '0.0'} {t('profile.reputation')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwn ? (
                editing ? (
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium">
                    <Save size={16} /> {t('profile.save')}
                  </button>
                ) : (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30">
                    <Edit size={16} /> {t('profile.edit')}
                  </button>
                )
              ) : (
                <>
                  <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/20">
                    <Flag size={14} /> {t('profile.report')}
                  </button>
                  <button onClick={handleBlock} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20">
                    <Ban size={14} /> {t('profile.block')}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-6 border border-dark-border w-full max-w-md">
              <h3 className="font-semibold text-white mb-4">{t('profile.report')} {profile.fullName}</h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting..."
                className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none"
              />
              <div className="flex gap-2 mt-4">
                <button onClick={handleReport} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Submit Report</button>
                <button onClick={() => setShowReport(false)} className="flex-1 py-2 border border-dark-border text-slate-300 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Teaching */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 border border-dark-border">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="text-blue-400" size={18} />
              {t('profile.teaching')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.teachSkills?.map(skill => (
                <SkillBadge
                  key={skill._id}
                  skill={skill.skillName}
                  type="teach"
                  level={skill.experienceLevel}
                  verified={skill.isVerified}
                />
              ))}
              {(!profile.teachSkills || profile.teachSkills.length === 0) && (
                <p className="text-slate-400 text-sm">No teaching skills set up</p>
              )}
            </div>
          </motion.div>

          {/* Learning */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 border border-dark-border">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="text-emerald-400" size={18} />
              {t('profile.learning')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.learnSkills?.map(skill => (
                <SkillBadge key={skill._id} skill={skill.skillName} type="learn" />
              ))}
              {(!profile.learnSkills || profile.learnSkills.length === 0) && (
                <p className="text-slate-400 text-sm">No learning goals set</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 border border-dark-border">
          <h3 className="font-semibold text-white mb-4">{t('profile.reviews')}</h3>
          {profile.ratings && profile.ratings.length > 0 ? (
            <div className="space-y-3">
              {profile.ratings.map(rating => (
                <div key={rating._id} className="p-4 bg-dark-surface/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= rating.stars ? 'text-yellow-400' : 'text-slate-600'} fill={s <= rating.stars ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">by {rating.raterId?.fullName || 'Anonymous'}</span>
                  </div>
                  {rating.feedback && <p className="text-sm text-slate-300">{rating.feedback}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">{t('profile.no_reviews')}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
