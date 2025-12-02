import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, User, LogOut, Shield } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/" />;
  }

  return children;
};

// Navigation Bar Component
const NavBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="flex items-center justify-between mb-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Cool-Shot AI Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight">
                Cool-Shot AI
              </h1>
              <p className="text-xs text-gray-400 font-medium">Powered by Cool Shot Systems</p>
            </div>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        {user.is_admin && (
          <Link to="/admin">
            <button className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${location.pathname === '/admin' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Shield size={18} />
              Admin
            </button>
          </Link>
        )}

        <Link to="/profile">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium ${location.pathname === '/profile' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <User size={18} />
            Profile
          </button>
        </Link>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
        >
          <LogOut size={18} />
        </button>
      </motion.div>
    </header>
  );
};

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 h-screen flex flex-col relative z-10">
        <NavBar />

        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <ChatInterface />
                  </motion.div>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
