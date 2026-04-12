from __future__ import annotations

import json
import re
import time
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
        "You are an advanced data analyst agent capable of multi-step reasoning. Use the execute_sql tool to compute numbers using DuckDB SQL. "
        "Never fabricate values. Use only tables and columns present in the schema context.\n"
        "When asked 'Why did X happen?' or any complex reasoning request, investigate iteratively. First query the baselines, then query the underlying dimensions (e.g., regions, channels, segments) to find drivers. Make multiple SQL queries if needed. DO NOT output the final JSON until you have fully investigated the drivers.\n"
        "COMMUNICATION RULES:\n"
        "1. Write your 'summary' and 'insight' fields using concise bullet points and tables instead of long text paragraphs.\n"
        "2. Ensure the 'chart' provided perfectly matches the insight. For example, if the answer points to reduced ad spend, the attached chart MUST visualize exactly the ad spend data. Do not include vague or unrelated charts.\n"
        "3. When visualizing a comparison or a specific answer (e.g. who got the most returns), include ALL categories in the chart data, do not filter down to just the answer class. Instead, add a boolean property `highlight: true` to the specific row in the `chart.data` array corresponding to the answer.\n"
        "If you need more information, call the execute_sql tool. When you have enough information to answer the user's question, return ONLY a valid JSON object matching this exact schema:\n"
        "- 'summary': A high-level text summary of the overall answer (prefer bullet points).\n"
        "- 'data_source': EXACTLY the main table name you queried (e.g. 'transactions', 'customers').\n"
        "- 'confidence': 'high', 'medium', or 'low'.\n"
        "- 'chart': A single primary chart including type (line|bar|table), data (array of objects), xKey, yKey, and optional series {key, label, color}.\n"
        "- 'reasoning_steps': Array of strings explaining the steps you took to investigate.\n"
        "- 'analyses': Array of specific insights. Each item must have 'type', 'insight' (prefer bullet points), and optionally a 'chart' (same format as primary chart).\n"
        "The 'type' for each analysis MUST be exactly one of the following categories if applicable: 'Understand what changed', 'Compare (time, region, product, segment)', 'Breakdown (decomposition)', 'Summarize (daily/weekly/monthly insights)'.\n"
        "Do not include any extra properties in the JSON."
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

    logger.info("question_received characters=%s", len(question))

    max_iterations = 5
    
    for iteration in range(max_iterations):
        if iteration > 0:
            time.sleep(1.0)
            
        response = client.chat(messages=messages, tools=_tool_schema(), tool_choice="auto")
        assistant_message = response["choices"][0]["message"]
        tool_calls = assistant_message.get("tool_calls", [])

        assistant_content = assistant_message.get("content")
        
        # OpenRouter / OpenAI requires content to be present as string or explicitly excluded/null based on sdk, 
        # but string is safest for messages array
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
                    logger.info("agent_direct_response_valid confidence=%s steps=%s", response_model.confidence, len(response_model.analyses or []))
                    return response_model.model_dump()
                except Exception as e:
                    logger.error(f"agent_response_invalid_schema: {str(e)}")
                    messages.append({
                        "role": "user",
                        "content": f"Your JSON response failed schema validation: {str(e)}. Please correct it and strictly follow the exact JSON keys and types required."
                    })
                    continue
            else:
                # Provide a generic response if unable to parse at all
                messages.append({
                    "role": "user",
                    "content": "Please provide your final answer in the exact JSON format requested."
                })
                continue

        logger.info("iteration=%d tool_calls=%s", iteration + 1, len(tool_calls))
        
        for tool_call in tool_calls:
            name = tool_call["function"]["name"]
            try:
                args = json.loads(tool_call["function"].get("arguments", "{}"))
                if name == "execute_sql":
                    query = args.get("query", "")
                    if hasattr(adapter, "execute_sql"):
                        # Truncate large results if necessary or let LLM evaluate. We'll return full list up to LLM context
                        result = {"rows": adapter.execute_sql(query)}
                    else:
                        raise ValueError("Adapter does not support execute_sql")
                else:
                    raise ValueError(f"Unknown tool: {name}")
                logger.info("tool_call name=%s query=%s", name, query)
            except Exception as exc:
                logger.exception("tool_call_failed name=%s", name)
                result = {"error": str(exc), "tool": name}
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call["id"],
                "content": json.dumps(result),
            })

    logger.warning("run_agent loop_exceeded max_iterations=%d", max_iterations)
    return {"summary": "Unable to fully process the query after multiple internal steps. Please refine your question.", "data_source": "", "chart": {"type": "table", "data": []}, "confidence": "low"}
