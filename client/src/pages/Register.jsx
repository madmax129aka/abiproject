import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    dob: '', gender: '', mobile: '', preferredLanguage: 'en', location: ''
  });
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.mobile) errs.mobile = 'Mobile number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success('Registration successful!');
      navigate('/skill-setup');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const pw = form.password;
    if (!pw) return { level: 0, text: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    
    if (score <= 2) return { level: score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: score, text: 'Medium', color: 'bg-yellow-500' };
    return { level: score, text: 'Strong', color: 'bg-green-500' };
  };

  const pwStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🔄</span>
            <span className="font-bold text-2xl gradient-text">SkillSwap</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">{t('auth.register')}</h1>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex-1 h-2 rounded-full overflow-hidden bg-dark-surface">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: step >= s ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-2">{t('auth.step')} {step}/2</span>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8 border border-dark-border">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.full_name')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text" value={form.fullName}
                    onChange={(e) => updateForm('fullName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email" value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Min 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-dark-surface overflow-hidden flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`flex-1 rounded-full ${i <= pwStrength.level ? pwStrength.color : 'bg-dark-border'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{pwStrength.text}</span>
                  </div>
                )}
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password" value={form.confirmPassword}
                    onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.dob')}</label>
                <input
                  type="date" value={form.dob}
                  onChange={(e) => updateForm('dob', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {errors.dob && <p className="text-red-400 text-xs mt-1">{errors.dob}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.gender')}</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateForm('gender', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.mobile')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="tel" value={form.mobile}
                    onChange={(e) => updateForm('mobile', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="9876543210"
                  />
                </div>
                {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.language')}</label>
                <select
                  value={form.preferredLanguage}
                  onChange={(e) => updateForm('preferredLanguage', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="en">English</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.location')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text" value={form.location}
                    onChange={(e) => updateForm('location', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-dark-border text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-all"
              >
                {t('auth.back')}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] glow-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : step === 2 ? t('auth.register_btn') : t('auth.next')}
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-4">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
