import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatInterface from './components/ChatInterface';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Sidebar from './components/Sidebar';
import logo from './assets/logo.png';
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

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  const handleNewChat = async () => {
    // Create a new conversation in backend
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: "New Chat" })
      });
      if (res.ok) {
        const newConv = await res.json();
        setActiveConversationId(newConv.id);
      }
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  const handlePromptSaved = () => {
    setSidebarRefresh(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col">
      <header className="p-4 flex justify-between items-center bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Cool-Shot AI Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight">
            Cool-Shot AI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-gray-300">Welcome, {user.full_name}</span>
              <button onClick={logout} className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded-lg transition-all border border-red-500/30">
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {user && (
          <Sidebar
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
            refreshTrigger={sidebarRefresh}
            onSelectPrompt={(content) => {
              // Dispatch event for ChatInterface to pick up
              window.dispatchEvent(new CustomEvent('insertPrompt', { detail: content }));
            }}
          />
        )}
        <main className="flex-1 p-4 relative">
          {/* Pass conversationId to children if it's ChatInterface */}
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

      <footer className="p-4 text-center text-gray-500 text-sm bg-black/20 backdrop-blur-sm border-t border-white/5">
        &copy; 2024 Cool Shot Systems. All rights reserved.
      </footer>
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
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatInterface />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
