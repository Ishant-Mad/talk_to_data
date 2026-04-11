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

type MonthlyRevenue = { month: number; amount: number };
type QuarterlyComplaints = { quarter: number; volume: number };
type WeeklyChannel = { week_of_year: number; channel: string; count: number };

type ChartData = {
  monthly: MonthlyRevenue[];
  quarterly: QuarterlyComplaints[];
  weekly: WeeklyChannel[];
};
`
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

type ProfilingEvent = {
  status?: string;
  table?: string;
  file?: string;
  rows_scanned?: number;
  chunk?: number;
  message?: string;
};

type SchemaPayload = {
  tables?: Record<string, { row_count?: number; columns?: Record<string, { inferred_type?: string }> }>;
};

const initialData: ChartData = {
  monthly: [],
  quarterly: [],
  weekly: [],
};

function parseCsv(text: string): Array<Record<string, string>> {
  const [headerLine, ...rows] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return rows.map((row) => {
    const values = row.split(",");
    return headers.reduce<Record<string, string>>((acc, key, idx) => {
      acc[key] = values[idx] ?? "";
      return acc;
    }, {});
  });
}

export default function Home() {
  const [data, setData] = useState<ChartData>(initialData);
  const [loading, setLoading] = useState(true);
  const [profilingStatus, setProfilingStatus] = useState("checking");
  const [profilingEvents, setProfilingEvents] = useState<ProfilingEvent[]>([]);
  const [profilingError, setProfilingError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaPayload | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function load() {
      try {
        const statusResponse = await fetch(`${apiBase}/profiling/status`);
        const statusPayload = await statusResponse.json();
        setProfilingStatus(statusPayload.status || "idle");
        if (statusPayload.error) {
          setProfilingError(statusPayload.error);
        }
      } catch (error) {
        setProfilingStatus("offline");
      }

      const eventSource = new EventSource(`${apiBase}/profiling/stream`);
      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data) as ProfilingEvent;
        setProfilingEvents((prev) => [...prev.slice(-24), payload]);
        if (payload.status === "completed") {
          setProfilingStatus("done");
          eventSource.close();
        }
        if (payload.status === "error") {
          setProfilingStatus("error");
          setProfilingError(payload.message || "Profiling failed");
          eventSource.close();
        }
      };
      eventSource.onerror = () => {
        setProfilingStatus((prev) => (prev === "done" ? prev : "offline"));
        eventSource.close();
      };

      const [monthlyText, quarterlyText, weeklyText] = await Promise.all([
        fetch("/validation/story1_monthly_revenue.csv").then((res) => res.text()),
        fetch("/validation/story2_complaints_q2.csv").then((res) => res.text()),
        fetch("/validation/story3_week8_channel_drop.csv").then((res) => res.text()),
      ]);

      try {
        const schemaResponse = await fetch(`${apiBase}/schema`);
        if (schemaResponse.ok) {
          const schemaPayload = (await schemaResponse.json()) as SchemaPayload;
          setSchema(schemaPayload);
        }
      } catch (error) {
        setSchema(null);
      }

      const monthly = parseCsv(monthlyText).map((row) => ({
        month: Number(row.month),
        amount: Number(row.amount),
      }));
      const quarterly = parseCsv(quarterlyText).map((row) => ({
        quarter: Number(row.quarter),
        volume: Number(row.volume),
      }));
      const weekly = parseCsv(weeklyText).map((row) => ({
        week_of_year: Number(row.week_of_year),
        channel: row.channel,
        count: Number(row.count),
      }));

      setData({ monthly, quarterly, weekly });
      setLoading(false);
    }

    load();
  }, []);

  const weeklySeries = useMemo(() => {
    const grouped: Record<number, { week: number; Digital?: number; Branch?: number }> = {};
    data.weekly.forEach((row) => {
      if (!grouped[row.week_of_year]) {
        grouped[row.week_of_year] = { week: row.week_of_year };
      }
      if (row.channel === "Digital") {
        grouped[row.week_of_year].Digital = row.count;
      }
      if (row.channel === "Branch") {
        grouped[row.week_of_year].Branch = row.count;
      }
    });
    return Object.values(grouped).sort((a, b) => a.week - b.week);
  }, [data.weekly]);

  return (
    <main className="page">
      {(profilingStatus === "checking" || profilingStatus === "running") && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="kicker">Profiling Dataset</div>
            <h2>Learning your dataset in real time</h2>
            <p>
              We are scanning every CSV to understand columns, types, and dimensions. This only
              happens on the first run.
            </p>
            <div className="progress-grid">
              {profilingEvents.length === 0 && <div className="progress-row">Waiting for data...</div>}
              {profilingEvents.map((event, index) => (
                <div key={`${event.table ?? "event"}-${index}`} className="progress-row">
                  <span>{event.file || event.table || "Profiler"}</span>
                  <span className="muted">
                    {event.status} {event.rows_scanned ? `• ${event.rows_scanned} rows` : ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="progress-footer">
              <span className="callout">Streaming progress</span>
              <span className="muted">Status: {profilingStatus}</span>
            </div>
          </div>
        </div>
      )}

      {profilingStatus === "error" && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="kicker">Profiling Error</div>
            <h2>We hit a snag while learning your data</h2>
            <p className="muted">{profilingError || "Unknown error"}</p>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="kicker">Talk to Data / Validation View</div>
        <h1>Story signals baked into the dataset</h1>
        <p>
          These charts are loaded straight from the validation CSVs. Use them to confirm the
          anomalies that will guide the evaluator.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <span className="callout">Story 1</span>
          <h3>March revenue dip</h3>
          <p className="hint">Something shifted in March. Ask why revenue fell.</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ded6" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#0b3d91" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card">
          <span className="callout">Story 2</span>
          <h3>Q2 complaints surge</h3>
          <p className="hint">Q2 jumps hard. Ask what segment and channel drove it.</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.quarterly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ded6" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#b32134" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card">
          <span className="callout">Story 3</span>
          <h3>Week 8 digital drop</h3>
          <p className="hint">Digital falls in week 8. Watch Branch compensate.</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ded6" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Digital" stroke="#0b3d91" strokeWidth={3} />
                <Line type="monotone" dataKey="Branch" stroke="#d09b2c" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="chat-panel">
        <div className="chat-header">
          <div>
            <div className="kicker">Ask the Agent</div>
            <h2>Ask why something changed</h2>
          </div>
          <span className="callout">LLM ready</span>
        </div>
        <div className="chat-body">
          {chatResponse ? (
            <div className="chat-message">
              <strong>Summary:</strong> {chatResponse.summary}
              <div className="muted">Confidence: {chatResponse.confidence}</div>
              {chatResponse.data_source && (
                <div className="muted">Source: {chatResponse.data_source}</div>
              )}
            </div>
          ) : (
            <div className="chat-message">Ask a question to see a structured response.</div>
          )}
        </div>
        {chatResponse?.chart?.data?.length ? (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              {chatResponse.chart.type === "bar" ? (
                <BarChart data={chatResponse.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ded6" />
                  <XAxis dataKey={chatResponse.chart.xKey || "label"} />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey={chatResponse.chart.yKey || "value"}
                    fill="#0b3d91"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={chatResponse.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ded6" />
                  <XAxis dataKey={chatResponse.chart.xKey || "label"} />
                  <YAxis />
                  <Tooltip />
                  {chatResponse.chart.series && chatResponse.chart.series.length ? (
                    chatResponse.chart.series.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke={series.color || "#0b3d91"}
                        strokeWidth={3}
                        name={series.label}
                      />
                    ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={chatResponse.chart.yKey || "value"}
                      stroke="#0b3d91"
                      strokeWidth={3}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : null}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask a question like: Why did revenue dip in March?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button
            disabled={chatLoading || !question.trim()}
            onClick={async () => {
              setChatLoading(true);
              setChatError(null);
              try {
                const response = await fetch(`${apiBase}/chat`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ question }),
                });
                if (!response.ok) {
                  const payload = await response.json();
                  throw new Error(payload?.message || "Agent request failed");
                }
                const payload = (await response.json()) as ChatResponse;
                if (!payload?.summary) {
                  throw new Error("Agent response was incomplete.");
                }
                setChatResponse(payload);
              } finally {
                setChatLoading(false);
              }
            }}
          >
            {chatLoading ? "Thinking..." : "Send"}
          </button>
        </div>
        {chatError && <div className="chat-error">{chatError}</div>}
      </section>

      <section className="schema-panel">
        <div className="schema-header">
          <div>
            <div className="kicker">Schema Snapshot</div>
            <h2>What the profiler learned</h2>
          </div>
          <span className="callout">Live</span>
        </div>
        <div className="schema-body">
          {schema?.tables ? (
            Object.entries(schema.tables).map(([tableName, table]) => (
              <div key={tableName} className="schema-table">
                <div className="schema-title">
                  <span>{tableName}</span>
                  <span className="muted">{table.row_count ?? 0} rows</span>
                </div>
                <div className="schema-columns">
                  {table.columns &&
                    Object.entries(table.columns)
                      .slice(0, 8)
                      .map(([colName, col]) => (
                        <div key={colName} className="schema-chip">
                          {colName}
                          <span className="muted">{col.inferred_type || "unknown"}</span>
                        </div>
                      ))}
                </div>
              </div>
            ))
          ) : (
            <div className="schema-empty">Schema is not ready yet.</div>
          )}
        </div>
      </section>

      {loading && <p>Loading validation charts...</p>}
    </main>
  );
}
