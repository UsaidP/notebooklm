"use client"

import { AlertCircle, Bot, MessageSquare, Send, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { type Message, type Source, useChat } from "@/hooks/useChat"
import { useDocuments } from "@/hooks/useDocuments"
import { useSourceSelection } from "@/hooks/useSourceSelection"

interface ChatPanelProps {
  notebookId: string
}

const SUGGESTIONS = [
  "Summarize all sources",
  "What are the key findings?",
  "Compare the documents",
  "List the main conclusions",
]

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--text-tertiary)",
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: "row-reverse",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          U
        </span>
      </div>
      <div style={{ maxWidth: "82%" }}>
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px 3px 12px 12px",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

function SourceCitationCard({
  source,
  index,
}: {
  source: Source
  index: number
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 7,
        padding: "8px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          [{index}] {source.documentName}
          {source.page ? ` · p.${source.page}` : ""}
        </span>
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 100,
            background: "var(--bg-secondary)",
            color: "var(--text-tertiary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {Math.round(source.score * 100)}%
        </span>
      </div>
      <p
        style={{
          fontSize: 11.5,
          color: "var(--text-tertiary)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        "{source.text.slice(0, 200)}..."
      </p>
    </div>
  )
}

function AssistantMessage({ message }: { message: Message }) {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Bot size={14} color="var(--text-secondary)" />
      </div>
      <div
        style={{
          maxWidth: "82%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Bubble */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "3px 12px 12px 12px",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          {message.isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
          )}
          {message.isStreaming && message.content && (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 14,
                background: "var(--accent)",
                marginLeft: 2,
                animation: "blink 1s infinite",
              }}
            />
          )}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div>
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "var(--text-tertiary)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <MessageSquare size={12} />
              {message.sources.length} sources cited {sourcesOpen ? "▾" : "▸"}
            </button>
            {sourcesOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {message.sources.map((src, i) => (
                  <SourceCitationCard key={i} source={src} index={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function ChatEmptyState({
  onChipClick,
}: {
  onChipClick: (text: string) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 20,
        padding: 40,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageSquare size={24} color="var(--text-tertiary)" />
      </div>
      <div>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.3px",
            margin: "0 0 6px",
          }}
        >
          Ask your sources anything
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            maxWidth: 340,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Powered by Groq llama-3.3-70b · Embeddings via nomic-embed · Qdrant
          vector search
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          maxWidth: 460,
        }}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onChipClick(s)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)"
              e.currentTarget.style.borderColor = "var(--border-strong)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-secondary)"
              e.currentTarget.style.borderColor = "var(--border-subtle)"
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatPanel({ notebookId }: ChatPanelProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming } =
    useChat(notebookId)
  const { data: documents } = useDocuments(notebookId)
  const { selectedIds } = useSourceSelection()
  const [inputValue, setInputValue] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasIndexed = documents?.some((d) => d.status === "INDEXED")
  const selectedSourceIds = Array.from(selectedIds)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 110) + "px"
  }, [inputValue])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || !hasIndexed) return
    const text = inputValue.trim()
    setInputValue("")
    await sendMessage(text, selectedSourceIds)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 0",
        }}
      >
        {messages.length === 0 ? (
          <ChatEmptyState
            onChipClick={(text) => sendMessage(text, selectedSourceIds)}
          />
        ) : (
          <div
            style={{
              maxWidth: 680,
              margin: "0 auto",
              padding: "0 20px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} message={msg} />
              ) : (
                <AssistantMessage key={msg.id} message={msg} />
              )
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "8px 20px",
            background: "rgba(248,113,113,0.1)",
            borderTop: "1px solid var(--error)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--error)",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Warning when no sources selected */}
      {hasIndexed && selectedSourceIds.length === 0 && (
        <div
          style={{
            padding: "8px 20px",
            background: "var(--warning-muted)",
            borderTop: "1px solid var(--warning)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle
            size={14}
            style={{ color: "var(--warning)", flexShrink: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--warning)",
            }}
          >
            No sources selected. All indexed documents will be searched.{" "}
            <span style={{ fontWeight: 500 }}>Select specific sources</span> for
            targeted results.
          </p>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: "14px 20px",
          flexShrink: 0,
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              padding: 10,
              borderRadius: 10,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !hasIndexed
                  ? "Upload and process a document first..."
                  : "Ask anything about your sources..."
              }
              disabled={!hasIndexed}
              rows={1}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "var(--text-primary)",
                resize: "none",
                maxHeight: 110,
                lineHeight: 1.6,
                fontFamily: "inherit",
              }}
            />
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(248,113,113,0.1)",
                  color: "var(--error)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !hasIndexed}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "none",
                  background:
                    inputValue.trim() && hasIndexed
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                  color:
                    inputValue.trim() && hasIndexed
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  cursor:
                    inputValue.trim() && hasIndexed ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                <Send size={14} />
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Groq · llama-3.3-70b-versatile · RAG via Qdrant (1024d) ·{" "}
            {selectedSourceIds.length || "All"} sources selected
          </p>
        </div>
      </div>
    </div>
  )
}
