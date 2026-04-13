from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import uvicorn
import os

from chat_engine import ChatEngine
from rag_engine import RAGEngine
import firebase_admin
from firebase_admin import credentials, firestore, auth

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Cool-Shot AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Firebase Admin
# ---------------------------------------------------------------------------
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin initialised.")
    except Exception as e:
        print(f"Firebase Admin init failed (some features disabled): {e}")
        db = None
else:
    db = firestore.client()

# ---------------------------------------------------------------------------
# Lazy-loaded engines
# ---------------------------------------------------------------------------
_chat_engine: Optional[ChatEngine] = None
_rag_engine: Optional[RAGEngine] = None


def get_chat_engine() -> ChatEngine:
    global _chat_engine
    if _chat_engine is None:
        print("Lazy-loading ChatEngine (Groq)…")
        _chat_engine = ChatEngine()
    return _chat_engine


def get_rag_engine() -> RAGEngine:
    global _rag_engine
    if _rag_engine is None:
        print("Lazy-loading RAGEngine…")
        _rag_engine = RAGEngine()
    return _rag_engine


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    if db is None:
        raise HTTPException(status_code=503, detail="Firebase not initialised")
    try:
        decoded = auth.verify_id_token(token)
        uid = decoded["uid"]
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            user_data = {
                "email": decoded.get("email"),
                "full_name": decoded.get("name", "User"),
                "created_at": datetime.utcnow(),
                "is_admin": False,
            }
            db.collection("users").document(uid).set(user_data)
            return {**user_data, "id": uid}
        return {**user_doc.to_dict(), "id": uid}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    history: list = []
    language: str = "English"
    conversation_id: Optional[str] = None


class ImageRequest(BaseModel):
    prompt: str


class ConversationCreate(BaseModel):
    title: str = "New Chat"


class SavedPromptCreate(BaseModel):
    title: str
    content: str
    tags: list = []


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "running", "message": "Cool-Shot AI Backend — visit /docs"}


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------
@app.post("/conversations")
async def create_conversation(conversation: ConversationCreate, current_user: dict = Depends(get_current_user)):
    try:
        ref = db.collection("conversations").document()
        data = {
            "id": ref.id,
            "user_id": current_user["id"],
            "title": conversation.title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        ref.set(data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    try:
        docs = (
            db.collection("conversations")
            .where("user_id", "==", current_user["id"])
            .order_by("updated_at", direction=firestore.Query.DESCENDING)
            .stream()
        )
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    try:
        conv_ref = db.collection("conversations").document(conversation_id)
        conv = conv_ref.get()
        if not conv.exists or conv.to_dict()["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Conversation not found")
        msgs = conv_ref.collection("messages").order_by("timestamp").stream()
        return [msg.to_dict() for msg in msgs]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Saved Prompts
# ---------------------------------------------------------------------------
@app.post("/prompts")
async def create_prompt(prompt: SavedPromptCreate, current_user: dict = Depends(get_current_user)):
    try:
        ref = db.collection("prompts").document()
        data = {
            "id": ref.id,
            "user_id": current_user["id"],
            "title": prompt.title,
            "content": prompt.content,
            "tags": prompt.tags,
            "created_at": datetime.utcnow(),
        }
        ref.set(data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/prompts")
async def get_prompts(current_user: dict = Depends(get_current_user)):
    try:
        docs = (
            db.collection("prompts")
            .where("user_id", "==", current_user["id"])
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .stream()
        )
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, current_user: dict = Depends(get_current_user)):
    try:
        ref = db.collection("prompts").document(prompt_id)
        prompt = ref.get()
        if not prompt.exists or prompt.to_dict()["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Prompt not found")
        ref.delete()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@app.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_admin)):
    try:
        users = db.collection("users").stream()
        return [u.to_dict() for u in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/activity")
async def get_all_activity(current_user: dict = Depends(get_current_admin)):
    return []


# ---------------------------------------------------------------------------
# Chat — powered by Groq (fast cloud inference)
# ---------------------------------------------------------------------------
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        engine = get_chat_engine()
        response = engine.generate_response(request.message, request.history, request.language)
        return {"response": response}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    try:
        # Optional RAG context injection
        context = ""
        try:
            rag = get_rag_engine()
            rag_docs = rag.search(request.message)
            if rag_docs:
                context = "\n\nRelevant Context:\n" + "\n".join(rag_docs) + "\n\n"
        except Exception:
            pass  # RAG is optional — don't fail the whole request

        augmented = context + request.message if context else request.message

        def stream_generator():
            engine = get_chat_engine()
            for token in engine.generate_stream(augmented, request.history, request.language):
                yield token

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Image Generation — Pollinations AI (free, fast, no API key needed)
# ---------------------------------------------------------------------------
@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        from image_service.generate import generate_image_base64
        img_b64 = generate_image_base64(request.prompt)
        return {"image_base64": img_b64, "prompt": request.prompt}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# File Upload for RAG
# ---------------------------------------------------------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        import shutil, tempfile
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


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
