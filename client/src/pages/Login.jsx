import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName}!`);
      if (!user.skillSetupComplete) {
        navigate('/skill-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
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
          <h1 className="mt-4 text-2xl font-bold text-white">{t('auth.login')}</h1>
          <p className="mt-1 text-slate-400 text-sm">Welcome back! Sign in to continue.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 border border-dark-border space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full pl-10 pr-12 py-3 bg-dark-surface border border-dark-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button type="button" onClick={() => toast('Feature coming soon!')} className="text-xs text-primary hover:underline">
              {t('auth.forgot_password')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] glow-primary disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Signing in...' : t('auth.login_btn')}
          </button>

          <p className="text-center text-sm text-slate-400">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t('auth.register')}
            </Link>
          </p>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 glass rounded-xl p-4 border border-dark-border">
          <p className="text-xs text-slate-500 mb-2 font-medium">Demo Accounts:</p>
          <div className="space-y-1 text-xs text-slate-400">
            <p><span className="text-slate-300">Admin:</span> admin@skillswap.com / Admin@123</p>
            <p><span className="text-slate-300">User:</span> alex@demo.com / Demo@123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
