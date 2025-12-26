import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Volume2, VolumeX, Settings, Save, Plus, X, Moon, Sun, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

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
    const [showCanvas, setShowCanvas] = useState(false);
    const [canvasContent, setCanvasContent] = useState('');
    const { theme, toggleTheme } = useTheme();

    const messagesEndRef = useRef(null);
    const recognition = useRef(null);
    const fileInputRef = useRef(null);
    const synth = window.speechSynthesis;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Listen for prompt insertion events from Sidebar
    useEffect(() => {
        const handleInsertPrompt = (e) => {
            setInput(e.detail);
        };
        window.addEventListener('insertPrompt', handleInsertPrompt);
        return () => window.removeEventListener('insertPrompt', handleInsertPrompt);
    }, []);

    // Fetch messages when conversationId changes
    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId);
        } else {
            setMessages([]);
        }
    }, [conversationId]);

    const fetchMessages = async (convId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${convId}/messages`);
            if (res.ok) {
                const data = await res.json();
                // Transform backend messages to frontend format
                setMessages(data.map(msg => ({
                    text: msg.content,
                    isUser: msg.role === 'user',
                    timestamp: new Date(msg.timestamp).toLocaleTimeString()
                })));
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognition.current = new window.webkitSpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognition.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [language]);

    const toggleListening = () => {
        if (isListening) {
            recognition.current.stop();
        } else {
            recognition.current.start();
            setIsListening(true);
        }
    };

    const speakText = (text) => {
        if (synth.speaking) {
            synth.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
        utterance.onend = () => setIsSpeaking(false);

        setIsSpeaking(true);
        synth.speak(utterance);
    };

    const handleSavePrompt = async () => {
        if (!promptTitle.trim() || !input.trim()) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/prompts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: promptTitle,
                    content: input,
                    tags: ["saved-from-chat"]
                })
            });

            if (res.ok) {
                setShowSavePrompt(false);
                setPromptTitle('');
                if (onPromptSaved) onPromptSaved();
            }
        } catch (err) {
            console.error("Failed to save prompt", err);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, isUser: true, timestamp: new Date().toLocaleTimeString() };
        const currentInput = input;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: currentInput,
                    history: messages.filter(m => !m.isError).slice(-6).map(m => ({
                        role: m.isUser ? 'user' : 'assistant',
                        content: m.text
                    })),
                    language: language,
                    conversation_id: conversationId
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponseText = '';

            setMessages(prev => [...prev, { text: '', isUser: false, timestamp: new Date().toLocaleTimeString() }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                aiResponseText += chunk;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    lastMessage.text = aiResponseText;
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again.", isUser: false, timestamp: new Date().toLocaleTimeString(), isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { text: `Uploaded ${data.filename}. You can now chat with this document.`, isUser: false, timestamp: new Date().toLocaleTimeString() }]);
            } else {
                console.error("Upload failed");
                setMessages(prev => [...prev, { text: "Failed to upload file.", isUser: false, isError: true, timestamp: new Date().toLocaleTimeString() }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { text: "Error uploading file.", isUser: false, isError: true, timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
            <div className="flex h-full gap-4">
                {/* Main Chat Area */}
                <div className={`flex flex-col h-full bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 glass ${showCanvas ? 'w-1/2' : 'w-full'}`}>
                    {/* Chat Header / Settings */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                            <span className="text-xs font-medium text-gray-400">{loading ? 'Generating...' : 'AI Ready'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowCanvas(!showCanvas)}
                                className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${showCanvas ? 'text-cyan-400 bg-white/5' : 'text-gray-400'}`}
                                title="Toggle Canvas Mode"
                            >
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-medium hidden md:block">Canvas</span>
                                    <div className="w-4 h-4 border-2 border-current rounded-sm flex">
                                        <div className="w-1/2 h-full border-r border-current"></div>
                                    </div>
                                </div>
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button
                                onClick={toggleTheme}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-yellow-400"
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button
                                onClick={onNewChat}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
                                title="New Chat"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${showSettings ? 'text-cyan-400 bg-white/5' : 'text-gray-400'}`}
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-black/40 border-b border-white/10 overflow-hidden"
                            >
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Language</label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-gray-300 focus:border-cyan-500/50 outline-none"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">✨</span>
                                </div>
                                <p className="text-sm">Start a conversation with Cool-Shot AI</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.isUser
                                    ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 rounded-tr-sm'
                                    : 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`text-[10px] mt-2 opacity-50 flex items-center gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                        <span>{msg.timestamp}</span>
                                        {!msg.isUser && (
                                            <button
                                                onClick={() => speakText(msg.text)}
                                                className="hover:text-cyan-400 transition-colors"
                                            >
                                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black/20 border-t border-white/10">
                        <AnimatePresence>
                            {showSavePrompt && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mb-4 p-3 bg-gray-800 rounded-lg border border-white/10 flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        placeholder="Enter prompt title..."
                                        value={promptTitle}
                                        onChange={(e) => setPromptTitle(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSavePrompt}
                                        className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-md transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setShowSavePrompt(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative flex items-center gap-2">
                            <button
                                onClick={() => setShowSavePrompt(!showSavePrompt)}
                                className={`p-3 rounded-xl transition-all duration-300 ${showSavePrompt ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-cyan-400'
                                    }`}
                                title="Save current input as prompt"
                            >
                                <Save size={20} />
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type your message..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-500 focus:border-cyan-500/50 focus:bg-white/10 transition-all outline-none"
                                />
                                <button
                                    onClick={toggleListening}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-gray-400 hover:text-cyan-400'
                                        }`}
                                >
                                    <Mic size={18} />
                                </button>
                            </div>

                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/20"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <AnimatePresence>
                    {showCanvas && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '50%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="h-full bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col glass"
                        >
                            <div className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-sm flex justify-between items-center">
                                <h3 className="font-medium text-white flex items-center gap-2">
                                    <span className="text-purple-400">✨</span> Canvas / Scratchpad
                                </h3>
                                <button
                                    onClick={() => setShowCanvas(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 p-4">
                                <textarea
                                    value={canvasContent}
                                    onChange={(e) => setCanvasContent(e.target.value)}
                                    placeholder="Write notes, draft content, or paste code here..."
                                    className="w-full h-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none font-mono text-sm"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    export default ChatInterface;
