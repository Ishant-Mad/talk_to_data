import Head from "next/head";
import { useEffect, useMemo, useState, useRef } from "react";
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
  PieChart,
  Pie,
  Cell,
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
  query?: {
    table: string;
    operation?: string;
  };
  valid_combinations?: Array<{ x: string; y: string; operation: string, type?: string }>;
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

type ChartPayload = ChartPlanItem["chart"];

type ChatMessageItem = {
  role: "user" | "assistant";
  content?: string;
  summary?: string;
  data_source?: string;
  chart?: any;
  confidence?: string;
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

function RechartsBlock({ chart, ...rest }: { chart: ChartPayload, [key: string]: any }) {
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
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6'];
  const darkCOLORS = ['#3b82f6', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#818cf8', '#f472b6', '#2dd4bf'];
  const colorsList = light ? COLORS : darkCOLORS;

  const dataKeys = chart.data && chart.data.length > 0 ? Object.keys(chart.data[0]) : [];
  const inferX = chart.xKey || (dataKeys.length > 0 ? dataKeys[0] : "label");
  let inferY = chart.yKey;
  if (!inferY) {
    const numerics = dataKeys.filter(k => typeof chart.data[0][k] === 'number');
    inferY = numerics.length > 0 ? numerics[0] : (dataKeys.length > 1 ? dataKeys[1] : "value");
  }

  if (kind === "pie") {
    return (
      <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }} {...rest}>
        <Pie
          data={chart.data}
          dataKey={inferY}
          nameKey={inferX}
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={35}
          paddingAngle={3}
          label={({ name, value }) => {
            const formatted = typeof value === 'number' ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value) : value;
            return `${name} (${formatted})`;
          }}
        >
          {chart.data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorsList[index % colorsList.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    );
  }
  if (kind === "bar") {
    return (
      <BarChart data={chart.data} {...rest}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey={inferX} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={inferY} fill={c.fill} radius={[2, 2, 0, 0]} maxBarSize={48} />
      </BarChart>
    );
  }
  return (
    <LineChart data={chart.data} {...rest}>
      <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
      <XAxis dataKey={inferX} {...axisProps} />
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
          dataKey={inferY}
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
      <div className="chart-wrap chart-wrap--table" style={{ width: "100%", height: "250px", overflow: "auto" }}>
        <DataTableChart data={chart.data} />
      </div>
    );
  }
  return (
    <div className="chart-wrap" style={{ width: "100%", height: 250 }}>
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

function InteractiveCard({ item, index }: { item: ChartPlanItem; index: number }) {
  const [localChart, setLocalChart] = useState(item.chart);
  const [selectedX, setSelectedX] = useState(item.chart.xKey || "");
  const [selectedY, setSelectedY] = useState(item.chart.yKey || "");
  const [selectedOp, setSelectedOp] = useState(item.query?.operation || "sum");
  const [loadingNewData, setLoadingNewData] = useState(false);
  const combinations = item.valid_combinations || [];

  const apiBase = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000" : "http://127.0.0.1:8000";

  // Listen for focus requests from Chat
  useEffect(() => {
    const handleFocus = (evt: CustomEvent) => {
      const { table, chart } = evt.detail;
      if (item.query?.table && table && item.query.table.toLowerCase() === table.toLowerCase()) {
        const cardEl = document.getElementById(`interactive-card-${index}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
          // Optional pulse effect
          cardEl.style.transition = "transform 0.3s, box-shadow 0.3s";
          cardEl.style.transform = "scale(1.02)";
          cardEl.style.boxShadow = "0 0 20px rgba(0, 122, 255, 0.4)";
          setTimeout(() => {
            cardEl.style.transform = "scale(1)";
            cardEl.style.boxShadow = "";
          }, 1000);
        }
        
        // Match x/y if possible
        if (chart && chart.xKey && chart.yKey) {
          const combo = combinations.find(c => c.x === chart.xKey && c.y === chart.yKey);
          if (combo) {
            setSelectedX(combo.x);
            setSelectedY(combo.y);
            setSelectedOp(combo.operation);
          }
        } else if (chart && chart.xKey) {
          const combo = combinations.find(c => c.x === chart.xKey);
          if (combo) {
            setSelectedX(combo.x);
            setSelectedY(combo.y);
            setSelectedOp(combo.operation);
          }
        }
      }
    };
    window.addEventListener("focus-chart", handleFocus as EventListener);
    return () => window.removeEventListener("focus-chart", handleFocus as EventListener);
  }, [item.query, combinations, index]);

  // When X/Y change, fetch new data block
  useEffect(() => {
    if (selectedX === item.chart.xKey && selectedY === item.chart.yKey && selectedOp === item.query?.operation) {
      setLocalChart(item.chart);
      return;
    }
    const combo = combinations.find(c => c.x === selectedX && c.y === selectedY && c.operation === selectedOp);
    if (!combo || !item.query?.table) return;

    setLoadingNewData(true);
    fetch(`${apiBase}/dashboard/widget_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: item.query.table, x: selectedX, y: selectedY, operation: selectedOp })
    })
      .then(res => res.json())
      .then(res => {
         const isTime = selectedX.includes("date") || selectedX.includes("time") || selectedX.includes("year") || selectedX.includes("month") || selectedX.includes("week") || selectedX.includes("quarter");
         const detectedType = combo.type || (isTime ? "line" : "bar");
         setLocalChart(prev => ({ ...prev, type: prev.type === 'pie' && !isTime ? 'pie' : detectedType, xKey: selectedX, yKey: "value", data: res.data || [] }));
      })
      .finally(() => setLoadingNewData(false));
  }, [selectedX, selectedY, selectedOp, apiBase, item.chart, item.query?.table, item.query?.operation, combinations]);

  // Derived options ensuring invalid combinations vanish
  // (Removed since we only use combinations map now)

  return (
    <article id={`interactive-card-${index}`} className="card" style={{ height: "420px", display: "flex", flexDirection: "column", position: "relative", transition: "transform 0.3s, box-shadow 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <h3>{item.title}</h3>
          {item.description && <p className="hint">{item.description}</p>}
        </div>
      </div>
      
      {combinations.length > 0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
          <select 
            value={`${selectedX}|${selectedY}|${selectedOp}`} 
            onChange={(e) => {
              const [newX, newY, newOp] = e.target.value.split("|");
              setSelectedX(newX);
              setSelectedY(newY);
              setSelectedOp(newOp);
            }}
            style={{ padding: "4px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-panel)", color: "var(--text-primary)", flex: 1, minWidth: 0, textOverflow: "ellipsis" }}
          >
            {combinations.map(combo => (
              <option key={`${combo.x}|${combo.y}|${combo.operation}`} value={`${combo.x}|${combo.y}|${combo.operation}`}>
                {combo.operation.toUpperCase()} of {combo.y} by {combo.x}
              </option>
            ))}
          </select>
          {!(selectedX.includes("date") || selectedX.includes("time") || selectedX.includes("year") || selectedX.includes("month") || selectedX.includes("week") || selectedX.includes("quarter")) && (
            <div className={`segmented-control ${(localChart.type || '').toLowerCase() === 'pie' ? 'segmented-control--index-1' : 'segmented-control--index-0'}`} style={{ margin: 0 }}>
              <div className="segmented-control__slider"></div>
              <button type="button" className={(localChart.type || '').toLowerCase() !== 'pie' ? 'active' : ''} onClick={() => setLocalChart(prev => ({ ...prev, type: 'bar' }))} style={{ zIndex: 1, backgroundColor: 'transparent', padding: "4px 12px", fontSize: "0.8rem" }}>Bar</button>
              <button type="button" className={(localChart.type || '').toLowerCase() === 'pie' ? 'active' : ''} onClick={() => setLocalChart(prev => ({ ...prev, type: 'pie' }))} style={{ zIndex: 1, backgroundColor: 'transparent', padding: "4px 12px", fontSize: "0.8rem" }}>Pie</button>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, opacity: loadingNewData ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <ChartViz chart={localChart} />
      </div>
      {loadingNewData && <div className="pulse-loader" style={{ position: "absolute", top: "50%", left: "50%" }}></div>}
    </article>
  );
}

export default function Home() {
  const [charts, setCharts] = useState<ChartPlanItem[]>(initialCharts);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [profilingStatus, setProfilingStatus] = useState("checking");
  const [profilingEvents, setProfilingEvents] = useState<ProfilingEvent[]>([]);
  const [profilingError, setProfilingError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessageItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaPayload | null>(null);
  const [streamKey, setStreamKey] = useState(0);
  const [exploreReady, setExploreReady] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"schema" | "signals">("signals");
  const [signalsLoading, setSignalsLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
    if (chatHistory.length > 0) {
      return 3;
    }
    return 2;
  }, [exploreReady, profilingStatus, chatHistory]);

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
      setSignalsLoading(false);
      return;
    }

    try {
      const schemaResponse = await fetch(`${apiBase}/schema`);
      if (schemaResponse.ok) {
        const schemaPayload = (await schemaResponse.json()) as SchemaPayload;
        if (!schemaPayload.tables || Object.keys(schemaPayload.tables).length === 0) {
          if (typeof window !== "undefined") {
            localStorage.removeItem(DATASET_FROM_UPLOAD_KEY);
          }
          setExploreReady(false);
          setSchema(null);
          setCharts([]);
          setLoading(false);
          setSignalsLoading(false);
          return;
        }
        setSchema(schemaPayload);
      }
    } catch {
      setSchema(null);
    }
    
    // Stop global loading so the schema view renders immediately
    setLoading(false);
    
    // Switch to schema tab to show users the computed result!
    setActiveRightTab("schema");
    setSignalsLoading(true);

    try {
      const planStart = Date.now();
      const planResponse = await fetch(`${apiBase}/dashboard/plan`);
      if (planResponse.ok) {
        const planPayload = (await planResponse.json()) as ChartPlanResponse;
        setCharts(planPayload.charts || []);
      }
      
      const elapsed = Date.now() - planStart;
      const minimumDisplayTime = 1000; // Force schema tab to stay open for at least 1 real second
      
      setTimeout(() => {
        setSignalsLoading(false);
        setActiveRightTab("signals");
      }, Math.max(0, minimumDisplayTime - elapsed));

    } catch {
      setCharts([]);
      setSignalsLoading(false);
    }
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
        if (statusPayload.status === "done" || (statusPayload.status === "idle" && hasUserUploadedDataset())) {
          refreshSchemaAndPlan();
        }
      } catch {
        setProfilingStatus("offline");
      }

      eventSource = new EventSource(`${apiBase}/profiling/stream`);
      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data) as ProfilingEvent;
        // Keep a larger buffer so previous tables are not aggressively sliced out
        setProfilingEvents((prev) => [...prev.slice(-2000), payload]);
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

  const liveTables = useMemo(() => {
    const tables: Record<string, { tableName: string, status: string, rows_scanned: number, features: Record<string, string[]> }> = {};
    for (const ev of profilingEvents) {
      if (!ev.table) continue;
      if (!tables[ev.table]) {
        tables[ev.table] = {
          tableName: ev.table,
          status: ev.status || "scanning",
          rows_scanned: 0,
          features: {},
        };
      }
      const t = tables[ev.table];
      t.status = ev.status || t.status;
      if (ev.rows_scanned && ev.rows_scanned > t.rows_scanned) {
        t.rows_scanned = ev.rows_scanned;
      }
      if (ev.feature) {
        t.features[ev.feature] = ev.samples || [];
      }
    }
    return Object.values(tables);
  }, [profilingEvents]);

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
                      {liveTables.map((table, index) => {
                        const isDone = table.status === "done" || table.status === "completed";
                        const featuresList = Object.keys(table.features);
                        const latestFeature = featuresList.length > 0 ? featuresList[featuresList.length - 1] : null;
                        return (
                          <div
                            key={`${table.tableName}-${index}`}
                            className={`profiling-log__entry ${isDone ? "profiling-log__entry--done" : ""}`}
                          >
                            <div className="profiling-log__header">
                              <span>{table.tableName}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {!isDone && <span className="pulse-loader" style={{ margin: 0, width: '6px', height: '6px' }}></span>}
                                {table.status}
                              </span>
                            </div>
                            <div className="profiling-log__body">
                              {table.rows_scanned > 0 && <span>Scanning {table.rows_scanned.toLocaleString()} records</span>}
                              {latestFeature && <span>· Detected: {latestFeature}</span>}
                            </div>
                            {latestFeature && table.features[latestFeature].length > 0 && (
                              <div className="profiling-log__samples">
                                {table.features[latestFeature].map((sample, sampleIndex) => (
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
                  <section className="chat-panel" aria-labelledby="analyst-heading" style={{ flex: 1, minHeight: 0 }}>
                    <div className="chat-header" style={{ flexShrink: 0 }}>
                      <div>
                        <p className="section__title" id="analyst-heading">Analyst</p>
                        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Natural language query</h2>
                      </div>
                    </div>
                    <div className="chat-body" style={{ border: "none", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      <div className="split-screen__scroll-area" style={{ padding: "0 8px 16px 0", flex: 1, display: "flex", flexDirection: "column" }}>
                        {chatHistory.length > 0 ? (
                          chatHistory.map((msg, index) => (
                            <div key={index} className="chat-message" style={{ marginBottom: "20px" }}>
                              {msg.role === "user" ? (
                                <div style={{ 
                                  alignSelf: "flex-end", 
                                  background: "var(--accent-muted)", 
                                  color: "var(--text)", 
                                  padding: "10px 14px", 
                                  borderRadius: "12px", 
                                  display: "inline-block", 
                                  maxWidth: "85%",
                                  marginBottom: "12px" 
                                }}>
                                  {msg.content}
                                </div>
                              ) : (
                                <div style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
                                  <strong>Summary</strong>
                                  <br />
                                  {msg.summary}
                                  <div className="chat-meta">Confidence · {msg.confidence}</div>
                                  {msg.data_source && (
                                    <div className="chat-meta chat-meta--tight">
                                      Provenance · <a href="#!" onClick={(e) => {
                                        e.preventDefault();
                                        setActiveRightTab("signals");
                                        setTimeout(() => {
                                          window.dispatchEvent(new CustomEvent("focus-chart", {
                                            detail: { table: msg.data_source, chart: msg.chart }
                                          }));
                                        }, 100);
                                      }} style={{ color: "var(--accent)", textDecoration: "underline", cursor: "pointer" }}>{msg.data_source}</a>
                                    </div>
                                  )}
                                  {msg.chart?.data?.length ? (
                                    <div style={{ marginTop: "16px", height: "300px" }}>
                                      <ChartViz chart={msg.chart} />
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="chat-message">
                            Submit a question to receive a structured answer. Figures are computed from your CSVs.
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                    <div className="chat-input" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", flexShrink: 0 }}>
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
                            const userMsg = question.trim();
                            setChatHistory(prev => [...prev, { role: "user", content: userMsg }]);
                            setQuestion("");
                            setChatLoading(true);
                            setChatError(null);
                          try {
                            const response = await fetch(`${apiBase}/chat`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ question: userMsg }),
                            });
                            if (!response.ok) throw new Error(await readApiError(response));
                            const payload = (await response.json()) as ChatResponse;
                            if (!payload?.summary) throw new Error("Agent response was incomplete.");
                            setChatHistory(prev => [...prev, { role: "assistant", ...payload }]);
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
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Live Schema Assembly</h2>
                      <div><span className="pulse-loader" style={{margin: 0, marginRight: '4px'}}></span><span className="pulse-loader" style={{margin: 0, marginRight: '4px', animationDelay: "0.2s"}}></span><span className="pulse-loader" style={{margin: 0, animationDelay: "0.4s"}}></span></div>
                    </div>
                    <div className="split-screen__scroll-area">
                      {liveTables.length === 0 ? (
                        <div className="schema-building">
                          <p style={{ maxWidth: "260px" }}>Awaiting telemetry to begin schema inference...</p>
                        </div>
                      ) : (
                        <div className="schema-body">
                          {liveTables.map((table, index) => {
                            const features = Object.keys(table.features);
                            const isTableDone = table.status === "done" || table.status === "completed";
                            return (
                              <div key={`${table.tableName}-${index}`} className="schema-table" style={{ background: "var(--bg-inset)", animation: "fade-in 0.5s", border: isTableDone ? "1px solid var(--signal-muted)" : undefined }}>
                                <div className="schema-title">
                                  <span>{table.tableName} {isTableDone && <span style={{color: "var(--signal)", fontSize: "0.8em", marginLeft: "6px"}}>✓</span>}</span>
                                  <span className="muted">{isTableDone ? "Complete" : "Scanning"} · {table.rows_scanned.toLocaleString()} rows</span>
                                </div>
                                <div className="schema-columns">
                                  {features.map((featureName) => (
                                    <div key={featureName} className="schema-chip" style={{ background: "var(--bg-panel)", borderColor: isTableDone ? "transparent" : "var(--border-focus)", animation: "slide-in 0.3s" }}>
                                      {featureName}
                                      <span className="muted" style={{ color: isTableDone ? "var(--text-secondary)" : "var(--accent)" }}>
                                        {isTableDone ? "mapped" : "indexing..."}
                                      </span>
                                    </div>
                                  ))}
                                  {!isTableDone && (
                                    <div className="schema-chip" style={{ borderStyle: "dashed", opacity: 0.6 }}>
                                      <span className="pulse-loader" style={{ margin: 0, width: '4px', height: '4px' }}></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Signals & Schema</h2>
                      <div className={`segmented-control ${activeRightTab === 'schema' ? 'segmented-control--index-0' : 'segmented-control--index-1'}`}>
                        <div className="segmented-control__slider"></div>
                        <button type="button" className={activeRightTab === 'schema' ? 'active' : ''} onClick={() => setActiveRightTab('schema')} style={{ zIndex: 1, backgroundColor: 'transparent' }}>Schema</button>
                        <button type="button" className={activeRightTab === 'signals' ? 'active' : ''} onClick={() => setActiveRightTab('signals')} style={{ zIndex: 1, backgroundColor: 'transparent' }}>Signals</button>
                      </div>
                    </div>
                    <div className="split-screen__scroll-area" style={{ position: 'relative' }}>
                      {activeRightTab === 'schema' && (
                        <div style={{ animation: 'fade-in 0.4s' }}>
                          {schema?.tables && Object.keys(schema.tables).length > 0 ? (
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
                          ) : (
                            <div className="card">
                              <h3>No schema built</h3>
                              <p className="hint">Could not retrieve schema payload.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeRightTab === 'signals' && (
                        <div style={{ animation: 'fade-in 0.4s' }}>
                          {signalsLoading ? (
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                              <div><span className="pulse-loader" style={{margin: 0, marginRight: '4px'}}></span><span className="pulse-loader" style={{margin: 0, marginRight: '4px', animationDelay: "0.2s"}}></span><span className="pulse-loader" style={{margin: 0, animationDelay: "0.4s"}}></span></div>
                              <p className="muted">Analyzing schema and generating visual signals...</p>
                            </div>
                          ) : (
                            <>
                              <div className="grid">
                                {charts.map((item, index) => (
                                  <InteractiveCard key={`${item.title}-${index}`} item={item} index={index} />
                                ))}
                              </div>
                              
                              {!hasCharts && (
                                <div className="card">
                                  <h3>No panels returned</h3>
                                  <p className="hint">The planner returned no chart specs. Check schema or try another upload.</p>
                                </div>
                              )}
                            </>
                          )}
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
