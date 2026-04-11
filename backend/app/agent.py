from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from app.adapters.base import DataAdapter
from app.contracts import AggregateArgs, ChatResponse, CompareArgs, FilterArgs, FindDriversArgs
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
        "series is an array of {key, label, color}. "
        "Use only tables and columns present in the schema context."
    )


def _schema_context(schema: Dict[str, Any]) -> str:
    tables = schema.get("tables", {}) if isinstance(schema, dict) else {}
    parts: List[str] = []
    for table_name, table in tables.items():
        measures = ", ".join(table.get("measures", [])) or "none"
        dimensions = ", ".join(table.get("dimensions", [])) or "none"
        time_column = table.get("inferred_time_column") or "none"
        parts.append(
            f"- {table_name}: measures=[{measures}] dimensions=[{dimensions}] time_column={time_column}"
        )
    return "Available schema:\n" + "\n".join(parts)


def _get_table_profile(schema: Dict[str, Any], table: str) -> Dict[str, Any]:
    tables = schema.get("tables", {}) if isinstance(schema, dict) else {}
    return tables.get(table, {})


def _require_table(schema: Dict[str, Any], table: str) -> Dict[str, Any]:
    table_profile = _get_table_profile(schema, table)
    if not table_profile:
        available = ", ".join(sorted((schema.get("tables", {}) or {}).keys()))
        raise ValueError(f"Unknown table '{table}'. Available tables: {available}")
    return table_profile


def _require_metric(table: str, metric: str, table_profile: Dict[str, Any]) -> None:
    columns = table_profile.get("columns", {}) or {}
    if metric not in columns:
        available = ", ".join(sorted(columns.keys()))
        raise ValueError(
            f"Unknown metric/column '{metric}' for table '{table}'. Available columns: {available}"
        )


def _require_group_by(table: str, group_by: Optional[str], table_profile: Dict[str, Any]) -> None:
    if not group_by:
        return
    columns = table_profile.get("columns", {}) or {}
    if group_by not in columns:
        available = ", ".join(sorted(columns.keys()))
        raise ValueError(
            f"Unknown group_by column '{group_by}' for table '{table}'. Available columns: {available}"
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
        parsed = FilterArgs.model_validate(args)
        table_profile = _require_table(schema, parsed.table)
        filter_columns = list(parsed.filters.keys())
        available_columns = table_profile.get("columns", {}) or {}
        missing_filters = [column for column in filter_columns if column not in available_columns]
        if missing_filters:
            available = ", ".join(sorted(available_columns.keys()))
            raise ValueError(
                f"Unknown filter column(s) for table '{parsed.table}': {', '.join(missing_filters)}. "
                f"Available columns: {available}"
            )
        return {
            "rows": filter_data(
                adapter,
                table=parsed.table,
                filters=parsed.filters,
                date_range=parsed.date_range.model_dump() if parsed.date_range else None,
            )
        }
    if name == "aggregate":
        parsed = AggregateArgs.model_validate(args)
        table_profile = _require_table(schema, parsed.table)
        _require_metric(parsed.table, parsed.metric, table_profile)
        _require_group_by(parsed.table, parsed.group_by, table_profile)
        return {
            "rows": aggregate(
                adapter,
                table=parsed.table,
                metric=parsed.metric,
                group_by=parsed.group_by,
                operation=parsed.operation,
                date_range=parsed.date_range.model_dump() if parsed.date_range else None,
            )
        }
    if name == "compare":
        parsed = CompareArgs.model_validate(args)
        table_profile = _require_table(schema, parsed.table)
        _require_metric(parsed.table, parsed.metric, table_profile)
        return compare(
            adapter,
            table=parsed.table,
            metric=parsed.metric,
            operation=parsed.operation,
            period_a=parsed.period_a.model_dump(),
            period_b=parsed.period_b.model_dump(),
        )
    if name == "find_drivers":
        parsed = FindDriversArgs.model_validate(args)
        table_profile = _require_table(schema, parsed.table)
        _require_metric(parsed.table, parsed.metric, table_profile)
        return find_drivers(
            adapter,
            table=parsed.table,
            metric=parsed.metric,
            operation=parsed.operation,
            date_range=parsed.date_range.model_dump() if parsed.date_range else None,
            schema=schema,
            limit=parsed.limit,
        )
    raise ValueError(f"Unknown tool: {name}")


def run_agent(adapter: DataAdapter, question: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    logger = get_logger("talk_to_data.agent")
    client = GroqClient()
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
            except Exception:
                logger.warning("agent_direct_response_invalid_schema")
            else:
                logger.info("agent_direct_response_valid confidence=%s", response_model.confidence)
                return response_model.model_dump()

    for tool_call in tool_calls:
        name = tool_call["function"]["name"]
        try:
            args = json.loads(tool_call["function"].get("arguments", "{}"))
            result = _call_tool(adapter, schema, name, args)
            logger.info("tool_call name=%s", name)
        except Exception as exc:  # noqa: BLE001
            logger.exception("tool_call_failed name=%s", name)
            result = {"error": str(exc), "tool": name}
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
            try:
                response_model = ChatResponse.model_validate(parsed)
            except Exception:
                logger.warning("agent_response_invalid_schema")
            else:
                logger.info("agent_response_valid confidence=%s", response_model.confidence)
                return response_model.model_dump()
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
    if not content:
        return None

    candidates = [content]
    candidates.extend(re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content))
    extracted = _extract_first_json_object(content)
    if extracted:
        candidates.append(extracted)

    payload: Optional[Dict[str, Any]] = None
    for candidate in candidates:
        try:
            maybe_payload = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(maybe_payload, dict):
            payload = maybe_payload
            break

    if payload is None:
        return None

    return _normalize_payload(payload)


def _extract_first_json_object(content: str) -> Optional[str]:
    start = content.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(content)):
        char = content[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return content[start : index + 1]

    return None


def _normalize_payload(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    summary = payload.get("summary")
    chart = payload.get("chart")
    confidence = str(payload.get("confidence", "medium")).strip().lower()

    if not isinstance(summary, str):
        return None
    if not isinstance(chart, dict):
        return None

    chart_type = str(chart.get("type", "table")).strip().lower()
    if chart_type not in {"line", "bar", "table"}:
        chart_type = "table"

    data = chart.get("data")
    if not isinstance(data, list):
        data = []

    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"

    normalized_chart: Dict[str, Any] = {
        "type": chart_type,
        "data": data,
    }

    if isinstance(chart.get("xKey"), str):
        normalized_chart["xKey"] = chart["xKey"]
    if isinstance(chart.get("yKey"), str):
        normalized_chart["yKey"] = chart["yKey"]
    if isinstance(chart.get("series"), list):
        normalized_chart["series"] = [item for item in chart["series"] if isinstance(item, dict)]

    return {
        "summary": summary,
        "data_source": str(payload.get("data_source", "")),
        "chart": normalized_chart,
        "confidence": confidence,
    }
