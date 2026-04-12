from __future__ import annotations

import json
import os
import time
from collections import defaultdict
from datetime import datetime
from typing import Callable, Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd

from app.profiling.schema_types import ColumnProfile, DatasetProfile, TableProfile
from app.utils.fingerprint import compute_dataset_fingerprint


ProgressCallback = Callable[[Dict[str, object]], None]


def _detect_date_column(series: pd.Series) -> float:
    if series.empty:
        return 0.0
    sample = series.dropna().astype(str).head(2000)
    if sample.empty:
        return 0.0
    parsed = pd.to_datetime(sample, errors="coerce", utc=True, format="mixed")
    return float(parsed.notna().mean())


def _infer_column_type(name: str, series: pd.Series) -> str:
    lowered = name.lower()
    if "date" in lowered or "time" in lowered:
        return "date"

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    date_parse_ratio = _detect_date_column(series)
    if date_parse_ratio > 0.9:
        return "date"

    return "categorical"


def _update_sample_values(samples: List[str], values: Iterable[str], limit: int) -> List[str]:
    for value in values:
        if value not in samples:
            samples.append(value)
        if len(samples) >= limit:
            break
    return samples


def _scan_csv(
    file_path: str,
    progress: Optional[ProgressCallback],
) -> Tuple[TableProfile, Dict[str, object]]:
    table_name = os.path.splitext(os.path.basename(file_path))[0]
    progress_meta: Dict[str, object] = {
        "table": table_name,
        "file": os.path.basename(file_path),
    }

    total_rows = 0
    missing_counts = defaultdict(int)
    min_values: Dict[str, float] = {}
    max_values: Dict[str, float] = {}
    sample_values: Dict[str, List[str]] = defaultdict(list)
    high_cardinality: Dict[str, bool] = defaultdict(bool)
    unique_sets: Dict[str, set] = defaultdict(set)
    inferred_types: Dict[str, str] = {}

    # For demo purposes, we make chunks smaller to trigger more progress events
    chunk_iter = pd.read_csv(file_path, chunksize=2000)
    for chunk_index, chunk in enumerate(chunk_iter, start=1):
        if progress is not None:
            time.sleep(0.4)  # Add artificial delay to make the UI animation noticeable
            
        total_rows += len(chunk)
        if chunk_index == 1:
            for col in chunk.columns:
                inferred_types[col] = _infer_column_type(col, chunk[col])

        for col in chunk.columns:
            series = chunk[col]
            missing_counts[col] += int(series.isna().sum())

            if inferred_types[col] == "numeric":
                numeric = pd.to_numeric(series, errors="coerce")
                min_val = numeric.min(skipna=True)
                max_val = numeric.max(skipna=True)
                if pd.notna(min_val):
                    min_values[col] = float(min_val) if col not in min_values else min(min_values[col], float(min_val))
                if pd.notna(max_val):
                    max_values[col] = float(max_val) if col not in max_values else max(max_values[col], float(max_val))

            if inferred_types[col] in {"categorical", "date"}:
                values = series.dropna().astype(str).unique().tolist()
                _update_sample_values(sample_values[col], values, 10)

            if not high_cardinality[col]:
                values = series.dropna().astype(str).unique().tolist()
                unique_sets[col].update(values)
                if len(unique_sets[col]) > 2000:
                    high_cardinality[col] = True
                    unique_sets[col].clear()

        if progress is not None and len(chunk.columns) > 0:
            feature_index = (chunk_index - 1) % len(chunk.columns)
            feature_name = chunk.columns[feature_index]
            feature_samples = chunk[feature_name].dropna().astype(str).unique().tolist()[:6]
            progress({
                **progress_meta,
                "rows_scanned": total_rows,
                "chunk": chunk_index,
                "status": "scanning rows",
                "feature": feature_name,
                "samples": feature_samples,
            })

    columns: Dict[str, ColumnProfile] = {}
    for col in inferred_types:
        unique_count = None
        if not high_cardinality[col]:
            unique_count = len(unique_sets[col])

        columns[col] = ColumnProfile(
            name=col,
            inferred_type=inferred_types[col],
            missing_count=missing_counts[col],
            total_count=total_rows,
            unique_count=unique_count,
            min_value=min_values.get(col),
            max_value=max_values.get(col),
            sample_values=sample_values[col],
            high_cardinality=high_cardinality[col],
        )

    if progress is not None:
        for col_profile in columns.values():
            progress({
                **progress_meta,
                "rows_scanned": total_rows,
                "status": "indexing features",
                "feature": col_profile.name,
                "samples": col_profile.sample_values[:6] if col_profile.sample_values else [],
            })
            time.sleep(0.1)

    inferred_time_column = None
    date_candidates = [c for c in columns.values() if c.inferred_type == "date"]
    if date_candidates:
        preferred = [c for c in date_candidates if "date" in c.name.lower()]
        inferred_time_column = (preferred or date_candidates)[0].name

    measures = [c.name for c in columns.values() if c.inferred_type == "numeric"]
    dimensions = [c.name for c in columns.values() if c.inferred_type == "categorical"]
    id_columns = [c.name for c in columns.values() if "id" in c.name.lower()]

    table_profile = TableProfile(
        name=table_name,
        file_path=file_path,
        row_count=total_rows,
        columns=columns,
        inferred_time_column=inferred_time_column,
        measures=measures,
        dimensions=dimensions,
        id_columns=id_columns,
    )

    return table_profile, progress_meta


