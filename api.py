from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
import uuid

from chat_engine import ChatEngine
from rag_engine import RAGEngine
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

# In-Memory Storage (replaces Firebase/Firestore)
# Structure: {conversation_id: {id, title, messages: [], created_at, updated_at}}
conversations_db = {}
prompts_db = {}

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

# Pydantic Models for Request/Response
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
    tags: List[str] = []

# Health Check
@app.get("/")
def read_root():
    return {"status": "Backend is running", "message": "Cool-Shot AI is ready"}

# Simple Conversation Management (No Auth)
@app.post("/conversations")
async def create_conversation(conversation: ConversationCreate):
    """Create a new conversation (anonymous)"""
    conv_id = str(uuid.uuid4())
    conv_data = {
        "id": conv_id,
        "title": conversation.title,
        "messages": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    conversations_db[conv_id] = conv_data
    return conv_data

@app.get("/conversations")
async def get_conversations():
    """Get all conversations (anonymous)"""
    return list(conversations_db.values())

@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Get messages for a conversation"""
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations_db[conversation_id].get("messages", [])

# Saved Prompts (No Auth)
@app.post("/prompts")
async def create_prompt(prompt: SavedPromptCreate):
    """Save a prompt (anonymous)"""
    prompt_id = str(uuid.uuid4())
    prompt_data = {
        "id": prompt_id,
        "title": prompt.title,
        "content": prompt.content,
        "tags": prompt.tags,
        "created_at": datetime.utcnow().isoformat()
    }
    prompts_db[prompt_id] = prompt_data
    return prompt_data

@app.get("/prompts")
async def get_prompts():
    """Get all saved prompts (anonymous)"""
    return list(prompts_db.values())

@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str):
    """Delete a prompt"""
    if prompt_id not in prompts_db:
        raise HTTPException(status_code=404, detail="Prompt not found")
    del prompts_db[prompt_id]
    return {"status": "success"}

# AI Chat Endpoints (No Auth Required)
@app.post("/chat")
async def chat(request: ChatRequest):
    """Simple chat endpoint (non-streaming)"""
    try:
        engine = get_chat_engine()
        response = engine.generate_response(request.message, request.history, request.language)
        
        # Optionally save to conversation if ID provided
        if request.conversation_id and request.conversation_id in conversations_db:
            conv = conversations_db[request.conversation_id]
            conv["messages"].append({
                "role": "user",
                "content": request.message,
                "timestamp": datetime.utcnow().isoformat()
            })
            conv["messages"].append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.utcnow().isoformat()
            })
            conv["updated_at"] = datetime.utcnow().isoformat()
        
        return {"response": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint with optional RAG context"""
    try:
        # Check for RAG context
        context = ""
        try:
            rag = get_rag_engine()
            rag_docs = rag.search(request.message)
            if rag_docs:
                context = "\n\nRelevant Context:\n" + "\n".join(rag_docs) + "\n\n"
                print(f"Found {len(rag_docs)} relevant documents.")
        except Exception as e:
            print(f"RAG search failed: {e}")

        async def stream_generator():
            # Prepend context to the message sent to AI
            augmented_message = context + request.message if context else request.message
            
            engine = get_chat_engine()
            collected_response = ""
            
            for token in engine.generate_stream(augmented_message, request.history, request.language):
                collected_response += token
                yield token
            
            # Optionally save to conversation if ID provided
            if request.conversation_id and request.conversation_id in conversations_db:
                conv = conversations_db[request.conversation_id]
                conv["messages"].append({
                    "role": "user",
                    "content": request.message,
                    "timestamp": datetime.utcnow().isoformat()
                })
                conv["messages"].append({
                    "role": "assistant",
                    "content": collected_response,
                    "timestamp": datetime.utcnow().isoformat()
                })
                conv["updated_at"] = datetime.utcnow().isoformat()

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Image Generation Endpoint (External Service)
IMAGE_SERVICE_URL = "https://professorceo-cool-shot-ai-imagine.hf.space/generate-image"

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    """Generate an image using external service"""
    try:
        response = requests.post(IMAGE_SERVICE_URL, json={"prompt": request.prompt}, timeout=30)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Image Service Error")
        return response.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Image service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
