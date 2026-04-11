from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, Iterable, List, Optional


class DataAdapter(ABC):
    @abstractmethod
    def schema(self) -> Dict[str, object]:
        raise NotImplementedError

    @abstractmethod
    def list_tables(self) -> List[str]:
        raise NotImplementedError

    @abstractmethod
    def filter(
        self,
        table: str,
        filters: Dict[str, object],
        date_range: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, object]]:
        raise NotImplementedError

    @abstractmethod
    def aggregate(
        self,
        table: str,
        metric: str,
        group_by: Optional[str],
        operation: str,
        date_range: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, object]]:
        raise NotImplementedError

    @abstractmethod
    def distinct(self, table: str, column: str) -> List[str]:
        raise NotImplementedError
