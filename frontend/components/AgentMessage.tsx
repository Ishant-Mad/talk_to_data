import React, { useState } from "react";
import { ChartRenderer, ChartDataProps } from "./ChartRenderer";
import { MarkdownView } from "./MarkdownView";

export interface AnalysisItem {
  type: string;
  insight: string;
  chart?: ChartDataProps;
}

export interface AgentResponseProps {
  summary: string;
  data_source?: string;
  confidence?: "high" | "medium" | "low" | string;
  chart?: ChartDataProps;
  reasoning_steps?: string[];
  sql_queries_run?: string[];
  analyses?: AnalysisItem[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text?: string;
  data?: AgentResponseProps;
  timestamp: string;
}

export function AgentMessage({ message }: { message: ChatMessage }) {
  const [showThinking, setShowThinking] = useState(false);
  const [copiedSqlIndex, setCopiedSqlIndex] = useState<number | null>(null);

  if (message.sender === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <div
          style={{
            maxWidth: "75%",
            padding: "12px 18px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)",
            color: "var(--text-primary)",
            fontSize: "0.96rem",
            fontWeight: 500,
            lineHeight: 1.55,
            boxShadow: "var(--shadow-xs)",
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  const data = message.data;
  if (!data) {
    return (
      <div style={{ padding: "16px", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
        {message.text}
      </div>
    );
  }

  const confidence = (data.confidence || "medium").toLowerCase();
  const reasoningSteps = data.reasoning_steps || [];
  const sqlQueries = data.sql_queries_run || [];
  const hasThinking = reasoningSteps.length > 0 || sqlQueries.length > 0;

  const copySql = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedSqlIndex(index);
    setTimeout(() => setCopiedSqlIndex(null), 2000);
  };

  return (
    <div
      className="ttd-card"
      style={{
        padding: "20px 24px",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {/* Header: Agent Identity, Confidence, Source */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-coral-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-coral)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L13.8 8.8L21 7.2L15.6 12L21 16.8L13.8 15.2L12 23L10.2 15.2L3 16.8L8.4 12L3 7.2L10.2 8.8L12 1Z" />
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)" }}>Data Analyst Agent</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "8px" }}>{message.timestamp}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {data.data_source && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.74rem",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Table: {data.data_source}
            </span>
          )}
          <span className={`ttd-badge ${confidence}`}>
            Confidence: {confidence}
          </span>
        </div>
      </div>

      {/* Accordion: Reasoning Steps & SQL Queries Executed */}
      {hasThinking && (
        <div className="ttd-accordion">
          <button
            type="button"
            className="ttd-accordion-header"
            onClick={() => setShowThinking(!showThinking)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                Agent Investigation Trace ({reasoningSteps.length} steps, {sqlQueries.length} SQL {sqlQueries.length === 1 ? "query" : "queries"})
              </span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: showThinking ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform var(--duration-fast) ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showThinking && (
            <div className="ttd-accordion-body">
              {/* Reasoning Steps */}
              {reasoningSteps.length > 0 && (
                <div style={{ marginBottom: sqlQueries.length > 0 ? "14px" : "0" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Reasoning Process:
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {reasoningSteps.map((step, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.84rem" }}>
                        <span style={{ color: "var(--accent-sage)", marginTop: "2px" }}>✓</span>
                        <span style={{ color: "var(--text-primary)" }}>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Executed SQL Queries */}
              {sqlQueries.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Executed DuckDB SQL:
                  </div>
                  {sqlQueries.map((sql, idx) => (
                    <div key={idx} className="ttd-sql-block">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Query {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => copySql(sql, idx)}
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--accent-coral)",
                            padding: "2px 6px",
                            borderRadius: "var(--radius-xs)",
                            background: "var(--bg-elevated)",
                          }}
                        >
                          {copiedSqlIndex === idx ? "Copied!" : "Copy SQL"}
                        </button>
                      </div>
                      <code>{sql}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary with Anthropic Editorial Styling and Markdown Parsing */}
      <div>
        <MarkdownView content={data.summary} style={{ lineHeight: 1.6 }} />
      </div>

      {/* Primary Visualization Chart */}
      {data.chart && data.chart.data && data.chart.data.length > 0 && (
        <div
          style={{
            padding: "16px",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
              Primary Visualization ({data.chart.type?.toUpperCase() || "BAR"})
            </span>
          </div>
          <ChartRenderer chart={data.chart} height={260} />
        </div>
      )}

      {/* Sub-analyses Cards */}
      {data.analyses && data.analyses.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
          <div style={{ fontWeight: 650, fontSize: "0.88rem", color: "var(--text-primary)" }}>
            Detailed Insights & Driver Decomposition:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            {data.analyses.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px 16px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--bg-surface)",
                      color: "var(--accent-coral)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {item.type}
                  </span>
                </div>
                <MarkdownView content={item.insight} style={{ fontSize: "0.92rem", lineHeight: 1.55 }} />
                {item.chart && item.chart.data && (
                  <div style={{ marginTop: "6px" }}>
                    <ChartRenderer chart={item.chart} height={160} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
