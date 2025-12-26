import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Save, Trash2, Layout, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ onSelectConversation, onNewChat, onSelectPrompt, refreshTrigger }) => {
    const [conversations, setConversations] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'prompts'

    useEffect(() => {
        fetchConversations();
        fetchPrompts();
    }, [refreshTrigger]);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`);
            if (res.ok) setConversations(await res.json());
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        }
    };

    const fetchPrompts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/prompts`);
            if (res.ok) setPrompts(await res.json());
        } catch (err) {
            console.error("Failed to fetch prompts", err);
        }
    };

    return (
        <div className="w-64 h-full bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col glass-heavy">
            {/* New Chat Button */}
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all border border-white/10 shadow-lg group backdrop-blur-sm"
                >
                    <Plus className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform" />
                    <span className="font-medium">New Chat</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 px-4 gap-4">
                <button
                    onClick={() => setActiveTab('chats')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'chats' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Recent
                    {activeTab === 'chats' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('prompts')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'prompts' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    My Stuff
                    {activeTab === 'prompts' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
                </button>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                {activeTab === 'chats' ? (
                    conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className="w-full text-left p-3 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors flex items-center gap-3 group"
                        >
                            <MessageSquare className="w-4 h-4 text-gray-500 group-hover:text-cyan-400" />
                            <span className="truncate text-sm">{conv.title || "Untitled Chat"}</span>
                        </button>
                    ))
                ) : (
                    prompts.map(prompt => (
                        <button
                            key={prompt.id}
                            onClick={() => onSelectPrompt(prompt.content)}
                            className="w-full text-left p-3 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors flex items-center gap-3 group"
                        >
                            <Sparkles className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                            <div className="overflow-hidden">
                                <div className="truncate text-sm font-medium">{prompt.title}</div>
                                <div className="truncate text-xs text-gray-500">{prompt.content}</div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* User Profile / Mini Footer */}
            <div className="p-4 border-t border-white/10">
                <div className="text-xs text-gray-500 text-center">Cool-Shot AI v2.1</div>
            </div>
        </div>
    );
};

export default Sidebar;
