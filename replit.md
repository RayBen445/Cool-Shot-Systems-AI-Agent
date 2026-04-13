# Cool-Shot AI

## Overview
Full-stack AI chat application with a React frontend (Vite) and Python FastAPI backend.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS v3, Framer Motion, Firebase Auth — runs on port 5000
- **Backend**: FastAPI + Uvicorn — runs on port 8000 (not active by default in Replit dev)
- **Auth**: Firebase Authentication (client-side) + Firebase ID token verification (server-side)
- **AI**: Microsoft Phi-3-mini-4k-instruct via HuggingFace Transformers (lazy-loaded)
- **RAG**: LangChain + FAISS for document search
- **Image Gen**: External HuggingFace Space endpoint
- **Database**: Firestore for conversations, prompts, users

## Workflows
- **Start application**: `cd frontend && npm run dev` — port 5000, webview

## Key Files
- `frontend/src/` — React app source
- `frontend/src/components/` — ChatInterface, Sidebar, Login, Register, Profile, AdminDashboard
- `frontend/src/context/` — AuthContext (Firebase), ThemeContext
- `frontend/src/firebase.js` — Firebase client config
- `api.py` — FastAPI backend (start separately if needed)
- `chat_engine.py` — Phi-3 LLM wrapper
- `rag_engine.py` — FAISS vector search
- `requirements.txt` — Python dependencies
- `serviceAccountKey.json` — Firebase Admin SDK credentials (keep secret, do not expose)

## Security Notes
- `serviceAccountKey.json` contains a private key — should be moved to an environment secret
- Firebase client config is public (safe) — keys are protected by Firebase security rules
- Backend CORS is currently set to allow all origins (`*`)

## UI Design System
- Dark theme: `#080b14` base background
- Violet/Indigo gradient accent colors
- Glassmorphism cards: `.glass`, `.glass-strong` classes
- `gradient-text`, `gradient-border` utility classes in index.css
- Inter font from Google Fonts
- Lucide React icons throughout
