from __future__ import annotations

import threading
from dataclasses import dataclass, field
from queue import Queue
from typing import Dict, List, Optional


@dataclass
class ProfilingState:
    status: str = "idle"
    events: List[Dict[str, object]] = field(default_factory=list)
    queue: Queue = field(default_factory=Queue)
    lock: threading.Lock = field(default_factory=threading.Lock)
    error: Optional[str] = None


profiling_state = ProfilingState()
