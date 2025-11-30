from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from chat_engine import ChatEngine
from image_engine import ImageEngine
import uvicorn
import os
import base64

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
print("Initializing AI Engines...")
chat_engine = ChatEngine()
image_engine = ImageEngine()
print("AI Engines Ready!")

class ChatRequest(BaseModel):
    message: str
    history: list = []

class ImageRequest(BaseModel):
    prompt: str

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = chat_engine.generate_response(request.message, request.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
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
