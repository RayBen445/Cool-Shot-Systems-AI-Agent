import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, Download, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Cool-Shot AI assistant (v2.0). How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [thinkingTime, setThinkingTime] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const messagesEndRef = useRef(null);

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
    }

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

    const speakResponse = (text) => {
        if (!autoSpeak) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognition) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };
            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            recognition.onend = () => {
                setIsListening(false);
            };
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
                    speakResponse(`Here is your image for: ${prompt}`);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't generate that image." }]);
                    speakResponse("Sorry, I couldn't generate that image.");
                }
            } else {
                // Normal chat message (Streaming)
                const history = messages.map(m => ({ role: m.role, content: m.content }));

                const response = await fetch(`${apiUrl}/chat/stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ message: userMessage, history: history }),
                });

                if (!response.ok) throw new Error(response.statusText);

                // Create a placeholder message for the assistant
                setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
                setIsLoading(false); // Stop loading spinner immediately as stream starts

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantMessage += chunk;

                    // Update the last message with the new chunk
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content = assistantMessage;
                        }
                        return newMessages;
                    });
                }

                // Speak the full response after streaming is done
                speakResponse(assistantMessage);
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
            {/* Header Controls */}
            <div className="flex justify-end p-4 border-b border-white/10">
                <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`p-2 rounded-full transition-all ${autoSpeak ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    title={autoSpeak ? "Mute Voice" : "Enable Voice"}
                >
                    {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>

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
                <form onSubmit={sendMessage} className="flex gap-4 items-center">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-4 rounded-2xl transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse shadow-red-500/50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        title="Speak"
                    >
                        {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Type your message..."}
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
