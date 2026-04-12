from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Protocol

import requests


class LLMClient(Protocol):
    def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        ...


class GroqClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self._api_key = api_key or os.getenv("GROQ_API_KEY")
        self._base_url = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")
        self._model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def _headers(self) -> Dict[str, str]:
        if not self._api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

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

        for attempt in range(2):
            response = requests.post(
                f"{self._base_url}/chat/completions",
                headers=self._headers(),
                data=json.dumps(payload),
                timeout=30,
            )
            if response.status_code == 429 and attempt < 1:
                retry_after = response.headers.get("Retry-After")
                sleep_time = min(float(retry_after) if retry_after else 1.0, 2.0)
                time.sleep(sleep_time)
                continue
            
            response.raise_for_status()
            return response.json()

class GithubClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self._api_key = api_key or os.getenv("GITHUB_TOKEN")
        self._base_url = os.getenv("GITHUB_API_BASE", "https://models.inference.ai.azure.com")
        self._model = os.getenv("GITHUB_MODEL", "Ministral-3B")

    def _headers(self) -> Dict[str, str]:
        if not self._api_key:
            raise RuntimeError("GITHUB_TOKEN is not configured for GithubClient.")
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

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

        for attempt in range(2):
            response = requests.post(
                f"{self._base_url}/chat/completions",
                headers=self._headers(),
                data=json.dumps(payload),
                timeout=30,
            )
            if response.status_code == 429 and attempt < 1:
                retry_after = response.headers.get("Retry-After")
                sleep_time = min(float(retry_after) if retry_after else 1.0, 2.0)
                time.sleep(sleep_time)
                continue
            
            response.raise_for_status()
            return response.json()

class OpenRouterClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self._api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self._base_url = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        self._model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")

    def _headers(self) -> Dict[str, str]:
        if not self._api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured for OpenRouterClient.")
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

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

        for attempt in range(2):
            response = requests.post(
                f"{self._base_url}/chat/completions",
                headers=self._headers(),
                data=json.dumps(payload),
                timeout=30,
            )
            if response.status_code == 429 and attempt < 1:
                retry_after = response.headers.get("Retry-After")
                sleep_time = min(float(retry_after) if retry_after else 1.0, 2.0)
                time.sleep(sleep_time)
                continue
            
            response.raise_for_status()
            return response.json()


def get_llm_client() -> LLMClient:
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider == "github":
        return GithubClient()
    elif provider == "openrouter":
        return OpenRouterClient()
    return GroqClient()