def profile_dataset(
    data_dir: str,
    output_path: str,
    progress: Optional[ProgressCallback] = None,
) -> DatasetProfile:
    csv_files = [
        os.path.join(data_dir, name)
        for name in os.listdir(data_dir)
        if name.lower().endswith(".csv")
    ]

    if not csv_files:
        raise FileNotFoundError("No CSV files found in data directory.")

    dataset_fingerprint = compute_dataset_fingerprint(csv_files)
    tables: Dict[str, TableProfile] = {}

    for file_path in sorted(csv_files):
        if progress is not None:
            time.sleep(1.0) # Pause between scanning datasets for dramatic effect
            progress({
                "table": os.path.splitext(os.path.basename(file_path))[0],
                "file": os.path.basename(file_path),
                "status": "starting",
            })

        table_profile, progress_meta = _scan_csv(file_path, progress)
        tables[table_profile.name] = table_profile

        if progress is not None:
            time.sleep(1.0) # Pause after dataset profile finishes
            progress({
                **progress_meta,
                "rows_scanned": table_profile.row_count,
                "status": "done",
            })

    dataset_profile = DatasetProfile(
        dataset_fingerprint=dataset_fingerprint,
        generated_at=datetime.utcnow().isoformat() + "Z",
        tables=tables,
        notes=[],
    )

    _persist_profile(dataset_profile, output_path)
    return dataset_profile


def _persist_profile(profile: DatasetProfile, output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(_profile_to_dict(profile), handle, indent=2)


def _profile_to_dict(profile: DatasetProfile) -> Dict[str, object]:
    return {
        "dataset_fingerprint": profile.dataset_fingerprint,
        "generated_at": profile.generated_at,
        "tables": {
            name: {
                "name": table.name,
                "file_path": table.file_path,
                "row_count": table.row_count,
                "inferred_time_column": table.inferred_time_column,
                "measures": table.measures,
                "dimensions": table.dimensions,
                "id_columns": table.id_columns,
                "columns": {
                    col_name: {
                        "name": col.name,
                        "inferred_type": col.inferred_type,
                        "missing_count": col.missing_count,
                        "total_count": col.total_count,
                        "unique_count": col.unique_count,
                        "min_value": col.min_value,
                        "max_value": col.max_value,
                        "sample_values": col.sample_values,
                        "high_cardinality": col.high_cardinality,
                    }
                    for col_name, col in table.columns.items()
                },
            }
            for name, table in profile.tables.items()
        },
        "notes": profile.notes,
    }


def load_profile(output_path: str) -> Optional[Dict[str, object]]:
    if not os.path.exists(output_path):
        return None
    with open(output_path, "r", encoding="utf-8") as handle:
        return json.load(handle)
