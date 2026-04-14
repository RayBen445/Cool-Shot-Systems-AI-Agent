from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import uvicorn
import os
import shutil

from chat_engine import ChatEngine
from rag_engine import RAGEngine
import firebase_admin
from firebase_admin import credentials, firestore, auth
import requests

# Initialize FastAPI
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin
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

# Safe DB access
def get_db():
    if not firebase_admin._apps:
        return None
    try:
        return firestore.client()
    except Exception as e:
        print(f"Firestore not available: {e}")
        return None

db = get_db()

# Global engine instances (Lazy loaded)
chat_engine = None
rag_engine = None

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

# Auth Dependency
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
                "is_admin": False
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


# Schemas
class ChatRequest(BaseModel):
    message: str
    history: list = []
    language: str = "English"
    conversation_id: Optional[str] = None

class ConversationCreate(BaseModel):
    title: str = "New Chat"

class SavedPromptCreate(BaseModel):
    title: str
    content: str
    tags: list = []

class ImageRequest(BaseModel):
    prompt: str


# Endpoints
@app.get("/")
def read_root():
    return {"status": "Backend is running", "message": "Go to /docs to see the API"}

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/conversations")
async def create_conversation(conversation: ConversationCreate, current_user: dict = Depends(get_current_user)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        new_conv_ref = db.collection('conversations').document()
        conv_data = {
            "id": new_conv_ref.id,
            "user_id": current_user['id'],
            "title": conversation.title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        new_conv_ref.set(conv_data)
        return conv_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        docs = db.collection('conversations').where('user_id', '==', current_user['id']).order_by('updated_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        conv_ref = db.collection('conversations').document(conversation_id)
        conv = conv_ref.get()
        if not conv.exists or conv.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Conversation not found")

        msgs = conv_ref.collection('messages').order_by('timestamp').stream()
        return [msg.to_dict() for msg in msgs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/prompts")
async def create_prompt(prompt: SavedPromptCreate, current_user: dict = Depends(get_current_user)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        new_prompt_ref = db.collection('prompts').document()
        prompt_data = {
            "id": new_prompt_ref.id,
            "user_id": current_user['id'],
            "title": prompt.title,
            "content": prompt.content,
            "tags": prompt.tags,
            "created_at": datetime.utcnow()
        }
        new_prompt_ref.set(prompt_data)
        return prompt_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prompts")
async def get_prompts(current_user: dict = Depends(get_current_user)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        docs = db.collection('prompts').where('user_id', '==', current_user['id']).order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, current_user: dict = Depends(get_current_user)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        prompt_ref = db.collection('prompts').document(prompt_id)
        prompt = prompt_ref.get()
        if not prompt.exists or prompt.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Prompt not found")
        prompt_ref.delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_admin)):
    if db is None: raise HTTPException(status_code=503, detail="DB not available")
    try:
        users = db.collection('users').stream()
        result = [user.to_dict() for user in users]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/activity")
async def get_all_activity(current_user: dict = Depends(get_current_admin)):
    return []

# AI Endpoints
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        engine = get_chat_engine()
        # Create a dynamic context dict
        context = {"current_mode": "chat"}
        response = await engine.generate_response(request.message, request.history, request.language, context=context)
        return {"response": response}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    try:
        engine = get_chat_engine()

        # Build dynamic context for the Orchestration System
        context = {"current_mode": "chat"}

        # Optional RAG context injection
        try:
            rag = get_rag_engine()
            rag_docs = rag.search(request.message)
            if rag_docs:
                context["session_context"] = "Relevant Context:\n" + "\n".join(rag_docs)
        except Exception as e:
            print(f"RAG Error (continuing without): {e}")

        async def stream_generator():
            async for token in engine.generate_stream(request.message, request.history, request.language, context=context):
                yield token

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


IMAGE_SERVICE_URL = "https://professorceo-cool-shot-ai-imagine.hf.space/generate-image"

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(IMAGE_SERVICE_URL, json={"prompt": request.prompt})
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Image Service Error")
            return response.json()
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
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


# App Lifecycle
@app.on_event("shutdown")
async def shutdown_event():
    if chat_engine is not None:
        await chat_engine.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
