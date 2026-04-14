import os
import json
import httpx
import asyncio

# --- 1. Mode Configuration ---
class ModeConfig:
    MODES = {
        "chat": "Provide direct and concise responses without unnecessary verbosity. Be conversational but highly efficient.",
        "code": "Focus on code generation, debugging, and optimization. Output must be clean, minimal, production-ready, and well-commented. Use markdown code blocks.",
        "system": "Interpret requests as system-level actions. Output actionable steps, CLI commands, or structural workflows. Avoid conversational filler.",
        "docs": "Generate structured written content. Use clear headings, bullet points, and high readability. Act as a technical writer."
    }

    # Command aliases mapped to modes
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
    "- Do not use generic assistant language (e.g., 'I am an AI', 'Sure, I can help').\n"
    "- Focus entirely on execution and direct answers.\n"
)

# --- 3. Command Parsing Layer ---
class CommandParser:
    @staticmethod
    def parse(user_input: str, default_mode: str = "chat"):
        """Extracts mode command from input if present and returns the mode and clean input."""
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
        """Constructs the deterministic system prompt based on mode and context."""
        context = context or {}
        mode_instruction = ModeConfig.MODES.get(mode, ModeConfig.MODES["chat"])

        prompt_parts = [
            f"[[BASE INSTRUCTION]]\n{BASE_INSTRUCTION}",
            f"[[MODE: {mode.upper()}]]\n{mode_instruction}",
        ]

        if context:
            prompt_parts.append("[[CONTEXT]]")
            for key, value in context.items():
                if value:
                    prompt_parts.append(f"{key.upper()}: {value}")

        prompt_parts.append(f"\n[[USER INPUT]]\n{user_input}")

        return "\n".join(prompt_parts)

# --- 5. API Wrapper / Interaction Layer ---
HF_SPACE_URL = "https://professorceo-coolshot-ai-backend.hf.space"

class ChatEngine:
    """Modular AI interaction layer handling prompt orchestration and external API communication."""

    def __init__(self, use_local=False):
        # Allow easy swapping to vLLM or other providers later
        self.stream_url = f"{HF_SPACE_URL}/chat/stream"
        self.chat_url = f"{HF_SPACE_URL}/chat"
        self.client = httpx.AsyncClient(timeout=120.0)
        print(f"ChatEngine initialized — API Provider: HuggingFace Space")

    async def generate_response(self, user_input: str, history: list = None, language: str = "English", context: dict = None):
        """Standard non-streaming generation."""
        stream = self.generate_stream(user_input, history, language, context)
        response_text = ""
        async for chunk in stream:
            response_text += chunk
        return response_text

    async def generate_stream(self, user_input: str, history: list = None, language: str = "English", context: dict = None):
        """Asynchronous streaming generation with full prompt orchestration."""
        history = history or []
        context = context or {}

        # 1. Parse mode command from user input
        current_mode = context.get("current_mode", "chat")
        mode, clean_input = CommandParser.parse(user_input, default_mode=current_mode)

        # Update context
        context["current_mode"] = mode
        context["language"] = language

        # 2. Orchestrate Prompt
        orchestrated_system_prompt = PromptBuilder.build(clean_input, mode, context)

        # 3. Construct Messages Array
        messages = [
            {"role": "system", "content": orchestrated_system_prompt}
        ]

        for m in history:
            if isinstance(m, dict) and "role" in m and "content" in m:
                # Filter out old system messages from history to prevent confusion
                if m["role"] != "system":
                    messages.append({"role": m["role"], "content": m["content"]})

        # Note: We send the clean_input directly to the API, as the orchestration
        # is handled in the system prompt. If the API doesn't support system prompts
        # well, we can inject it into the final user message.

        payload = {
            "message": clean_input,
            "history": messages, # Pass orchestrated history
            "language": language
        }

        # 4. API Execution
        try:
            async with self.client.stream("POST", self.stream_url, json=payload) as response:
                response.raise_for_status()
                async for chunk in response.aiter_text():
                    if chunk:
                        yield chunk
        except httpx.HTTPStatusError as e:
            # Fallback to non-streaming if stream fails
            try:
                resp = await self.client.post(self.chat_url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                yield data.get("response", "")
            except Exception as fallback_err:
                yield f"[Error contacting API: {fallback_err}]"
        except Exception as e:
            yield f"[Error: {str(e)}]"

    async def close(self):
        await self.client.aclose()

# Example usage integration (local testing)
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
        await engine.close()

    asyncio.run(run_test())
