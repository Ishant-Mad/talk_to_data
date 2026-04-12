import re

with open("backend/app/llm/llm_client.py", "r") as f:
    content = f.read()

# Add KeyRotator
key_rotator_code = """
class LLMClient(Protocol):
    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        ...

class KeyRotator:
    def __init__(self, keys_str: Optional[str]):
        self.keys = [k.strip() for k in (keys_str or "").split(",") if k.strip()]
        self._index = 0

    def get_key(self) -> str:
        if not self.keys:
            return ""
        key = self.keys[self._index]
        self._index = (self._index + 1) % len(self.keys)
        return key
"""
content = re.sub(r"class LLMClient\(Protocol\):.*?\.\.\.", key_rotator_code, content, flags=re.DOTALL)

def patch_client(cls_name, env_name, env_fallback=""):
    global content
    
    # Patch __init__
    init_old = f"""class {cls_name}:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self._api_key = api_key or os.getenv("{env_name}")"""
    
    if env_fallback:
        env_str = f'api_key or os.getenv("{env_fallback}") or os.getenv("{env_name}")'
    else:
        env_str = f'api_key or os.getenv("{env_name}S") or os.getenv("{env_name}")'
        
    init_new = f"""class {cls_name}:
    def __init__(self, api_key: Optional[str] = None) -> None:
        keys_str = {env_str}
        self._rotator = KeyRotator(keys_str)"""
        
    content = content.replace(init_old, init_new)
    
    # Patch _headers
    headers_old1 = f"""    def _headers(self) -> Dict[str, str]:
        if not self._api_key:
            raise RuntimeError("{env_name} is not configured"""
    
    headers_new1 = f"""    def _headers(self, current_key: str) -> Dict[str, str]:
        if not current_key:
            raise RuntimeError("{env_name} is not configured"""
            
    content = content.replace(headers_old1, headers_new1)
    content = content.replace("f\"Bearer {self._api_key}\"", "f\"Bearer {current_key}\"")
    
    # Patch requests.post headers
    content = content.replace("headers=self._headers(),", "headers=self._headers(current_key),")
    
    # Insert current_key = self._rotator.get_key() inside chat's attempt loop for this class.
    # We can do this with a simpler regex or replace.
    chat_loop_old = """        for attempt in range(2):
            response = requests.post("""
    chat_loop_new = """        for attempt in range(2):
            current_key = self._rotator.get_key()
            response = requests.post("""
    
    content = content.replace(chat_loop_old, chat_loop_new)

patch_client("GroqClient", "GROQ_API_KEY")
patch_client("GithubClient", "GITHUB_TOKEN", "GITHUB_TOKENS")
patch_client("OpenRouterClient", "OPENROUTER_API_KEY")

with open("backend/app/llm/llm_client.py", "w") as f:
    f.write(content)

