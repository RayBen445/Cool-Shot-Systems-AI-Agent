import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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
              <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
              <Zap className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight">
                Cool-Shot AI
              </h1>
              <p className="text-xs text-gray-400 font-medium">Powered by Cool Shot Systems</p>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10"
          >
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare size={18} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                activeTab === 'image'
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon size={18} />
              Image
            </button>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ChatInterface />
              </motion.div>
            ) : (
              <motion.div
                key="image"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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
