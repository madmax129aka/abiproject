import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, X, Upload, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const SkillSetup = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState([]);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [teachSearch, setTeachSearch] = useState('');
  const [learnSearch, setLearnSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/skills');
      setAllSkills(res.data.skills || []);
    } catch (error) {
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const addTeachSkill = (skillName) => {
    if (teachSkills.find(s => s.name === skillName)) return;
    if (learnSkills.includes(skillName)) {
      toast.error("Can't teach and learn the same skill");
      return;
    }
    setTeachSkills([...teachSkills, { name: skillName, level: 'Intermediate', certificate: null }]);
    setTeachSearch('');
  };

  const addLearnSkill = (skillName) => {
    if (learnSkills.includes(skillName)) return;
    if (teachSkills.find(s => s.name === skillName)) {
      toast.error("Can't teach and learn the same skill");
      return;
    }
    setLearnSkills([...learnSkills, skillName]);
    setLearnSearch('');
  };

  const removeTeachSkill = (skillName) => {
    setTeachSkills(teachSkills.filter(s => s.name !== skillName));
  };

  const updateTeachLevel = (skillName, level) => {
    setTeachSkills(teachSkills.map(s => s.name === skillName ? { ...s, level } : s));
  };

  const handleSave = async () => {
    if (teachSkills.length === 0) {
      toast.error('Add at least one skill you can teach');
      return;
    }
    if (learnSkills.length === 0) {
      toast.error('Add at least one skill you want to learn');
      return;
    }

    setSaving(true);
    try {
      await api.post('/skills/user/batch', {
        teachSkills: teachSkills.map(s => ({ name: s.name, level: s.level })),
        learnSkills: learnSkills
      });
      
      updateUser({ skillSetupComplete: true });
      toast.success('Skills saved! Starting validation...');
      
      // Navigate to validate the first teach skill
      navigate(`/validate/${encodeURIComponent(teachSkills[0].name)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save skills');
    } finally {
      setSaving(false);
    }
  };

  const filteredTeachSkills = allSkills.filter(s => 
    s.name.toLowerCase().includes(teachSearch.toLowerCase()) &&
    !teachSkills.find(ts => ts.name === s.name)
  );

  const filteredLearnSkills = allSkills.filter(s => 
    s.name.toLowerCase().includes(learnSearch.toLowerCase()) &&
    !learnSkills.includes(s.name)
  );

  if (loading) return <LoadingSpinner text="Loading skills..." />;

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            {t('skills.setup_title')}
          </h1>
          <p className="text-slate-400 text-center mb-10">
            Tell us what you know and what you want to learn
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Teach Skills */}
            <div className="glass rounded-2xl p-6 border border-dark-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <GraduationCap className="text-blue-400" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{t('skills.teach')}</h2>
                  <p className="text-xs text-slate-400">{t('skills.teach_desc')}</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={teachSearch}
                  onChange={(e) => setTeachSearch(e.target.value)}
                  placeholder={t('skills.search_skills')}
                  className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {teachSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-surface border border-dark-border rounded-xl max-h-40 overflow-y-auto z-10 shadow-xl">
                    {filteredTeachSkills.slice(0, 8).map(skill => (
                      <button
                        key={skill._id}
                        onClick={() => addTeachSkill(skill.name)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary/10 hover:text-white transition-colors"
                      >
                        {skill.name} <span className="text-slate-500 text-xs">({skill.category})</span>
                      </button>
                    ))}
                    {filteredTeachSkills.length === 0 && (
                      <p className="px-4 py-2 text-sm text-slate-500">No skills found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Added skills */}
              <div className="space-y-3">
                {teachSkills.map(skill => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-3 bg-dark-surface rounded-xl border border-dark-border"
                  >
                    <span className="text-sm text-white font-medium flex-1">{skill.name}</span>
                    <select
                      value={skill.level}
                      onChange={(e) => updateTeachLevel(skill.name, e.target.value)}
                      className="px-2 py-1 bg-dark-bg border border-dark-border rounded-lg text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Beginner">{t('skills.beginner')}</option>
                      <option value="Intermediate">{t('skills.intermediate')}</option>
                      <option value="Expert">{t('skills.expert')}</option>
                    </select>
                    <button onClick={() => removeTeachSkill(skill.name)} className="text-slate-500 hover:text-red-400">
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
                {teachSkills.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-8">Search and add skills you can teach</p>
                )}
              </div>
            </div>

            {/* Learn Skills */}
            <div className="glass rounded-2xl p-6 border border-dark-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{t('skills.learn')}</h2>
                  <p className="text-xs text-slate-400">{t('skills.learn_desc')}</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={learnSearch}
                  onChange={(e) => setLearnSearch(e.target.value)}
                  placeholder={t('skills.search_skills')}
                  className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {learnSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-surface border border-dark-border rounded-xl max-h-40 overflow-y-auto z-10 shadow-xl">
                    {filteredLearnSkills.slice(0, 8).map(skill => (
                      <button
                        key={skill._id}
                        onClick={() => addLearnSkill(skill.name)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary/10 hover:text-white transition-colors"
                      >
                        {skill.name} <span className="text-slate-500 text-xs">({skill.category})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Added skills */}
              <div className="flex flex-wrap gap-2">
                {learnSkills.map(skill => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  >
                    {skill}
                    <button onClick={() => setLearnSkills(learnSkills.filter(s => s !== skill))} className="hover:text-red-400">
                      <X size={14} />
                    </button>
                  </motion.span>
                ))}
                {learnSkills.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-8 w-full">Search and add skills you want to learn</p>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSave}
              disabled={saving || teachSkills.length === 0 || learnSkills.length === 0}
              className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-105 glow-primary disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? 'Saving...' : t('skills.save_continue')}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              You'll need to validate your teaching skills with a short AI assessment
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SkillSetup;
