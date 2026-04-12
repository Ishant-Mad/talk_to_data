from __future__ import annotations

import json
import os
import shutil
import threading
from typing import Dict, Generator, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.adapters.csv_adapter import CSVAdapter
from app.contracts import ChatResponse
from app.profiling.profiler import load_profile, profile_dataset
from app.llm.llm_client import get_llm_client
from app.agent import run_agent
from app.planner import propose_chart_plan
from app.state import profiling_state
from app.tools import aggregate, compare, filter_data, find_drivers
from app.utils.logger import get_logger
from app.utils.fingerprint import compute_dataset_fingerprint


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(REPO_ROOT, ".env"), override=True)
DATA_DIR = os.path.join(REPO_ROOT, "data")
PROFILE_PATH = os.path.join(REPO_ROOT, "data", "data_profile.json")

if os.path.exists(DATA_DIR):
    for filename in os.listdir(DATA_DIR):
        file_path = os.path.join(DATA_DIR, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception:
            pass
os.makedirs(DATA_DIR, exist_ok=True)

app = FastAPI(title="Talk to Data API")
adapter = CSVAdapter(DATA_DIR, PROFILE_PATH)
logger = get_logger("talk_to_data.api")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _publish_event(event: Dict[str, object]) -> None:
    with profiling_state.lock:
        profiling_state.events.append(event)
        profiling_state.queue.put(event)


def _should_profile() -> bool:
    profile = load_profile(PROFILE_PATH)
    csv_files = [
        os.path.join(DATA_DIR, name)
        for name in os.listdir(DATA_DIR)
        if name.lower().endswith(".csv")
    ]
    if not csv_files:
        return False
    fingerprint = compute_dataset_fingerprint(csv_files)
    if not profile:
        return True
    return profile.get("dataset_fingerprint") != fingerprint


def _run_profiling() -> None:
    try:
        profiling_state.status = "running"
        profiling_state.error = None
        profile_dataset(DATA_DIR, PROFILE_PATH, progress=_publish_event)
        profiling_state.status = "done"
        _publish_event({"status": "completed"})
    except Exception as exc:  # noqa: BLE001
        profiling_state.status = "error"
        profiling_state.error = str(exc)
        _publish_event({"status": "error", "message": str(exc)})


def _ensure_profiling() -> None:
    if profiling_state.status in {"running", "done"}:
        return
    if not _should_profile():
        profiling_state.status = "done"
        return
    thread = threading.Thread(target=_run_profiling, daemon=True)
    thread.start()


def _profiling_stream_terminal(event: Dict[str, object]) -> bool:
    """End SSE after an explicit terminal payload (avoid queue.empty() under concurrency)."""
    status = event.get("status")
    if status == "completed":
        return True
    if status == "error" and "message" in event:
        return True
    return False


def _event_stream() -> Generator[str, None, None]:
    _ensure_profiling()
    # If profiling already finished and nothing is queued, emit a terminal event so
    # clients do not block forever on queue.get() (e.g. cached profile on cold start).
    if profiling_state.status == "done" and profiling_state.queue.empty():
        yield f"data: {json.dumps({'status': 'completed'})}\n\n"
        return
    if profiling_state.status == "error" and profiling_state.queue.empty():
        message = profiling_state.error or "Profiling failed"
        yield f"data: {json.dumps({'status': 'error', 'message': message})}\n\n"
        return
    while True:
        event = profiling_state.queue.get()
        yield f"data: {json.dumps(event)}\n\n"
        if _profiling_stream_terminal(event):
            break


@app.on_event("startup")
def startup_event() -> None:
    _ensure_profiling()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/schema")
def get_schema() -> Dict[str, object]:
    _ensure_profiling()
    return adapter.schema()


@app.get("/suggested_questions")
def suggested_questions() -> Dict[str, object]:
    _ensure_profiling()
    schema = adapter.schema()
    
    # Return empty array if no schema is formed yet
    if not schema.get("tables"):
        return {"questions": []}
        
    client = get_llm_client()
    messages = [
        {
            "role": "system", 
            "content": "You are a data assistant. Output ONLY a valid JSON array of exactly 3 strings suggesting short, analytical questions based on this database schema. No markdown mapping."
        },
        {"role": "user", "content": f"Schema: {json.dumps(schema)}"}
    ]
    try:
        response = client.chat(messages, temperature=0.7)
        content = response["choices"][0]["message"]["content"].strip()
        
        if content.startswith("```"):
            import re
            content = re.sub(r'```(?:json)?\n?(.*?)\n?```', r'\1', content, flags=re.DOTALL).strip()
            
        questions = json.loads(content)
        if isinstance(questions, list) and len(questions) >= 3:
            return {"questions": questions[:3]}
    except Exception:
        logger.exception("suggested_questions failed")
        
    # Default fallback
    return {"questions": [
        "Show revenue by region for Q1",
        "Which product had the most returns?",
        "Compare support tickets by month"
    ]}


@app.get("/profiling/status")
def profiling_status() -> Dict[str, Optional[str]]:
    return {"status": profiling_state.status, "error": profiling_state.error}


@app.get("/profiling/stream")
def profiling_stream() -> StreamingResponse:
    return StreamingResponse(_event_stream(), media_type="text/event-stream")


@app.post("/upload")
async def upload(files: List[UploadFile]) -> Dict[str, object]:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    for file in files:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    os.makedirs(DATA_DIR, exist_ok=True)
    for file in files:
        target_path = os.path.join(DATA_DIR, file.filename)
        with open(target_path, "wb") as handle:
            content = await file.read()
            handle.write(content)

    adapter._init_duckdb_views()

    if os.path.exists(PROFILE_PATH):
        os.remove(PROFILE_PATH)

    profiling_state.status = "idle"
    profiling_state.error = None
    profiling_state.events.clear()
    return {"status": "uploaded", "files": [file.filename for file in files]}


@app.get("/upload/demo")
def upload_demo(dataset: str) -> Dict[str, object]:
    import shutil
    DATA_SOURCE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data2")
    
    if not os.path.exists(DATA_SOURCE):
        raise HTTPException(status_code=400, detail="data2 folder not found")
    
    if dataset not in ("single", "multiple"):
        raise HTTPException(status_code=400, detail="dataset must be 'single' or 'multiple'")
        
    os.makedirs(DATA_DIR, exist_ok=True)
    for filename in os.listdir(DATA_DIR):
        file_path = os.path.join(DATA_DIR, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    
    if dataset == "single":
        files_to_copy = ["business_data.csv"]
    else:
        files_to_copy = [f for f in os.listdir(DATA_SOURCE) if f.endswith(".csv") and f != "business_data.csv"]
        
    copied_files = []
    for filename in files_to_copy:
        src_path = os.path.join(DATA_SOURCE, filename)
        if os.path.exists(src_path):
            dest_path = os.path.join(DATA_DIR, filename)
            shutil.copy2(src_path, dest_path)
            copied_files.append(filename)
            
    if not copied_files:
        raise HTTPException(status_code=400, detail=f"No demo files found in {DATA_SOURCE}.")
        
    adapter._init_duckdb_views()
    
    if os.path.exists(PROFILE_PATH):
        os.remove(PROFILE_PATH)
        
    profiling_state.status = "idle"
    profiling_state.error = None
    profiling_state.events.clear()
    adapter.reset_cache()
    
    return {
        "status": "demo_loaded",
        "dataset": dataset,
        "files": copied_files
    }


@app.post("/profiling/reset")
def profiling_reset() -> Dict[str, str]:
    if os.path.exists(PROFILE_PATH):
        os.remove(PROFILE_PATH)
    profiling_state.status = "idle"
    profiling_state.error = None
    profiling_state.events.clear()
    adapter.reset_cache()
    return {"status": "reset"}


@app.get("/dashboard/plan")
def dashboard_plan() -> Dict[str, object]:
    try:
        schema = adapter.schema()
        plan = propose_chart_plan(schema)
        charts = []
        for item in plan.charts:
            date_range_val = item.query.date_range
            if hasattr(date_range_val, "model_dump"):
                date_range_val = date_range_val.model_dump()
            elif hasattr(date_range_val, "dict"):
                date_range_val = date_range_val.dict()

            rows = aggregate(
                adapter,
                table=item.query.table,
                metric=item.query.metric,
                group_by=item.query.group_by,
                operation=item.query.operation,
                date_range=date_range_val,
            )
            chart = item.chart.model_copy()
            limit = item.query.limit if getattr(item.query, "limit", None) else 24
            chart.data = rows[:limit]
            
            # Force the chart keys to match what our aggregate() returns
            if item.query.group_by:
                chart.xKey = item.query.group_by[0] if isinstance(item.query.group_by, list) else str(item.query.group_by)
            chart.yKey = "value"

            charts.append({
                "title": item.title,
                "description": item.description,
                "chart": chart.model_dump(),
                "query": item.query.model_dump(),
                "valid_combinations": [vc.model_dump() for vc in getattr(item, "valid_combinations", [])],
            })
        return {"charts": charts}
    except Exception:  # noqa: BLE001
        logger.exception("dashboard_plan_failed")
        return {"charts": []}

from pydantic import BaseModel
class WidgetDataRequest(BaseModel):
    table: str
    x: str
    y: str
    operation: str

@app.post("/dashboard/widget_data")
def dashboard_widget_data(req: WidgetDataRequest) -> Dict[str, object]:
    try:
        rows = aggregate(
            adapter,
            table=req.table,
            metric=req.y,
            group_by=req.x,
            operation=req.operation,
            date_range=None,
        )
        return {"data": rows[:24]}
    except Exception:
        logger.exception("widget_data_failed")
        return {"data": []}

@app.post("/chat")
def chat(payload: Dict[str, object]) -> Dict[str, object]:
    question = str(payload.get("question", "")).strip()
    logger.info("chat_request length=%s", len(question))
    if not question:
        return {
            "summary": "Please ask a question.",
            "data_source": "",
            "chart": {"type": "table", "data": []},
            "confidence": "low",
        }
    try:
        schema = adapter.schema()
        response = run_agent(adapter, question, schema)
        return ChatResponse.model_validate(response).model_dump()
    except Exception as exc:  # noqa: BLE001
        logger.exception("chat_request_failed")
        if "429" in str(exc) or "Too Many Requests" in str(exc):
            return {
                "summary": "The AI data agent is currently experiencing high traffic and is rate-limited. Please wait a few moments and try your query again.",
                "data_source": "system",
                "chart": {"type": "table", "data": []},
                "confidence": "low",
            }
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/tools/filter")
def tool_filter(payload: Dict[str, object]) -> Dict[str, object]:
    logger.info("tool_filter")
    try:
        table = str(payload.get("table"))
        filters = payload.get("filters", {})
        date_range = payload.get("date_range")
        data = filter_data(adapter, table, filters, date_range)
        return {"rows": data}
    except Exception as exc:  # noqa: BLE001
        logger.exception("tool_filter_failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/tools/aggregate")
def tool_aggregate(payload: Dict[str, object]) -> Dict[str, object]:
    logger.info("tool_aggregate")
    try:
        table = str(payload.get("table"))
        metric = str(payload.get("metric"))
        group_by = payload.get("group_by")
        operation = str(payload.get("operation", "sum"))
        date_range = payload.get("date_range")
        data = aggregate(adapter, table, metric, group_by, operation, date_range)
        return {"rows": data}
    except Exception as exc:  # noqa: BLE001
        logger.exception("tool_aggregate_failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/tools/compare")
def tool_compare(payload: Dict[str, object]) -> Dict[str, object]:
    logger.info("tool_compare")
    try:
        table = str(payload.get("table"))
        metric = str(payload.get("metric"))
        operation = str(payload.get("operation", "sum"))
        period_a = payload.get("period_a", {})
        period_b = payload.get("period_b", {})
        return compare(adapter, table, metric, operation, period_a, period_b)
    except Exception as exc:  # noqa: BLE001
        logger.exception("tool_compare_failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/tools/find_drivers")
def tool_find_drivers(payload: Dict[str, object]) -> Dict[str, object]:
    logger.info("tool_find_drivers")
    try:
        table = str(payload.get("table"))
        metric = str(payload.get("metric"))
        operation = str(payload.get("operation", "sum"))
        date_range = payload.get("date_range")
        limit = int(payload.get("limit", 5))
        schema = adapter.schema()
        return find_drivers(adapter, table, metric, operation, date_range, schema, limit)
    except Exception as exc:  # noqa: BLE001
        logger.exception("tool_find_drivers_failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
