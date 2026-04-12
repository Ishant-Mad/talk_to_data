from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from app.adapters.base import DataAdapter
from app.contracts import ChatResponse
from app.llm.llm_client import get_llm_client
from app.utils.logger import get_logger

def _tool_schema() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "execute_sql",
                "description": "Execute a DuckDB SQL query. Use the exact tables and columns provided in the schema context.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The DuckDB SQL query."}
                    },
                    "required": ["query"],
                },
            },
        },
    ]

def _system_prompt() -> str:
    return (
        "You are a data analyst agent. Use the execute_sql tool to compute numbers using DuckDB SQL. "
        "Never fabricate values. Return only valid JSON with exact keys: summary, data_source, chart, confidence. Do not include any extra properties. "
        "For 'data_source', use EXACTLY the table name you queried (e.g. 'transactions', 'customers'). "
        "Confidence MUST be one of 'high', 'medium', or 'low'. "
        "chart MUST include exactly these keys: type (line|bar|table), data (array of objects), and ideally xKey and yKey representing the dimensions or measures used. "
        "series is an optional array of objects with keys {key, label, color} only. Do not include extra fields. "
        "Use only tables and columns present in the schema context."
    )

def _schema_context(schema: Dict[str, Any]) -> str:
    tables = schema.get("tables", {}) if isinstance(schema, dict) else {}
    parts: List[str] = []
    for table_name, table in tables.items():
        measures = ", ".join(table.get("measures", [])) or "none"
        dimensions = ", ".join(table.get("dimensions", [])) or "none"
        time_column = table.get("inferred_time_column") or "none"
        columns = ", ".join(table.get("columns", {}).keys()) or "none"
        parts.append(
            f"- VIEW {table_name}: columns=[{columns}] measures=[{measures}] dimensions=[{dimensions}] time_column={time_column}"
        )
    return "Available schema for DuckDB execution:\n" + "\n".join(parts)

def _parse_response(content: str) -> Optional[Dict[str, Any]]:
    match = re.search(r"(\{.*\})", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None

def run_agent(adapter: DataAdapter, question: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    logger = get_logger("talk_to_data.agent")
    client = get_llm_client()
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": _system_prompt()},
        {"role": "system", "content": _schema_context(schema)},
        {"role": "user", "content": question},
    ]

    response = client.chat(messages=messages, tools=_tool_schema(), tool_choice="auto")
    assistant_message = response["choices"][0]["message"]
    tool_calls = assistant_message.get("tool_calls", [])
    logger.info("question_received characters=%s tool_calls=%s", len(question), len(tool_calls))

    assistant_content = assistant_message.get("content")
    messages.append({
        "role": "assistant",
        "content": assistant_content if isinstance(assistant_content, str) else "",
        "tool_calls": tool_calls,
    })

    if not tool_calls:
        direct = _parse_response(assistant_content if isinstance(assistant_content, str) else "")
        if direct:
            try:
                response_model = ChatResponse.model_validate(direct)
            except Exception as e:
                logger.error(f"agent_response_invalid_schema: {str(e)}")
                logger.warning("agent_direct_response_invalid_schema")
            else:
                logger.info("agent_direct_response_valid confidence=%s", response_model.confidence)
                return response_model.model_dump()

    for tool_call in tool_calls:
        name = tool_call["function"]["name"]
        try:
            args = json.loads(tool_call["function"].get("arguments", "{}"))
            if name == "execute_sql":
                query = args.get("query", "")
                if hasattr(adapter, "execute_sql"):
                    result = {"rows": adapter.execute_sql(query)}
                else:
                    raise ValueError("Adapter does not support execute_sql")
            else:
                raise ValueError(f"Unknown tool: {name}")
            logger.info("tool_call name=%s", name)
        except Exception as exc:
            logger.exception("tool_call_failed name=%s", name)
            result = {"error": str(exc), "tool": name}
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call["id"],
            "content": json.dumps(result),
        })

    for _ in range(2):
        final = client.chat(messages=messages)
        raw_final_content = final["choices"][0]["message"].get("content")
        content = (raw_final_content or "{}").strip()
        parsed = _parse_response(content)
        if parsed:
            try:
                response_model = ChatResponse.model_validate(parsed)
                return response_model.model_dump()
            except Exception as e:
                logger.error(f"agent_response_invalid_schema: {str(e)}")
                logger.warning("agent_response_invalid_schema")
                messages.append({
                    "role": "user",
                    "content": f"Your JSON response failed schema validation: {str(e)}. Please correct it and strictly follow the JSON keys and types."
                })
    return {"summary": "Unable to process the query.", "data_source": "", "chart": {"type": "table", "data": []}, "confidence": "low"}
