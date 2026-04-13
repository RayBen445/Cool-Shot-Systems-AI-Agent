import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Sparkles, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ onSelectConversation, onNewChat, onSelectPrompt, refreshTrigger, activeConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchPrompts();
  }, [refreshTrigger]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const fetchPrompts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/prompts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPrompts(await res.json());
    } catch (err) {
      console.error('Failed to fetch prompts', err);
    }
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 h-full flex flex-col border-r border-white/[0.06] bg-[#0c1018]/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Top: New Chat + Collapse */}
      <div className="flex items-center gap-2 p-3 flex-shrink-0">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.button
              key="new-chat-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onNewChat}
              className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/20 text-white text-sm font-medium transition-all group"
            >
              <Plus className="w-4 h-4 text-violet-400 group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
              New Chat
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronRight size={16} />
          </motion.div>
        </button>
      </div>

      {/* Collapsed: just new chat icon */}
      {collapsed && (
        <div className="px-3 pb-2">
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 flex items-center justify-center text-violet-400 transition-colors"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Tabs — only show when expanded */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex px-3 gap-1 mb-2 flex-shrink-0"
          >
            {[['chats', 'Chats'], ['prompts', 'Prompts']].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-white/8 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 mb-1 flex-shrink-0">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
            {activeTab === 'chats' ? 'Recent' : 'Saved'}
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {!collapsed && activeTab === 'chats' && (
          conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 group ${
                  activeConversationId === conv.id
                    ? 'bg-violet-500/15 text-white border border-violet-500/20'
                    : 'hover:bg-white/4 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeConversationId === conv.id ? 'text-violet-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="truncate text-xs">{conv.title || 'Untitled Chat'}</span>
              </button>
            ))
          )
        )}

        {!collapsed && activeTab === 'prompts' && (
          prompts.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs">No saved prompts yet</div>
          ) : (
            prompts.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt.content)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/4 text-slate-400 hover:text-slate-200 transition-all flex items-start gap-2.5 group"
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                <div className="overflow-hidden">
                  <div className="truncate text-xs font-medium text-slate-300">{prompt.title}</div>
                  <div className="truncate text-[10px] text-slate-600 mt-0.5">{prompt.content}</div>
                </div>
              </button>
            ))
          )
        )}

        {collapsed && (
          <div className="flex flex-col gap-1 items-center">
            {conversations.slice(0, 8).map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                title={conv.title || 'Untitled Chat'}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  activeConversationId === conv.id ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-slate-600 hover:text-slate-400'
                }`}
              >
                <Hash size={14} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/[0.05] flex-shrink-0">
          <div className="text-[10px] text-slate-700 text-center font-medium">Cool-Shot AI v2.1</div>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
