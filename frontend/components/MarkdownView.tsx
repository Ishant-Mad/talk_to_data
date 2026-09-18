import React from "react";

interface MarkdownViewProps {
  content?: string;
  style?: React.CSSProperties;
}

export function MarkdownView({ content, style }: MarkdownViewProps) {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;

  const flushList = () => {
    if (inList && currentList.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          style={{
            margin: "6px 0 10px 0",
            paddingLeft: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            listStyleType: "disc",
          }}
        >
          {currentList}
        </ul>
      );
      currentList = [];
      inList = false;
    }
  };

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for bold (**text**), inline code (`code`), and italics (*text*)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={`b-${match.index}`} style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push(
          <code
            key={`c-${match.index}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85em",
              padding: "2px 6px",
              borderRadius: "var(--radius-xs)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--accent-coral)",
            }}
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(<em key={`em-${match.index}`}>{matchText.slice(1, -1)}</em>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Check if bullet item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      const itemText = trimmed.substring(2);
      currentList.push(
        <li key={`li-${i}`} style={{ lineHeight: 1.55 }}>
          {renderInline(itemText)}
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} style={{ margin: "4px 0", lineHeight: 1.55 }}>
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList();

  return <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", ...style }}>{elements}</div>;
}
