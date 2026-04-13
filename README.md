

<div align="center">
 
<!-- Replace with your actual logo -->
<img src="docs/logo.png" alt="Talk to Data" width="72" height="72" />
 
# Talk to Data

[![Live Demo](https://img.shields.io/badge/Live%20Demo-try%20it%20now-brightgreen?style=for-the-badge)](https://talk-to-data-frontend-dhcc.onrender.com/)

**Ask questions. Get answers. No SQL required.**
 
An intelligent analytics platform that turns natural language into insights, charts, and dashboards — powered by LLMs and in-memory SQL. Built for business analysts, ops teams, and anyone who needs answers from data without writing code.
 
<video src="https://github.com/user-attachments/assets/8c261895-e9d9-49cd-ad82-98a9751f1c03" width="750" controls="controls" muted="muted" autoplay="autoplay" loop="loop"></video>
 
<br/>

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs)
![DuckDB](https://img.shields.io/badge/DuckDB-in--memory-yellow?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?style=flat-square&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)
 
</div>
 
---
 
## Overview
 
**Talk to Data** lets you upload any CSV dataset and ask questions about it in plain English. Instead of writing SQL or configuring BI tools, you type a question — the system generates and runs the query, then returns a full analysis: text summary, charts, step-by-step reasoning, and a confidence score. It is designed for business users who need fast answers from data without technical overhead.
 
---
 
## How it works
 
```
User question  ──▶  Chat UI  ──▶  FastAPI agent  ──▶  DuckDB (SQL)  ──▶  Charts + Summary
                   (Next.js)      (LLM + tools)       (CSV views)        (Recharts)
```
<img width="1280" height="681" alt="image" src="https://github.com/user-attachments/assets/affd4cfb-4fc9-4039-8525-e4fc5ca94cfc" />

1. Upload CSV files — they become queryable SQL views instantly
2. Ask a question in plain English
3. The LLM agent writes and runs SQL, then returns: **text summary · charts · confidence score · reasoning**
 
---
 
## Features
 
All features listed below are fully implemented and working.
 
### 📈 Almost every answer comes with a chart or a table
 
Ask a question — get back not just text, but an automatically selected and rendered visualisation alongside it. The system picks the right chart type (bar, line, or pie) based on the data shape, so you always see the answer, not just read it.
 
```
"Show me complaints by channel last quarter"
        ↓
  ┌─ Summary ──────────────────────────────────────┐
  │ Phone had the highest complaint volume (42%)…  │
  └────────────────────────────────────────────────┘
  ┌─ Chart (auto-selected: pie) ───────────────────┐
  │         📊 Complaints by channel               │
  │    Phone ████████████████  42%                 │
  │    Email ██████████        28%                 │
  │    Chat  ███████           19%                 │
  │    Other █████             11%                 │
  └────────────────────────────────────────────────┘
  ┌─ Confidence: 94% ──┐  ┌─ Reasoning: 3 steps ──┐
  └────────────────────┘  └───────────────────────┘
```
 
| | Feature | Description |
|---|---|---|
| 💬 | **Natural language chat** | Ask questions in plain English — every response includes a text summary, auto-generated chart, reasoning steps, and a confidence score |
| 📊 | **Auto dashboards** | System recommends and renders a full set of charts from your data schema on load |
| 📁 | **CSV upload** | Drop in any dataset — DuckDB views and schema are created instantly |
| 🔍 | **Live data profiling** | Schema inference, column type detection, and distributions streamed in real time via SSE |
| ⚡ | **Drill-down tools** | Filter, aggregate, compare time periods, and find metric drivers via API |
| 🌗 | **Light / dark mode** | Full theme support across the entire UI |
 
---
 
## Tech stack
 
| Layer | Technology | Why we chose it |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript | Type-safe UI with fast rendering and hot reload |
| **Charts** | Recharts | Composable, responsive chart components with minimal config |
| **Backend** | FastAPI (Python) | Async-first REST API with built-in SSE streaming support |
| **Database** | DuckDB | In-memory SQL engine — runs analytical queries on CSVs in milliseconds without a server |
| **AI / LLM** | OpenRouter / Groq / GitHub Models | Multi-step reasoning and SQL generation; supports multiple providers and API key rotation for rate limit handling |
| **Validation** | Pydantic | Strict request/response schema enforcement across all endpoints |
 
**Why DuckDB?** Traditional databases require schema setup and data loading pipelines. DuckDB queries CSV files directly in memory, making it ideal for ad-hoc analytics where the dataset changes frequently.
 
**Why an LLM agent?** Keyword-based or template SQL approaches break on free-form questions. An LLM with tool-calling can interpret ambiguous questions, plan multi-step queries, and explain its reasoning — making the system usable without SQL knowledge.
 
---
 
## Quickstart
 
> 🚀 **No setup needed** — try the live deployment instantly at **[talk-to-data-frontend-dhcc.onrender.com](https://talk-to-data-frontend-dhcc.onrender.com/)**. Upload a CSV or load a demo dataset and start asking questions right away.
 
**To run locally — Prerequisites:** Python 3.11+, Node.js 18+
 
### 1. Clone the repo
 
```bash
git clone https://github.com/your-org/natwest-talk-to-data.git
cd natwest-talk-to-data
```
 
### 2. Configure environment variables
 
```bash
cp .env.example .env
```
 
Open `.env` and fill in your chosen LLM provider credentials (see [Environment variables](#environment-variables) below).
 
### 3. Start the backend
 
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
 
### 4. Start the frontend
 
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```
 
Open **http://localhost:3000** — upload a CSV and start asking questions.
 
---
 
### ⚡ Faster alternative: one-click start with VS Code
 
If you use VS Code, you don't need to run any of the manual steps above. The repo includes a pre-configured `tasks.json` that handles everything — venv creation, dependency install, and both servers — in parallel, automatically.
 
1. Open the project folder in VS Code
2. Open the Command Palette: `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
3. Run **Tasks: Run Task** → select **Run Project (Split Terminals)**
 
That's it. VS Code will:
- Create a Python virtual environment (`.venv`) if one doesn't exist
- Install backend dependencies via `pip`
- Install frontend dependencies via `npm`
- Start both servers in parallel in a shared terminal panel
 
| Task | What it runs |
|---|---|
| `Start Backend` | Creates `.venv` → activates it → `pip install` → `uvicorn` on port 8000 |
| `Start Frontend` | `npm install` → `npm run dev` on port 3000 |
| `Run Project (Split Terminals)` | Runs both tasks above in parallel — **use this one** |
 
---

## Environment variables
 
Copy `.env.example` to `.env` and fill in values for your chosen LLM provider. You only need to configure **one** provider.
 
```bash
# Data directory configuration
DATA_DIR=./data
PROFILE_PATH=./data/data_profile.json
 
# LLM provider — choose one: "groq", "github", "openrouter"
LLM_PROVIDER=openrouter
 
# Groq (fastest inference) — https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here
 
# GitHub Models (via personal access token)
GITHUB_TOKEN=your_github_pat_here
GITHUB_MODEL=Ministral-3B
 
# OpenRouter (recommended — supports free models and multi-key load balancing)
# Comma-separated list of keys for automatic rotation across rate limits
OPENROUTER_API_KEYS="key1,key2,key3" or OPENROUTER_API_KEY=key
OPENROUTER_MODEL=openai/gpt-oss-120b:free
```
 
> ⚠️ Never commit your real `.env` file. The `.env.example` file is provided in the repo with placeholder values only.
 
---
 
## Usage examples
 
### Upload a dataset
 
```bash
curl -X POST http://localhost:8000/upload \
  -F "files=@transactions.csv" \
  -F "files=@complaints.csv"
```
 
### Ask a question via the chat API
 
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Which product category had the highest refund rate in March?"}'
```
 
**Example response:**
 
```json
{
  "summary": "Electronics had the highest refund rate in March at 14.2%, followed by Apparel at 9.8%.",
  "charts": [
    { "type": "bar", "title": "Refund rate by category", "data": ["..."] }
  ],
  "reasoning": ["Filtered transactions to March", "Grouped by category", "Calculated refund_count / total_count"],
  "confidence": 0.91
}
```
 
### Compare two time periods
 
```bash
curl -X POST http://localhost:8000/tools/compare \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "revenue",
    "period_a": {"start": "2024-01-01", "end": "2024-03-31"},
    "period_b": {"start": "2024-04-01", "end": "2024-06-30"}
  }'
```
 
### Stream profiling progress (Server-Sent Events)
 
```bash
curl http://localhost:8000/profiling/stream
# Streams: {"status": "profiling", "table": "transactions", "progress": 0.6}
```
 
---
 
## API reference
 
| Method | Endpoint | What it does |
|---|---|---|
| `POST` | `/upload` | Upload one or more CSV files |
| `GET` | `/profiling/stream` | SSE stream of profiling progress |
| `POST` | `/chat` | Send a natural language question, get full analysis |
| `GET` | `/dashboard/plan` | Get recommended visualisations for the loaded data |
| `POST` | `/dashboard/widget_data` | Fetch aggregated data for a specific chart widget |
| `POST` | `/tools/filter` | Slice data by conditions and date ranges |
| `POST` | `/tools/aggregate` | Group and summarise by dimension |
| `POST` | `/tools/compare` | Compare metrics across two time periods |
| `POST` | `/tools/find_drivers` | Identify drivers behind a metric change |
 
Full schema for each endpoint is enforced via Pydantic — see `backend/app/contracts.py`.
 
---
 
## Project structure
 
```
├── backend/
│   └── app/
│       ├── main.py              # FastAPI routes
│       ├── agent.py             # LLM agent + tool orchestration
│       ├── planner.py           # Dashboard planning logic
│       ├── tools.py             # Filter / aggregate / compare / drivers
│       ├── contracts.py         # Pydantic schemas
│       ├── state.py             # Thread-safe state management
│       └── adapters/
│           └── csv_adapter.py   # CSV → DuckDB view creation
├── frontend/
│   ├── pages/
│   │   └── index.tsx            # Main chat + dashboard page
│   └── context/
│       └── ThemeContext.tsx     # Light / dark mode
├── .env.example                 # Environment variable template
└── README.md
```
 
---
 
## Limitations
 
- **In-memory only:** DuckDB holds data in memory for the session. Very large CSV files (>500MB) may degrade performance depending on available RAM.
- **No authentication:** There is no user login or session isolation — all uploaded data is shared within a single running instance.
- **LLM accuracy:** SQL generation depends on the LLM response quality. Ambiguous questions may produce incorrect queries; the confidence score helps surface this.
- **Single session dataset:** Uploading new files resets the current data profile. Multiple named datasets cannot be persisted across sessions.
 
---
 
## Future improvements
 
- **User authentication and multi-tenancy** — isolated workspaces per user or team
- **Persistent storage** — save datasets and chat history across sessions
- **Scheduled reports** — run queries automatically and deliver results by email
- **Streaming chat responses** — stream LLM answers token-by-token for faster perceived response
- **Fine-tuned SQL generation** — replace general-purpose LLMs with a model trained on analytics queries for higher accuracy
 
---
 
## Contributing
 
Pull requests are welcome. For major changes, please open an issue first.
 
1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit with DCO sign-off: `git commit -s -m "add my feature"`
4. Push and open a PR
 
All commits must be signed off in accordance with the [Developer Certificate of Origin (DCO)](https://developercertificate.org/).
 
---
 
## License
 
[Apache 2.0](LICENSE) © NatWest Group
