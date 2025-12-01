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
        # Format the conversation for Phi-3
        messages = history + [{"role": "user", "content": user_input}]
        
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
