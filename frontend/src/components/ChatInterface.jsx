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
        <div className="flex flex-col h-full max-w-5xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
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
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-500' 
                                    : 'bg-gradient-to-br from-purple-600 to-purple-500'
                            }`}
                        >
                            {msg.role === 'user' ? <User size={22} /> : <Bot size={22} />}
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[75%] p-5 rounded-2xl shadow-xl ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-600/30 to-blue-500/20 border border-blue-400/40 text-blue-50 rounded-tr-sm backdrop-blur-sm'
                                    : 'bg-gradient-to-br from-purple-600/30 to-purple-500/20 border border-purple-400/40 text-purple-50 rounded-tl-sm backdrop-blur-sm'
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
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 shadow-lg">
                            <Bot size={22} />
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/30 to-purple-500/20 border border-purple-400/40 backdrop-blur-sm p-5 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-xl">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-200" />
                            <span className="text-purple-200 text-base font-medium">Thinking...</span>
                            <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-r from-black/30 to-black/20 border-t border-white/10 backdrop-blur-sm">
                <form onSubmit={sendMessage} className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all backdrop-blur-sm shadow-inner text-base"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/30 font-semibold"
                    >
                        <Send size={22} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
