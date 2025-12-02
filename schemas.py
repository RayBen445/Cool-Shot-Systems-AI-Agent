from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_admin: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserActivity(User):
    message_count: int
    prompt_count: int

class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ChatMessageBase(BaseModel):
    role: str
    content: str
    conversation_id: Optional[int] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class UserActivity(User):
    message_count: int
    prompt_count: int

class SavedPromptBase(BaseModel):
    title: str
    content: str
    is_public: bool = False

class SavedPromptCreate(SavedPromptBase):
    pass

class SavedPrompt(SavedPromptBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
