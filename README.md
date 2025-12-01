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
    pip install -r requirements.txt
    python api.py

    # Frontend (in a new terminal)
    cd frontend
    npm install
    npm run dev
    ```

## 🌐 Deploy Frontend on Vercel

You can deploy the frontend UI on Vercel. Note that the AI models require GPU resources and must be hosted separately (e.g., on a GPU server, Hugging Face Spaces, or cloud VM).

### Steps:

1. **Deploy the backend** on a GPU-enabled server:
   - Use services like [Hugging Face Spaces](https://huggingface.co/spaces), [RunPod](https://runpod.io), [AWS EC2 with GPU](https://aws.amazon.com/ec2/instance-types/g4/), or [Google Cloud GPU VMs](https://cloud.google.com/gpu)
   - Run `pip install -r requirements.txt && python api.py`
   - Note your backend URL (e.g., `https://your-backend.example.com`)

2. **Deploy the frontend on Vercel**:
   - Push this repository to your GitHub account
   - Go to [Vercel](https://vercel.com) and import your repository
   - Set the **Root Directory** to `frontend`
   - Add the environment variable:
     - `VITE_API_URL` = `https://your-backend-url.com`
   - Click **Deploy**

### Local Development with Remote Backend:

```bash
cd frontend
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend URL
npm install
npm run dev
```

## 🏗️ Tech Stack

* **Backend**: Python, FastAPI, PyTorch, Transformers, Diffusers
* **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
