import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    systemStatus: 'operational'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';
        const response = await fetch(`${apiUrl}/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        setError('Failed to load admin stats');
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.is_admin) {
      fetchStats();
    }
  }, [user]);

  if (!user?.is_admin) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-300 mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access the admin dashboard.</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-red-400" />
          <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
        </div>
        <p className="text-gray-400">Monitor system status and user activity</p>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="text-blue-400" size={32} />
            <span className="text-xs text-gray-400 bg-blue-500/10 px-2 py-1 rounded">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</h3>
          <p className="text-gray-400 text-sm">Total Users</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-green-400" size={32} />
            <span className="text-xs text-gray-400 bg-green-500/10 px-2 py-1 rounded">Active</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.activeUsers}</h3>
          <p className="text-gray-400 text-sm">Active Users</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-purple-400" size={32} />
            <span className="text-xs text-gray-400 bg-purple-500/10 px-2 py-1 rounded">API</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalRequests}</h3>
          <p className="text-gray-400 text-sm">Total Requests</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <Shield className="text-yellow-400" size={32} />
            <span className={`text-xs px-2 py-1 rounded ${
              stats.systemStatus === 'operational' 
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {stats.systemStatus}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1 capitalize">{stats.systemStatus}</h3>
          <p className="text-gray-400 text-sm">System Status</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
