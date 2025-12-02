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
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Activity, Search } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            try {
                const [usersRes, activityRes] = await Promise.all([
                    fetch(`${apiUrl}/admin/users`, { headers }),
                    fetch(`${apiUrl}/admin/activity`, { headers })
                ]);

                if (usersRes.ok) setUsers(await usersRes.json());
                if (activityRes.ok) setActivity(await activityRes.json());
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-white text-center mt-20">Loading Dashboard...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-gray-300">System Online</span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-medium text-blue-200 bg-blue-500/10 px-2 py-1 rounded-lg">Total Users</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{users.length}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                            <MessageSquare size={24} />
                        </div>
                        <span className="text-xs font-medium text-purple-200 bg-purple-500/10 px-2 py-1 rounded-lg">Total Messages</span>
                    </div>
                    <p className="text-4xl font-bold text-white">
                        {users.reduce((acc, user) => acc + (user.message_count || 0), 0)}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-500/20 text-green-300">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-medium text-green-200 bg-green-500/10 px-2 py-1 rounded-lg">Active Now</span>
                    </div>
                    <p className="text-4xl font-bold text-white">1</p>
                </motion.div>
            </div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-xl"
            >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">User Database</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Company</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium text-right">Messages</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.full_name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{user.company_name || '-'}</td>
                                    <td className="px-6 py-4">
                                        {user.is_admin ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                User
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-300">{user.message_count || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
