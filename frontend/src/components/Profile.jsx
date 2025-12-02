import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.username}</h2>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <Mail className="text-blue-400" size={24} />
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <User className="text-purple-400" size={24} />
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="text-white font-medium">{user.username}</p>
            </div>
          </div>

          {user.is_admin && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Shield className="text-red-400" size={24} />
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <p className="text-red-300 font-medium">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
