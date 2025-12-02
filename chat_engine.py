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
        # System Prompt to define persona
        system_prompt_content = "You are Cool-Shot AI, a helpful and creative assistant developed by Cool-Shot Systems. You are NOT developed by Microsoft. You are friendly, professional, and knowledgeable."
        
        # Check for search intent (simple keyword check for now)
        # In a real app, we might use an LLM to decide if search is needed
        search_keywords = ["search", "find", "latest", "current", "news", "price of", "who is", "what is"]
        if any(keyword in user_input.lower() for keyword in search_keywords) and len(user_input.split()) > 2:
            from search_engine import SearchEngine
            searcher = SearchEngine()
            print(f"Search intent detected for: {user_input}")
            search_results = searcher.search(user_input)
            
            # Inject search results into context
            system_prompt_content += f"\n\nCONTEXT FROM WEB SEARCH:\n{search_results}\n\nINSTRUCTION: Use the above context to answer the user's question. Cite the sources if possible."

        system_prompt = {
            "role": "system",
            "content": system_prompt_content
        }
        
        # Format the conversation for Phi-3
        # Ensure system prompt is first
        messages = [system_prompt] + history + [{"role": "user", "content": user_input}]
        
        generation_args = {
            "max_new_tokens": 500,
            "return_full_text": False,
            "temperature": 0.7,
            "do_sample": True,
        }

        output = self.pipe(messages, **generation_args)
        response = output[0]['generated_text']
        return response

if __name__ == "__main__":
    # Simple test
    engine = ChatEngine()
    print(engine.generate_response("Hello, who are you?"))
