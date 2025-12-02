import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Building, Shield, LogOut } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
            >
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-3xl font-bold text-white">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">{user.full_name || 'User'}</h2>
                        <p className="text-gray-400 flex items-center gap-2 mt-1">
                            <Mail size={16} /> {user.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-purple-300">
                            <Building size={20} />
                            <span className="font-medium">Company</span>
                        </div>
                        <p className="text-xl text-white font-semibold">{user.company_name || 'Not specified'}</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-blue-300">
                            <Shield size={20} />
                            <span className="font-medium">Account Type</span>
                        </div>
                        <p className="text-xl text-white font-semibold flex items-center gap-2">
                            {user.is_admin ? (
                                <span className="text-yellow-400">Administrator</span>
                            ) : (
                                'Standard User'
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
