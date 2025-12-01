import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Cool-Shot AI assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, history: history }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the backend." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto bg-gradient-to-br from-white/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden border border-white/30">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`p-3 rounded-2xl shadow-lg ${
                                msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-cyan-600 via-blue-600 to-blue-500 shadow-cyan-500/50' 
                                    : 'bg-gradient-to-br from-purple-600 via-violet-600 to-purple-500 shadow-purple-500/50'
                            }`}
                        >
                            {msg.role === 'user' ? <User size={22} /> : <Bot size={22} />}
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[75%] p-5 rounded-2xl shadow-xl ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-br from-cyan-600/40 via-blue-600/30 to-blue-500/20 border border-cyan-400/50 text-cyan-50 rounded-tr-sm backdrop-blur-sm shadow-cyan-500/30'
                                    : 'bg-gradient-to-br from-purple-600/40 via-violet-600/30 to-purple-500/20 border border-purple-400/50 text-purple-50 rounded-tl-sm backdrop-blur-sm shadow-purple-500/30'
                            }`}
                        >
                            <p className="leading-relaxed whitespace-pre-wrap text-base">{msg.content}</p>
                        </motion.div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4"
                    >
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-500 shadow-lg shadow-purple-500/50">
                            <Bot size={22} />
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/40 via-violet-600/30 to-purple-500/20 border border-purple-400/50 backdrop-blur-sm p-5 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-xl shadow-purple-500/30">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-200" />
                            <span className="text-purple-100 text-base font-medium">Thinking...</span>
                            <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 border-t border-white/20 backdrop-blur-sm">
                <form onSubmit={sendMessage} className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/10 border border-white/30 rounded-2xl px-6 py-4 text-white placeholder-cyan-200/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-400/60 transition-all backdrop-blur-sm shadow-inner text-base"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-500 hover:from-cyan-500 hover:via-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-cyan-500/40 font-semibold"
                    >
                        <Send size={22} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
