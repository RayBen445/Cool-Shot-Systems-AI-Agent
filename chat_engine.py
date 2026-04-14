import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import asyncio
from threading import Thread
import json
import re
from datetime import datetime
from typing import Optional, Dict, Any, List

# --- 1. Advanced Mode Configuration ---
class ModeConfig:
    """Enhanced modes that go beyond standard AI assistants"""
    MODES = {
        # Core Modes
        "chat": {
            "instruction": "You are Cool-Shot AI, an advanced conversational assistant. Be direct, insightful, and helpful. Avoid filler words and generic responses. Provide unique perspectives and actionable insights.",
            "icon": "message-circle",
            "description": "General conversation"
        },
        "code": {
            "instruction": """You are an elite software architect and engineer. Your code must be:
- Production-ready with proper error handling
- Well-documented with clear comments
- Following industry best practices
- Optimized for performance and maintainability
Always explain your architectural decisions. Use markdown code blocks with language tags.""",
            "icon": "code",
            "description": "Code generation & debugging"
        },
        "reason": {
            "instruction": """You are a deep reasoning engine. For complex problems:
1. Break down the problem into components
2. Analyze each component systematically
3. Consider multiple perspectives and edge cases
4. Build your conclusion step by step
5. Validate your reasoning before presenting

Show your thinking process using <thinking></thinking> tags when appropriate.""",
            "icon": "brain",
            "description": "Deep analysis & reasoning"
        },
        "create": {
            "instruction": """You are a creative director and content creator. Generate:
- Original, engaging content
- Multiple creative variations when appropriate
- Content optimized for the target medium
- Fresh perspectives that avoid cliches

Be bold, innovative, and push creative boundaries.""",
            "icon": "sparkles",
            "description": "Creative writing & ideation"
        },
        "research": {
            "instruction": """You are a research analyst. Your task is to:
- Synthesize information from multiple angles
- Identify key insights and patterns
- Present findings in a structured format
- Cite reasoning and acknowledge limitations
- Provide actionable recommendations

Format outputs with clear sections and bullet points.""",
            "icon": "search",
            "description": "Research & analysis"
        },
        "system": {
            "instruction": """You are a DevOps and systems expert. Provide:
- Precise CLI commands and scripts
- Infrastructure as Code examples
- Security best practices
- Step-by-step deployment guides
- Troubleshooting procedures

Always warn about potential risks and provide rollback strategies.""",
            "icon": "terminal",
            "description": "System administration"
        },
        "teach": {
            "instruction": """You are a world-class educator. Your approach:
- Start with foundational concepts
- Build complexity gradually
- Use analogies and real-world examples
- Include exercises for practice
- Check understanding with questions
- Adapt explanations to the learner's level

Make learning engaging and memorable.""",
            "icon": "graduation-cap",
            "description": "Learning & tutorials"
        },
        "plan": {
            "instruction": """You are a strategic planner and project manager. Create:
- Clear, actionable project plans
- Realistic timelines with milestones
- Risk assessments and mitigation strategies
- Resource allocation recommendations
- Success metrics and KPIs

Use structured formats like tables, timelines, and checklists.""",
            "icon": "calendar",
            "description": "Project planning"
        }
    }

    ALIASES = {
        "/chat": "chat",
        "/code": "code",
        "/build": "code",
        "/fix": "code",
        "/debug": "code",
        "/reason": "reason",
        "/think": "reason",
        "/analyze": "reason",
        "/create": "create",
        "/write": "create",
        "/research": "research",
        "/system": "system",
        "/devops": "system",
        "/teach": "teach",
        "/learn": "teach",
        "/explain": "teach",
        "/plan": "plan",
        "/project": "plan",
    }

    # Tool commands that trigger special behaviors
    TOOL_COMMANDS = {
        "/search": "web_search",
        "/imagine": "image_generation",
        "/artifact": "create_artifact",
        "/canvas": "open_canvas",
        "/upload": "file_upload",
    }


# --- 2. Enhanced Base Instruction Layer ---
BASE_INSTRUCTION = """You are Cool-Shot AI, an advanced AI assistant that surpasses standard AI interfaces.

## Core Principles:
1. **Precision Over Verbosity** - Every word should add value
2. **Structured Outputs** - Use formatting that enhances readability
3. **Proactive Assistance** - Anticipate follow-up needs
4. **Transparent Reasoning** - Show your thought process when helpful
5. **Actionable Results** - Provide concrete next steps

## Output Guidelines:
- Use markdown formatting for better readability
- Include code blocks with proper syntax highlighting
- Use tables for comparisons and structured data
- Add bullet points for lists and key points
- Break complex responses into clear sections

## Unique Capabilities:
- Multi-mode intelligence (code, reasoning, creative, research, etc.)
- Deep contextual understanding
- Artifact generation for complex outputs
- Proactive suggestions and improvements

Current Time: {current_time}
"""


