import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Volume2, VolumeX, Settings, Save, Plus, X, Moon, Sun, Paperclip, Sparkles, Bot, User, Copy, Check, Image as ImageIcon, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

// Markdown renderer with syntax-highlighted code blocks
const MarkdownContent = ({ content }) => (
  <ReactMarkdown
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        if (!inline && match) {
          return (
            <div className="relative group my-2">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={String(children).replace(/\n$/, '')} />
              </div>
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  margin: 0,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          );
        }
        return (
          <code className="bg-black/30 text-violet-300 px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>
            {children}
          </code>
        );
      },
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 pl-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 pl-2">{children}</ol>,
      li: ({ children }) => <li className="text-slate-300">{children}</li>,
      h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-3 mb-2">{children}</h1>,
      h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-1.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-2 mb-1">{children}</h3>,
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-violet-500/50 pl-4 my-2 text-slate-400 italic">{children}</blockquote>
      ),
      a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">{children}</a>
      ),
      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
    }}
  >
    {content}
  </ReactMarkdown>
);

// Generated image message
const ImageMessage = ({ src, prompt }) => (
  <div className="space-y-2">
    <img
      src={`data:image/png;base64,${src}`}
      alt={prompt}
      className="rounded-xl max-w-full border border-white/10 shadow-lg"
    />
    <p className="text-xs text-slate-500 italic">"{prompt}"</p>
  </div>
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
];
const LANG_CODES = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN' };

const SUGGESTIONS = [
  { icon: '💻', text: 'Write a Python function to sort a list of dictionaries by key' },
  { icon: '🔍', text: 'Explain how React hooks work with examples' },
  { icon: '🖼️', text: '/imagine a futuristic city at sunset, cinematic lighting' },
  { icon: '🧮', text: 'Solve: What is the time complexity of merge sort?' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
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
    if (isListening) recognition.current.stop();
    else { recognition.current.start(); setIsListening(true); }
  };

  const speakText = (text) => {
    if (synth.speaking) { synth.cancel(); setIsSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG_CODES[language] || 'en-US';
    utt.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utt);
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
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
  };

  // Detect /imagine command and route to image generation
  const isImageRequest = (text) => /^\/(imagine|image|img|draw|generate)\s+/i.test(text.trim());
  const extractImagePrompt = (text) => text.trim().replace(/^\/(imagine|image|img|draw|generate)\s+/i, '');

  const sendImageRequest = async (prompt) => {
    setLoading(true);
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {
      text: `🖼️ Generating image: *${prompt}*`,
      isUser: false,
      timestamp: ts,
      generating: true,
    }]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Image generation failed');
      const data = await res.json();

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: '',
          isUser: false,
          timestamp: ts,
          imageBase64: data.image_base64,
          imagePrompt: prompt,
        };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: 'Sorry, image generation failed. Please try again.',
          isUser: false,
          timestamp: ts,
          isError: true,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { text: userText, isUser: true, timestamp: ts }]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Route to image generation if /imagine command
    if (isImageRequest(userText)) {
      return sendImageRequest(extractImagePrompt(userText));
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/chat/stream?language=${language}${conversationId ? `&conversation_id=${conversationId}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userText,
          history: messages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }))
        }),
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { text: '', isUser: false, timestamp: ts, streaming: true }]);
      setLoading(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
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
        timestamp: ts,
        isError: true,
      }]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { text: `**${data.filename}** uploaded and indexed. You can now ask questions about it.`, isUser: false, timestamp: ts }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Error uploading file.', isUser: false, isError: true, timestamp: ts }]);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-[#080b14]">

      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-[#0c1018]/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-[11px] font-medium text-slate-600">{loading ? 'Thinking…' : 'AI Ready'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors" title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={onNewChat} className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors" title="New chat">
            <Plus size={15} />
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-violet-500/15 text-violet-400' : 'hover:bg-white/5 text-slate-600 hover:text-slate-300'}`}
            title="Settings"
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
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Response Language</label>
                <div className="flex gap-1.5 flex-wrap">
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
              <p className="text-[10px] text-slate-700">
                Tip: Type <code className="text-violet-500">/imagine [prompt]</code> to generate images inline.
              </p>
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
            <h2 className="text-xl font-bold text-white mb-2">How can I help you today?</h2>
            <p className="text-slate-500 text-sm mb-8">I can write code, answer questions, generate images, and more.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                  className="text-left px-4 py-3 glass rounded-xl hover:bg-white/6 transition-all text-sm text-slate-400 hover:text-slate-200 flex items-start gap-2.5"
                >
                  <span className="text-base">{s.icon}</span>
                  <span>{s.text}</span>
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
            transition={{ duration: 0.25 }}
            className={`flex items-end gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!msg.isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mb-5">
                <Bot size={14} className="text-violet-400" />
              </div>
            )}

            <div className={`max-w-[78%] group flex flex-col gap-1 ${msg.isUser ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.isUser
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-violet-900/30'
                  : msg.isError
                  ? 'glass border border-red-500/20 text-red-300 rounded-bl-sm'
                  : 'glass text-slate-200 rounded-bl-sm'
              }`}>
                {msg.generating ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Loader size={13} className="animate-spin" />
                    Generating image…
                  </div>
                ) : msg.imageBase64 ? (
                  <ImageMessage src={msg.imageBase64} prompt={msg.imagePrompt} />
                ) : msg.isUser ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <>
                    <MarkdownContent content={msg.text || ' '} />
                    {msg.streaming && (
                      <span className="inline-block w-0.5 h-4 bg-violet-400 rounded-full animate-pulse ml-0.5 align-middle" />
                    )}
                  </>
                )}
              </div>

              {/* Message actions row */}
              <div className={`flex items-center gap-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[10px] text-slate-700">{msg.timestamp}</span>
                {!msg.isUser && msg.text && !msg.imageBase64 && (
                  <>
                    <CopyButton text={msg.text} />
                    <button
                      onClick={() => speakText(msg.text)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors"
                      title="Read aloud"
                    >
                      {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                  </>
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

        {loading && !messages[messages.length - 1]?.generating && <TypingIndicator />}
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
                placeholder="Name this prompt…"
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
                title="Save as prompt"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
                title="Upload file for Q&A"
              >
                <Paperclip size={16} />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md" />
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Message Cool-Shot AI… (try /imagine a sunset over the ocean)"
              rows={1}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-600 resize-none py-2 max-h-40 leading-relaxed"
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
                title="Send (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-700 mt-2">
          Powered by Groq · Type <span className="text-slate-600">/imagine</span> to generate images
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
