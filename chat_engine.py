import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline, BitsAndBytesConfig
import asyncio
from threading import Thread

# --- 1. Mode Configuration ---
class ModeConfig:
    MODES = {
        "chat": "Provide direct and concise responses without unnecessary verbosity. Be conversational but highly efficient.",
        "code": "Focus on code generation, debugging, and optimization. Output must be clean, minimal, production-ready, and well-commented. Use markdown code blocks.",
        "system": "Interpret requests as system-level actions. Output actionable steps, CLI commands, or structural workflows. Avoid conversational filler.",
        "docs": "Generate structured written content. Use clear headings, bullet points, and high readability. Act as a technical writer."
    }

    ALIASES = {
        "/chat": "chat",
        "/code": "code",
        "/build": "code",
        "/optimize": "code",
        "/fix": "code",
        "/system": "system",
        "/docs": "docs",
    }

# --- 2. Base Instruction Layer ---
BASE_INSTRUCTION = (
    "You are the DevOS system intelligence. Follow these rules strictly:\n"
    "- Prioritize precision over verbosity.\n"
    "- Output must be structured and easy to parse.\n"
    "- Do not use generic assistant language.\n"
    "- Focus entirely on execution and direct answers.\n"
)

# --- 3. Command Parsing Layer ---
class CommandParser:
    @staticmethod
    def parse(user_input: str, default_mode: str = "chat"):
        words = user_input.split()
        if not words:
            return default_mode, user_input

        first_word = words[0].lower()
        if first_word in ModeConfig.ALIASES:
            mode = ModeConfig.ALIASES[first_word]
            clean_input = " ".join(words[1:]).strip()
            return mode, clean_input

        return default_mode, user_input

# --- 4. Prompt Builder Layer ---
class PromptBuilder:
    @staticmethod
    def build(user_input: str, mode: str, context: dict = None) -> str:
        context = context or {}
        mode_instruction = ModeConfig.MODES.get(mode, ModeConfig.MODES["chat"])

        prompt_parts = [
            f"[[BASE INSTRUCTION]]\n{BASE_INSTRUCTION}",
            f"[[MODE: {mode.upper()}]]\n{mode_instruction}",
        ]

        if context:
            prompt_parts.append("[[CONTEXT]]")
            for key, value in context.items():
                if value and key not in ["current_mode", "language"]:
                    prompt_parts.append(f"{key.upper()}: {value}")

        return "\n".join(prompt_parts)

class ChatEngine:
    def __init__(self):
        print("Loading DevOS Chat Model (Phi-4 with 4-bit quantization)... this may take a minute.")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Running on device: {self.device}")

        model_id = "microsoft/phi-4"

        torch_dtype = torch.float16 if self.device == "cuda" else torch.float32

        quantization_config = None
        if self.device == "cuda":
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch_dtype,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )

        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map="auto" if self.device == "cuda" else self.device,
            torch_dtype=torch_dtype,
            trust_remote_code=True,
            quantization_config=quantization_config,
        )
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)

    async def generate_response(self, user_input: str, history: list = None, language: str = "English", context: dict = None):
        stream = self.generate_stream(user_input, history, language, context)
        response_text = ""
        async for chunk in stream:
            response_text += chunk
        return response_text

    async def generate_stream(self, user_input: str, history: list = None, language: str = "English", context: dict = None):
        from transformers import TextIteratorStreamer

        history = history or []
        context = context or {}

        # 1. Parse Mode
        current_mode = context.get("current_mode", "chat")
        mode, clean_input = CommandParser.parse(user_input, default_mode=current_mode)

        context["current_mode"] = mode

        # 2. Orchestrate Prompt
        orchestrated_system_prompt = PromptBuilder.build(clean_input, mode, context)

        messages = [{"role": "system", "content": orchestrated_system_prompt}]

        for m in history:
            if isinstance(m, dict) and "role" in m and "content" in m:
                if m["role"] != "system":
                    messages.append({"role": m["role"], "content": m["content"]})

        messages.append({"role": "user", "content": clean_input})

        # 3. Tokenize
        model_inputs = self.tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(self.device)

        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)

        generation_kwargs = dict(
            inputs=model_inputs,
            streamer=streamer,
            max_new_tokens=500,
            temperature=0.7,
            do_sample=True,
        )

        # 4. Run Generation
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()

        # 5. Yield Tokens
        # The streamer is a synchronous iterator that blocks on a queue.
        # We must pull from it asynchronously to avoid blocking the FastAPI event loop.
        import queue
        while True:
            try:
                # get next token from streamer in a thread to avoid blocking the event loop
                new_text = await asyncio.to_thread(next, streamer)
                yield new_text
                await asyncio.sleep(0) # Yield control
            except StopIteration:
                break

    async def close(self):
        pass

if __name__ == "__main__":
    async def run_test():
        engine = ChatEngine()
        print("Testing Chat Mode:")
        async for token in engine.generate_stream("Hello, what can you do?"):
            print(token, end="", flush=True)
        print("\n\nTesting Code Mode:")
        async for token in engine.generate_stream("/code write a python script to fetch a url"):
            print(token, end="", flush=True)
        print("\n")

    asyncio.run(run_test())
