import React, { useState, useRef } from "react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  apiBase: string;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess, apiBase }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setStatusMessage("Uploading and profiling CSV dataset...");
    setErrorMessage(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
      }

      setStatusMessage("Files uploaded successfully! Starting background profiling...");
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="ttd-overlay" onClick={onClose}>
      <div
        className="ttd-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "480px",
          maxWidth: "92vw",
          padding: "24px",
          position: "relative",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Upload CSV Dataset</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Upload one or more CSV tables to explore with DuckDB & Agent reasoning.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
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

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "var(--accent-coral)" : "var(--border-strong)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "36px 20px",
            textAlign: "center",
            background: isDragging ? "var(--accent-coral-subtle)" : "var(--bg-elevated)",
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-enter)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />

          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDragging ? "var(--accent-coral)" : "var(--text-muted)"}
            strokeWidth="1.5"
            style={{ margin: "0 auto 12px" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)", marginBottom: "4px" }}>
            Click to upload or drag & drop
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Supports CSV files (e.g. transactions.csv, customers.csv)
          </div>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div
            style={{
              marginTop: "14px",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-sage-subtle)",
              color: "var(--accent-sage)",
              fontSize: "0.84rem",
              fontWeight: 500,
            }}
          >
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginTop: "14px",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-coral-subtle)",
              color: "var(--accent-coral)",
              fontSize: "0.84rem",
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