# --- 3. Advanced Command Parser ---
class CommandParser:
    """Enhanced parser supporting modes, tools, and complex commands"""
    
    @staticmethod
    def parse(user_input: str, default_mode: str = "chat") -> Dict[str, Any]:
        """Parse user input for modes, tools, and clean content"""
        result = {
            "mode": default_mode,
            "tool": None,
            "tool_params": {},
            "clean_input": user_input,
            "flags": []
        }
        
        if not user_input.strip():
            return result
            
        words = user_input.split()
        first_word = words[0].lower()
        
        # Check for tool commands first
        if first_word in ModeConfig.TOOL_COMMANDS:
            result["tool"] = ModeConfig.TOOL_COMMANDS[first_word]
            result["clean_input"] = " ".join(words[1:]).strip()
            
            # Parse tool-specific parameters
            if result["tool"] == "image_generation":
                result["tool_params"] = CommandParser._parse_image_params(result["clean_input"])
            
            return result
        
        # Check for mode aliases
        if first_word in ModeConfig.ALIASES:
            result["mode"] = ModeConfig.ALIASES[first_word]
            result["clean_input"] = " ".join(words[1:]).strip()
        
        # Parse flags (--flag or -f style)
        flags = []
        clean_words = []
        for word in result["clean_input"].split():
            if word.startswith("--"):
                flags.append(word[2:])
            elif word.startswith("-") and len(word) == 2:
                flags.append(word[1:])
            else:
                clean_words.append(word)
        
        result["flags"] = flags
        result["clean_input"] = " ".join(clean_words)
        
        return result
    
    @staticmethod
    def _parse_image_params(input_str: str) -> Dict[str, Any]:
        """Parse image generation parameters"""
        params = {
            "prompt": input_str,
            "style": "realistic",
            "aspect_ratio": "1:1"
        }
        
        # Extract style flags
        style_patterns = {
            "--anime": "anime",
            "--realistic": "realistic",
            "--artistic": "artistic",
            "--3d": "3d-render",
            "--sketch": "sketch"
        }
        
        for flag, style in style_patterns.items():
            if flag in input_str:
                params["style"] = style
                params["prompt"] = input_str.replace(flag, "").strip()
        
        # Extract aspect ratio
        ar_match = re.search(r"--ar\s*(\d+:\d+)", input_str)
        if ar_match:
            params["aspect_ratio"] = ar_match.group(1)
            params["prompt"] = re.sub(r"--ar\s*\d+:\d+", "", params["prompt"]).strip()
        
        return params


