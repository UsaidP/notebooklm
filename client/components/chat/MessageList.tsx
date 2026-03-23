import React from "react"
import { Message } from "../../hooks/useChat"
import { MarkdownMessage } from "./MarkdownMessage"
import { SourceCitations } from "./SourceCitations"

// Shimmer Loader for thinking animation
const ShimmerLoader = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "10px 0",
      maxWidth: "300px",
    }}
  >
    <div
      style={{
        height: "10px",
        width: "100%",
        borderRadius: "4px",
        background:
          "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-hover) 50%, var(--bg-surface) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
    <div
      style={{
        height: "10px",
        width: "80%",
        borderRadius: "4px",
        background:
          "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-hover) 50%, var(--bg-surface) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  </div>
)

export const MessageList = ({ messages }: { messages: Message[] }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        paddingBottom: "24px",
      }}
    >
      {messages.map((message) => {
        const isUser = message.role === "user"

        if (isUser) {
          return (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <div
                style={{
                  maxWidth: "480px",
                  padding: "10px 16px",
                  borderRadius: "16px 16px 4px 16px",
                  background: "var(--accent)",
                  color: "var(--primary-foreground)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {message.content}
              </div>
            </div>
          )
        }

        // Assistant Message
        return (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxWidth: "720px",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="var(--accent)"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L13.09 8.26L19 7L15.45 11.9L21 14L15.45 16.1L19 21L13.09 15.74L12 22L10.91 15.74L5 21L8.55 16.1L3 14L8.55 11.9L5 7L10.91 8.26L12 2Z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                Assistant
              </span>
            </div>

            {message.isStreaming && !message.content ? (
              <div style={{ paddingLeft: "26px" }}>
                <ShimmerLoader />
              </div>
            ) : (
              <MarkdownMessage content={message.content} />
            )}

            {message.sources && message.sources.length > 0 && (
              <SourceCitations sources={message.sources} />
            )}
          </div>
        )
      })}

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
