import React, { useState } from "react";
import { ChartRenderer, ChartDataProps } from "./ChartRenderer";

export interface DashboardChartItem {
  id?: string;
  title: string;
  type?: string;
  query: {
    table: string;
    metrics: string[];
    dimensions: string[];
    date_range?: any;
    operation?: string;
  };
  chart: ChartDataProps;
}

interface DashboardCanvasProps {
  plan: {
    dashboard_title?: string;
    charts: DashboardChartItem[];
  } | null;
  schema: any;
  onRefreshPlan: () => void;
  apiBase: string;
}

export function DashboardCanvas({ plan, schema, onRefreshPlan, apiBase }: DashboardCanvasProps) {
  const [customizingIndex, setCustomizingIndex] = useState<number | null>(null);
  const [widgetCharts, setWidgetCharts] = useState<Record<number, ChartDataProps>>({});
  const [selectedX, setSelectedX] = useState<string>("");
  const [selectedY, setSelectedY] = useState<string>("");
  const [selectedOp, setSelectedOp] = useState<string>("sum");
  const [isUpdating, setIsUpdating] = useState(false);

  const charts = plan?.charts || [];

  const handleOpenCustomize = (idx: number, item: DashboardChartItem) => {
    setCustomizingIndex(idx);
    const tableInfo = schema?.tables?.[item.query.table] || {};
    const cols = Object.keys(tableInfo.columns || {});
    setSelectedX(item.chart.xKey || cols[0] || "");
    setSelectedY(item.chart.yKey || cols[1] || cols[0] || "");
    setSelectedOp(item.query.operation || "sum");
  };

  const handleApplyCustomization = async (idx: number, item: DashboardChartItem) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${apiBase}/dashboard/widget_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: item.query.table,
          x: selectedX,
          y: selectedY,
          operation: selectedOp,
        }),
      });
      if (res.ok) {
        const customData = await res.json();
        setWidgetCharts((prev) => ({
          ...prev,
          [idx]: {
            ...item.chart,
            data: customData.data || [],
            xKey: selectedX,
            yKey: "value",
          },
        }));
        setCustomizingIndex(null);
      }
    } catch (e) {
      console.error("Failed to customize widget", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Studio Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 600 }}>
            {plan?.dashboard_title || "Automated Business Intelligence"}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            DuckDB-backed metrics, aggregations, and interactive driver views.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshPlan}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.84rem",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Re-generate Plan
        </button>
      </div>

      {/* Grid of Analytical Widgets */}
      {charts.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          No dashboard widgets generated yet. Upload data or choose a demo dataset to start.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {charts.map((item, idx) => {
            const currentChart = widgetCharts[idx] || item.chart;
            const tableCols = Object.keys(schema?.tables?.[item.query.table]?.columns || {});

            return (
              <div
                key={idx}
                className="ttd-card"
                style={{
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</h3>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Table: <span style={{ fontFamily: "var(--font-mono)" }}>{item.query.table}</span> • Type:{" "}
                        {(item.chart?.type || item.type || "bar").toUpperCase()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCustomize(idx, item)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-xs)",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Customize
                    </button>
                  </div>

                  {/* Widget Chart */}
                  <ChartRenderer chart={currentChart} height={220} />
                </div>

                {/* Inline Customizer Modal / Panel */}
                {customizingIndex === idx && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)" }}>
                      Customize Metric & Dimension:
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                          Dimension (X):
                        </label>
                        <select
                          value={selectedX}
                          onChange={(e) => setSelectedX(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 8px",
                            borderRadius: "var(--radius-xs)",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {tableCols.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                          Metric (Y):
                        </label>
                        <select
                          value={selectedY}
                          onChange={(e) => setSelectedY(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px 8px",
                            borderRadius: "var(--radius-xs)",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {tableCols.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                        Aggregation Operation:
                      </label>
                      <select
                        value={selectedOp}
                        onChange={(e) => setSelectedOp(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "5px 8px",
                          borderRadius: "var(--radius-xs)",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "0.8rem",
                        }}
                      >
                        <option value="sum">SUM</option>
                        <option value="avg">AVERAGE</option>
                        <option value="count">COUNT</option>
                        <option value="min">MINIMUM</option>
                        <option value="max">MAXIMUM</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => setCustomizingIndex(null)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCustomization(idx, item)}
                        disabled={isUpdating}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "var(--radius-xs)",
                          background: "var(--accent-coral)",
                          color: "var(--accent-coral-contrast)",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                        }}
                      >
                        {isUpdating ? "Updating..." : "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
