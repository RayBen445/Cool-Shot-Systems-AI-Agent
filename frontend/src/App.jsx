import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatInterface from './components/ChatInterface';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Sidebar from './components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Shield, Sparkles } from 'lucide-react';
import logo from './assets/logo.png';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.is_admin) return <Navigate to="/" />;
  return children;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'New Chat' })
      });
      if (res.ok) {
        const newConv = await res.json();
        setActiveConversationId(newConv.id);
      }
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const handlePromptSaved = () => setSidebarRefresh(prev => prev + 1);

  const initial = user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="h-screen flex flex-col bg-[#080b14] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-white/[0.06] bg-[#0c1018]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="Cool-Shot AI" className="w-8 h-8 object-contain rounded-lg" />
            <div className="absolute inset-0 rounded-lg ring-1 ring-violet-500/30" />
          </div>
          <span className="text-sm font-semibold gradient-text tracking-wide">Cool-Shot AI</span>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-900/40">
                  {initial}
                </div>
                <span className="text-sm text-slate-300 hidden sm:block">{user.full_name || user.email}</span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <div className="text-xs font-medium text-slate-400">Signed in as</div>
                      <div className="text-sm text-white font-medium truncate mt-0.5">{user.email}</div>
                    </div>
                    <div className="p-1.5">
                      <NavLink
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm"
                      >
                        <User size={15} /> Profile
                      </NavLink>
                      {user.is_admin && (
                        <NavLink
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm"
                        >
                          <Shield size={15} /> Admin
                        </NavLink>
                      )}
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors text-sm"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {user && (
          <Sidebar
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
            refreshTrigger={sidebarRefresh}
            activeConversationId={activeConversationId}
            onSelectPrompt={(content) => {
              window.dispatchEvent(new CustomEvent('insertPrompt', { detail: content }));
            }}
          />
        )}
        <main className="flex-1 overflow-hidden">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === ChatInterface) {
              return React.cloneElement(child, {
                conversationId: activeConversationId,
                onNewChat: handleNewChat,
                onPromptSaved: handlePromptSaved
              });
            }
            return child;
          })}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Layout><ChatInterface /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
