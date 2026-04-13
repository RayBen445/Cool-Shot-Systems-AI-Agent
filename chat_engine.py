import requests
import json

HF_SPACE_URL = "https://professorceo-coolshot-ai-backend.hf.space"

class ChatEngine:
    def __init__(self):
        self.chat_url = f"{HF_SPACE_URL}/chat"
        self.stream_url = f"{HF_SPACE_URL}/chat/stream"
        print(f"ChatEngine initialized — using HuggingFace Space: {HF_SPACE_URL}")

    def generate_response(self, user_input, history=[], language="English"):
        return "".join(self.generate_stream(user_input, history, language))

    def generate_stream(self, user_input, history=[], language="English"):
        payload = {
            "message": user_input,
            "history": [
                {"role": m["role"], "content": m["content"]}
                for m in history
                if isinstance(m, dict) and "role" in m and "content" in m
            ],
            "language": language,
        }

        try:
            with requests.post(self.stream_url, json=payload, stream=True, timeout=120) as resp:
                resp.raise_for_status()
                for chunk in resp.iter_content(chunk_size=None, decode_unicode=True):
                    if chunk:
                        yield chunk
        except requests.exceptions.HTTPError as e:
            # Fall back to non-streaming endpoint
            try:
                resp = requests.post(self.chat_url, json=payload, timeout=120)
                resp.raise_for_status()
                data = resp.json()
                yield data.get("response", "")
            except Exception as fallback_err:
                yield f"[Error contacting AI backend: {fallback_err}]"
        except Exception as e:
            yield f"[Error: {e}]"


if __name__ == "__main__":
    engine = ChatEngine()
    for token in engine.generate_stream("Hello, who are you?"):
        print(token, end="", flush=True)
    print()
