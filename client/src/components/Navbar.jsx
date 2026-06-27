import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Users, MessageCircle, User, Bot, Shield,
  LogOut, Menu, X, Bell, Sun, Moon, Globe
} from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications?.slice(0, 10) || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // silent fail
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setShowLangMenu(false);
    // Update on server
    if (user?._id) {
      api.put(`/users/${user._id}`, { preferredLanguage: lang }).catch(() => {});
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/matches', icon: Users, label: t('nav.matches') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
    { path: '/chatbot', icon: Bot, label: t('nav.chatbot') },
    { path: `/profile/${user?._id}`, icon: User, label: t('nav.profile') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('nav.admin') }] : [])
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass dark:glass glass-light border-b border-dark-border dark:border-dark-border border-light-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <span className="font-bold text-xl gradient-text hidden sm:block">SkillSwap</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-primary/20 text-primary'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <Globe size={18} />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-32 rounded-xl glass dark:glass glass-light border border-dark-border overflow-hidden shadow-xl">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'ta', label: 'தமிழ்' },
                      { code: 'hi', label: 'हिन्दी' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors ${
                          i18n.language === lang.code ? 'text-primary font-medium' : 'text-slate-300'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full text-xs flex items-center justify-center text-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl glass dark:glass glass-light border border-dark-border shadow-xl">
                    <div className="p-3 border-b border-dark-border">
                      <h3 className="font-semibold text-white text-sm">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">
                        You're all caught up!
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <Link
                          key={notif._id}
                          to={notif.link || '#'}
                          onClick={() => setShowNotifs(false)}
                          className={`block px-4 py-3 border-b border-dark-border/50 hover:bg-white/5 transition-colors ${
                            !notif.read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <p className="text-sm text-slate-200">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="hidden md:flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {user?.fullName?.charAt(0) || '?'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-dark-border">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-primary/20 text-primary'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 w-full"
              >
                <LogOut size={18} />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
