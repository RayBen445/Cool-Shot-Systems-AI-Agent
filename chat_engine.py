import os
from groq import Groq

class ChatEngine:
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY environment variable is not set.")
        self.client = Groq(api_key=api_key)
        # Qwen-3 32B: best-in-class coding + reasoning + general chat, very fast on Groq
        self.model = "qwen-qwq-32b"
        print(f"ChatEngine initialized with Groq model: {self.model}")

    def generate_response(self, user_input, history=[], language="English"):
        return "".join(self.generate_stream(user_input, history, language))

    def generate_stream(self, user_input, history=[], language="English"):
        system_prompt = (
            f"You are Cool-Shot AI, a helpful, creative, and highly capable assistant developed by Cool-Shot Systems. "
            f"You are expert at coding, debugging, writing, reasoning, math, and general knowledge. "
            f"When writing code, always use proper markdown code blocks with the language specified. "
            f"Be friendly, professional, and concise. Reply in {language}."
        )

        # Detect search intent and augment with web results
        search_keywords = ["search", "find", "latest", "current", "news", "price of", "who is", "what is", "today"]
        if any(kw in user_input.lower() for kw in search_keywords) and len(user_input.split()) > 2:
            try:
                from search_engine import SearchEngine
                searcher = SearchEngine()
                print(f"Search intent detected: {user_input}")
                results = searcher.search(user_input)
                system_prompt += f"\n\nCONTEXT FROM WEB SEARCH:\n{results}\n\nUse this context to answer accurately. Cite sources where helpful."
            except Exception as e:
                print(f"Search failed (non-fatal): {e}")

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_input})

        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=4096,
            temperature=0.7,
            stream=True,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content

if __name__ == "__main__":
    engine = ChatEngine()
    print(engine.generate_response("Write a Python function to reverse a linked list."))
