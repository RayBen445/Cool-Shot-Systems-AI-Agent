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
from database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()
# Force git update

# Security Config
SECRET_KEY = "your-secret-key-keep-it-secret" # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

from fastapi import UploadFile, File
import shutil
from rag_engine import RAGEngine

# Initialize engines
print("Initializing AI Engines...")
chat_engine = ChatEngine()
image_engine = ImageEngine()
rag_engine = RAGEngine()
print("AI Engines Ready!")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth Helpers
def verify_password(plain_password, hashed_password):
    if len(plain_password) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# Auth Endpoints
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Check if this is the Admin user
    is_admin = False
    if user.email == "oladoyeheritage445@gmail.com":
        is_admin = True
        
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        full_name=user.full_name,
        company_name=user.company_name,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

# Conversation Endpoints
@app.post("/conversations", response_model=schemas.Conversation)
async def create_conversation(conversation: schemas.ConversationCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_conversation = models.Conversation(**conversation.dict(), user_id=current_user.id)
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@app.get("/conversations", response_model=List[schemas.Conversation])
async def get_conversations(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Conversation).filter(models.Conversation.user_id == current_user.id).order_by(models.Conversation.updated_at.desc()).all()

@app.get("/conversations/{conversation_id}/messages", response_model=List[schemas.ChatMessage])
async def get_conversation_messages(conversation_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return db.query(models.ChatMessage).filter(models.ChatMessage.conversation_id == conversation_id).order_by(models.ChatMessage.timestamp).all()

# Saved Prompt Endpoints
@app.post("/prompts", response_model=schemas.SavedPrompt)
async def create_prompt(prompt: schemas.SavedPromptCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_prompt = models.SavedPrompt(**prompt.dict(), user_id=current_user.id)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@app.get("/prompts", response_model=List[schemas.SavedPrompt])
async def get_prompts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.SavedPrompt).filter(models.SavedPrompt.user_id == current_user.id).order_by(models.SavedPrompt.created_at.desc()).all()

@app.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_prompt = db.query(models.SavedPrompt).filter(models.SavedPrompt.id == prompt_id, models.SavedPrompt.user_id == current_user.id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db.delete(db_prompt)
    db.commit()
    return {"status": "success"}

# Admin Endpoints
@app.get("/admin/users", response_model=List[schemas.UserActivity])
async def get_all_users(current_user: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Get users with message count
    users = db.query(models.User).all()
    result = []
    for user in users:
        msg_count = db.query(func.count(models.ChatMessage.id)).filter(models.ChatMessage.user_id == user.id).scalar()
        prompt_count = db.query(func.count(models.SavedPrompt.id)).filter(models.SavedPrompt.user_id == user.id).scalar()
        user_data = schemas.UserActivity.from_orm(user)
        user_data.message_count = msg_count
        user_data.prompt_count = prompt_count
        result.append(user_data)
    return result

@app.get("/admin/activity", response_model=List[schemas.ChatMessage])
async def get_all_activity(current_user: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    messages = db.query(models.ChatMessage).order_by(models.ChatMessage.timestamp.desc()).limit(100).all()
    return messages

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
async def chat(request: ChatRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ... (Keep existing /chat for backward compatibility if needed, or redirect logic)
    # For now, let's keep /chat as blocking and add /chat/stream
    try:
        # Save User Message
        user_msg = models.ChatMessage(user_id=current_user.id, role="user", content=request.message)
        db.add(user_msg)
        db.commit()

        # Generate Response
        response = chat_engine.generate_response(request.message, request.history)
        
        # Save Assistant Message
        ai_msg = models.ChatMessage(user_id=current_user.id, role="assistant", content=response)
        db.add(ai_msg)
        db.commit()
        
        return {"response": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# RAG Endpoints
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
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
async def chat_stream(request: ChatRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Check for RAG context
        context = ""
        rag_docs = rag_engine.search(request.message)
        if rag_docs:
            context = "\n\nRelevant Context:\n" + "\n".join(rag_docs) + "\n\n"
            print(f"Found {len(rag_docs)} relevant documents.")

        # Save User Message
        user_msg = models.ChatMessage(
            user_id=current_user.id, 
            conversation_id=request.conversation_id,
            role="user", 
            content=request.message
        )
        db.add(user_msg)
        db.commit()

        # Update conversation timestamp
        if request.conversation_id:
            conversation = db.query(models.Conversation).filter(models.Conversation.id == request.conversation_id).first()
            if conversation:
                conversation.updated_at = datetime.utcnow()
                db.commit()

        async def stream_generator():
            full_response = ""
            # Prepend context to the message sent to AI (but not saved in DB as user message)
            augmented_message = context + request.message if context else request.message
            
            for token in chat_engine.generate_stream(augmented_message, request.history, request.language):
                full_response += token
                yield token
            
            print(f"Generated response for conv {request.conversation_id}")

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
async def generate_image(request: ImageRequest, current_user: models.User = Depends(get_current_user)):
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
