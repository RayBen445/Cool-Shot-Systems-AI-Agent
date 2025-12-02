---
title: Coolshot AI Backend
emoji: 🚀
colorFrom: purple
colorTo: blue
sdk: docker
pinned: false
---

# Cool-Shot-Systems-AI-Agent

A powerful **AI Backend API** that provides intelligent chat and image generation capabilities.

## 🚀 Features

* **💬 Intelligent Chat API**: Powered by Microsoft's **Phi-3 Mini**, capable of reasoning and conversation.
* **🎨 Image Generation API**: Create stunning visuals in seconds using **SDXL Turbo**.
* **⚡ FastAPI Backend**: High-performance REST API with automatic documentation.
* **🔒 Secure**: JWT authentication, user management, and prompt history.

## 🛠️ Prerequisites

* **Python 3.10+**
* **Git**
* *(Recommended)* NVIDIA GPU with 8GB+ VRAM for faster generation.

## ⚡ Quick Start

1. **Clone the repository**:

    ```bash
    git clone https://github.com/rayben445/Cool-Shot-Systems-AI-Agent.git
    cd Cool-Shot-Systems-AI-Agent
    ```

2. **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

3. **Run the API server**:

    ```bash
    python api.py
    ```

4. **Access the API**:
   - API Base URL: `http://localhost:7860`
   - Interactive API Docs: `http://localhost:7860/docs`
   - Alternative Docs: `http://localhost:7860/redoc`

## 🏗️ Tech Stack

* **Backend**: Python, FastAPI, PyTorch, Transformers, Diffusers
* **AI Models**: Microsoft Phi-3 Mini, SDXL Turbo
* **Database**: SQLite with SQLAlchemy ORM
* **Security**: JWT tokens, bcrypt password hashing

## 🌐 Deployment

This backend API can be deployed to various platforms:

### Deploy to Hugging Face Spaces (Recommended)

1. Create a new Space at [huggingface.co/spaces](https://huggingface.co/spaces)
2. Select "Docker" as the SDK
3. Push this repository to your Space
4. The `Dockerfile` is already configured for deployment

### Deploy to Railway

1. Connect your GitHub repository to [Railway](https://railway.app)
2. Railway will auto-detect the Dockerfile
3. Set environment variables if needed
4. Deploy!

### Deploy to Render

1. Create a new Web Service at [Render](https://render.com)
2. Connect your repository
3. Use Docker deployment
4. Set port to `7860`

### Deploy to Other Platforms

The included `Dockerfile` allows deployment to:
- **Google Cloud Run**
- **AWS ECS/Fargate**
- **Azure Container Instances**
- Any Docker-compatible hosting platform

## 📚 API Endpoints

- `POST /register` - Create a new user account
- `POST /token` - Login and get JWT token
- `POST /chat` - Send chat messages to the AI
- `POST /image/generate` - Generate images from text prompts
- `GET /prompts` - Get user's prompt history
- `GET /user/stats` - Get user statistics

See `/docs` endpoint for full interactive API documentation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
