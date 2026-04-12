from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


ConfidenceLevel = Literal["high", "medium", "low"]
ChartKind = Literal["line", "bar", "table"]


class DateRange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start: Optional[str] = None
    end: Optional[str] = None


class ChartSeries(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    label: Optional[str] = None
    color: Optional[str] = None


class ChartSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: ChartKind
    data: List[Dict[str, Any]]
    xKey: Optional[str] = None
    yKey: Optional[str] = None
    series: List[ChartSeries] = Field(default_factory=list)


class ChatResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str
    data_source: str = ""
    chart: ChartSpec
    confidence: ConfidenceLevel

    @field_validator("confidence", mode="before")
    def _lower_confidence(cls, v: Any) -> Any:
        return v.lower() if isinstance(v, str) else v


class ChartQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    table: str
    metric: str
    operation: str = "sum"
    group_by: Optional[Any] = None
    date_range: Optional[Any] = None
    limit: Optional[int] = 24


class LogicalPair(BaseModel):
    model_config = ConfigDict(extra="ignore")
    x: str
    y: str
    operation: Literal["sum", "avg", "mean", "count"] = "sum"


class ChartPlanItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str
    description: Optional[str] = None
    chart: ChartSpec
    query: ChartQuery
    valid_combinations: List[LogicalPair] = Field(default_factory=list)


class ChartPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    charts: List[ChartPlanItem]


class FilterArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    table: str
    filters: Dict[str, Any] = Field(default_factory=dict)
    date_range: Optional[DateRange] = None


class AggregateArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    table: str
    metric: str
    group_by: Optional[str] = None
    operation: Literal["sum", "avg", "mean", "count"]
    date_range: Optional[DateRange] = None


class CompareArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    table: str
    metric: str
    operation: Literal["sum", "avg", "mean", "count"]
    period_a: DateRange
    period_b: DateRange


class FindDriversArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    table: str
    metric: str
    operation: Literal["sum", "avg", "mean", "count"]
    date_range: Optional[DateRange] = None
    limit: int = 5
