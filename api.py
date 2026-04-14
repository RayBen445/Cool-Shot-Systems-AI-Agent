from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
import shutil
import json

from chat_engine import ChatEngine, ModeConfig
from rag_engine import RAGEngine
from search_engine import SearchEngine
import firebase_admin
from firebase_admin import credentials, firestore, auth

# === App Initialization ===
print(f"===== Application Startup at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} =====")

app = FastAPI(
    title="Cool-Shot AI API",
    description="Advanced AI assistant API with multi-mode intelligence",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Firebase Initialization ===
if not firebase_admin._apps:
    try:
        if os.path.exists('serviceAccountKey.json'):
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
            print("Firebase initialized with service account.")
        else:
            firebase_admin.initialize_app()
            print("Firebase initialized with default credentials.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")

def get_db():
    if not firebase_admin._apps:
        return None
    try:
        return firestore.client()
    except Exception as e:
        print(f"Firestore not available: {e}")
        return None

db = get_db()

# === Global Engine Instances (Lazy Loaded) ===
chat_engine = None
rag_engine = None
search_engine = None

def get_chat_engine():
    global chat_engine
    if chat_engine is None:
        print("Lazy loading Chat Engine...")
        chat_engine = ChatEngine()
    return chat_engine

def get_rag_engine():
    global rag_engine
    if rag_engine is None:
        print("Lazy loading RAG Engine...")
        rag_engine = RAGEngine()
    return rag_engine

def get_search_engine():
    global search_engine
    if search_engine is None:
        print("Lazy loading Search Engine...")
        search_engine = SearchEngine()
    return search_engine

# === Auth Dependency ===
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if db is None:
        raise HTTPException(status_code=503, detail="Firebase not initialized")
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            user_data = {
                "email": decoded_token.get('email'),
                "full_name": decoded_token.get('name', 'User'),
                "created_at": datetime.utcnow(),
                "is_admin": False,
                "preferences": {
                    "default_mode": "chat",
                    "theme": "dark"
                }
            }
            db.collection('users').document(uid).set(user_data)
            return {**user_data, "id": uid}
        return {**user_doc.to_dict(), "id": uid}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


# === Schemas ===
class ChatRequest(BaseModel):
    message: str
    history: list = []
    language: str = "English"
    conversation_id: Optional[str] = None
    mode: Optional[str] = "chat"

class ConversationCreate(BaseModel):
    title: str = "New Chat"

class SavedPromptCreate(BaseModel):
    title: str
    content: str
    tags: list = []

class ImageRequest(BaseModel):
    prompt: str
    style: str = "realistic"
    aspect_ratio: str = "1:1"

class SearchRequest(BaseModel):
    query: str
    max_results: int = 5

class ArtifactCreate(BaseModel):
    conversation_id: str
    type: str
    content: str
    title: Optional[str] = None


# === Core Endpoints ===
@app.get("/")
def read_root():
    return {
        "status": "online",
        "name": "Cool-Shot AI",
        "version": "2.0.0",
        "capabilities": [
            "multi-mode-chat",
            "code-generation",
            "deep-reasoning",
            "creative-writing",
            "research-analysis",
            "image-generation",
            "web-search",
            "document-rag"
        ]
    }

@app.get("/modes")
def get_modes():
    """Get available AI modes and their descriptions"""
    return {
        mode: {
            "description": config["description"],
            "icon": config["icon"],
            "command": f"/{mode}"
        }
        for mode, config in ModeConfig.MODES.items()
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "firebase": db is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


# === User Endpoints ===
@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


# === Conversation Endpoints ===
@app.post("/conversations")
async def create_conversation(conversation: ConversationCreate, current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        new_conv_ref = db.collection('conversations').document()
        conv_data = {
            "id": new_conv_ref.id,
            "user_id": current_user['id'],
            "title": conversation.title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "mode": "chat",
            "message_count": 0
        }
        new_conv_ref.set(conv_data)
        return conv_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        docs = db.collection('conversations').where('user_id', '==', current_user['id']).order_by('updated_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        conv_ref = db.collection('conversations').document(conversation_id)
        conv = conv_ref.get()
        if not conv.exists or conv.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conv.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        conv_ref = db.collection('conversations').document(conversation_id)
        conv = conv_ref.get()
        if not conv.exists or conv.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Delete all messages in the conversation
        msgs = conv_ref.collection('messages').stream()
        for msg in msgs:
            msg.reference.delete()
        
        # Delete the conversation
        conv_ref.delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        conv_ref = db.collection('conversations').document(conversation_id)
        conv = conv_ref.get()
        if not conv.exists or conv.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Conversation not found")

        msgs = conv_ref.collection('messages').order_by('timestamp').stream()
        return [msg.to_dict() for msg in msgs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === Prompt Library Endpoints ===
@app.post("/prompts")
async def create_prompt(prompt: SavedPromptCreate, current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        new_prompt_ref = db.collection('prompts').document()
        prompt_data = {
            "id": new_prompt_ref.id,
            "user_id": current_user['id'],
            "title": prompt.title,
            "content": prompt.content,
            "tags": prompt.tags,
            "created_at": datetime.utcnow(),
            "usage_count": 0
        }
        new_prompt_ref.set(prompt_data)
        return prompt_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prompts")
async def get_prompts(current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        docs = db.collection('prompts').where('user_id', '==', current_user['id']).order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, current_user: dict = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        prompt_ref = db.collection('prompts').document(prompt_id)
        prompt = prompt_ref.get()
        if not prompt.exists or prompt.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Prompt not found")
        prompt_ref.delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === AI Chat Endpoints ===
@app.post("/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint"""
    try:
        engine = get_chat_engine()
        context = {"current_mode": request.mode or "chat"}
        
        # Optional RAG context injection
        try:
            rag = get_rag_engine()
            rag_docs = rag.search(request.message)
            if rag_docs:
                context["session_context"] = "Relevant Context:\n" + "\n".join(rag_docs)
        except Exception as e:
            print(f"RAG Error (continuing without): {e}")
        
        result = await engine.generate_response(
            request.message, 
            request.history, 
            request.language, 
            context=context
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, language: str = "en"):
    """Streaming chat endpoint with tool detection"""
    try:
        engine = get_chat_engine()
        context = {"current_mode": request.mode or "chat", "language": language}

        # Optional RAG context injection
        try:
            rag = get_rag_engine()
            rag_docs = rag.search(request.message)
            if rag_docs:
                context["session_context"] = "Relevant Context:\n" + "\n".join(rag_docs)
        except Exception as e:
            print(f"RAG Error (continuing without): {e}")

        async def stream_generator():
            async for token in engine.generate_stream(
                request.message, 
                request.history, 
                request.language or language, 
                context=context
            ):
                # Check for tool commands
                if token.startswith("[TOOL:"):
                    yield f"data: {json.dumps({'type': 'tool', 'content': token})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            stream_generator(), 
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# === Web Search Endpoint ===
@app.post("/search")
async def web_search(request: SearchRequest):
    """Perform web search and return results"""
    try:
        se = get_search_engine()
        results = se.search(request.query, request.max_results)
        return {"query": request.query, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/with-search")
async def chat_with_search(request: ChatRequest):
    """Chat with automatic web search integration"""
    try:
        engine = get_chat_engine()
        se = get_search_engine()
        
        # Perform search
        search_results = se.search(request.message, max_results=3)
        
        context = {
            "current_mode": request.mode or "research",
            "session_context": f"Web Search Results:\n{search_results}"
        }
        
        result = await engine.generate_response(
            request.message, 
            request.history, 
            request.language, 
            context=context
        )
        return {**result, "search_results": search_results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# === Image Generation Endpoint ===
@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    """Generate image from prompt"""
    try:
        from image_engine import ImageEngine
        img_engine = ImageEngine()
        img_b64 = img_engine.generate(
            request.prompt, 
            style=request.style,
            aspect_ratio=request.aspect_ratio
        )
        return {
            "image_base64": img_b64, 
            "prompt": request.prompt,
            "style": request.style,
            "aspect_ratio": request.aspect_ratio
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# === Artifact Endpoints ===
@app.post("/artifacts")
async def save_artifact(artifact: ArtifactCreate, current_user: dict = Depends(get_current_user)):
    """Save an artifact from a conversation"""
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        new_artifact_ref = db.collection('artifacts').document()
        artifact_data = {
            "id": new_artifact_ref.id,
            "user_id": current_user['id'],
            "conversation_id": artifact.conversation_id,
            "type": artifact.type,
            "content": artifact.content,
            "title": artifact.title or f"Artifact {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "created_at": datetime.utcnow()
        }
        new_artifact_ref.set(artifact_data)
        return artifact_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/artifacts")
async def get_artifacts(current_user: dict = Depends(get_current_user)):
    """Get user's saved artifacts"""
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        docs = db.collection('artifacts').where('user_id', '==', current_user['id']).order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/artifacts/{artifact_id}")
async def delete_artifact(artifact_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an artifact"""
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        artifact_ref = db.collection('artifacts').document(artifact_id)
        artifact = artifact_ref.get()
        if not artifact.exists or artifact.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Artifact not found")
        artifact_ref.delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === File Upload Endpoint ===
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload and ingest a file for RAG"""
    try:
        import tempfile
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        rag = get_rag_engine()
        rag.ingest_file(tmp_path)
        os.unlink(tmp_path)
        return {"filename": file.filename, "status": "ingested"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === Admin Endpoints ===
@app.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_admin)):
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        users = db.collection('users').stream()
        return [user.to_dict() for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/stats")
async def get_stats(current_user: dict = Depends(get_current_admin)):
    """Get system statistics"""
    if db is None:
        raise HTTPException(status_code=503, detail="DB not available")
    try:
        users_count = len(list(db.collection('users').stream()))
        convs_count = len(list(db.collection('conversations').stream()))
        prompts_count = len(list(db.collection('prompts').stream()))
        
        return {
            "users": users_count,
            "conversations": convs_count,
            "prompts": prompts_count,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === App Lifecycle ===
@app.on_event("shutdown")
async def shutdown_event():
    if chat_engine is not None:
        await chat_engine.close()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
