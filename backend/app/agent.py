from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.adapters.base import DataAdapter
from app.llm.groq_client import GroqClient
from app.tools import aggregate, compare, filter_data, find_drivers
from app.utils.logger import get_logger


def _tool_schema() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "get_schema",
                "description": "Return dataset schema profile with tables, columns, and inferred roles.",
                "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "filter_data",
                "description": "Filter rows by column values and optional date range.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "table": {"type": "string"},
                        "filters": {"type": "object"},
                        "date_range": {
                            "type": "object",
                            "properties": {
                                "start": {"type": "string"},
                                "end": {"type": "string"},
                            },
                        },
                    },
                    "required": ["table", "filters"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "aggregate",
                "description": "Aggregate a metric using sum, avg, or count, optionally grouped by a dimension.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "table": {"type": "string"},
                        "metric": {"type": "string"},
                        "group_by": {"type": ["string", "null"]},
                        "operation": {"type": "string", "enum": ["sum", "avg", "mean", "count"]},
                        "date_range": {
                            "type": "object",
                            "properties": {
                                "start": {"type": "string"},
                                "end": {"type": "string"},
                            },
                        },
                    },
                    "required": ["table", "metric", "operation"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "compare",
                "description": "Compare a metric across two periods.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "table": {"type": "string"},
                        "metric": {"type": "string"},
                        "operation": {"type": "string", "enum": ["sum", "avg", "mean", "count"]},
                        "period_a": {
                            "type": "object",
                            "properties": {
                                "start": {"type": "string"},
                                "end": {"type": "string"},
                            },
                        },
                        "period_b": {
                            "type": "object",
                            "properties": {
                                "start": {"type": "string"},
                                "end": {"type": "string"},
                            },
                        },
                    },
                    "required": ["table", "metric", "operation", "period_a", "period_b"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "find_drivers",
                "description": "Find top contributing categories for a metric in a date range.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "table": {"type": "string"},
                        "metric": {"type": "string"},
                        "operation": {"type": "string", "enum": ["sum", "avg", "mean", "count"]},
                        "date_range": {
                            "type": "object",
                            "properties": {
                                "start": {"type": "string"},
                                "end": {"type": "string"},
                            },
                        },
                        "limit": {"type": "integer"},
                    },
                    "required": ["table", "metric", "operation"],
                },
            },
        },
    ]


def _system_prompt() -> str:
    return (
        "You are a data analyst agent. Use the tools to compute numbers. "
        "Never fabricate values. Return only valid JSON with keys: summary, data_source, chart, confidence. "
        "chart must include: type (line|bar|table), data (array of objects), and either xKey/yKey or series. "
        "series is an array of {key, label, color}."
    )


def _call_tool(
    adapter: DataAdapter,
    schema: Dict[str, Any],
    name: str,
    args: Dict[str, Any],
) -> Any:
    if name == "get_schema":
        return schema
    if name == "filter_data":
        return {"rows": filter_data(adapter, **args)}
    if name == "aggregate":
        return {"rows": aggregate(adapter, **args)}
    if name == "compare":
        return compare(adapter, **args)
    if name == "find_drivers":
        return find_drivers(adapter, schema=schema, **args)
    raise ValueError(f"Unknown tool: {name}")


def run_agent(adapter: DataAdapter, question: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    logger = get_logger("talk_to_data.agent")
    client = GroqClient()
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": _system_prompt()},
        {"role": "user", "content": question},
    ]

    response = client.chat(messages=messages, tools=_tool_schema(), tool_choice="auto")
    tool_calls = response["choices"][0]["message"].get("tool_calls", [])
    logger.info("question_received characters=%s tool_calls=%s", len(question), len(tool_calls))

    for tool_call in tool_calls:
        name = tool_call["function"]["name"]
        args = json.loads(tool_call["function"].get("arguments", "{}"))
        result = _call_tool(adapter, schema, name, args)
        logger.info("tool_call name=%s", name)
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call["id"],
            "content": json.dumps(result),
        })

    for _ in range(2):
        final = client.chat(messages=messages)
        content = final["choices"][0]["message"].get("content", "{}").strip()
        parsed = _parse_response(content)
        if parsed:
            logger.info("agent_response_valid confidence=%s", parsed.get("confidence"))
            return parsed
        messages.append({
            "role": "assistant",
            "content": "Return only valid JSON with summary, data_source, chart, confidence.",
        })
        logger.warning("agent_response_invalid attempt_retry")

    return {
        "summary": "The agent response was invalid.",
        "data_source": "",
        "chart": {"type": "table", "data": []},
        "confidence": "low",
    }


def _parse_response(content: str) -> Optional[Dict[str, Any]]:
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        return None

    if not isinstance(payload, dict):
        return None

    if "summary" not in payload or "chart" not in payload or "confidence" not in payload:
        return None

    chart = payload.get("chart", {})
    if not isinstance(chart, dict) or "type" not in chart or "data" not in chart:
        return None

    if not isinstance(chart.get("data"), list):
        return None

    return payload
