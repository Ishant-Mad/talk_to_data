import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export interface ChartDataProps {
  type?: "bar" | "line" | "area" | "pie" | "table" | string;
  data?: any[];
  xKey?: string;
  yKey?: string;
  series?: { key: string; label?: string; color?: string } | any[];
}

const ANTHROPIC_COLORS = [
  "#D97757", // Terracotta Coral (Primary)
  "#60705E", // Sage Olive
  "#D2973B", // Warm Amber
  "#8F7EAA", // Dusty Lavender
  "#4A6984", // Slate Blue
  "#E28A6D", // Light Terracotta
  "#7B8C79", // Light Sage
  "#DE9B35", // Gold
];

export function ChartRenderer({
  chart,
  height = 280,
}: {
  chart?: ChartDataProps | null;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!chart || !chart.data || chart.data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
        }}
      >
        No chart data available for this query
      </div>
    );
  }

  const chartData = chart.data || [];
  const chartType = (chart.type || "bar").toLowerCase();
  const firstRow = chartData[0] || {};
  const rawKeys = Object.keys(firstRow);

  // Intelligent Key Resolution:
  // 1. Resolve xKey: find categorical / date string key
  let resolvedXKey = "";
  if (chart.xKey && rawKeys.includes(chart.xKey) && chart.xKey !== "highlight") {
    resolvedXKey = chart.xKey;
  } else {
    // Find first non-numeric key (string or date), ignoring 'highlight'
    const catKey = rawKeys.find(
      (k) => k !== "highlight" && typeof firstRow[k] === "string"
    );
    resolvedXKey = catKey || rawKeys[0] || "x";
  }

  // 2. Resolve yKey: find numeric measure key
  let resolvedYKey = "";
  if (chart.yKey && rawKeys.includes(chart.yKey) && chart.yKey !== "highlight" && chart.yKey !== resolvedXKey) {
    resolvedYKey = chart.yKey;
  } else if (rawKeys.includes("value") && resolvedXKey !== "value") {
    resolvedYKey = "value";
  } else {
    // Find first numeric key, ignoring 'highlight' and xKey
    const numKey = rawKeys.find(
      (k) => k !== "highlight" && k !== resolvedXKey && typeof firstRow[k] === "number"
    );
    resolvedYKey = numKey || rawKeys.find((k) => k !== resolvedXKey && k !== "highlight") || "value";
  }

  if (!mounted) {
    return (
      <div
        style={{
          height: `${height}px`,
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
        }}
      />
    );
  }

  // Render Table View
  if (chartType === "table") {
    const columns = rawKeys.filter((k) => k !== "highlight");
    return (
      <div
        style={{
          overflowX: "auto",
          maxHeight: `${height + 60}px`,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-surface)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: 650,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid var(--divider)",
                  background: row.highlight ? "var(--accent-coral-subtle)" : "transparent",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      padding: "10px 14px",
                      color: row.highlight ? "var(--accent-coral)" : "var(--text-primary)",
                      fontWeight: row.highlight ? 700 : 500,
                    }}
                  >
                    {typeof row[col] === "number" ? row[col].toLocaleString() : String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Custom Minimal Floating Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const val = item.value;
      const formattedVal = typeof val === "number" ? val.toLocaleString() : val;
      const itemLabel = label || item.name || resolvedXKey;
      return (
        <div className="ttd-chart-tooltip">
          <div style={{ fontWeight: 600, marginBottom: "2px" }}>{itemLabel}</div>
          <div style={{ color: "var(--accent-coral)", fontFamily: "var(--font-mono)" }}>
            {item.name || resolvedYKey}: <strong>{formattedVal}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if series has a specific color
  const seriesColor = Array.isArray(chart.series)
    ? chart.series[0]?.color
    : chart.series?.color || "var(--accent-coral)";

  return (
    <div style={{ width: "100%", height: `${height}px`, marginTop: "12px" }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey={resolvedXKey}
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={resolvedYKey}
              stroke={seriesColor}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "var(--bg-surface)", stroke: "var(--accent-coral)", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "var(--accent-coral)" }}
            />
          </LineChart>
        ) : chartType === "area" ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-coral)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--accent-coral)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey={resolvedXKey}
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={resolvedYKey}
              stroke="var(--accent-coral)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#areaGradient)"
            />
          </AreaChart>
        ) : chartType === "pie" ? (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey={resolvedYKey}
              nameKey={resolvedXKey}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height / 2.5, 90)}
              innerRadius={Math.min(height / 5, 45)}
              paddingAngle={2}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-pie-${index}`}
                  fill={entry.highlight ? "var(--accent-coral)" : ANTHROPIC_COLORS[index % ANTHROPIC_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        ) : (
          /* Default: Bar Chart */
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey={resolvedXKey}
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={resolvedYKey} radius={[4, 4, 0, 0]}>
              {chartData.map((entry: any, index: number) => {
                const isHighlighted = Boolean(entry.highlight);
                const fillColor = isHighlighted
                  ? "var(--accent-coral)"
                  : ANTHROPIC_COLORS[index % ANTHROPIC_COLORS.length];
                const hasHighlights = chartData.some((d: any) => d.highlight);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillColor}
                    opacity={hasHighlights && !isHighlighted ? 0.45 : 0.9}
                  />
                );
              })}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
