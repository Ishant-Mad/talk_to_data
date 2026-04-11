from __future__ import annotations

from typing import Dict, List, Optional

from app.adapters.base import DataAdapter
from app.utils.logger import get_logger


def _get_table_profile(schema: Dict[str, object], table: str) -> Dict[str, object]:
    return schema.get("tables", {}).get(table, {})


def filter_data(
    adapter: DataAdapter,
    table: str,
    filters: Dict[str, object],
    date_range: Optional[Dict[str, str]] = None,
) -> List[Dict[str, object]]:
    logger = get_logger("talk_to_data.tools")
    rows = adapter.filter(table=table, filters=filters, date_range=date_range)
    logger.info("filter_data rows=%s", len(rows))
    return rows[:500]


def aggregate(
    adapter: DataAdapter,
    table: str,
    metric: str,
    group_by: Optional[str],
    operation: str,
    date_range: Optional[Dict[str, str]] = None,
) -> List[Dict[str, object]]:
    logger = get_logger("talk_to_data.tools")
    rows = adapter.aggregate(
        table=table,
        metric=metric,
        group_by=group_by,
        operation=operation,
        date_range=date_range,
    )
    logger.info("aggregate rows=%s", len(rows))
    return rows[:200]


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
    return {
        "period_a": period_a,
        "period_b": period_b,
        "value_a": a[0]["value"] if a else None,
        "value_b": b[0]["value"] if b else None,
    }


def find_drivers(
    adapter: DataAdapter,
    table: str,
    metric: str,
    operation: str,
    date_range: Optional[Dict[str, str]],
    schema: Dict[str, object],
    limit: int = 5,
) -> Dict[str, object]:
    table_profile = _get_table_profile(schema, table)
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
    sorted_rows = sorted(grouped, key=lambda row: row.get("value", 0), reverse=True)
    return {"dimension": dimension, "drivers": sorted_rows[:limit]}
