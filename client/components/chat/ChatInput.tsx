import React, { useEffect, useRef } from "react"

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: () => void
  isStreaming: boolean
  onStop: () => void
  disabled?: boolean
}

export const ChatInput = ({
  input,
  setInput,
  onSubmit,
  isStreaming,
  onStop,
  disabled,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 120) + "px"
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && !isStreaming && input.trim()) {
        onSubmit()
      }
    }
  }

  return (
    <div style={{ padding: "12px 0 20px", flexShrink: 0 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!disabled && !isStreaming && input.trim()) {
            onSubmit()
          }
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? "none" : "auto",
            transition: "all 0.15s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Upload documents to start chatting..."
                : "Ask anything about your documents..."
            }
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "14px",
              lineHeight: "1.5",
              resize: "none",
              fontFamily: "inherit",
              padding: "4px 0",
              maxHeight: "120px",
            }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generation"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--destructive)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim() || disabled}
              title="Send message"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background:
                  input.trim() && !disabled
                    ? "var(--accent)"
                    : "var(--bg-surface)",
                color:
                  input.trim() && !disabled
                    ? "var(--primary-foreground)"
                    : "var(--text-muted)",
                cursor: input.trim() && !disabled ? "pointer" : "not-allowed",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 8px",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          <span>
            {disabled
              ? "Upload and index documents to enable chat"
              : "Use Shift+Enter for new lines"}
          </span>
          <span>{input.trim() && !disabled ? "Press Enter to send" : ""}</span>
        </div>
      </form>
    </div>
  )
}
