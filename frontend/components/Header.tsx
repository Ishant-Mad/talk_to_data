import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  activeDatasetName?: string;
  tableCount?: number;
  rowCount?: number;
  profilingStatus?: string;
  onOpenSchema: () => void;
  onOpenUpload: () => void;
  onLoadDemo: (demoId: "single" | "multi") => void;
  activeView: "chat" | "dashboard";
  onSelectView: (view: "chat" | "dashboard") => void;
}

export function Header({
  activeDatasetName,
  tableCount = 0,
  rowCount,
  profilingStatus = "idle",
  onOpenSchema,
  onOpenUpload,
  onLoadDemo,
  activeView,
  onSelectView,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="ttd-header">
      {/* Left: Brand Identity & View Switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div className="ttd-logo-group">
          {/* Anthropic Claude Spark Emblem */}
          <svg
            className="ttd-spark-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 1L13.8 8.8L21 7.2L15.6 12L21 16.8L13.8 15.2L12 23L10.2 15.2L3 16.8L8.4 12L3 7.2L10.2 8.8L12 1Z" />
          </svg>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="ttd-brand-title">Talk to Data</span>
              <span className="ttd-brand-badge">Agentic</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <nav className="ttd-mode-switcher" aria-label="View mode">
          <button
            type="button"
            className={`ttd-mode-tab ${activeView === "chat" ? "active" : ""}`}
            onClick={() => onSelectView("chat")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Agent Chat
          </button>
          <button
            type="button"
            className={`ttd-mode-tab ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => onSelectView("dashboard")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Data Studio
          </button>
        </nav>
      </div>

      {/* Right: Dataset Tools & Theme Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Dataset Status Pill */}
        {activeDatasetName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--accent-sage)",
              }}
            />
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{activeDatasetName}</span>
            {rowCount !== undefined && (
              <span style={{ color: "var(--text-muted)" }}>• {rowCount.toLocaleString()} rows</span>
            )}
          </div>
        )}

        {/* Demo Data Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.84rem",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Demo Datasets
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showDemoMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "210px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "6px",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onLoadDemo("single");
                  setShowDemoMenu(false);
                }}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.84rem",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontWeight: 600 }}>Business Data (Single)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sales, revenue, spend, returns</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadDemo("multi");
                  setShowDemoMenu(false);
                }}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.84rem",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontWeight: 600 }}>E-Commerce (Multi)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Customers, orders, products</div>
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={onOpenUpload}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.84rem",
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload CSV
        </button>

        {/* Schema Inspector Trigger */}
        <button
          type="button"
          onClick={onOpenSchema}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.84rem",
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          Schema ({tableCount})
          {profilingStatus === "running" && (
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--accent-coral)",
                boxShadow: "0 0 8px var(--accent-coral)",
              }}
            />
          )}
        </button>

        {/* Theme Toggle (Sun/Moon) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          {theme === "dark" ? (
            /* Sun Icon */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
