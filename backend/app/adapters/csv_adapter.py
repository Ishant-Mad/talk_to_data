from __future__ import annotations

import os
from typing import Dict, List, Optional

import pandas as pd

from app.adapters.base import DataAdapter
from app.profiling.profiler import load_profile


def _looks_like_date_only(value: str) -> bool:
    stripped = value.strip()
    if not stripped or "T" in stripped.upper():
        return False
    return len(stripped) <= 10 and stripped[0].isdigit()


def _parse_ts(value: Optional[str]) -> Optional[pd.Timestamp]:
    if value is None or not str(value).strip():
        return None
    ts = pd.to_datetime(str(value).strip(), errors="coerce", utc=True, format="mixed")
    if pd.isna(ts):
        return None
    return ts


class CSVAdapter(DataAdapter):
    def __init__(self, data_dir: str, profile_path: str) -> None:
        self._data_dir = data_dir
        self._profile_path = profile_path
        self._frames: Dict[str, pd.DataFrame] = {}

    def schema(self) -> Dict[str, object]:
        profile = load_profile(self._profile_path)
        return profile or {"tables": {}}

    def reset_cache(self) -> None:
        self._frames.clear()

    def list_tables(self) -> List[str]:
        return [os.path.splitext(name)[0] for name in os.listdir(self._data_dir) if name.endswith(".csv")]

    def _time_series(self, frame: pd.DataFrame, date_col: str) -> pd.Series:
        return pd.to_datetime(frame[date_col], errors="coerce", utc=True, format="mixed")

    def _mask_date_range(self, frame: pd.DataFrame, table: str, date_range: Optional[Dict[str, str]]) -> pd.DataFrame:
        if not date_range:
            return frame
        date_col = self._infer_time_column(table)
        if not date_col:
            return frame
        self._require_columns(frame, table, [date_col])
        parsed = self._time_series(frame, date_col)
        mask = parsed.notna()

        start_raw = date_range.get("start")
        start_ts = _parse_ts(start_raw if isinstance(start_raw, str) else None)
        if start_ts is not None and isinstance(start_raw, str) and _looks_like_date_only(start_raw):
            start_ts = start_ts.normalize()
        if start_ts is not None:
            mask &= parsed >= start_ts

        end_raw = date_range.get("end")
        end_ts = _parse_ts(end_raw if isinstance(end_raw, str) else None)
        if end_ts is not None:
            if isinstance(end_raw, str) and _looks_like_date_only(end_raw):
                mask &= parsed < end_ts.normalize() + pd.Timedelta(days=1)
            else:
                mask &= parsed <= end_ts

        return frame.loc[mask]

    def filter(
        self,
        table: str,
        filters: Dict[str, object],
        date_range: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, object]]:
        frame = self._load_table(table)
        result = frame

        self._require_columns(frame, table, filters.keys())

        for column, value in filters.items():
            result = result[result[column] == value]

        result = self._mask_date_range(result, table, date_range)

        return result.to_dict(orient="records")

    def aggregate(
        self,
        table: str,
        metric: str,
        group_by: Optional[str],
        operation: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, object]]:
        frame = self._load_table(table)
        self._require_columns(frame, table, [metric])
        if group_by:
            self._require_columns(frame, table, [group_by])

        frame = self._mask_date_range(frame, table, date_range)

        if operation == "count":
            if group_by:
                grouped = frame.groupby(group_by).size().reset_index(name="value")
            else:
                grouped = pd.DataFrame({"value": [len(frame)]})
        else:
            if operation not in {"sum", "avg", "mean"}:
                raise ValueError(f"Unsupported operation: {operation}")
            agg_op = "mean" if operation in {"avg", "mean"} else operation
            if group_by:
                grouped = frame.groupby(group_by)[metric].agg(agg_op).reset_index(name="value")
            else:
                grouped = pd.DataFrame({"value": [frame[metric].agg(agg_op)]})

        return grouped.to_dict(orient="records")

    def distinct(self, table: str, column: str) -> List[str]:
        frame = self._load_table(table)
        self._require_columns(frame, table, [column])
        return frame[column].dropna().astype(str).unique().tolist()

    def _load_table(self, table: str) -> pd.DataFrame:
        if table not in self._frames:
            path = os.path.join(self._data_dir, f"{table}.csv")
            self._frames[table] = pd.read_csv(path)
        return self._frames[table]

    def _infer_time_column(self, table: str) -> Optional[str]:
        profile = load_profile(self._profile_path)
        if not profile:
            return None
        table_profile = profile.get("tables", {}).get(table, {})
        return table_profile.get("inferred_time_column")

    @staticmethod
    def _require_columns(frame: pd.DataFrame, table: str, columns: List[str]) -> None:
        missing = [column for column in columns if column not in frame.columns]
        if missing:
            raise ValueError(f"Table '{table}' is missing required columns: {', '.join(missing)}")
