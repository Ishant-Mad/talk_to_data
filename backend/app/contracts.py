from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


ConfidenceLevel = Literal["high", "medium", "low"]
ChartKind = Literal["line", "bar", "table", "pie", "area"]


class DateRange(BaseModel):
    model_config = ConfigDict(extra="ignore")

    start: Optional[str] = None
    end: Optional[str] = None


class ChartSeries(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: str
    label: Optional[str] = None
    color: Optional[str] = None


class ChartSpec(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str = "bar"
    data: List[Dict[str, Any]] = Field(default_factory=list)
    xKey: Optional[str] = None
    yKey: Optional[str] = None
    series: Optional[List[ChartSeries]] = Field(default_factory=list)

    @field_validator("type", mode="before")
    def _clean_type(cls, v: Any) -> str:
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ("line", "bar", "table", "pie", "area"):
                return v_clean
        return "bar"

    @field_validator("series", mode="before")
    def _coerce_series(cls, v: Any) -> List[Any]:
        if v is None:
            return []
        if isinstance(v, dict):
            return [v]
        return v if isinstance(v, list) else []

    @field_validator("data", mode="before")
    def _coerce_data(cls, v: Any) -> List[Any]:
        if v is None:
            return []
        return v if isinstance(v, list) else []


class AnalysisItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str  # "Understand what changed", "Compare", "Breakdown", "Summarize"
    insight: str
    chart: Optional[ChartSpec] = None

    @field_validator("insight", mode="before")
    def _coerce_insight(cls, v: Any) -> str:
        if isinstance(v, list):
            return "\n".join(f"- {x}" if not str(x).startswith("-") else str(x) for x in v)
        return str(v) if v is not None else ""


class ChatResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    summary: str
    data_source: str = ""
    chart: ChartSpec
    confidence: ConfidenceLevel = "medium"
    reasoning_steps: Optional[List[str]] = Field(default_factory=list)
    analyses: Optional[List[AnalysisItem]] = Field(default_factory=list)
    sql_queries_run: Optional[List[str]] = Field(default_factory=list)

    @field_validator("summary", mode="before")
    def _coerce_summary(cls, v: Any) -> str:
        if isinstance(v, list):
            return "\n".join(f"- {x}" if not str(x).startswith("-") else str(x) for x in v)
        return str(v) if v is not None else ""

    @field_validator("confidence", mode="before")
    def _lower_confidence(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_low = v.strip().lower()
            if v_low in ("high", "medium", "low"):
                return v_low
        return "medium"


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
    model_config = ConfigDict(extra="ignore")

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
