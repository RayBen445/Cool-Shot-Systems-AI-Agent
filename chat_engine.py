import os
from groq import Groq

class ChatEngine:
    def __init__(self):
        print("Initializing Chat Engine with Groq API...")
        # Get API key from environment variable
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            print("WARNING: GROQ_API_KEY not set. Using placeholder.")
            api_key = "placeholder"
        
        self.client = Groq(api_key=api_key)
        self.model = "mixtral-8x7b-32768"  # Fast and capable model
        print(f"Chat Engine ready with model: {self.model}")

    def generate_response(self, user_input, history=[], language="English"):
        """Generate a complete response (non-streaming)"""
        response_text = ""
        for chunk in self.generate_stream(user_input, history, language):
            response_text += chunk
        return response_text

    def generate_stream(self, user_input, history=[], language="English"):
        """Generate a streaming response using Groq API"""
        # System Prompt
        system_prompt_content = f"You are Cool-Shot AI, a helpful and creative assistant developed by Cool-Shot Systems. You are friendly, professional, and knowledgeable. Please reply in {language}."
        
        # Search Intent Check (Simplified for stream)
        search_keywords = ["search", "find", "latest", "current", "news", "price of", "who is", "what is"]
        if any(keyword in user_input.lower() for keyword in search_keywords) and len(user_input.split()) > 2:
            try:
                from search_engine import SearchEngine
                searcher = SearchEngine()
                print(f"Search intent detected for: {user_input}")
                search_results = searcher.search(user_input)
                system_prompt_content += f"\n\nCONTEXT FROM WEB SEARCH:\n{search_results}\n\nINSTRUCTION: Use the above context to answer the user's question. Cite the sources if possible."
            except Exception as e:
                print(f"Search failed: {e}")

        # Build messages array
        messages = [{"role": "system", "content": system_prompt_content}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_input})
        
        try:
            # Call Groq API with streaming
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
                stream=True,
            )
            
            # Yield tokens as they arrive
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            print(f"Error generating response: {e}")
            yield f"Sorry, I encountered an error: {str(e)}"

if __name__ == "__main__":
    # Simple test
    engine = ChatEngine()
    print(engine.generate_response("Hello, who are you?"))
