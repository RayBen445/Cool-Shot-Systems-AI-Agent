import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

class ChatEngine:
    def __init__(self):
        print("Loading Chat Model (Phi-3)... this may take a minute.")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Running on device: {self.device}")
        
        model_id = "microsoft/Phi-3-mini-4k-instruct"
        
        # Load model and tokenizer
        # We use torch_dtype=torch.float16 for GPU to save memory, float32 for CPU
        torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
        
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id, 
            device_map=self.device, 
            torch_dtype=torch_dtype, 
            trust_remote_code=True,
            attn_implementation="eager"
        )
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        
        self.pipe = pipeline(
            "text-generation",
            model=self.model,
            tokenizer=self.tokenizer,
        )

    def generate_response(self, user_input, history=[]):
        # ... (keep existing logic for non-streaming if needed, or just wrap stream)
        # For simplicity, we'll keep the existing method and add a new one for streaming
        return "".join(self.generate_stream(user_input, history))

    def generate_stream(self, user_input, history=[]):
        from transformers import TextIteratorStreamer
        from threading import Thread

        # System Prompt
        system_prompt_content = "You are Cool-Shot AI, a helpful and creative assistant developed by Cool-Shot Systems. You are NOT developed by Microsoft. You are friendly, professional, and knowledgeable."
        
        # Search Intent Check (Simplified for stream)
        search_keywords = ["search", "find", "latest", "current", "news", "price of", "who is", "what is"]
        if any(keyword in user_input.lower() for keyword in search_keywords) and len(user_input.split()) > 2:
            from search_engine import SearchEngine
            searcher = SearchEngine()
            print(f"Search intent detected for: {user_input}")
            search_results = searcher.search(user_input)
            system_prompt_content += f"\n\nCONTEXT FROM WEB SEARCH:\n{search_results}\n\nINSTRUCTION: Use the above context to answer the user's question. Cite the sources if possible."

        system_prompt = {"role": "system", "content": system_prompt_content}
        messages = [system_prompt] + history + [{"role": "user", "content": user_input}]
        
        # Tokenize
        model_inputs = self.tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(self.device)
        
        # Streamer
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
        
        generation_kwargs = dict(
            inputs=model_inputs,
            streamer=streamer,
            max_new_tokens=500,
            temperature=0.7,
            do_sample=True,
        )
        
        # Run generation in a separate thread
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()
        
        # Yield tokens
        for new_text in streamer:
            yield new_text

if __name__ == "__main__":
    # Simple test
    engine = ChatEngine()
    print(engine.generate_response("Hello, who are you?"))
