import React, { useState } from "react"
import { Source } from "../../hooks/useChat"

export const SourceBadge = ({
  index,
  onClick,
  active,
}: {
  index: number
  onClick: () => void
  active: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      borderRadius: "4px",
      border: `1px solid ${active ? "var(--accent)" : "var(--border-default)"}`,
      background: active ? "var(--accent)" : "var(--bg-surface)",
      color: active ? "var(--primary-foreground)" : "var(--accent)",
      fontSize: "10px",
      fontWeight: 600,
      cursor: "pointer",
      marginLeft: "2px",
      verticalAlign: "super",
      transition: "all 0.12s",
      fontFamily: "var(--font-mono)",
      padding: 0,
      lineHeight: 1,
    }}
  >
    {index}
  </button>
)

export const SourceCitations = ({ sources }: { sources: Source[] }) => {
  const [expandedSource, setExpandedSource] = useState<number | null>(null)

  if (!sources || sources.length === 0) return null

  return (
    <div
      style={{
        paddingLeft: "26px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexWrap: "wrap",
          marginTop: "8px",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          Sources
        </span>
        {sources.map((source, i) => (
          <SourceBadge
            key={i}
            index={i + 1}
            active={expandedSource === i}
            onClick={() => setExpandedSource(expandedSource === i ? null : i)}
          />
        ))}
      </div>

      {expandedSource !== null && sources[expandedSource] && (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            fontSize: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginTop: "6px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              📄 {sources[expandedSource].documentName}{" "}
              {sources[expandedSource].page
                ? `· Page ${sources[expandedSource].page}`
                : ""}
            </span>
            <span
              style={{
                fontSize: "10px",
                color:
                  sources[expandedSource].score > 0.8
                    ? "var(--privy-sage)"
                    : sources[expandedSource].score > 0.5
                      ? "var(--privy-clay)"
                      : "var(--destructive)",
                fontWeight: 600,
              }}
            >
              {(sources[expandedSource].score * 100).toFixed(0)}% Match
            </span>
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            "{sources[expandedSource].text}"
          </p>
        </div>
      )}
    </div>
  )
}
