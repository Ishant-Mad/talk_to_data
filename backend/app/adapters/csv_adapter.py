from __future__ import annotations

import os
from typing import Dict, List, Optional

import duckdb
import pandas as pd

from app.adapters.base import DataAdapter
from app.profiling.profiler import load_profile

class CSVAdapter(DataAdapter):
    def __init__(self, data_dir: str, profile_path: str) -> None:
        self._data_dir = data_dir
        self._profile_path = profile_path
        self._con = duckdb.connect()
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
                    self._con.execute(f"CREATE OR REPLACE VIEW {table_name} AS SELECT * FROM read_csv_auto('{abspath}');")
                except Exception as e:
                    print(f"Error creating view for {table_name}: {e}")

    def execute_sql(self, query: str) -> List[Dict[str, object]]:
        """Execute a DuckDB SQL query and return the results as a list of dicts."""
        try:
            df = self._con.execute(query).fetchdf()
            # Convert datetime columns to string to ensure JSON serialization works
            for col in df.select_dtypes(include=['datetime64', 'datetimetz']).columns:
                df[col] = df[col].astype(str)
            return df.to_dict(orient="records")
        except Exception as e:
            return [{"error": str(e)}]

    def schema(self) -> Dict[str, object]:
        profile = load_profile(self._profile_path)
        return profile or {"tables": {}}

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
