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
    
    where_clauses = []
    if filters:
        for k, v in filters.items():
            if isinstance(v, str):
                where_clauses.append(f"{k} = '{v}'")
            else:
                where_clauses.append(f"{k} = {v}")
                
    if date_range:
        # Assuming date_range has 'start' and 'end' and 'column'
        col = date_range.get("column", "date")
        start = date_range.get("start")
        end = date_range.get("end")
        if start:
            where_clauses.append(f"{col} >= '{start}'")
        if end:
            where_clauses.append(f"{col} <= '{end}'")
            
    where_sql = " AND ".join(where_clauses)
    query = f"SELECT * FROM {table}"
    if where_sql:
        query += f" WHERE {where_sql}"
        
    rows = adapter.execute_sql(query) if hasattr(adapter, "execute_sql") else []
    logger.info("filter_data rows=%s", len(rows))
    return rows[:500]


def aggregate(
    adapter: DataAdapter,
    table: str,
    metric: str,
    group_by: Optional[object],
    operation: str,
    date_range: Optional[Dict[str, str]] = None,
) -> List[Dict[str, object]]:
    logger = get_logger("talk_to_data.tools")
    
    op = operation.upper() if operation else "SUM"
    select_parts = []
    
    # Normalize group_by
    group_by_cols = []
    if group_by:
        if isinstance(group_by, list):
            group_by_cols = [str(g) for g in group_by]
        elif isinstance(group_by, str):
            group_by_cols = [group_by]
        
    for g in group_by_cols:
        select_parts.append(g)
    
    if metric:
        select_parts.append(f"{op}({metric}) AS value")
    else:
        select_parts.append("COUNT(*) AS value")
        
    query = f"SELECT {', '.join(select_parts)} FROM {table}"
    
    where_clauses = []
    if date_range and isinstance(date_range, dict):
        col = date_range.get("column", "date")
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
            query += f" ORDER BY value DESC"
        
    rows = adapter.execute_sql(query) if hasattr(adapter, "execute_sql") else []
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