# --- 4. Advanced Prompt Builder ---
class PromptBuilder:
    """Builds sophisticated prompts with context injection"""
    
    @staticmethod
    def build(user_input: str, mode: str, context: Optional[Dict] = None) -> str:
        """Build a comprehensive prompt with mode-specific instructions"""
        context = context or {}
        mode_config = ModeConfig.MODES.get(mode, ModeConfig.MODES["chat"])
        
        # Format base instruction with current time
        base = BASE_INSTRUCTION.format(
            current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        prompt_parts = [
            f"## System Configuration\n{base}",
            f"## Active Mode: {mode.upper()}\n{mode_config['instruction']}",
        ]
        
        # Add context if available
        if context:
            context_parts = []
            
            # RAG context
            if context.get("session_context"):
                context_parts.append(f"### Retrieved Context\n{context['session_context']}")
            
            # User preferences
            if context.get("user_preferences"):
                context_parts.append(f"### User Preferences\n{context['user_preferences']}")
            
            # Previous artifacts
            if context.get("artifacts"):
                context_parts.append(f"### Available Artifacts\n{context['artifacts']}")
            
            if context_parts:
                prompt_parts.append("## Contextual Information\n" + "\n\n".join(context_parts))
        
        return "\n\n".join(prompt_parts)
    
    @staticmethod
    def build_artifact_prompt(artifact_type: str, content: str) -> str:
        """Build prompt for artifact generation"""
        artifact_instructions = {
            "code": "Generate production-ready code. Include all necessary imports, error handling, and comments.",
            "document": "Create a well-structured document with proper headings, sections, and formatting.",
            "diagram": "Describe the diagram in Mermaid syntax that can be rendered.",
            "table": "Generate a properly formatted markdown table.",
            "plan": "Create a detailed project plan with phases, tasks, and timelines."
        }
        
        instruction = artifact_instructions.get(artifact_type, artifact_instructions["document"])
        return f"""## Artifact Generation Mode
Type: {artifact_type}
Instructions: {instruction}

Generate the following artifact:
{content}

Wrap the artifact content in <artifact type="{artifact_type}"></artifact> tags."""


# --- 5. Response Post-Processor ---
class ResponseProcessor:
    """Process and enhance AI responses"""
    
    @staticmethod
    def extract_artifacts(response: str) -> tuple[str, List[Dict]]:
        """Extract artifacts from response"""
        artifacts = []
        artifact_pattern = r'<artifact type="(\w+)">(.*?)</artifact>'
        
        matches = re.findall(artifact_pattern, response, re.DOTALL)
        for match in matches:
            artifacts.append({
                "type": match[0],
                "content": match[1].strip(),
                "id": f"artifact_{len(artifacts)}"
            })
        
        # Clean response of artifact tags for display
        clean_response = re.sub(artifact_pattern, "[Artifact generated - see panel]", response, flags=re.DOTALL)
        
        return clean_response, artifacts
    
    @staticmethod
    def enhance_code_blocks(response: str) -> str:
        """Add copy buttons and syntax highlighting hints to code blocks"""
        # This is handled on the frontend, but we ensure proper formatting
        return response
    
    @staticmethod
    def format_thinking(response: str) -> str:
        """Format thinking tags for UI rendering"""
        # Convert <thinking> tags to collapsible sections
        response = re.sub(
            r'<thinking>(.*?)</thinking>',
            r'<details class="thinking"><summary>View reasoning</summary>\1</details>',
            response,
            flags=re.DOTALL
        )
        return response


# --- 6. Main Chat Engine ---
class ChatEngine:
    def __init__(self):
        print("Loading Cool-Shot AI Model (Phi-4 with 4-bit quantization)... this may take a minute.")
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
        self.tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
        
        # Initialize processors
        self.command_parser = CommandParser()
        self.prompt_builder = PromptBuilder()
        self.response_processor = ResponseProcessor()
        
        print("Cool-Shot AI Engine initialized successfully!")

    def get_available_modes(self) -> Dict[str, Dict]:
        """Return available modes with their descriptions"""
        return {
            mode: {
                "description": config["description"],
                "icon": config["icon"],
                "command": f"/{mode}"
            }
            for mode, config in ModeConfig.MODES.items()
        }

    async def generate_response(self, user_input: str, history: list = None, 
                                language: str = "English", context: dict = None) -> Dict[str, Any]:
        """Generate a complete response with metadata"""
        response_text = ""
        async for chunk in self.generate_stream(user_input, history, language, context):
            response_text += chunk
        
        # Process response for artifacts and formatting
        clean_response, artifacts = self.response_processor.extract_artifacts(response_text)
        clean_response = self.response_processor.format_thinking(clean_response)
        
        return {
            "response": clean_response,
            "artifacts": artifacts,
            "mode": context.get("current_mode", "chat") if context else "chat"
        }

    async def generate_stream(self, user_input: str, history: list = None, 
                              language: str = "English", context: dict = None):
        """Stream response tokens"""
        from transformers import TextIteratorStreamer

        history = history or []
        context = context or {}

        # Parse command and mode
        current_mode = context.get("current_mode", "chat")
        parsed = self.command_parser.parse(user_input, default_mode=current_mode)
        
        # Check for tool commands
        if parsed["tool"]:
            # Return tool indicator for frontend handling
            yield f"[TOOL:{parsed['tool']}:{json.dumps(parsed['tool_params'])}]"
            return
        
        mode = parsed["mode"]
        clean_input = parsed["clean_input"]
        context["current_mode"] = mode

        # Build system prompt
        system_prompt = self.prompt_builder.build(clean_input, mode, context)

        # Construct messages
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (limit to last 10 exchanges for context window)
        for m in history[-20:]:
            if isinstance(m, dict) and "role" in m and "content" in m:
                if m["role"] != "system":
                    messages.append({"role": m["role"], "content": m["content"]})

        messages.append({"role": "user", "content": clean_input})

        # Tokenize
        model_inputs = self.tokenizer.apply_chat_template(
            messages, 
            add_generation_prompt=True, 
            return_tensors="pt"
        ).to(self.device)

        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)

        # Adjust generation params based on mode
        temperature = 0.7
        max_tokens = 1024
        
        if mode == "code":
            temperature = 0.3  # More deterministic for code
            max_tokens = 2048
        elif mode == "create":
            temperature = 0.9  # More creative
        elif mode == "reason":
            max_tokens = 2048  # Allow longer reasoning

        generation_kwargs = dict(
            inputs=model_inputs,
            streamer=streamer,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.95,
            repetition_penalty=1.1,
        )

        # Run generation in thread
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()

        # Yield tokens
        while True:
            try:
                new_text = await asyncio.to_thread(next, streamer)
                yield new_text
                await asyncio.sleep(0)
            except StopIteration:
                break

    async def close(self):
        """Cleanup resources"""
        pass


# --- 7. Test Runner ---
if __name__ == "__main__":
    async def run_tests():
        engine = ChatEngine()
        
        print("\n=== Available Modes ===")
        for mode, info in engine.get_available_modes().items():
            print(f"  /{mode}: {info['description']}")
        
        print("\n=== Test: Chat Mode ===")
        async for token in engine.generate_stream("What makes you different from other AI assistants?"):
            print(token, end="", flush=True)
        
        print("\n\n=== Test: Code Mode ===")
        async for token in engine.generate_stream("/code Create a Python async web scraper with rate limiting"):
            print(token, end="", flush=True)
        
        print("\n\n=== Test: Reason Mode ===")
        async for token in engine.generate_stream("/reason What are the tradeoffs between microservices and monoliths?"):
            print(token, end="", flush=True)
        
        print("\n")

    asyncio.run(run_tests())
