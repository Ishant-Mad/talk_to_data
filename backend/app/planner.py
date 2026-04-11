from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from app.contracts import ChartPlanItem, ChartPlanResponse, ChartQuery, ChartSpec
from app.llm.groq_client import GroqClient


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


def propose_chart_plan(schema: Dict[str, Any]) -> ChartPlanResponse:
    client = GroqClient()
    system_prompt = (
        "You are a data visualization planner. Use only schema fields provided. "
        "Return JSON with key charts: an array of chart specs and queries. "
        "Each chart has: title, description, chart{type,xKey,yKey,series,data}, query{table,metric,operation,group_by,date_range,limit}. "
        "Set chart.data to an empty array. Use dynamic chart count (2-6)."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": _schema_context(schema)},
        {
            "role": "user",
            "content": (
                "Plan dashboard charts that highlight major trends or anomalies. "
                "Prefer line charts for time columns and bar charts for category breakdowns."
            ),
        },
    ]

    response = client.chat(messages=messages, temperature=0.2)
    content = response["choices"][0]["message"].get("content", "{}").strip()

    parsed = _try_parse_json(content)
    if parsed is not None:
        try:
            return ChartPlanResponse.model_validate(parsed)
        except Exception:
            pass

    return _fallback_plan(schema)


def _try_parse_json(content: str) -> Dict[str, Any] | None:
    if not content:
        return None

    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", content)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None
    return None


def _fallback_plan(schema: Dict[str, Any]) -> ChartPlanResponse:
    tables = schema.get("tables", {}) if isinstance(schema, dict) else {}
    charts: List[ChartPlanItem] = []

    for table_name, table in tables.items():
        measures: List[str] = table.get("measures", []) or []
        dimensions: List[str] = table.get("dimensions", []) or []
        time_col = table.get("inferred_time_column")

        if not measures:
            continue

        metric = measures[0]
        if time_col:
            charts.append(
                ChartPlanItem(
                    title=f"{table_name} trend",
                    description=f"{metric} over {time_col}",
                    chart=ChartSpec(type="line", data=[], xKey=time_col, yKey="value", series=[]),
                    query=ChartQuery(
                        table=table_name,
                        metric=metric,
                        operation="sum",
                        group_by=time_col,
                        limit=24,
                    ),
                )
            )
        elif dimensions:
            charts.append(
                ChartPlanItem(
                    title=f"{table_name} by {dimensions[0]}",
                    description=f"{metric} breakdown",
                    chart=ChartSpec(type="bar", data=[], xKey=dimensions[0], yKey="value", series=[]),
                    query=ChartQuery(
                        table=table_name,
                        metric=metric,
                        operation="sum",
                        group_by=dimensions[0],
                        limit=20,
                    ),
                )
            )

        if len(charts) >= 4:
            break

    return ChartPlanResponse(charts=charts)
