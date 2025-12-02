<button
    onClick={() => downloadImage(msg.image)}
    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md"
    title="Download Image"
>
    <Download size={20} />
</button>
                                </div >
                            )}
                        </motion.div >
                    </motion.div >
                ))}

{
    isLoading && (
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
    )
}
<div ref={messagesEndRef} />
            </div >

    {/* Input Area */ }
    < div className = "p-6 bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 border-t border-white/20 backdrop-blur-sm" >
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
            </div >
        </div >
    );
};

export default ChatInterface;
