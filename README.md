---
title: CoolShot AI Backend
emoji: 🚀
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
app_file: api.py
pinned: false
---

# Cool-Shot-Systems-AI-Agent

A premium **Local AI Assistant** that runs entirely on your machine, featuring a modern, animated UI.

![UI Preview](https://via.placeholder.com/800x450?text=Local+AI+Assistant+Preview)

## 🚀 Features

* **💬 Intelligent Chat**: Powered by Microsoft's **Phi-3 Mini**, capable of reasoning and conversation.
* **🎨 Image Generation**: Create stunning visuals in seconds using **SDXL Turbo**.
* **✨ Modern UI**: Built with **React**, **Tailwind CSS**, and **Framer Motion** for a smooth, glassmorphism experience.
* **🔒 100% Local**: No data leaves your computer. No API keys required.

## 🛠️ Prerequisites

* **Python 3.10+**
* **Node.js 18+**
* **Git**
* *(Recommended)* NVIDIA GPU with 8GB+ VRAM for faster generation.

## ⚡ Quick Start

1. **Clone the repository**:

    ```bash
    git clone https://github.com/rayben445/Cool-Shot-Systems-AI-Agent.git
    cd Cool-Shot-Systems-AI-Agent
    ```

2. **Run the One-Click Installer**:
    Double-click `start_app.bat` on Windows.

    *Or run manually:*

    ```bash
    # Backend
    cd local_ai_assistant
    pip install -r requirements.txt
    python api.py

    # Frontend
    cd frontend
    npm install
    npm run dev
    ```

## 🏗️ Tech Stack

* **Backend**: Python, FastAPI, PyTorch, Transformers, Diffusers
* **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React

## 🌐 Deployment

### Deploy to Vercel

The frontend can be easily deployed to Vercel for free! See the detailed deployment guide:

📖 **[Vercel Deployment Guide](VERCEL_DEPLOYMENT.md)**

Quick steps:
1. Fork/clone this repository
2. Sign up at [Vercel](https://vercel.com)
3. Import your repository
4. Set root directory to `frontend`
5. Add environment variable: `VITE_API_URL` with your backend URL
6. Deploy!

### Backend Deployment

The backend can be deployed to:
- **Hugging Face Spaces** (current deployment)
- **Railway**
- **Render**
- **Google Cloud Run / AWS / Azure**

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed backend deployment options.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
