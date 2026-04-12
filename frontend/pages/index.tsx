import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

function chartPalette(light: boolean) {
  if (light) {
    return {
      axis: "#64748b",
      grid: "rgba(15, 25, 45, 0.09)",
      fill: "#2563eb",
      tooltipBg: "#ffffff",
      tooltipBorder: "rgba(15, 25, 45, 0.12)",
      tooltipText: "#0f1419",
      tick: "#64748b",
    };
  }
  return {
    axis: "#5c6370",
    grid: "rgba(255, 255, 255, 0.06)",
    fill: "#3d8bfd",
    tooltipBg: "#131820",
    tooltipBorder: "rgba(255, 255, 255, 0.12)",
    tooltipText: "#e4e6eb",
    tick: "#8b929e",
  };
}

type ChartPlanItem = {
  title: string;
  description?: string;
  chart: {
    type: string;
    data: Array<Record<string, unknown>>;
    xKey?: string;
    yKey?: string;
    series?: Array<{ key: string; label?: string; color?: string }>;
  };
};

type ChartPlanResponse = {
  charts: ChartPlanItem[];
};

type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

type ProfilingEvent = {
  status?: string;
  table?: string;
  file?: string;
  rows_scanned?: number;
  chunk?: number;
  message?: string;
  feature?: string;
  samples?: string[];
};

type SchemaPayload = {
  tables?: Record<
    string,
    { row_count?: number; columns?: Record<string, { inferred_type?: string }> }
  >;
};

type ChatResponse = {
  summary: string;
  data_source: string;
  chart: {
    type: string;
    data: Array<Record<string, unknown>>;
    xKey?: string;
    yKey?: string;
    series?: Array<{ key: string; label?: string; color?: string }>;
  };
  confidence: string;
};

type ChartPayload = ChartPlanItem["chart"];

function DataTableChart({ data }: { data: Array<Record<string, unknown>> }) {
  if (!data.length) {
    return <p className="muted">No rows.</p>;
  }
  const columns = Object.keys(data[0]);
  return (
    <div className="chart-table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td key={col}>{formatCell(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function RechartsBlock({ chart }: { chart: ChartPayload }) {
  const { theme } = useTheme();
  const light = theme === "light";
  const c = useMemo(() => chartPalette(light), [light]);
  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: c.tooltipBg,
      border: `1px solid ${c.tooltipBorder}`,
      borderRadius: 6,
      fontSize: 12,
      color: c.tooltipText,
    }),
    [c],
  );
  const axisProps = useMemo(
    () => ({
      stroke: c.axis,
      tick: { fill: c.tick, fontSize: 11 },
      tickLine: { stroke: c.axis },
    }),
    [c],
  );
  const kind = (chart.type || "").toLowerCase();
  if (kind === "bar") {
    return (
      <BarChart data={chart.data}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey={chart.xKey || "label"} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={chart.yKey || "value"} fill={c.fill} radius={[2, 2, 0, 0]} maxBarSize={48} />
      </BarChart>
    );
  }
  return (
    <LineChart data={chart.data}>
      <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
      <XAxis dataKey={chart.xKey || "label"} {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip contentStyle={tooltipStyle} />
      {chart.series && chart.series.length ? (
        chart.series.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            stroke={series.color || c.fill}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            name={series.label}
          />
        ))
      ) : (
        <Line
          type="monotone"
          dataKey={chart.yKey || "value"}
          stroke={c.fill}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      )}
    </LineChart>
  );
}

function ChartViz({ chart }: { chart: ChartPayload }) {
  const kind = (chart.type || "").toLowerCase();
  if (kind === "table") {
    return (
      <div className="chart-wrap chart-wrap--table">
        <DataTableChart data={chart.data} />
      </div>
    );
  }
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBlock chart={chart} />
      </ResponsiveContainer>
    </div>
  );
}

const initialCharts: ChartPlanItem[] = [];

const DATASET_FROM_UPLOAD_KEY = "ttd_dataset_from_upload";

function hasUserUploadedDataset(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(DATASET_FROM_UPLOAD_KEY) === "1";
}

type PipelineStep = {
  num: string;
  label: string;
  detail: string;
};

