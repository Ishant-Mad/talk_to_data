from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Protocol

import requests
from dotenv import load_dotenv


def _resolve_env_var(name: str) -> Optional[str]:
    val = os.getenv(name)
    if not val:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        for path in [
            os.path.join(repo_root, ".env"),
            os.path.join(repo_root, "backend", ".env"),
            ".env",
        ]:
            if os.path.exists(path):
                load_dotenv(path, override=True)
                val = os.getenv(name)
                if val:
                    break
    return val


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
    _instances: Dict[str, "KeyRotator"] = {}

    def __new__(cls, keys_str: Optional[str]) -> "KeyRotator":
        keys_str = (keys_str or "").strip()
        if not keys_str:
            instance = super(KeyRotator, cls).__new__(cls)
            instance._init("")
            return instance
        if keys_str not in cls._instances:
            instance = super(KeyRotator, cls).__new__(cls)
            instance._init(keys_str)
            cls._instances[keys_str] = instance
        return cls._instances[keys_str]

    def _init(self, keys_str: str) -> None:
        raw_keys = keys_str.replace("\n", ",").replace("\r", "").split(",")
        self.keys = [k.strip().strip('"').strip("'") for k in raw_keys if k.strip().strip('"').strip("'")]
        self._index = 0

    def get_key(self) -> str:
        if not self.keys:
            return ""
        key = self.keys[self._index]
        self._index = (self._index + 1) % len(self.keys)
        return key


def _post_with_retry(
    url: str,
    payload: Dict[str, Any],
    rotator: KeyRotator,
    auth_error_message: str,
    timeout: int = 60,
) -> Dict[str, Any]:
    """POST to `url` with key rotation and exponential-ish back-off on 429.

    Raises an ``HTTPError`` (or ``RuntimeError`` for missing keys) after all
    retry attempts are exhausted, ensuring the caller always receives an
    exception rather than silently falling off the end of the loop.
    """
    if not rotator.keys:
        raise RuntimeError(auth_error_message)

    max_attempts = max(2, len(rotator.keys))
    last_response: Optional[requests.Response] = None

    for attempt in range(max_attempts):
        current_key = rotator.get_key()
        headers = {
            "Authorization": f"Bearer {current_key}",
            "Content-Type": "application/json",
        }
        response = requests.post(
            url,
            headers=headers,
            data=json.dumps(payload),
            timeout=timeout,
        )
        last_response = response

        if response.status_code == 429 and attempt < max_attempts - 1:
            retry_after = response.headers.get("Retry-After")
            sleep_time = min(float(retry_after) if retry_after else 1.0, 4.0)
            time.sleep(sleep_time)
            continue

        if response.status_code == 400:
            try:
                err_data = response.json()
                err_obj = err_data.get("error", {})
                failed_gen = err_obj.get("failed_generation")
                if failed_gen:
                    try:
                        parsed_gen = json.loads(failed_gen)
                        if isinstance(parsed_gen, dict) and "arguments" in parsed_gen:
                            args_val = parsed_gen["arguments"]
                            content = json.dumps(args_val) if isinstance(args_val, (dict, list)) else str(args_val)
                        else:
                            content = failed_gen
                    except Exception:
                        content = failed_gen
                    return {
                        "choices": [{
                            "message": {
                                "role": "assistant",
                                "content": content
                            },
                            "finish_reason": "stop"
                        }]
                    }
            except Exception:
                pass

        # On the final attempt, or on any non-retryable status, raise/return
        response.raise_for_status()
        return response.json()

    # This line is only reached if every attempt ended with a `continue` that
    # exhausted all retries — raise on the last response to surface the error.
    assert last_response is not None  # guaranteed since max_attempts >= 2
    last_response.raise_for_status()
    raise RuntimeError("Exhausted all retry attempts without a successful response")


class GroqClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        keys_str = api_key or _resolve_env_var("GROQ_API_KEYS") or _resolve_env_var("GROQ_API_KEY")
        self._rotator = KeyRotator(keys_str)
        self._base_url = (_resolve_env_var("GROQ_API_BASE") or "https://api.groq.com/openai/v1").strip().rstrip("/")
        self._model = (_resolve_env_var("GROQ_MODEL") or "openai/gpt-oss-120b").strip()

    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice

        return _post_with_retry(
            url=f"{self._base_url}/chat/completions",
            payload=payload,
            rotator=self._rotator,
            auth_error_message="GROQ_API_KEY is not configured.",
        )


class GithubClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        keys_str = api_key or os.getenv("GITHUB_TOKENS") or os.getenv("GITHUB_TOKEN")
        self._rotator = KeyRotator(keys_str)
        self._base_url = (os.getenv("GITHUB_API_BASE") or "https://models.inference.ai.azure.com").strip().rstrip("/")
        self._model = (os.getenv("GITHUB_MODEL") or "Ministral-3B").strip()

    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice

        return _post_with_retry(
            url=f"{self._base_url}/chat/completions",
            payload=payload,
            rotator=self._rotator,
            auth_error_message="GITHUB_TOKEN is not configured for GithubClient.",
        )


class OpenRouterClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        keys_str = api_key or os.getenv("OPENROUTER_API_KEYS") or os.getenv("OPENROUTER_API_KEY")
        self._rotator = KeyRotator(keys_str)
        self._base_url = (os.getenv("OPENROUTER_API_BASE") or "https://openrouter.ai/api/v1").strip().rstrip("/")
        self._model = (os.getenv("OPENROUTER_MODEL") or "meta-llama/llama-3.3-70b-instruct").strip()

    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice

        return _post_with_retry(
            url=f"{self._base_url}/chat/completions",
            payload=payload,
            rotator=self._rotator,
            auth_error_message="OPENROUTER_API_KEY is not configured for OpenRouterClient.",
        )


def get_llm_client() -> LLMClient:
    provider = (_resolve_env_var("LLM_PROVIDER") or "groq").strip().lower()
    if provider == "github":
        return GithubClient()
    elif provider == "openrouter":
        return OpenRouterClient()
    return GroqClient()
