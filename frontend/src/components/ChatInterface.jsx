import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Volume2, VolumeX, Settings, Save, Plus, X, Moon, Sun, Paperclip, Sparkles, Bot, User, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';

const TypingIndicator = () => (
  <div className="flex items-end gap-3">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
      <Bot size={14} className="text-violet-400" />
    </div>
    <div className="glass rounded-2xl rounded-bl-sm px-5 py-4">
      <div className="flex gap-1.5 items-center h-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  </div>
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors" title="Copy">
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
];

const LANG_CODES = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN' };

const ChatInterface = ({ conversationId, onNewChat, onPromptSaved }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showSettings, setShowSettings] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const { theme, toggleTheme } = useTheme();

  const messagesEndRef = useRef(null);
  const recognition = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const synth = window.speechSynthesis;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    const handler = e => setInput(e.detail);
    window.addEventListener('insertPrompt', handler);
    return () => window.removeEventListener('insertPrompt', handler);
  }, []);

  useEffect(() => {
    if (conversationId) fetchMessages(conversationId);
    else setMessages([]);
  }, [conversationId]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = LANG_CODES[language] || 'en-US';
      recognition.current.onresult = e => { setInput(e.results[0][0].transcript); setIsListening(false); };
      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }
  }, [language]);

  const fetchMessages = async (convId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map(msg => ({
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (err) { console.error('Failed to fetch messages', err); }
  };

  const toggleListening = () => {
    if (!recognition.current) return;
    if (isListening) { recognition.current.stop(); }
    else { recognition.current.start(); setIsListening(true); }
  };

  const speakText = (text) => {
    if (synth.speaking) { synth.cancel(); setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language] || 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleSavePrompt = async () => {
    if (!promptTitle.trim() || !input.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: promptTitle, content: input, tags: ['saved-from-chat'] })
      });
      if (res.ok) { setShowSavePrompt(false); setPromptTitle(''); if (onPromptSaved) onPromptSaved(); }
    } catch (err) { console.error('Failed to save prompt', err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const userMessage = { text: userText, isUser: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/chat/stream?language=${language}${conversationId ? `&conversation_id=${conversationId}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userText, history: messages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })) }),
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { text: '', isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), streaming: true }]);
      setLoading(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: aiText };
          return updated;
        });
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });

    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessages(prev => [...prev, {
        text: 'Sorry, something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { text: `Uploaded **${data.filename}**. You can now chat with this document.`, isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Error uploading file.', isUser: false, isError: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = [
    'Explain quantum computing simply',
    'Write a Python hello world',
    'Give me 3 creative business ideas',
    'Summarize the water cycle',
  ];

  return (
    <div className="flex flex-col h-full bg-[#080b14]">
      {/* Chat toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-[#0c1018]/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-[11px] font-medium text-slate-600">{loading ? 'Generating...' : 'AI Ready'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onNewChat}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
            title="New chat"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-violet-500/15 text-violet-400' : 'hover:bg-white/5 text-slate-600 hover:text-slate-300'}`}
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 overflow-hidden border-b border-white/[0.05] bg-[#0c1018]/60"
          >
            <div className="px-5 py-4 flex items-center gap-6">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Language</label>
                <div className="flex gap-1.5">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${language === l.code ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-5 animate-float">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">How can I help you?</h2>
            <p className="text-slate-500 text-sm mb-8">Ask me anything — I'm your AI assistant.</p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-left px-4 py-3 glass rounded-xl hover:bg-white/6 border-transparent hover:border-violet-500/20 transition-all group text-sm text-slate-400 hover:text-slate-200"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-end gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!msg.isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mb-5">
                <Bot size={14} className="text-violet-400" />
              </div>
            )}

            <div className={`max-w-[75%] group ${msg.isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.isUser
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-violet-900/30'
                  : msg.isError
                  ? 'glass border border-red-500/20 text-red-300 rounded-bl-sm'
                  : 'glass text-slate-200 rounded-bl-sm message-ai'
              }`}>
                {msg.isUser ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <ReactMarkdown>{msg.text || ' '}</ReactMarkdown>
                )}
                {msg.streaming && (
                  <span className="inline-block w-1 h-4 bg-violet-400 rounded-full animate-pulse ml-1 align-middle" />
                )}
              </div>
              <div className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[10px] text-slate-700">{msg.timestamp}</span>
                {!msg.isUser && <CopyButton text={msg.text} />}
                {!msg.isUser && (
                  <button onClick={() => speakText(msg.text)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors">
                    {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                )}
              </div>
            </div>

            {msg.isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 mb-5">
                <User size={14} className="text-slate-300" />
              </div>
            )}
          </motion.div>
        ))}

        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-white/[0.05]">
        <AnimatePresence>
          {showSavePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-3 flex items-center gap-2 glass rounded-xl px-4 py-2.5"
            >
              <input
                type="text"
                placeholder="Name this prompt..."
                value={promptTitle}
                onChange={e => setPromptTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSavePrompt()}
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-600"
                autoFocus
              />
              <button onClick={handleSavePrompt} className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">Save</button>
              <button onClick={() => setShowSavePrompt(false)} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-strong rounded-2xl p-2 gradient-border">
          <div className="flex items-end gap-2">
            <div className="flex gap-1 pb-1">
              <button
                onClick={() => setShowSavePrompt(s => !s)}
                className={`p-2 rounded-xl transition-all ${showSavePrompt ? 'bg-violet-500/20 text-violet-400' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}
                title="Save prompt"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
                title="Upload file"
              >
                <Paperclip size={16} />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Message Cool-Shot AI…"
              rows={1}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-600 resize-none py-2 max-h-36 leading-relaxed"
            />

            <div className="flex items-center gap-1 pb-1">
              {recognition.current && (
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all ${isListening ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}
                  title="Voice input"
                >
                  <Mic size={16} />
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-violet-900/30 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-700 mt-2">Cool-Shot AI may make mistakes. Verify important information.</p>
      </div>
    </div>
  );
};

export default ChatInterface;
