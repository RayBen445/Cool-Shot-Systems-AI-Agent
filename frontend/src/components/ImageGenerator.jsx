import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Download, Loader2, Image as ImageIcon } from 'lucide-react';

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
            const response = await fetch('http://localhost:8000/generate-image', {
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
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/10 p-8">

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">AI Image Generator</h2>
                <p className="text-gray-400">Describe what you want to see, and I'll paint it for you.</p>
            </div>

            {/* Input Section */}
            <form onSubmit={generateImage} className="flex gap-3 mb-8">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city with flying cars at sunset..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-lg"
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/20 font-semibold flex items-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    Generate
                </button>
            </button>
        </form>

      {/* Image Display Area */ }
    <div className="flex-1 flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 overflow-hidden relative min-h-[400px]">
        {isLoading ? (
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-purple-300 animate-pulse">Dreaming up your image...</p>
            </div>
        ) : generatedImage ? (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative group w-full h-full flex items-center justify-center"
            >
                <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                        href={generatedImage}
                        download={`generated-${Date.now()}.png`}
                        className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        <Download size={20} />
                        Download
                    </a>
                </div>
            </motion.div>
        ) : (
            <div className="text-center text-gray-600">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Your masterpiece will appear here</p>
            </div>
        )}
    </div>
    </div >
  );
};

export default ImageGenerator;