const PIPELINE: PipelineStep[] = [
  { num: "01", label: "Ingest", detail: "Upload CSV assets to the analysis environment." },
  { num: "02", label: "Calibrate", detail: "Profiler scans schema, types, and cardinality." },
  { num: "03", label: "Signals", detail: "Models propose dashboard views from your schema." },
  { num: "04", label: "Interrogate", detail: "Query through natural language with tool-backed answers." },
];

export default function Home() {
  const [charts, setCharts] = useState<ChartPlanItem[]>(initialCharts);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [profilingStatus, setProfilingStatus] = useState("checking");
  const [profilingEvents, setProfilingEvents] = useState<ProfilingEvent[]>([]);
  const [profilingError, setProfilingError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaPayload | null>(null);
  const [streamKey, setStreamKey] = useState(0);
  const [exploreReady, setExploreReady] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    setExploreReady(hasUserUploadedDataset());
  }, []);

  const currentPhase = useMemo(() => {
    if (!exploreReady) {
      return 0;
    }
    if (profilingStatus === "checking" || profilingStatus === "running") {
      return 1;
    }
    if (profilingStatus === "error" || profilingStatus === "offline") {
      return 1;
    }
    if (chatResponse) {
      return 3;
    }
    return 2;
  }, [exploreReady, profilingStatus, chatResponse]);

  async function readApiError(response: Response): Promise<string> {
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      return (
        payload.detail ||
        payload.message ||
        `Request failed (${response.status})`
      );
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  async function refreshSchemaAndPlan() {
    if (!hasUserUploadedDataset()) {
      setSchema(null);
      setCharts([]);
      setLoading(false);
      return;
    }

    try {
      const schemaResponse = await fetch(`${apiBase}/schema`);
      if (schemaResponse.ok) {
        const schemaPayload = (await schemaResponse.json()) as SchemaPayload;
        setSchema(schemaPayload);
      }
    } catch {
      setSchema(null);
    }

    try {
      const planResponse = await fetch(`${apiBase}/dashboard/plan`);
      if (planResponse.ok) {
        const planPayload = (await planResponse.json()) as ChartPlanResponse;
        setCharts(planPayload.charts || []);
      }
    } catch {
      setCharts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    let eventSource: EventSource | null = null;

    async function load() {
      try {
        const statusResponse = await fetch(`${apiBase}/profiling/status`);
        const statusPayload = await statusResponse.json();
        setProfilingStatus(statusPayload.status || "idle");
        if (statusPayload.error) {
          setProfilingError(statusPayload.error);
        }
        if (statusPayload.status === "done") {
          refreshSchemaAndPlan();
        }
      } catch {
        setProfilingStatus("offline");
      }

      eventSource = new EventSource(`${apiBase}/profiling/stream`);
      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data) as ProfilingEvent;
        setProfilingEvents((prev) => [...prev.slice(-24), payload]);
        if (payload.status === "completed") {
          setProfilingStatus("done");
          eventSource?.close();
          refreshSchemaAndPlan();
        }
        if (payload.status === "error") {
          setProfilingStatus("error");
          setProfilingError(payload.message || "Profiling failed");
          eventSource?.close();
        }
      };
      eventSource.onerror = () => {
        setProfilingStatus((prev) => (prev === "done" ? prev : "offline"));
        eventSource?.close();
      };
    }

    load();

    return () => {
      eventSource?.close();
    };
  }, [apiBase, streamKey]);

  const hasCharts = exploreReady && charts.length > 0;

  const statusPillClass = (() => {
    if (profilingStatus === "error") {
      return "status-pill status-pill--error";
    }
    if (profilingStatus === "offline") {
      return "status-pill status-pill--offline";
    }
    if (profilingStatus === "checking" || profilingStatus === "running") {
      return "status-pill status-pill--work";
    }
    if (profilingStatus === "done") {
      return "status-pill status-pill--live";
    }
    return "status-pill";
  })();

  const statusLabel = (() => {
    if (profilingStatus === "offline") {
      return "API offline";
    }
    if (profilingStatus === "error") {
      return "Profiler error";
    }
    if (profilingStatus === "checking") {
      return "Connecting…";
    }
    if (profilingStatus === "running") {
      return "Profiling";
    }
    if (profilingStatus === "done") {
      return exploreReady ? "Dataset ready" : "Awaiting ingest";
    }
    return profilingStatus;
  })();

  return (
    <>
      <Head>
        <title>Talk to Data — Intelligence workspace</title>
        <meta
          name="description"
          content="Upload CSVs, profile in real time, and interrogate data with a tool-backed analyst."
        />
      </Head>
      <div className="app-shell">
        <header className="top-bar">
          <div className="top-bar__brand">
            <span className="top-bar__logo">TTD</span>
            <span className="top-bar__title">Talk to Data</span>
          </div>
          <div className="top-bar__meta">
            <ThemeToggle />
            <span className={statusPillClass}>{statusLabel}</span>
            {exploreReady && (
              <span className="badge badge--signal">Workspace bound</span>
            )}
          </div>
        </header>

        <main className="page" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!exploreReady && (
            <>
              <section className="hero" style={{ marginTop: "80px" }}>
                <p className="hero__kicker">Dataset operations</p>
                <h1>Ingest, profile, and interrogate structured data</h1>
                <p className="hero__lede">
                  CSV-first pipeline: live profiling feeds schema context to planning and
                  retrieval. Responses are grounded in computed aggregates, not guesses.
                </p>
                <div className="upload-box">
                  <label className="upload-drop">
                    <input
                      type="file"
                      accept=".csv"
                      multiple
                      onChange={async (event) => {
                        const files = event.target.files;
                        if (!files || files.length === 0) {
                          return;
                        }
                        setUploading(true);
                        setUploadError(null);
                        setCharts([]);
                        setSchema(null);
                        setLoading(true);
                        try {
                          const formData = new FormData();
                          Array.from(files).forEach((file) =>
                            formData.append("files", file),
                          );
                          const response = await fetch(`${apiBase}/upload`, {
                            method: "POST",
                            body: formData,
                          });
                          if (!response.ok) {
                            throw new Error(await readApiError(response));
                          }
                          window.sessionStorage.setItem(DATASET_FROM_UPLOAD_KEY, "1");
                          setExploreReady(true);
                          setProfilingStatus("checking");
                          setProfilingEvents([]);
                          setStreamKey((prev) => prev + 1);
                        } catch (error) {
                          const message =
                            error instanceof Error ? error.message : "Upload failed.";
                          setUploadError(message);
                          setLoading(false);
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                    <span>
                      {uploading
                        ? "Uploading…"
                        : "Drop CSV files here or click to select · multiple files supported"}
                    </span>
                  </label>
                  {uploadError && <div className="chat-error">{uploadError}</div>}
                </div>
              </section>
            </>
          )}

          {exploreReady && (
            <div className="split-screen split-screen--active">
              {/* Left Panel: Profiling Log -> Chat UI */}
              <div className="split-screen__left">
                {profilingStatus !== "done" ? (
                  <>
                    <h2 style={{ fontSize: "1.1rem", margin: 0 }}>System Profiler</h2>
                    <p className="muted" style={{ marginBottom: "8px", fontSize: "0.85rem" }}>
                      Analysing dataset shape and constructing schema...
                    </p>
                    <div className="split-screen__scroll-area profiling-log">
                      {profilingEvents.map((event, index) => {
                        const isDone = event.status === "completed";
                        return (
                          <div
                            key={`${event.table ?? "event"}-${index}`}
                            className={`profiling-log__entry ${isDone ? "profiling-log__entry--done" : ""}`}
                          >
                            <div className="profiling-log__header">
                              <span>{event.file || event.table || "Telemetry"}</span>
                              <span>{event.status}</span>
                            </div>
                            <div className="profiling-log__body">
                              {event.rows_scanned && <span>Scanning {event.rows_scanned} records</span>}
                              {event.feature && <span>· Detected: {event.feature}</span>}
                              {event.message && <span>· {event.message}</span>}
                            </div>
                            {event.samples && event.samples.length > 0 && (
                              <div className="profiling-log__samples">
                                {event.samples.map((sample, sampleIndex) => (
                                  <span key={`${sample}-${sampleIndex}`} className="progress-chip">
                                    {sample}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <section className="chat-panel" aria-labelledby="analyst-heading">
                    <div className="chat-header">
                      <div>
                        <p className="section__title" id="analyst-heading">Analyst</p>
                        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Natural language query</h2>
                      </div>
                    </div>
                    <div className="chat-body" style={{ border: "none" }}>
                      <div className="split-screen__scroll-area" style={{ padding: "0 8px 16px 0" }}>
                        {chatResponse ? (
                          <div className="chat-message">
                            <strong>Summary</strong>
                            <br />
                            {chatResponse.summary}
                            <div className="chat-meta">Confidence · {chatResponse.confidence}</div>
                            {chatResponse.data_source && (
                              <div className="chat-meta chat-meta--tight">
                                Provenance · {chatResponse.data_source}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="chat-message">
                            Submit a question to receive a structured answer. Figures are computed from your CSVs.
                          </div>
                        )}
                        {chatResponse?.chart?.data?.length ? (
                          <div style={{ marginTop: "16px", height: "300px" }}>
                            <ChartViz chart={chatResponse.chart} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="chat-input" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                      <input
                        type="text"
                        placeholder="e.g. Sum volume by region for Q1"
                        value={question}
                        disabled={chatLoading}
                        onChange={(event) => setQuestion(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !chatLoading && question.trim()) {
                            e.preventDefault();
                            document.getElementById('ttd-btn-execute')?.click();
                          }
                        }}
                      />
                      <button
                        id="ttd-btn-execute"
                        type="button"
                        disabled={chatLoading || !question.trim()}
                        onClick={async () => {
                          setChatLoading(true);
                          setChatError(null);
                          try {
                            const response = await fetch(`${apiBase}/chat`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ question: question.trim() }),
                            });
                            if (!response.ok) throw new Error(await readApiError(response));
                            const payload = (await response.json()) as ChatResponse;
                            if (!payload?.summary) throw new Error("Agent response was incomplete.");
                            setChatResponse(payload);
                          } catch (error) {
                            setChatError(error instanceof Error ? error.message : "Could not reach the data agent right now.");
                          } finally {
                            setChatLoading(false);
                          }
                        }}
                      >
                        {chatLoading ? "Running…" : "Execute"}
                      </button>
                    </div>
                    {chatError && <div className="chat-error">{chatError}</div>}
                  </section>
                )}
              </div>

              {/* Right Panel: Schema Loading -> Signals */}
              <div className="split-screen__right">
                {profilingStatus !== "done" || loading ? (
                  <div className="schema-building">
                    <div><span className="pulse-loader"></span><span className="pulse-loader" style={{animationDelay: "0.2s"}}></span><span className="pulse-loader" style={{animationDelay: "0.4s"}}></span></div>
                    <h3 style={{ marginTop: "24px" }}>Inferring Schema & Generating Signals</h3>
                    <p style={{ maxWidth: "260px" }}>LLM is currently inspecting columns, grouping data structures, and generating relevant dashboard charts...</p>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Signals & Schema</h2>
                    <div className="split-screen__scroll-area">
                      {schema?.tables && Object.keys(schema.tables).length > 0 && (
                         <div className="schema-body" style={{ marginBottom: "24px" }}>
                           {Object.entries(schema.tables).map(([tableName, table]) => (
                             <div key={tableName} className="schema-table" style={{ background: "var(--bg-inset)" }}>
                               <div className="schema-title">
                                 <span>{tableName}</span>
                                 <span className="muted">{(table.row_count ?? 0).toLocaleString()} rows</span>
                               </div>
                               <div className="schema-columns">
                                 {table.columns &&
                                   Object.entries(table.columns)
                                     .slice(0, 12)
                                     .map(([colName, col]) => (
                                       <div key={colName} className="schema-chip" style={{ background: "var(--bg-panel)" }}>
                                         {colName}
                                         <span className="muted">{col.inferred_type || "unknown"}</span>
                                       </div>
                                     ))}
                               </div>
                             </div>
                           ))}
                         </div>
                      )}
                      
                      <div className="grid">
                        {charts.map((item, index) => (
                          <article key={`${item.title}-${index}`} className="card" style={{ height: "350px", display: "flex", flexDirection: "column" }}>
                            <h3>{item.title}</h3>
                            {item.description && <p className="hint">{item.description}</p>}
                            <div style={{ flex: 1, minHeight: 0 }}>
                              <ChartViz chart={item.chart} />
                            </div>
                          </article>
                        ))}
                      </div>
                      
                      {!hasCharts && (
                        <div className="card">
                          <h3>No panels returned</h3>
                          <p className="hint">The planner returned no chart specs. Check schema or try another upload.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
        </main>
      </div>
    </>
  );
}
