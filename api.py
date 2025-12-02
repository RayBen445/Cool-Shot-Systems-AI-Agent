from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import uvicorn
import os
import base64

from chat_engine import ChatEngine
from image_engine import ImageEngine
import models
import schemas
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin
if not firebase_admin._apps:
    if os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
    else:
        # Try getting from env var (for Hugging Face)
        key_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
        if key_json:
            import json
            cred_dict = json.loads(key_json)
            cred = credentials.Certificate(cred_dict)
        else:
            print("Warning: No service account key found. Firebase features will fail.")
            cred = None
            
    if cred:
        firebase_admin.initialize_app(cred)

if firebase_admin._apps:
    db = firestore.client()
else:
    db = None

# Initialize engines
print("Initializing AI Engines...")
chat_engine = ChatEngine()
image_engine = ImageEngine()
rag_engine = RAGEngine()
print("AI Engines Ready!")

# Auth Dependency
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        # Get user data from Firestore
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            # Create user if not exists (first login)
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

# Auth Endpoints
# Note: Registration and Login are handled by Firebase on the Frontend.
# The backend only verifies the ID token via get_current_user.

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Conversation Endpoints
@app.post("/conversations")
async def create_conversation(conversation: schemas.ConversationCreate, current_user: dict = Depends(get_current_user)):
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
    try:
        docs = db.collection('conversations').where('user_id', '==', current_user['id']).order_by('updated_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Verify ownership
        conv_ref = db.collection('conversations').document(conversation_id)
        conv = conv_ref.get()
        if not conv.exists or conv.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
        msgs = conv_ref.collection('messages').order_by('timestamp').stream()
        return [msg.to_dict() for msg in msgs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Saved Prompt Endpoints
@app.post("/prompts")
async def create_prompt(prompt: schemas.SavedPromptCreate, current_user: dict = Depends(get_current_user)):
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
    try:
        docs = db.collection('prompts').where('user_id', '==', current_user['id']).order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, current_user: dict = Depends(get_current_user)):
    try:
        prompt_ref = db.collection('prompts').document(prompt_id)
        prompt = prompt_ref.get()
        if not prompt.exists or prompt.to_dict()['user_id'] != current_user['id']:
            raise HTTPException(status_code=404, detail="Prompt not found")
        prompt_ref.delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin Endpoints
@app.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_admin)):
    try:
        users = db.collection('users').stream()
        result = []
        for user in users:
            user_data = user.to_dict()
            # Count messages (this might be expensive in Firestore, maybe skip or approximate)
            # For now, let's just return user data
            result.append(user_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/activity")
async def get_all_activity(current_user: dict = Depends(get_current_admin)):
    # This is hard in Firestore without a global collection group query
    # For now, return empty or implement a specific 'activity' log collection
    return []

# Protected AI Endpoints
class ChatRequest(BaseModel):
    message: str
    history: list = []
    language: str = "English"
    conversation_id: Optional[int] = None

class ImageRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"status": "Backend is running", "message": "Go to /docs to see the API"}

@app.post("/chat")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    # ... (Keep existing /chat for backward compatibility if needed, or redirect logic)
    # For now, let's keep /chat as blocking and add /chat/stream
    try:
        # Generate Response
        response = chat_engine.generate_response(request.message, request.history)
        
        # Save to Firestore if conversation_id is present
        if request.conversation_id:
            conv_ref = db.collection('conversations').document(request.conversation_id)
            # User Msg
            conv_ref.collection('messages').add({
                "role": "user",
                "content": request.message,
                "timestamp": datetime.utcnow()
            })
            # AI Msg
            conv_ref.collection('messages').add({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.utcnow()
            })
            conv_ref.update({"updated_at": datetime.utcnow()})
        
        return {"response": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# RAG Endpoints
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        # Save file locally
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Ingest into RAG
        rag_engine.ingest_file(file_path)
        
        return {"filename": file.filename, "status": "ingested"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Check for RAG context
        context = ""
        rag_docs = rag_engine.search(request.message)
        if rag_docs:
            context = "\n\nRelevant Context:\n" + "\n".join(rag_docs) + "\n\n"
            print(f"Found {len(rag_docs)} relevant documents.")

        # Save User Message
        if request.conversation_id:
            conv_ref = db.collection('conversations').document(request.conversation_id)
            conv_ref.collection('messages').add({
                "role": "user",
                "content": request.message,
                "timestamp": datetime.utcnow()
            })
            conv_ref.update({"updated_at": datetime.utcnow()})

        async def stream_generator():
            full_response = ""
            # Prepend context to the message sent to AI (but not saved in DB as user message)
            augmented_message = context + request.message if context else request.message
            
            for token in chat_engine.generate_stream(augmented_message, request.history, request.language):
                full_response += token
                yield token
            
            # Save AI Message after generation
            if request.conversation_id:
                conv_ref = db.collection('conversations').document(request.conversation_id)
                conv_ref.collection('messages').add({
                    "role": "assistant",
                    "content": full_response,
                    "timestamp": datetime.utcnow()
                })
            
            print(f"Generated response for conv {request.conversation_id}")

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
async def generate_image(request: ImageRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Generate image to a temporary file
        filename = "temp_generated.png"
        image_engine.generate_image(request.prompt, output_path=filename)
        
        # Read and encode to base64 to send to frontend
        with open(filename, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
        return {"image_base64": encoded_string}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
