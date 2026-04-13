import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Building, Shield, LogOut, CheckCircle, User } from 'lucide-react';

const InfoCard = ({ icon: Icon, label, value, color = 'text-violet-400' }) => (
  <div className="glass rounded-2xl p-5">
    <div className={`flex items-center gap-2 mb-2 ${color}`}>
      <Icon size={16} />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <p className="text-white font-semibold text-base">{value}</p>
  </div>
);

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initial = user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Hero card */}
        <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 pointer-events-none" />
          <div className="flex items-center gap-6 relative">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-violet-900/50">
                {initial}
              </div>
              {user.is_admin && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg">
                  <Shield size={12} className="text-amber-900" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.full_name || 'User'}</h2>
              <p className="text-slate-400 flex items-center gap-1.5 mt-1 text-sm">
                <Mail size={14} /> {user.email}
              </p>
              {user.is_admin && (
                <span className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
                  <Shield size={11} /> Administrator
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard
            icon={Building}
            label="Company"
            value={user.company_name || 'Not specified'}
            color="text-indigo-400"
          />
          <InfoCard
            icon={Shield}
            label="Account Type"
            value={user.is_admin ? 'Administrator' : 'Standard User'}
            color={user.is_admin ? 'text-amber-400' : 'text-violet-400'}
          />
          <InfoCard
            icon={CheckCircle}
            label="Status"
            value="Active"
            color="text-emerald-400"
          />
          <InfoCard
            icon={User}
            label="User ID"
            value={user.id ? String(user.id).slice(0, 8) + '...' : 'N/A'}
            color="text-slate-400"
          />
        </div>

        {/* Danger zone */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Account Actions</h3>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-sm font-medium"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
