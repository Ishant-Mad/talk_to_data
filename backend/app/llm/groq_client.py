from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests


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

        response = requests.post(
            f"{self._base_url}/chat/completions",
            headers=self._headers(),
            data=json.dumps(payload),
            timeout=60,
        )
        response.raise_for_status()
        return response.json()
