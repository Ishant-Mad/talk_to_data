from __future__ import annotations

import re
from typing import Dict, List, Optional

from app.adapters.base import DataAdapter
from app.utils.logger import get_logger

_SAFE_IDENT = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')

LIMIT_FILTER = 500
LIMIT_AGGREGATE = 200


def _sanitize_identifier(name: str) -> str:
    """Raise ValueError if `name` is not a safe SQL identifier."""
    if not name or not _SAFE_IDENT.match(name):
        raise ValueError(
            f"Unsafe SQL identifier: {name!r}. "
            "Only alphanumerics and underscores are allowed."
        )
    return name


def filter_data(
    adapter: DataAdapter,
    table: str,
    filters: Dict[str, object],
    date_range: Optional[Dict[str, str]] = None,
) -> List[Dict[str, object]]:
    logger = get_logger("talk_to_data.tools")

    # Validate table name
    _sanitize_identifier(table)

    where_clauses = []
    params: List[object] = []

    if filters:
        for k, v in filters.items():
            _sanitize_identifier(k)  # column name must be safe
            where_clauses.append(f"{k} = ?")
            params.append(v)

    if date_range:
        col = date_range.get("column", "date")
        _sanitize_identifier(col)
        start = date_range.get("start")
        end = date_range.get("end")
        if start:
            where_clauses.append(f"{col} >= ?")
            params.append(start)
        if end:
            where_clauses.append(f"{col} <= ?")
            params.append(end)

    where_sql = " AND ".join(where_clauses)
    query = f"SELECT * FROM {table}"
    if where_sql:
        query += f" WHERE {where_sql}"

    if not hasattr(adapter, "execute_sql"):
        return []

    try:
        rows = adapter.execute_sql(query)
    except Exception as exc:
        logger.error("filter_data_failed table=%s error=%s", table, exc)
        return []

    truncated = len(rows) > LIMIT_FILTER
    result = rows[:LIMIT_FILTER]
    logger.info("filter_data rows=%s truncated=%s", len(result), truncated)
    if truncated:
        # Append a meta row so the LLM knows the result was cut off
        result.append({"_truncated": True, "_total_rows_available": len(rows)})
    return result


def aggregate(
    adapter: DataAdapter,
    table: str,
    metric: str,
    group_by: Optional[object],
    operation: str,
    date_range: Optional[Dict[str, str]] = None,
) -> List[Dict[str, object]]:
    logger = get_logger("talk_to_data.tools")

    _sanitize_identifier(table)

    op_map = {"sum": "SUM", "avg": "AVG", "mean": "AVG", "count": "COUNT"}
    op = op_map.get((operation or "sum").lower(), "SUM")

    select_parts = []

    # Normalize group_by
    group_by_cols: List[str] = []
    if group_by:
        if isinstance(group_by, list):
            group_by_cols = [str(g) for g in group_by]
        elif isinstance(group_by, str):
            group_by_cols = [group_by]

    for g in group_by_cols:
        _sanitize_identifier(g)
        select_parts.append(g)

    if metric and metric != "*":
        _sanitize_identifier(metric)
        select_parts.append(f"{op}({metric}) AS value")
    else:
        select_parts.append("COUNT(*) AS value")

    query = f"SELECT {', '.join(select_parts)} FROM {table}"

    where_clauses: List[str] = []
    if date_range and isinstance(date_range, dict):
        col = date_range.get("column", "date")
        _sanitize_identifier(col)
        start = date_range.get("start")
        end = date_range.get("end")
        if start:
            where_clauses.append(f"{col} >= '{start}'")
        if end:
            where_clauses.append(f"{col} <= '{end}'")

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    if group_by_cols:
        group_by_sql = ", ".join(group_by_cols)
        query += f" GROUP BY {group_by_sql}"
        first_group = group_by_cols[0].lower()
        if first_group in ("date", "month", "year", "week_of_year", "timestamp", "created_at") or "date" in first_group:
            query += f" ORDER BY {group_by_sql} ASC"
        else:
            query += " ORDER BY value DESC"

    if not hasattr(adapter, "execute_sql"):
        return []

    try:
        rows = adapter.execute_sql(query)
    except Exception as exc:
        logger.error("aggregate_failed table=%s error=%s", table, exc)
        return []

    truncated = len(rows) > LIMIT_AGGREGATE
    result = rows[:LIMIT_AGGREGATE]
    logger.info("aggregate rows=%s truncated=%s", len(result), truncated)
    if truncated:
        result.append({"_truncated": True, "_total_rows_available": len(rows)})
    return result


def compare(
    adapter: DataAdapter,
    table: str,
    metric: str,
    operation: str,
    period_a: Dict[str, str],
    period_b: Dict[str, str],
) -> Dict[str, object]:
    a = aggregate(adapter, table, metric, None, operation, period_a)
    b = aggregate(adapter, table, metric, None, operation, period_b)

    # Filter out any truncation sentinel rows before reading values
    a_rows = [r for r in a if "_truncated" not in r]
    b_rows = [r for r in b if "_truncated" not in r]

    value_a = a_rows[0].get("value") if a_rows else None
    value_b = b_rows[0].get("value") if b_rows else None

    result: Dict[str, object] = {
        "period_a": period_a,
        "period_b": period_b,
        "value_a": value_a,
        "value_b": value_b,
    }

    # Compute change safely to spare the LLM division-by-zero issues
    if value_a is not None and value_b is not None:
        try:
            a_float = float(value_a)
            b_float = float(value_b)
            if a_float != 0:
                result["change_pct"] = round((b_float - a_float) / abs(a_float) * 100, 2)
            else:
                result["change_pct"] = None
            result["change_abs"] = round(b_float - a_float, 4)
        except (TypeError, ValueError):
            pass

    return result


def find_drivers(
    adapter: DataAdapter,
    table: str,
    metric: str,
    operation: str,
    date_range: Optional[Dict[str, str]],
    schema: Dict[str, object],
    limit: int = 5,
) -> Dict[str, object]:
    table_profile = schema.get("tables", {}).get(table, {})
    dimensions = table_profile.get("dimensions", [])
    id_columns = set(table_profile.get("id_columns", []))
    columns = table_profile.get("columns", {})
    preferred_dimensions = []
    for dimension in dimensions:
        if dimension in id_columns:
            continue
        column_profile = columns.get(dimension, {}) if isinstance(columns, dict) else {}
        if column_profile.get("high_cardinality"):
            continue
        preferred_dimensions.append(dimension)

    if not preferred_dimensions and dimensions:
        preferred_dimensions = [dimension for dimension in dimensions if dimension not in id_columns]

    if not preferred_dimensions:
        return {"drivers": [], "dimension": None}

    dimension = preferred_dimensions[0]
    logger = get_logger("talk_to_data.tools")
    grouped = aggregate(adapter, table, metric, dimension, operation, date_range)
    logger.info("find_drivers dimension=%s", dimension)
    data_rows = [r for r in grouped if "_truncated" not in r]
    sorted_rows = sorted(data_rows, key=lambda row: row.get("value", 0), reverse=True)
    return {"dimension": dimension, "drivers": sorted_rows[:limit]}
