import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Download, Loader2, Image as ImageIcon, Sparkles, Palette } from 'lucide-react';

const ImageGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const generateImage = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setGeneratedImage(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';
            const response = await fetch(`${apiUrl}/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            const data = await response.json();
            if (data.image_base64) {
                setGeneratedImage(`data:image/png;base64,${data.image_base64}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to generate image. Make sure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-10">

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="flex items-center justify-center gap-3 mb-3">
                    <Palette className="w-8 h-8 text-purple-400" />
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                        AI Image Studio
                    </h2>
                    <Sparkles className="w-7 h-7 text-pink-400 animate-pulse" />
                </div>
                <p className="text-gray-300 text-lg">Describe your vision, and watch AI bring it to life.</p>
            </motion.div>

            {/* Input Section */}
            <form onSubmit={generateImage} className="flex gap-4 mb-10">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city with flying cars at sunset..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-5 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500/60 transition-all text-lg backdrop-blur-sm shadow-inner"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-5 rounded-2xl transition-all duration-200 shadow-lg shadow-purple-500/40 font-bold text-lg flex items-center gap-3"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                    {isLoading ? 'Creating...' : 'Generate'}
                </motion.button>
            </form>

            {/* Image Display Area */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black/30 to-black/20 rounded-3xl border border-white/10 overflow-hidden relative min-h-[600px] shadow-inner backdrop-blur-sm">
                {isLoading ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="relative mb-6">
                            <Loader2 className="w-16 h-16 animate-spin text-purple-500 mx-auto" />
                            <Sparkles className="w-8 h-8 text-pink-400 absolute top-0 right-0 animate-pulse" />
                        </div>
                        <p className="text-purple-300 text-xl animate-pulse font-medium">Crafting your masterpiece...</p>
                        <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
                    </motion.div>
                ) : generatedImage ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative group w-full h-full flex items-center justify-center p-6"
                    >
                        <img
                            src={generatedImage}
                            alt="Generated artwork"
                            className="w-full h-full object-contain rounded-2xl shadow-2xl ring-2 ring-white/20"
                            style={{ maxHeight: '550px', minHeight: '400px' }}
                        />
                        <motion.div 
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity flex items-end justify-center p-8"
                        >
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                href={generatedImage}
                                download={`cool-shot-ai-${Date.now()}.png`}
                                className="bg-gradient-to-r from-white to-gray-100 text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl hover:shadow-white/20 transition-all"
                            >
                                <Download size={24} />
                                Download Image
                            </motion.a>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <ImageIcon className="w-20 h-20 mx-auto mb-6 opacity-20 text-gray-400" />
                        <p className="text-gray-400 text-xl font-medium">Your creation will appear here</p>
                        <p className="text-gray-500 text-sm mt-2">Start by describing what you'd like to see</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;
