import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Header } from "../components/Header";
import { PromptComposer } from "../components/PromptComposer";
import { AgentMessage, ChatMessage } from "../components/AgentMessage";
import { SchemaDrawer } from "../components/SchemaDrawer";
import { DashboardCanvas } from "../components/DashboardCanvas";
import { UploadModal } from "../components/UploadModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [activeView, setActiveView] = useState<"chat" | "dashboard">("chat");
  const [inputPrompt, setInputPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [profilingStatus, setProfilingStatus] = useState("idle");
  const [profilingEvents, setProfilingEvents] = useState<string[]>([]);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial schema and dashboard plan
  const fetchSchema = async () => {
    try {
      const res = await fetch(`${API_BASE}/schema`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data);
      }
    } catch (e) {
      console.warn("Could not fetch schema", e);
    }
  };

  const fetchPlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/plan`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (e) {
      console.warn("Could not fetch plan", e);
    }
  };

  const fetchProfilingStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/profiling/status`);
      if (res.ok) {
        const data = await res.json();
        setProfilingStatus(data.status || "idle");
      }
    } catch {
      setProfilingStatus("idle");
    }
  };

  // SSE Stream for live profiling telemetry
  useEffect(() => {
    fetchSchema();
    fetchPlan();
    fetchProfilingStatus();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/profiling/stream`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status) setProfilingStatus(data.status);
          if (data.message) {
            setProfilingEvents((prev) => [...prev, data.message]);
          }
          if (data.status === "done") {
            fetchSchema();
            fetchPlan();
          }
        } catch {
          if (event.data) {
            setProfilingEvents((prev) => [...prev, event.data]);
          }
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (e) {
      console.warn("SSE connection error", e);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // Populate initial welcome message once schema is loaded
  useEffect(() => {
    if (messages.length === 0 && schema) {
      const tables = Object.keys(schema.tables || {});
      const primaryTable = tables[0] || "business_data";
      const rowCount = schema.tables?.[primaryTable]?.row_count;

      setMessages([
        {
          id: "welcome-1",
          sender: "agent",
          timestamp: "Just now",
          data: {
            summary: `Welcome to Talk to Data. I am your autonomous analytical assistant.
- Active dataset: \`${primaryTable}\`${rowCount ? ` (${rowCount.toLocaleString()} rows)` : ""}.
- Ask any high-level question, and I will iteratively execute DuckDB SQL queries, uncover underlying drivers, and visualize trends.`,
            confidence: "high",
            data_source: primaryTable,
            reasoning_steps: ["Connected to local DuckDB analytical engine", "Indexed dataset schema & column types"],
            sql_queries_run: [`SELECT * FROM ${primaryTable} LIMIT 5;`],
          },
        },
      ]);
    }
  }, [schema]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Ask Prompt
  const handleAsk = async (questionToAsk?: string) => {
    const question = (questionToAsk || inputPrompt).trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Agent analysis failed" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const agentData = await res.json();
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        data: agentData,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "agent",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          data: {
            summary: `I encountered an issue processing your request: ${err.message || "Unknown error"}.
- Please check your backend connection or refine your question.`,
            confidence: "low",
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo dataset loader
  const handleLoadDemo = async (demoId: "single" | "multi") => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/upload/demo?dataset=${demoId}`);
      if (res.ok) {
        await fetchSchema();
        await fetchPlan();
        setMessages((prev) => [
          ...prev,
          {
            id: `demo-${Date.now()}`,
            sender: "agent",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            data: {
              summary: `Loaded ${demoId === "single" ? "Business Data (Single Table)" : "E-Commerce (Multi-Table)"} demo dataset successfully.
- All views are mounted in DuckDB and ready for SQL querying.`,
              confidence: "high",
            },
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load demo", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger re-profiling
  const handleTriggerReprofile = async () => {
    try {
      await fetch(`${API_BASE}/profiling/reset`, { method: "POST" });
      setProfilingEvents([]);
      fetchProfilingStatus();
    } catch (e) {
      console.error("Failed to reset profiling", e);
    }
  };

  const tables = schema?.tables || {};
  const tableNames = Object.keys(tables);
  const activeTable = tableNames[0] || "business_data";
  const rowCount = tables[activeTable]?.row_count;

  return (
    <div className="ttd-app">
      <Head>
        <title>Talk to Data | Agentic BI & Analytics</title>
        <meta
          name="description"
          content="Ultra-modern autonomous data analyst with iterative DuckDB reasoning, SQL generation, and instant charts."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header Chrome */}
      <Header
        activeDatasetName={activeTable}
        tableCount={tableNames.length}
        rowCount={rowCount}
        profilingStatus={profilingStatus}
        onOpenSchema={() => setIsSchemaOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadDemo={handleLoadDemo}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* Main Content Viewport */}
      <main className="ttd-main">
        {activeView === "chat" ? (
          <>
            {/* Conversation Messages Feed (Top to Bottom) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "160px" }}>
              {/* If no user messages yet, show welcoming hero header */}
              {messages.length <= 1 && (
                <section style={{ textAlign: "center", padding: "16px 0 12px" }}>
                  <h1 style={{ marginBottom: "6px" }}>Explore your data through conversation</h1>
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "var(--text-secondary)",
                      maxWidth: "600px",
                      margin: "0 auto",
                      lineHeight: 1.5,
                    }}
                  >
                    Multi-step DuckDB reasoning, driver decomposition, and interactive charts built for instant clarity.
                  </p>
                </section>
              )}

              {/* Chat messages */}
              {messages.map((msg) => (
                <AgentMessage key={msg.id} message={msg} />
              ))}

              {/* Agent Thinking Progress Indicator (Appears at bottom of messages while waiting) */}
              {isLoading && (
                <div className="ttd-agent-thinking" style={{ margin: "12px 0" }}>
                  <span className="ttd-pulse-dot" />
                  <span>
                    Investigating schema, executing DuckDB SQL queries, and identifying drivers...
                  </span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Bottom-Docked Prompt Composer (ChatGPT / Gemini / Claude Style) */}
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 35,
                padding: "16px 20px 24px",
                background: "linear-gradient(to top, var(--bg-canvas) 85%, transparent)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <div style={{ maxWidth: "860px", margin: "0 auto", width: "100%" }}>
                <PromptComposer
                  value={inputPrompt}
                  onChange={setInputPrompt}
                  onSubmit={handleAsk}
                  isLoading={isLoading}
                  suggestions={messages.length <= 1 ? undefined : []}
                />
              </div>
            </div>
          </>
        ) : (
          /* Data Studio (Dashboard View) */
          <DashboardCanvas
            plan={plan}
            schema={schema}
            onRefreshPlan={fetchPlan}
            apiBase={API_BASE}
          />
        )}
      </main>

      {/* Schema Inspector Drawer */}
      <SchemaDrawer
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        schema={schema}
        profilingStatus={profilingStatus}
        profilingEvents={profilingEvents}
        onTriggerReprofile={handleTriggerReprofile}
      />

      {/* Upload CSV Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchSchema();
          fetchPlan();
        }}
        apiBase={API_BASE}
      />
    </div>
  );
}
