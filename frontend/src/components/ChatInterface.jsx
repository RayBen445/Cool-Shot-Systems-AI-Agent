import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your local AI assistant. How can I help you today?" }
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
            // Prepare history for the backend (excluding the last user message we just added locally)
            // In a real app, you might want to send the whole history or manage it better
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('https://professorceo-coolshot-ai-backend.hf.space/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, history: history }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the local brain." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none'
                                : 'bg-purple-600/20 border border-purple-500/30 text-purple-100 rounded-tl-none'
                                }`}
                        >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3"
                    >
                        <div className="p-2 rounded-full bg-purple-600">
                            <Bot size={20} />
                        </div>
                        <div className="bg-purple-600/20 border border-purple-500/30 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                            <span className="text-purple-300 text-sm">Thinking...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-white/5">
                <form onSubmit={sendMessage} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
