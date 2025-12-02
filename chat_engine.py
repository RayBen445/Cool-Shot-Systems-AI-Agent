import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread
from search_engine import web_search

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

    def generate_response(self, user_input, history=[], use_search=False):
        # System Prompt to define persona
        system_prompt = "You are Cool-Shot AI, a helpful and creative assistant developed by Cool-Shot Systems. You are NOT developed by Microsoft. You are friendly, professional, and knowledgeable."
        
        # Add internet search results if requested
        search_context = ""
        if use_search and ("search" in user_input.lower() or "find" in user_input.lower() or "what is" in user_input.lower()):
            results = web_search(user_input, num_results=3)
            if results:
                search_context = "\n\nInternet Search Results:\n"
                for i, result in enumerate(results, 1):
                    search_context += f"{i}. {result['snippet']}\n"
                search_context += "\nUse this information to answer the question.\n"
        
        # Format the conversation for Phi-3
        messages = [{"role": "system", "content": system_prompt + search_context}] + history + [{"role": "user", "content": user_input}]
        
        # Format for Phi-3
        formatted_prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.device)
        
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=500,
            temperature=0.7,
            do_sample=True,
            pad_token_id=self.tokenizer.eos_token_id
        )
        
        response = self.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        return response

    def generate_response_stream(self, user_input, history=[], use_search=False):
        """Generate response with streaming support"""
        system_prompt = "You are Cool-Shot AI, a helpful and creative assistant developed by Cool-Shot Systems. You are NOT developed by Microsoft. You are friendly, professional, and knowledgeable."
        
        # Add internet search results if requested
        search_context = ""
        if use_search:
            results = web_search(user_input, num_results=3)
            if results:
                search_context = "\n\nInternet Search Results:\n"
                for i, result in enumerate(results, 1):
                    search_context += f"{i}. {result['snippet']}\n"
        
        messages = [{"role": "system", "content": system_prompt + search_context}] + history + [{"role": "user", "content": user_input}]
        formatted_prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.device)
        
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
        generation_kwargs = dict(
            **inputs,
            max_new_tokens=500,
            temperature=0.7,
            do_sample=True,
            pad_token_id=self.tokenizer.eos_token_id,
            streamer=streamer
        )
        
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()
        
        for text in streamer:
            yield text

if __name__ == "__main__":
    # Simple test
    engine = ChatEngine()
    print(engine.generate_response("Hello, who are you?"))
