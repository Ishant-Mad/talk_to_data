from __future__ import annotations

import os
from typing import Dict, List, Optional

import duckdb
import pandas as pd

from app.adapters.base import DataAdapter
from app.profiling.profiler import load_profile
from app.utils.logger import get_logger

logger = get_logger("talk_to_data.csv_adapter")

# Characters that are safe in SQL identifiers (alphanumerics + underscore)
import re as _re
_SAFE_IDENT = _re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')


def _sanitize_identifier(name: str) -> str:
    """Return a DuckDB-safe quoted identifier, raising if the name is clearly malicious."""
    if not name or not _SAFE_IDENT.match(name):
        raise ValueError(
            f"Unsafe SQL identifier: {name!r}. "
            "Only alphanumerics and underscores are allowed."
        )
    return name


class CSVAdapter(DataAdapter):
    def __init__(self, data_dir: str, profile_path: str) -> None:
        self._data_dir = data_dir
        self._profile_path = profile_path
        self._con = duckdb.connect()
        self._init_duckdb_views()

    def reset_cache(self) -> None:
        """Reset the cache and re-initialize DuckDB views."""
        self._init_duckdb_views()

    def _init_duckdb_views(self) -> None:
        """Create views in DuckDB for each CSV file in the data directory."""
        if not os.path.exists(self._data_dir):
            return
        for filename in os.listdir(self._data_dir):
            if filename.endswith(".csv"):
                table_name = os.path.splitext(filename)[0]
                path = os.path.join(self._data_dir, filename)
                abspath = os.path.abspath(path)
                try:
                    safe_table = _sanitize_identifier(table_name)
                    escaped_path = abspath.replace("'", "''")
                    self._con.execute(
                        f"CREATE OR REPLACE VIEW {safe_table} AS "
                        f"SELECT * FROM read_csv_auto('{escaped_path}');"
                    )
                except ValueError as e:
                    logger.warning("skipping_view table=%s reason=%s", table_name, e)
                except Exception as e:
                    logger.error("error_creating_view table=%s error=%s", table_name, e)

    def execute_sql(self, query: str) -> List[Dict[str, object]]:
        """Execute a DuckDB SQL query and return the results as a list of dicts.

        Raises on error so callers can handle failures properly instead of
        receiving a silent ``[{"error": "..."}]`` sentinel value.
        """
        df = self._con.execute(query).fetchdf()
        # Convert datetime columns to string to ensure JSON serialization works
        for col in df.select_dtypes(include=['datetime64', 'datetimetz']).columns:
            df[col] = df[col].astype(str)
        return df.to_dict(orient="records")

    def schema(self) -> Dict[str, object]:
        profile = load_profile(self._profile_path)
        if profile and profile.get("tables"):
            return profile

        # Instant schema fallback from DuckDB views so tables are never empty
        tables: Dict[str, Any] = {}
        for tbl in self.list_tables():
            try:
                safe_t = _sanitize_identifier(tbl)
                desc = self._con.execute(f"DESCRIBE {safe_t};").fetchall()
                cols: Dict[str, Any] = {}
                measures: List[str] = []
                dimensions: List[str] = []
                time_col: Optional[str] = None
                for col_info in desc:
                    col_name = str(col_info[0])
                    col_type = str(col_info[1])
                    cols[col_name] = {"type": col_type}
                    col_lower = col_name.lower()
                    type_lower = col_type.lower()
                    if any(t in type_lower for t in ("int", "double", "float", "decimal", "numeric", "real")) and not col_lower.endswith("_id") and col_lower != "id":
                        measures.append(col_name)
                    elif any(t in type_lower for t in ("date", "time", "timestamp")):
                        time_col = col_name
                        dimensions.append(col_name)
                    else:
                        dimensions.append(col_name)

                cnt = self._con.execute(f"SELECT COUNT(*) FROM {safe_t};").fetchone()
                row_count = cnt[0] if cnt else 0
                tables[tbl] = {
                    "columns": cols,
                    "measures": measures,
                    "dimensions": dimensions,
                    "inferred_time_column": time_col,
                    "row_count": row_count,
                }
            except Exception as e:
                logger.warning("fallback_schema_error table=%s error=%s", tbl, e)
        return {"tables": tables}

    def list_tables(self) -> List[str]:
        return [os.path.splitext(name)[0] for name in os.listdir(self._data_dir) if name.endswith(".csv")]

    def filter(
        self,
        table: str,
        filters: Dict[str, object],
        date_range: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, object]]:
        raise NotImplementedError("Use execute_sql instead")

    def aggregate(
        self,
        table: str,
        metric: str,
        group_by: Optional[str],
        operation: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, object]]:
        raise NotImplementedError("Use execute_sql instead")

    def distinct(self, table: str, column: str) -> List[str]:
        raise NotImplementedError("Use execute_sql instead")
