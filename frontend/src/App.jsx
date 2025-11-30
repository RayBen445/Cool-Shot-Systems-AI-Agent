import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Sparkles } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white font-sans overflow-hidden">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Local AI Assistant
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'
                }`}
            >
              <MessageSquare size={18} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === 'image' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'
                }`}
            >
              <ImageIcon size={18} />
              Image
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ChatInterface />
              </motion.div>
            ) : (
              <motion.div
                key="image"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
