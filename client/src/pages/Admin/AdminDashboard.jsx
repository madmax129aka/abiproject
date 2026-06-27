import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Activity, Calendar, FileCheck, AlertTriangle, BookOpen, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || !stats) {
        const res = await api.get('/admin/stats');
        setStats(res.data.stats);
      }
      if (activeTab === 'users') {
        const res = await api.get(`/admin/users?search=${searchTerm}`);
        setUsers(res.data.users || []);
      }
      if (activeTab === 'certificates') {
        const res = await api.get('/admin/certificates');
        setCertificates(res.data.certificates || []);
      }
      if (activeTab === 'reports') {
        const res = await api.get('/admin/reports');
        setReports(res.data.reports || []);
      }
    } catch (error) {
      console.error('Admin data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleCertVerify = async (certId, approved) => {
    try {
      await api.put(`/admin/certificates/${certId}/verify`, { approved });
      toast.success(approved ? 'Certificate approved' : 'Certificate rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to verify certificate');
    }
  };

  const handleReportAction = async (userId, action) => {
    try {
      await api.put(`/admin/reports/${userId}/action`, { action });
      toast.success(`Action "${action}" applied`);
      fetchData();
    } catch (error) {
      toast.error('Failed to apply action');
    }
  };

  const tabs = [
    { id: 'overview', icon: BarChart3, label: t('admin.overview') },
    { id: 'users', icon: Users, label: t('admin.users') },
    { id: 'certificates', icon: FileCheck, label: t('admin.certificates') },
    { id: 'reports', icon: AlertTriangle, label: t('admin.reports') },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-60 min-h-[calc(100vh-4rem)] border-r border-dark-border p-4 hidden md:block">
          <h2 className="text-lg font-bold text-white mb-6 px-3">{t('admin.title')}</h2>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary border-l-2 border-primary'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border flex z-40">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
                activeTab === tab.id ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {loading && !stats ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Overview */}
              {activeTab === 'overview' && stats && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: t('admin.total_users'), value: stats.totalUsers, icon: Users, color: 'bg-primary/20 text-primary' },
                      { label: t('admin.active_matches'), value: stats.activeMatches, icon: Activity, color: 'bg-blue-500/20 text-blue-400' },
                      { label: t('admin.sessions_today'), value: stats.sessionsToday, icon: Calendar, color: 'bg-success/20 text-success' },
                      { label: t('admin.pending_certs'), value: stats.pendingCertificates, icon: FileCheck, color: 'bg-yellow-500/20 text-yellow-400' }
                    ].map((stat, i) => (
                      <div key={i} className="glass rounded-xl p-4 border border-dark-border">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                          <stat.icon size={18} />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass rounded-xl p-6 border border-dark-border">
                      <h3 className="font-semibold text-white mb-4">New Users (Last 7 Days)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.newUsersLast7Days || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2D2D4E" />
                          <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid #2D2D4E', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="glass rounded-xl p-6 border border-dark-border">
                      <h3 className="font-semibold text-white mb-4">Top Skills (Teaching)</h3>
                      <div className="space-y-2">
                        {(stats.topTeachSkills || []).slice(0, 5).map((skill, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm text-slate-300 w-32 truncate">{skill._id}</span>
                            <div className="flex-1 h-2 rounded-full bg-dark-surface overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(skill.count / (stats.topTeachSkills[0]?.count || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{skill.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                      placeholder="Search users by name or email..."
                      className="w-full max-w-md px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="glass rounded-xl border border-dark-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-dark-border">
                            <th className="text-left p-4 text-xs font-medium text-slate-400">Name</th>
                            <th className="text-left p-4 text-xs font-medium text-slate-400">Email</th>
                            <th className="text-left p-4 text-xs font-medium text-slate-400">Status</th>
                            <th className="text-left p-4 text-xs font-medium text-slate-400">Reputation</th>
                            <th className="text-left p-4 text-xs font-medium text-slate-400">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(u => (
                            <tr key={u._id} className="border-b border-dark-border/50 hover:bg-white/5">
                              <td className="p-4 text-sm text-white">{u.fullName}</td>
                              <td className="p-4 text-sm text-slate-300">{u.email}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-success/20 text-success'}`}>
                                  {u.isBanned ? 'Banned' : 'Active'}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-slate-300">{u.reputationScore?.toFixed(1) || '0'}</td>
                              <td className="p-4">
                                <button
                                  onClick={() => handleBan(u._id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                    u.isBanned 
                                      ? 'bg-success/20 text-success hover:bg-success/30' 
                                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  }`}
                                >
                                  {u.isBanned ? t('admin.unban') : t('admin.ban')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Certificates */}
              {activeTab === 'certificates' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4">Certificate Verification Queue</h2>
                  {certificates.length === 0 ? (
                    <p className="text-slate-400 text-center py-10">No certificates pending review</p>
                  ) : (
                    certificates.map(cert => (
                      <div key={cert._id} className="glass rounded-xl p-4 border border-dark-border flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-white">{cert.skillName}</p>
                          <p className="text-sm text-slate-400">{cert.userId?.fullName} ({cert.userId?.email})</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Status: {cert.certificateVerified ? '✅ Verified' : '⏳ Pending'}
                          </p>
                        </div>
                        {!cert.certificateVerified && (
                          <div className="flex gap-2">
                            <button onClick={() => handleCertVerify(cert._id, true)} className="px-3 py-1.5 bg-success/20 text-success rounded-lg text-xs font-medium">
                              {t('admin.approve')}
                            </button>
                            <button onClick={() => handleCertVerify(cert._id, false)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                              {t('admin.reject')}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* Reports */}
              {activeTab === 'reports' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4">User Reports</h2>
                  {reports.length === 0 ? (
                    <p className="text-slate-400 text-center py-10">No open reports</p>
                  ) : (
                    reports.map(report => (
                      <div key={report._id} className="glass rounded-xl p-4 border border-dark-border">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{report.fullName}</p>
                            <p className="text-sm text-slate-400">{report.email}</p>
                            <div className="mt-2 space-y-1">
                              {report.reportedBy?.map((r, i) => (
                                <p key={i} className="text-xs text-slate-500">
                                  Reported by {r.userId?.fullName || 'Unknown'}: "{r.reason}"
                                </p>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleReportAction(report._id, 'warn')} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                              {t('admin.warn')}
                            </button>
                            <button onClick={() => handleReportAction(report._id, 'ban')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                              {t('admin.ban')}
                            </button>
                            <button onClick={() => handleReportAction(report._id, 'dismiss')} className="px-3 py-1.5 bg-slate-500/20 text-slate-400 rounded-lg text-xs font-medium">
                              {t('admin.dismiss')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
