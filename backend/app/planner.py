from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from app.contracts import ChartPlanItem, ChartPlanResponse, ChartQuery, ChartSpec
from app.llm.llm_client import get_llm_client


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
    client = get_llm_client()
    system_prompt = (
        "You are an expert data visualization planner. Use only the schema fields provided. "
        "Return JSON with key `charts` containing an array of chart specifications. "
        "Each chart must have: `title`, `description`, `chart` {type, xKey, yKey, series, data: []}, `query` {table, metric, operation, group_by, limit}, "
        "and `valid_combinations`: array of {x, y, operation}. "
        "CRITICAL LOGIC RULE: Ensure `valid_combinations` are USEFUL business relationships. "
        "NEVER use ID columns (like customer_id, transaction_id, complaint_id) as an X-axis or Y-axis. "
        "Time columns (date) vs Financials/Counts (amount, volume) -> operation: sum. "
        "Categories (region, segment, status, channel, category) vs Counts/Amounts -> operation: sum. "
        "Time-based or score metrics (resolution_time, satisfaction_score) -> operation: avg. "
        "Y-axis MUST be a true numerical measure. Provide 3-5 HIGHLY INSIGHTFUL business alternatives per chart."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": _schema_context(schema)},
        {
            "role": "user",
            "content": (
                "Plan dashboard charts that highlight major trends or anomalies. "
                "CRITICAL: You MUST return EXACTLY ONE chart for EVERY table in the schema. Do not skip any tables. "
                "Intelligently decide the best chart 'type' based on the variables mapping. "
                "Use 'line' for tracking changes over continuous time (dates/timelines), "
                "'bar' for comparing counts across distinct categories (regions, channels), "
                "and 'pie' for displaying proportional/percentage breakdowns or shares of a whole (composition)."
            ),
        },
    ]

    responses = []
    try:
        response = client.chat(messages=messages, temperature=0.2)
        content = response["choices"][0]["message"].get("content", "{}").strip()
        print("LLM RESPONSE:", content)
        parsed = _try_parse_json(content)
        
        fallback_plan = _fallback_plan(schema)
        
        if parsed is not None:
            try:
                llm_response = ChartPlanResponse.model_validate(parsed)
                # LLMs frequently truncate lists or skip tables to save tokens.
                # Let's ensure every table in the fallback plan exists in the LLM plan.
                covered_tables = {c.query.table for c in llm_response.charts}
                for fb_chart in fallback_plan.charts:
                    if fb_chart.query.table not in covered_tables:
                        llm_response.charts.append(fb_chart)
                
                # Check valid_combinations. Some LLMs forget them. Default to fallback combos if so.
                for c in llm_response.charts:
                    if not getattr(c, "valid_combinations", []):
                        for fb_c in fallback_plan.charts:
                            if fb_c.query.table == c.query.table:
                                c.valid_combinations = fb_c.valid_combinations
                                break
                return llm_response
            except Exception as e:
                print(f"Validation error: {e}")
                pass
    except Exception as e:
        print(f"LLM Error: {e}")
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

        # Filter out high-cardinality IDs from dimensions
        clean_dims = [d for d in dimensions if not d.endswith("_id") and d != "id"]
        
        # If we have no dimensions and no inferred time column, but we do have enough measures
        # (e.g., a file with 'month' and 'amount' both inferred as numbers) we treat the first non-ID measure as X.
        if not clean_dims and not time_col and len(measures) >= 2:
            potential_x = [m for m in measures if not m.endswith("_id") and m != "id"]
            if len(potential_x) >= 2:
                time_col = potential_x[0]
                measures = potential_x[1:]

        valid_combos_set = set()
        valid_combos = []
        
        def add_combo(combo):
            key = (combo["x"], combo["y"], combo["operation"])
            if key not in valid_combos_set:
                valid_combos_set.add(key)
                valid_combos.append(combo)

        for x_val in ([time_col] if time_col else []) + clean_dims:
            for m in measures:
                # Skip IDs pretending to be measures
                if m.endswith("_id") or m == "id":
                    continue
                # Do not map date vs parts of date
                if x_val in ["date", "timestamp", "datetime"] and m in ["week_of_year", "month", "quarter", "year", "day_of_week"]:
                    continue
                if m in ["week_of_year", "month", "quarter", "year", "day_of_week", x_val]:
                    continue
                
                # Heuristically decide the best operation
                op = "avg" if any(kw in m.lower() for kw in ["time", "score", "age", "rate", "percentage"]) else "sum"
                add_combo({"x": x_val, "y": m, "operation": op})

        # Allow simple "count" operations over dimensions representing volume analysis
        id_cols = [d for d in dimensions if d.endswith("_id") or d == "id"]
        count_col = id_cols[0] if id_cols else "*"
        for x_val in clean_dims:
            add_combo({"x": x_val, "y": count_col, "operation": "count"})
        
        if time_col:
            add_combo({"x": time_col, "y": count_col, "operation": "count"})

        if not valid_combos:
            continue

        # Find the most sensible default combination
        best_combo = valid_combos[0]
        for c in valid_combos:
            if c["x"] == time_col and c["y"] in ["amount", "revenue", "volume", "sales"] and c["operation"] == "sum":
                best_combo = c
                break
            elif c["y"] in ["amount", "revenue", "volume", "sales"] and c["operation"] == "sum" and c["x"] in ["category", "segment", "region", "channel", "status"]:
                best_combo = c
                break
            elif c["operation"] == "count" and c["x"] == time_col:
                best_combo = c

        metric = best_combo["y"]
        op_str = best_combo["operation"]
        x_col = best_combo["x"]
        is_time = x_col == time_col
        # For small categories, maybe a pie chart, but default to bar for fallback safety
        auto_type = "line" if is_time else "bar"
        
        # Determine a friendly metric label
        metric_label = metric.replace("_", " ") if metric and metric != "*" else "records"

        charts.append(
            ChartPlanItem(
                title=f"{table_name.replace('_', ' ').title()} By {x_col.replace('_', ' ').title()}",
                description=f"Showing {op_str.lower()} of {metric_label}",
                chart=ChartSpec(type=auto_type, data=[], xKey=x_col, yKey="value", series=[]),
                query=ChartQuery(
                    table=table_name,
                    metric=metric,
                    operation=op_str,
                    group_by=x_col,
                    limit=24 if is_time else 15,
                ),
                valid_combinations=valid_combos
            )
        )

    return ChartPlanResponse(charts=charts)
