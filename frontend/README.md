# Cool-Shot Systems AI Agent - Frontend

A modern, animated UI for the Local AI Assistant featuring chat and image generation capabilities.

## 🎨 Tech Stack

- **React 19** - UI Library
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS v4** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## 🌐 Environment Variables

Create a `.env` file in this directory (see `.env.example`):

```env
VITE_API_URL=http://localhost:7860
```

For production, set this to your deployed backend URL.

## 📦 Deployment to Vercel

See the detailed guide: **[../VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md)**

Quick deploy:
1. Connect your repo to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL`
4. Deploy!

## 🧪 Linting

```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatInterface.jsx    # Chat UI component
│   └── ImageGenerator.jsx   # Image generation UI
├── assets/                   # Static assets
├── App.jsx                   # Main app component
├── App.css                   # App-specific styles
├── main.jsx                  # App entry point
└── index.css                 # Global styles (Tailwind)
```

## 🎯 Features

- **Chat Interface**: Real-time chat with AI assistant
- **Image Generation**: AI-powered image creation
- **Smooth Animations**: Framer Motion transitions
- **Glassmorphism UI**: Modern, translucent design
- **Responsive**: Works on all screen sizes
