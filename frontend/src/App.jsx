import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950 text-white font-sans overflow-hidden relative">
      {/* Animated background elements with vibrant colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 h-screen flex flex-col relative z-10">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <Sparkles className="w-10 h-10 text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
              <Zap className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 via-purple-400 to-pink-400 tracking-tight drop-shadow-lg">
                Cool-Shot AI
              </h1>
              <p className="text-xs text-cyan-300 font-medium">Powered by Advanced AI</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-full p-1.5 border border-white/20 shadow-2xl shadow-purple-500/20"
          >
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium ${
                activeTab === 'chat' 
                  ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/60 scale-105' 
                  : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5'
              }`}
            >
              <MessageSquare size={18} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium ${
                activeTab === 'image' 
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/60 scale-105' 
                  : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5'
              }`}
            >
              <ImageIcon size={18} />
              Image
            </button>
          </motion.div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                <ChatInterface />
              </motion.div>
            ) : (
              <motion.div
                key="image"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                <ImageGenerator />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
