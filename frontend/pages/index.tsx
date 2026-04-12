import Head from "next/head";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

/* ================================================================
   CHART PALETTE — light mode with indigo accent
   ================================================================ */
function chartPalette() {
  return {
    axis: "#94A3B8",
    grid: "#F1F5F9",
    fill: "#6366F1",
    tooltipBg: "#ffffff",
    tooltipBorder: "#E2E8F0",
    tooltipText: "#1E293B",
    tick: "#94A3B8",
  };
}

/* ================================================================
   TYPES
   ================================================================ */
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
  valid_combinations?: Array<{
    x: string;
    y: string;
    operation: string;
    type?: string;
  }>;
};

type ChartPlanResponse = { charts: ChartPlanItem[] };

type ApiErrorPayload = { detail?: string; message?: string };

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

/* ================================================================
   DATA TABLE
   ================================================================ */
function DataTableChart({ data }: { data: Array<Record<string, unknown>> }) {
  if (!data.length) return <p className="muted">No rows.</p>;
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
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/* ================================================================
   RECHARTS BLOCK
   ================================================================ */
function RechartsBlock({
  chart,
  ...rest
}: {
  chart: ChartPayload;
  [key: string]: any;
}) {
  const c = chartPalette();
  const tooltipStyle = {
    backgroundColor: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
    color: c.tooltipText,
  };
  const axisProps = {
    stroke: c.axis,
    tick: { fill: c.tick, fontSize: 11 },
    tickLine: { stroke: c.axis },
  };
  const kind = (chart.type || "").toLowerCase();
  const COLORS = [
    "#6366F1",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#3B82F6",
  ];

  const dataKeys =
    chart.data && chart.data.length > 0 ? Object.keys(chart.data[0]) : [];
  const inferX = chart.xKey || (dataKeys.length > 0 ? dataKeys[0] : "label");
  let inferY = chart.yKey;
  if (!inferY) {
    const numerics = dataKeys.filter(
      (k) => typeof chart.data[0][k] === "number",
    );
    inferY =
      numerics.length > 0
        ? numerics[0]
        : dataKeys.length > 1
          ? dataKeys[1]
          : "value";
  }

  if (kind === "pie") {
    return (
      <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }} {...rest}>
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
            const formatted =
              typeof value === "number"
                ? new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                : value;
            return `${name} (${formatted})`;
          }}
        >
          {chart.data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        <Bar
          dataKey={inferY}
          fill={c.fill}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
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

/* ================================================================
   CHART VIZ WRAPPER
   ================================================================ */
function ChartViz({ chart }: { chart: ChartPayload }) {
  const kind = (chart.type || "").toLowerCase();
  if (kind === "table") {
    return (
      <div
        className="chart-wrap chart-wrap--table"
        style={{ width: "100%", overflow: "auto" }}
      >
        <DataTableChart data={chart.data} />
      </div>
    );
  }
  return (
    <div className="chart-wrap" style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBlock chart={chart} />
      </ResponsiveContainer>
    </div>
  );
}

/* ================================================================
   INTERACTIVE SIGNAL CARD
   ================================================================ */
function InteractiveCard({
  item,
  index,
}: {
  item: ChartPlanItem;
  index: number;
}) {
  const [localChart, setLocalChart] = useState(item.chart);
  const [selectedX, setSelectedX] = useState(item.chart.xKey || "");
  const [selectedY, setSelectedY] = useState(item.chart.yKey || "");
  const [selectedOp, setSelectedOp] = useState(item.query?.operation || "sum");
  const [loadingNewData, setLoadingNewData] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const combinations = item.valid_combinations || [];

  const apiBase =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      : "http://127.0.0.1:8000";

  useEffect(() => {
    const handleFocus = (evt: CustomEvent) => {
      const { table, chart } = evt.detail;
      if (
        item.query?.table &&
        table &&
        item.query.table.toLowerCase() === table.toLowerCase()
      ) {
        setIsExpanded(true);
        const cardEl = document.getElementById(`interactive-card-${index}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
          cardEl.style.transition = "transform 0.3s, box-shadow 0.3s";
          cardEl.style.transform = "scale(1.02)";
          cardEl.style.boxShadow = "0 0 0 2px #6366F1";
          setTimeout(() => {
            cardEl.style.transform = "scale(1)";
            cardEl.style.boxShadow = "";
          }, 1000);
        }
        if (chart && chart.xKey && chart.yKey) {
          const combo = combinations.find(
            (c) => c.x === chart.xKey && c.y === chart.yKey,
          );
          if (combo) {
            setSelectedX(combo.x);
            setSelectedY(combo.y);
            setSelectedOp(combo.operation);
          }
        } else if (chart && chart.xKey) {
          const combo = combinations.find((c) => c.x === chart.xKey);
          if (combo) {
            setSelectedX(combo.x);
            setSelectedY(combo.y);
            setSelectedOp(combo.operation);
          }
        }
      }
    };
    window.addEventListener("focus-chart", handleFocus as EventListener);
    return () =>
      window.removeEventListener("focus-chart", handleFocus as EventListener);
  }, [item.query, combinations, index]);

  useEffect(() => {
    if (
      selectedX === item.chart.xKey &&
      selectedY === item.chart.yKey &&
      selectedOp === item.query?.operation
    ) {
      setLocalChart(item.chart);
      return;
    }
    const combo = combinations.find(
      (c) =>
        c.x === selectedX && c.y === selectedY && c.operation === selectedOp,
    );
    if (!combo || !item.query?.table) return;

    setLoadingNewData(true);
    fetch(`${apiBase}/dashboard/widget_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: item.query.table,
        x: selectedX,
        y: selectedY,
        operation: selectedOp,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        const isTime =
          selectedX.includes("date") ||
          selectedX.includes("time") ||
          selectedX.includes("year") ||
          selectedX.includes("month") ||
          selectedX.includes("week") ||
          selectedX.includes("quarter");
        const detectedType = combo.type || (isTime ? "line" : "bar");
        setLocalChart((prev) => ({
          ...prev,
          type: prev.type === "pie" && !isTime ? "pie" : detectedType,
          xKey: selectedX,
          yKey: "value",
          data: res.data || [],
        }));
      })
      .finally(() => setLoadingNewData(false));
  }, [
    selectedX,
    selectedY,
    selectedOp,
    apiBase,
    item.chart,
    item.query?.table,
    item.query?.operation,
    combinations,
  ]);

  const isTime =
    selectedX.includes("date") ||
    selectedX.includes("time") ||
    selectedX.includes("year") ||
    selectedX.includes("month") ||
    selectedX.includes("week") ||
    selectedX.includes("quarter");

  return (
    <div
      id={`interactive-card-${index}`}
      className="signal-card-wrapper"
      style={{ transition: "transform 0.3s, box-shadow 0.3s" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <p className="signal-card__title" style={{ margin: 0 }}>
          {item.title}
        </p>
        <span
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
            color: "#94A3B8",
          }}
        >
          ▼
        </span>
      </div>

      {isExpanded && (
        <div style={{ marginTop: "16px" }}>
          {item.description && (
            <p className="signal-card__sub">{item.description}</p>
          )}

          {combinations.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <select
                value={`${selectedX}|${selectedY}|${selectedOp}`}
                onChange={(e) => {
                  const [newX, newY, newOp] = e.target.value.split("|");
                  setSelectedX(newX);
                  setSelectedY(newY);
                  setSelectedOp(newOp);
                }}
                style={{ flex: 1, minWidth: 0 }}
              >
                {combinations.map((combo) => (
                  <option
                    key={`${combo.x}|${combo.y}|${combo.operation}`}
                    value={`${combo.x}|${combo.y}|${combo.operation}`}
                  >
                    {combo.operation.toUpperCase()} of {combo.y} by {combo.x}
                  </option>
                ))}
              </select>

              {!isTime && (
                <div
                  className={`segmented-control ${(localChart.type || "").toLowerCase() === "pie" ? "segmented-control--index-1" : "segmented-control--index-0"}`}
                  style={{ margin: 0 }}
                >
                  <div className="segmented-control__slider" />
                  <button
                    type="button"
                    className={
                      (localChart.type || "").toLowerCase() !== "pie"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setLocalChart((prev) => ({ ...prev, type: "bar" }))
                    }
                    style={{ zIndex: 1, backgroundColor: "transparent" }}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    className={
                      (localChart.type || "").toLowerCase() === "pie"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setLocalChart((prev) => ({ ...prev, type: "pie" }))
                    }
                    style={{ zIndex: 1, backgroundColor: "transparent" }}
                  >
                    Pie
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              opacity: loadingNewData ? 0.5 : 1,
              transition: "opacity 0.2s",
              position: "relative",
            }}
          >
            <ChartViz chart={localChart} />
            {loadingNewData && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                }}
              >
                <div className="dot-loader">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CONSTANTS & HELPERS
   ================================================================ */
const initialCharts: ChartPlanItem[] = [];
const DATASET_FROM_UPLOAD_KEY = "ttd_dataset_from_upload";

function hasUserUploadedDataset(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DATASET_FROM_UPLOAD_KEY) === "1";
}

function getTypeBadgeClass(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("int") || t.includes("float") || t.includes("number"))
    return "type-badge type-badge--int";
  if (t.includes("date") || t.includes("time"))
    return "type-badge type-badge--date";
  if (t.includes("bool")) return "type-badge type-badge--bool";
  return "type-badge type-badge--text";
}

function typeLabel(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("int")) return "INT";
  if (t.includes("float")) return "FLOAT";
  if (t.includes("date")) return "DATE";
  if (t.includes("bool")) return "BOOL";
  if (t.includes("text") || t.includes("str")) return "TEXT";
  return type.toUpperCase().slice(0, 6) || "?";
}

// Demo datasets — presentational only, clicking opens file picker
const DEMO_DATASETS = [
  {
    id: "single",
    badge: "📄",
    badgeColor: "#EEF2FF",
    name: "Single CSV File",
    desc: "Uses business_data.csv from the data2 folder.",
    meta: "1 file",
  },
  {
    id: "multiple",
    badge: "📂",
    badgeColor: "#ECFDF5",
    name: "Multiple CSV Files",
    desc: "Uses complaints.csv, customers.csv, support_tickets.csv, and transactions.csv from the data2 folder.",
    meta: "4 files",
  },
];

const SUGGESTION_CHIPS = [
  "Show revenue by region for Q1",
  "Which product had the most returns?",
  "Compare support tickets by month",
];

/* ================================================================
   MAIN PAGE
   ================================================================ */
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const handleDemoClick = async (demoId: string) => {
    setUploading(true);
    setUploadError(null);
    setProfilingStatus("checking");

    // Simulate a brief delay to show loading state
    await new Promise((r) => setTimeout(r, 400));

    // We mock a successful "upload" by transitioning to profiling
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DATASET_FROM_UPLOAD_KEY, "1");
    }

    setProfilingStatus("profiling");
    setProfilingEvents([
      { message: `Loading demo dataset: ${demoId}...`, status: "info" },
    ]);

    setTimeout(() => {
      setProfilingEvents((p) => [
        ...p,
        { message: "Generating dashboard...", status: "info" },
      ]);
      setLoading(false); // End loading flow
      setExploreReady(true);
      setUploading(false);
    }, 1000);
  };

  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaPayload | null>(null);
  const [streamKey, setStreamKey] = useState(0);
  const [exploreReady, setExploreReady] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"schema" | "signals">(
    "signals",
  );
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<
    "chat" | "sources" | "signals"
  >("chat");
  const [showTip, setShowTip] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    setExploreReady(hasUserUploadedDataset());
  }, []);

  // Show first-load tip when workspace first opens
  useEffect(() => {
    if (
      exploreReady &&
      profilingStatus === "done" &&
      chatHistory.length === 0
    ) {
      setShowTip(true);
      const t = setTimeout(() => setShowTip(false), 5000);
      return () => clearTimeout(t);
    }
  }, [exploreReady, profilingStatus, chatHistory.length]);

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
        if (
          !schemaPayload.tables ||
          Object.keys(schemaPayload.tables).length === 0
        ) {
          // Schema is empty — profiling may still be in progress, do NOT reset exploreReady.
          // Just bail out silently; the SSE stream will call refreshSchemaAndPlan() when done.
          setLoading(false);
          setSignalsLoading(false);
          return;
        }
        setSchema(schemaPayload);
      }
    } catch {
      setSchema(null);
    }

    setLoading(false);
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
      setTimeout(
        () => {
          setSignalsLoading(false);
          setActiveRightTab("signals");
        },
        Math.max(0, 1000 - elapsed),
      );
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
        if (statusPayload.error) setProfilingError(statusPayload.error);
        // Only refresh schema/plan when profiling is fully done.
        // Do NOT trigger on "idle" — that fires right after upload before profiling starts,
        // causing an empty schema response that previously kicked the user back to landing.
        if (statusPayload.status === "done") {
          refreshSchemaAndPlan();
        }
      } catch {
        setProfilingStatus("offline");
      }

      eventSource = new EventSource(`${apiBase}/profiling/stream`);
      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data) as ProfilingEvent;
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
    const tables: Record<
      string,
      {
        tableName: string;
        status: string;
        rows_scanned: number;
        features: Record<string, string[]>;
      }
    > = {};
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
      if (ev.rows_scanned && ev.rows_scanned > t.rows_scanned)
        t.rows_scanned = ev.rows_scanned;
      if (ev.feature) t.features[ev.feature] = ev.samples || [];
    }
    return Object.values(tables);
  }, [profilingEvents]);

  const hasCharts = exploreReady && charts.length > 0;

  /* ---- Status pill ---- */
  const statusPillClass = (() => {
    if (profilingStatus === "error") return "status-pill status-pill--error";
    if (profilingStatus === "offline")
      return "status-pill status-pill--offline";
    if (profilingStatus === "checking" || profilingStatus === "running")
      return "status-pill status-pill--work";
    if (profilingStatus === "done") return "status-pill status-pill--live";
    return "status-pill";
  })();

  const statusLabel = (() => {
    if (profilingStatus === "offline") return "API offline";
    if (profilingStatus === "error") return "Profiler error";
    if (profilingStatus === "checking") return "Connecting…";
    if (profilingStatus === "running") return "Profiling";
    if (profilingStatus === "done")
      return exploreReady ? "Dataset ready" : "Awaiting ingest";
    return profilingStatus;
  })();

  /* ---- Upload handler (shared) ---- */
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadError(null);
      setCharts([]);
      setSchema(null);
      setLoading(true);
      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("files", file));
        const response = await fetch(`${apiBase}/upload`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(await readApiError(response));
        window.sessionStorage.setItem(DATASET_FROM_UPLOAD_KEY, "1");
        setExploreReady(true);
        setProfilingStatus("checking");
        setProfilingEvents([]);
        setStreamKey((prev) => prev + 1);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed.",
        );
        setLoading(false);
      } finally {
        setUploading(false);
      }
    },
    [apiBase],
  );

  /* ---- Send chat ---- */
  async function handleSend(text?: string) {
    const userMsg = (text ?? question).trim();
    if (!userMsg || chatLoading) return;
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
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
      setChatHistory((prev) => [...prev, { role: "assistant", ...payload }]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Could not reach the data agent right now.",
      );
    } finally {
      setChatLoading(false);
    }
  }

  /* ----------------------------------------------------------------
     LEFT PANEL CONTENT
  ---------------------------------------------------------------- */
  function renderLeftPanel() {
    return (
      <aside className="panel--left">
        <div className="panel__header">
          <span className="panel__label">Sources</span>
        </div>
        <div className="panel__body">
          {liveTables.length > 0 ? (
            liveTables.map((table) => (
              <div key={table.tableName} className="file-row">
                {/* File icon */}
                <svg
                  className="file-row__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="file-row__name">{table.tableName}.csv</span>
                <span className="file-row__meta">
                  {table.rows_scanned > 0
                    ? `${table.rows_scanned.toLocaleString()} rows`
                    : ""}
                </span>
                {/* Eye icon */}
                <svg
                  className="file-row__eye"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            ))
          ) : schema?.tables ? (
            Object.keys(schema.tables).map((name) => (
              <div key={name} className="file-row">
                <svg
                  className="file-row__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="file-row__name">{name}.csv</span>
                <span className="file-row__meta">
                  {(schema.tables![name].row_count ?? 0).toLocaleString()} rows
                </span>
                <svg
                  className="file-row__eye"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "16px",
                fontSize: "13px",
                color: "var(--text-hint)",
                textAlign: "center",
              }}
            >
              No files loaded
            </div>
          )}

          {/* Collapsible schema */}
          {schema?.tables && Object.keys(schema.tables).length > 0 && (
            <div className="schema-section">
              <button
                className="schema-section__toggle"
                onClick={() => setSchemaOpen((v) => !v)}
                aria-expanded={schemaOpen}
              >
                <span className="schema-section__label">Schema</span>
                <svg
                  className={`schema-section__chevron${schemaOpen ? " schema-section__chevron--open" : ""}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {schemaOpen && (
                <div className="schema-section__body">
                  {Object.entries(schema.tables).map(([tableName, table]) => (
                    <div key={tableName} className="schema-table-block">
                      <span className="schema-table-name">{tableName}</span>
                      {table.columns &&
                        Object.entries(table.columns)
                          .slice(0, 15)
                          .map(([colName, col]) => (
                            <div key={colName} className="schema-col-row">
                              <span className="schema-col-name">{colName}</span>
                              <span
                                className={getTypeBadgeClass(
                                  col.inferred_type || "",
                                )}
                              >
                                {typeLabel(col.inferred_type || "unknown")}
                              </span>
                            </div>
                          ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="panel__footer">
          <label className="btn-add-files">
            <input
              ref={addFilesInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add files
          </label>
        </div>
      </aside>
    );
  }

  /* ----------------------------------------------------------------
     MIDDLE PANEL — CHAT
  ---------------------------------------------------------------- */
  function renderMiddlePanel() {
    const isDone = profilingStatus === "done";

    return (
      <main className="panel--middle">
        {!isDone ? (
          /* Profiling in progress */
          <div className="profiling-panel">
            <p className="profiling-panel__heading">Analysing dataset…</p>
            <p className="profiling-panel__sub">
              Scanning schema, types, and cardinality
            </p>
            <div className="profiling-scroll">
              {liveTables.length === 0 ? (
                <div className="schema-building">
                  <div className="dot-loader" style={{ marginBottom: "12px" }}>
                    <span />
                    <span />
                    <span />
                  </div>
                  <p>Awaiting telemetry to begin schema inference…</p>
                </div>
              ) : (
                liveTables.map((table, index) => {
                  const isDone2 =
                    table.status === "done" || table.status === "completed";
                  const featuresList = Object.keys(table.features);
                  const latestFeature =
                    featuresList.length > 0
                      ? featuresList[featuresList.length - 1]
                      : null;
                  return (
                    <div
                      key={`${table.tableName}-${index}`}
                      className={`profiling-log__entry${isDone2 ? " profiling-log__entry--done" : ""}`}
                    >
                      <div className="profiling-log__header">
                        <span>{table.tableName}</span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            color: "var(--text-hint)",
                          }}
                        >
                          {!isDone2 && (
                            <span
                              className="pulse-loader"
                              style={{ margin: 0, width: "6px", height: "6px" }}
                            />
                          )}
                          {isDone2 ? "✓ done" : table.status}
                        </span>
                      </div>
                      <div className="profiling-log__body">
                        {table.rows_scanned > 0 && (
                          <span>
                            Scanning {table.rows_scanned.toLocaleString()}{" "}
                            records
                          </span>
                        )}
                        {latestFeature && (
                          <span>· Detected: {latestFeature}</span>
                        )}
                      </div>
                      {latestFeature &&
                        table.features[latestFeature].length > 0 && (
                          <div className="profiling-log__samples">
                            {table.features[latestFeature].map(
                              (sample, sampleIndex) => (
                                <span
                                  key={`${sample}-${sampleIndex}`}
                                  className="progress-chip"
                                >
                                  {sample}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <>
            {/* CHAT AREA */}
            {chatHistory.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty__icon">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h2 className="chat-empty__heading">
                  Ask anything about your data
                </h2>
                <p className="chat-empty__sub">
                  Try: "Show revenue by region for Q1" or "Which product had the
                  most returns?"
                </p>
                <div className="suggestion-chips">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      className="chip"
                      type="button"
                      onClick={() => handleSend(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-scroll">
                {chatHistory.map((msg, index) => {
                  if (msg.role === "user") {
                    return (
                      <div key={index} className="bubble-wrap--user">
                        <div className="bubble--user">{msg.content}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="bubble-wrap--assistant">
                      <div className="bubble--assistant">
                        <div className="bubble__summary">
                          <strong
                            style={{
                              fontSize: "13px",
                              color: "var(--text-hint)",
                              fontWeight: 500,
                              display: "block",
                              marginBottom: "6px",
                            }}
                          >
                            Summary
                          </strong>
                          {msg.summary}
                        </div>
                        {msg.confidence && (
                          <div className="bubble__meta">
                            Confidence · {msg.confidence}
                          </div>
                        )}
                        {msg.data_source && (
                          <div className="bubble__meta">
                            Provenance ·{" "}
                            <a
                              href="#!"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveRightTab("signals");
                                setTimeout(() => {
                                  window.dispatchEvent(
                                    new CustomEvent("focus-chart", {
                                      detail: {
                                        table: msg.data_source,
                                        chart: msg.chart,
                                      },
                                    }),
                                  );
                                }, 100);
                              }}
                              style={{
                                color: "var(--accent)",
                                textDecoration: "underline",
                              }}
                            >
                              {msg.data_source}
                            </a>
                          </div>
                        )}
                        {msg.chart?.data?.length ? (
                          <div style={{ marginTop: "8px" }}>
                            <ChartViz chart={msg.chart} />
                          </div>
                        ) : null}
                        <div className="bubble__actions">
                          <button
                            className="bubble__action-btn"
                            type="button"
                            title="Save to note"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            Save
                          </button>
                          <div className="bubble__action-sep" />
                          <button
                            className="bubble__action-btn"
                            type="button"
                            title="Helpful"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                          </button>
                          <button
                            className="bubble__action-btn"
                            type="button"
                            title="Not helpful"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading bubble */}
                {chatLoading && (
                  <div className="bubble-wrap--assistant">
                    <div className="bubble--assistant">
                      <div className="dot-loader">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {chatError && <div className="chat-error">{chatError}</div>}

            {/* Input bar */}
            <div className="chat-input-bar">
              {(showTip || chatHistory.length === 0) && (
                <p className="chat-input-tip">
                  Tip: Be specific — mention column names or date ranges for
                  best results.
                </p>
              )}
              <div className="chat-input-row">
                <input
                  id="ttd-chat-input"
                  type="text"
                  placeholder="Ask a question about your data…"
                  value={question}
                  disabled={chatLoading}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !chatLoading && question.trim()) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  id="ttd-btn-execute"
                  type="button"
                  className="btn-execute"
                  disabled={chatLoading || !question.trim()}
                  onClick={() => handleSend()}
                >
                  {chatLoading ? "Running…" : "Execute"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    );
  }

  /* ----------------------------------------------------------------
     RIGHT PANEL — SIGNALS & SCHEMA
  ---------------------------------------------------------------- */
  function renderRightPanel() {
    return (
      <aside
        className={`panel--right${rightPanelOpen ? " panel--right-open" : ""}`}
      >
        <div className="pill-tabs">
          <button
            className={`pill-tab${activeRightTab === "signals" ? " pill-tab--active" : ""}`}
            onClick={() => setActiveRightTab("signals")}
          >
            Signals
          </button>
          <button
            className={`pill-tab${activeRightTab === "schema" ? " pill-tab--active" : ""}`}
            onClick={() => setActiveRightTab("schema")}
          >
            Schema
          </button>
        </div>

        <div className="right-panel-scroll">
          {/* SIGNALS TAB */}
          {activeRightTab === "signals" && (
            <>
              {signalsLoading ? (
                <div
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "160px",
                    gap: "12px",
                  }}
                >
                  <div className="dot-loader">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p
                    className="muted"
                    style={{ fontSize: "13px", textAlign: "center" }}
                  >
                    Generating visual signals…
                  </p>
                </div>
              ) : hasCharts ? (
                charts.map((item, index) => (
                  <InteractiveCard
                    key={`${item.title}-${index}`}
                    item={item}
                    index={index}
                  />
                ))
              ) : (
                <div className="card">
                  <h3 style={{ fontSize: "14px" }}>No signals yet</h3>
                  <p className="hint">
                    Upload a dataset for the planner to generate signals.
                  </p>
                </div>
              )}
            </>
          )}

          {/* SCHEMA TAB */}
          {activeRightTab === "schema" && (
            <>
              {schema?.tables && Object.keys(schema.tables).length > 0 ? (
                Object.entries(schema.tables).map(([tableName, table]) => (
                  <div key={tableName} className="right-schema-table">
                    <div className="right-schema-table__header">
                      <span className="right-schema-table__name">
                        {tableName}
                      </span>
                      <span className="right-schema-table__rows">
                        {(table.row_count ?? 0).toLocaleString()} rows
                      </span>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.columns &&
                          Object.entries(table.columns)
                            .slice(0, 20)
                            .map(([colName, col]) => (
                              <tr key={colName}>
                                <td style={{ fontFamily: "var(--font-mono)" }}>
                                  {colName}
                                </td>
                                <td>
                                  <span
                                    className={getTypeBadgeClass(
                                      col.inferred_type || "",
                                    )}
                                  >
                                    {typeLabel(col.inferred_type || "unknown")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <div className="card">
                  <h3 style={{ fontSize: "14px" }}>No schema built</h3>
                  <p className="hint">
                    Schema will appear after profiling completes.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    );
  }

  /* ================================================================
     RENDER
     ================================================================ */
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
        {/* TOP BAR */}
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

            {/* Right panel drawer toggle (tablet) */}
            {exploreReady && (
              <button
                type="button"
                className="right-drawer-toggle"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border)",
                  background: rightPanelOpen
                    ? "var(--accent-light)"
                    : "var(--bg-panel)",
                  color: rightPanelOpen ? "var(--accent)" : "var(--text-muted)",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                }}
                onClick={() => setRightPanelOpen((v) => !v)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="3" x2="16" y2="21" />
                </svg>
                Signals
              </button>
            )}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="page">
          {/* ---- SCREEN 1: Landing ---- */}
          {!exploreReady && (
            <div className="landing-page">
              <div className="landing-card">
                <h1 className="landing-hero">Talk to your data</h1>
                <p className="landing-sub">
                  Upload CSVs to analyse, query, and visualise instantly.
                </p>

                {/* Upload zone */}
                <label className="upload-zone" id="ttd-upload-zone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  {/* Cloud upload icon */}
                  <div className="upload-zone__icon">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                  </div>
                  <span className="upload-zone__text">
                    {uploading
                      ? "Uploading…"
                      : "Drop CSV files here or click to select"}
                  </span>
                  <span className="upload-zone__hint">
                    Multiple files supported
                  </span>
                </label>

                {uploadError && (
                  <div className="upload-error">{uploadError}</div>
                )}

                {/* Divider */}
                <div className="or-divider">
                  <span className="or-divider__text">
                    or explore a demo dataset
                  </span>
                </div>

                {/* Demo tiles */}
                <div className="demo-grid" id="ttd-demo-grid">
                  {DEMO_DATASETS.map((ds) => (
                    <div
                      key={ds.id}
                      className="demo-tile"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleDemoClick(ds.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleDemoClick(ds.id);
                      }}
                      id={`ttd-demo-${ds.id}`}
                    >
                      <div
                        className="demo-tile__badge"
                        style={{ background: ds.badgeColor }}
                      >
                        {ds.badge}
                      </div>
                      <p className="demo-tile__name">{ds.name}</p>
                      <p className="demo-tile__desc">{ds.desc}</p>
                      <div className="demo-tile__meta">{ds.meta}</div>
                      <span className="demo-tile__hover-hint">
                        Click to load this dataset →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- SCREEN 2: Workspace ---- */}
          {exploreReady && (
            <div className="workspace">
              {renderLeftPanel()}
              {renderMiddlePanel()}
              {renderRightPanel()}

              {/* Mobile tab bar */}
              <nav className="mobile-tab-bar" aria-label="Navigation">
                {(["chat", "sources", "signals"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`mobile-tab${activeMobileTab === tab ? " mobile-tab--active" : ""}`}
                    onClick={() => setActiveMobileTab(tab)}
                  >
                    {tab === "chat" && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                    {tab === "sources" && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {tab === "signals" && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    )}
                    <span style={{ textTransform: "capitalize" }}>{tab}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
