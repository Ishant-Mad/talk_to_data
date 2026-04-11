from __future__ import annotations

import json
import os
import threading
from typing import Dict, Generator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.adapters.csv_adapter import CSVAdapter
from app.contracts import ChatResponse
from app.profiling.profiler import load_profile, profile_dataset
from app.agent import run_agent
from app.state import profiling_state
from app.tools import aggregate, compare, filter_data, find_drivers
from app.utils.logger import get_logger
from app.utils.fingerprint import compute_dataset_fingerprint


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(REPO_ROOT, "data")
PROFILE_PATH = os.path.join(REPO_ROOT, "data", "data_profile.json")

app = FastAPI(title="Talk to Data API")
adapter = CSVAdapter(DATA_DIR, PROFILE_PATH)
logger = get_logger("talk_to_data.api")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
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


def _event_stream() -> Generator[str, None, None]:
    _ensure_profiling()
    while True:
        event = profiling_state.queue.get()
        yield f"data: {json.dumps(event)}\n\n"
        if profiling_state.status in {"done", "error"} and profiling_state.queue.empty():
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


@app.get("/profiling/status")
def profiling_status() -> Dict[str, Optional[str]]:
    return {"status": profiling_state.status, "error": profiling_state.error}


@app.get("/profiling/stream")
def profiling_stream() -> StreamingResponse:
    return StreamingResponse(_event_stream(), media_type="text/event-stream")


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
