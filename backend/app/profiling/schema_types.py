from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class ColumnProfile:
    name: str
    inferred_type: str
    missing_count: int
    total_count: int
    unique_count: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    sample_values: List[str] = field(default_factory=list)
    high_cardinality: bool = False


@dataclass
class TableProfile:
    name: str
    file_path: str
    row_count: int
    columns: Dict[str, ColumnProfile]
    inferred_time_column: Optional[str] = None
    measures: List[str] = field(default_factory=list)
    dimensions: List[str] = field(default_factory=list)
    id_columns: List[str] = field(default_factory=list)


@dataclass
class DatasetProfile:
    dataset_fingerprint: str
    generated_at: str
    tables: Dict[str, TableProfile]
    notes: List[str] = field(default_factory=list)
