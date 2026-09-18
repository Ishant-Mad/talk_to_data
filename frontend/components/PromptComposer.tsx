import React, { useRef, useEffect } from "react";

interface PromptComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (prompt?: string) => void;
  isLoading: boolean;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "What is the total revenue by product?",
  "Which region generated the highest sales?",
  "Compare revenue vs ad spend by channel",
  "Why did returns spike, and what drove it?",
];

export function PromptComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
  suggestions = DEFAULT_SUGGESTIONS,
}: PromptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div>
      <div className="ttd-composer-wrap">
        <textarea
          ref={textareaRef}
          className="ttd-textarea"
          placeholder="Ask a question about your data (e.g. 'What is total revenue by product?', 'Why did sales drop?')..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />

        <div className="ttd-composer-actions">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <kbd
                style={{
                  padding: "1px 5px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                }}
              >
                ↵
              </kbd>
              to ask
            </span>
            <span>•</span>
            <span>Shift + ↵ for newline</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="ttd-send-btn"
              onClick={() => onSubmit()}
              disabled={!value.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="ttd-pulse-dot" style={{ width: "6px", height: "6px" }} />
                  Analyzing...
                </>
              ) : (
                <>
                  Ask Agent
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      {!value && suggestions.length > 0 && (
        <div className="ttd-suggestions">
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center", marginRight: "4px" }}>
            Try:
          </span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              className="ttd-pill"
              onClick={() => onSubmit(sug)}
              disabled={isLoading}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
