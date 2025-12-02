import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, Download, Mic, Volume2, Settings } from 'lucide-react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Cool-Shot AI assistant (v3.0). How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [thinkingTime, setThinkingTime] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [useStreaming, setUseStreaming] = useState(true);
    const [language, setLanguage] = useState('en');
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        let interval;
        if (isLoading) {
            setThinkingTime(0);
            interval = setInterval(() => {
                setThinkingTime(prev => prev + 0.1);
            }, 100);
        } else {
            setThinkingTime(0);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Voice Recognition
    const startRecording = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';

            recognitionRef.current.onstart = () => {
                setIsRecording(true);
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current.start();
        } else {
            alert('Speech recognition not supported in this browser');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    // Text to Speech
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';

        try {
            // Check for image generation command
            if (userMessage.toLowerCase().startsWith('generate ')) {
                const prompt = userMessage.slice(9); // Remove "generate "
                const response = await fetch(`${apiUrl}/generate-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ prompt: prompt }),
                });

                const data = await response.json();
                if (data.image_base64) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Here is your image for: "${prompt}"`,
                        image: `data:image/png;base64,${data.image_base64}`
                    }]);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't generate that image." }]);
                }
            } else {
                // Normal chat message
                const history = messages.map(m => ({ role: m.role, content: m.content }));
                
                if (useStreaming) {
                    // Streaming response
                    const response = await fetch(`${apiUrl}/chat/stream`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ message: userMessage, history: history }),
                    });

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let fullResponse = '';

                    // Add empty assistant message to update incrementally
                    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const text = line.slice(6);
                                fullResponse += text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1].content = fullResponse;
                                    return newMessages;
                                });
                            }
                        }
                    }

                    // Enable TTS for final response
                    if (fullResponse) {
                        speakText(fullResponse);
                    }
                } else {
                    // Non-streaming response
                    const response = await fetch(`${apiUrl}/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ message: userMessage, history: history }),
                    });

                    const data = await response.json();
                    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                    speakText(data.response);
                }
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the backend." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadImage = (imageUrl) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `cool-shot-ai-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            className={`p-3 rounded-2xl shadow-lg ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-cyan-600 via-blue-600 to-blue-500 shadow-cyan-500/50'
                                    : 'bg-gradient-to-br from-purple-600 via-violet-600 to-purple-500 shadow-purple-500/50'
                                }`}
                        >
                            {msg.role === 'user' ? <User size={22} /> : <Bot size={22} />}
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[75%] p-5 rounded-2xl shadow-xl ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-cyan-600/40 via-blue-600/30 to-blue-500/20 border border-cyan-400/50 text-cyan-50 rounded-tr-sm backdrop-blur-sm shadow-cyan-500/30'
                                    : 'bg-gradient-to-br from-purple-600/40 via-violet-600/30 to-purple-500/20 border border-purple-400/50 text-purple-50 rounded-tl-sm backdrop-blur-sm shadow-purple-500/30'
                                }`}
                        >
                            <p className="leading-relaxed whitespace-pre-wrap text-base">{msg.content}</p>
                            {msg.image && (
                                <div className="mt-4 relative rounded-xl overflow-hidden shadow-lg border border-white/10 group">
                                    <img src={msg.image} alt="Generated" className="w-full h-auto" />
                                    <button
                                        onClick={() => downloadImage(msg.image)}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md"
                                        title="Download Image"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>
                            )}
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
                            <span className="text-purple-100 text-base font-medium">Thinking... ({thinkingTime.toFixed(1)}s)</span>
                            <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 border-t border-white/20 backdrop-blur-sm">
                {/* Settings Panel */}
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-white/10 rounded-xl border border-white/20"
                    >
                        <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 text-white">
                                <input
                                    type="checkbox"
                                    checked={useStreaming}
                                    onChange={(e) => setUseStreaming(e.target.checked)}
                                    className="rounded"
                                />
                                Streaming
                            </label>
                            <label className="flex items-center gap-2 text-white">
                                Language:
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-white/20 rounded px-2 py-1"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </label>
                        </div>
                    </motion.div>
                )}

                <form onSubmit={sendMessage} className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`${
                            isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'
                        } text-white p-4 rounded-2xl transition-all`}
                        title="Voice Input"
                    >
                        <Mic size={20} />
                    </button>
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
