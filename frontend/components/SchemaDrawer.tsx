import React from "react";

interface SchemaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schema: any;
  profilingStatus: string;
  profilingEvents: string[];
  onTriggerReprofile: () => void;
}

export function SchemaDrawer({
  isOpen,
  onClose,
  schema,
  profilingStatus,
  profilingEvents,
  onTriggerReprofile,
}: SchemaDrawerProps) {
  if (!isOpen) return null;

  const tables = schema?.tables || {};
  const tableNames = Object.keys(tables);

  return (
    <>
      {/* Backdrop */}
      <div className="ttd-overlay" onClick={onClose} />

      {/* Drawer Panel */}
      <aside className="ttd-drawer" aria-label="Dataset schema inspector">
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Data Schema & Profiling</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {tableNames.length} {tableNames.length === 1 ? "table" : "tables"} detected in DuckDB
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              background: "var(--bg-elevated)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Profiling Status & SSE Stream */}
          <div
            style={{
              padding: "14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background:
                      profilingStatus === "done"
                        ? "var(--accent-sage)"
                        : profilingStatus === "running"
                        ? "var(--accent-coral)"
                        : "var(--text-muted)",
                    boxShadow: profilingStatus === "running" ? "0 0 8px var(--accent-coral)" : "none",
                  }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Status: {profilingStatus}</span>
              </div>
              <button
                type="button"
                onClick={onTriggerReprofile}
                disabled={profilingStatus === "running"}
                style={{
                  fontSize: "0.76rem",
                  color: "var(--accent-coral)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Re-profile Data
              </button>
            </div>

            {profilingEvents.length > 0 && (
              <div
                style={{
                  maxHeight: "100px",
                  overflowY: "auto",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-canvas)",
                  padding: "8px",
                  borderRadius: "var(--radius-xs)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {profilingEvents.slice(-6).map((ev, i) => (
                  <div key={i}>› {ev}</div>
                ))}
              </div>
            )}
          </div>

          {/* Tables & Columns Inspector */}
          {tableNames.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: "0.88rem" }}>
              No tables currently loaded. Upload a CSV or select a Demo dataset.
            </div>
          ) : (
            tableNames.map((tblName) => {
              const table = tables[tblName] || {};
              const columns = table.columns || {};
              const colKeys = Object.keys(columns);
              const measures = table.measures || [];
              const dimensions = table.dimensions || [];
              const timeCol = table.inferred_time_column;

              return (
                <div
                  key={tblName}
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                    background: "var(--bg-surface)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {tblName}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {table.row_count ? `${table.row_count.toLocaleString()} rows` : "view"}
                    </span>
                  </div>

                  {timeCol && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      Time Dimension: <strong style={{ color: "var(--accent-coral)" }}>{timeCol}</strong>
                    </div>
                  )}

                  {/* Columns list */}
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                      Columns ({colKeys.length}):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {colKeys.map((colName) => {
                        const colInfo = columns[colName] || {};
                        const isMeasure = measures.includes(colName);
                        const isDim = dimensions.includes(colName);

                        return (
                          <div
                            key={colName}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "4px 8px",
                              background: "var(--bg-elevated)",
                              borderRadius: "var(--radius-xs)",
                              fontSize: "0.78rem",
                            }}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{colName}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {isMeasure && (
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "1px 5px",
                                    borderRadius: "var(--radius-full)",
                                    background: "var(--accent-coral-subtle)",
                                    color: "var(--accent-coral)",
                                  }}
                                >
                                  measure
                                </span>
                              )}
                              {isDim && (
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "1px 5px",
                                    borderRadius: "var(--radius-full)",
                                    background: "var(--accent-sage-subtle)",
                                    color: "var(--accent-sage)",
                                  }}
                                >
                                  dimension
                                </span>
                              )}
                              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                {colInfo.type || "string"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
