"use client"

import {
  AlertCircle,
  Bot,
  CheckCircle,
  Copy,
  Menu,
  MessageSquare,
  PanelRight,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { type Message, type Source, type UseChatReturn } from "@/hooks/useChat"
import { useDocuments } from "@/hooks/useDocuments"
import { useSourceSelection } from "@/hooks/useSourceSelection"

interface ChatColumnProps {
  notebookId: string
  notebookName?: string
  chat: UseChatReturn
  isMobile?: boolean
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
  onToggleLeft?: () => void
  onToggleRight?: () => void
}

const SUGGESTIONS = [
  { icon: Sparkles, text: "Summarize all sources", color: "var(--accent)" },
  {
    icon: MessageSquare,
    text: "What are the key findings?",
    color: "var(--privy-sage)",
  },
  {
    icon: MessageSquare,
    text: "Compare the documents",
    color: "var(--privy-clay)",
  },
  {
    icon: MessageSquare,
    text: "List the main conclusions",
    color: "var(--text-secondary)",
  },
]

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            opacity: 0.7,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function UserMessage({ message, isMobile = false }: { message: Message; isMobile?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }, [message.content])

  return (
    <div
      style={{
        display: "flex",
        gap: isMobile ? 8 : 12,
        flexDirection: "row-reverse",
        alignItems: "flex-start",
        marginBottom: isMobile ? 16 : 24,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: isMobile ? 28 : 32,
          height: isMobile ? 28 : 32,
          borderRadius: 10,
          background:
            "linear-gradient(135deg, var(--accent) 0%, var(--privy-sage-soft) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(122, 158, 126, 0.2)",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 12 : 13,
            fontWeight: 700,
            color: "var(--primary-foreground)",
          }}
        >
          U
        </span>
      </div>

      {/* Message Content */}
      <div
        style={{
          maxWidth: isMobile ? "85%" : "80%",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            background: "var(--accent)",
            borderRadius: "16px 4px 16px 16px",
            padding: isMobile ? "10px 14px" : "12px 16px",
            fontSize: isMobile ? 15 : 14,
            color: "var(--primary-foreground)",
            lineHeight: 1.6,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          {message.content}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          type="button"
          aria-label={copied ? "Copied to clipboard" : "Copy message"}
          style={{
            alignSelf: "flex-end",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            background: "transparent",
            border: "none",
            borderRadius: 4,
            color: "var(--text-muted)",
            fontSize: 11,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)"
            e.currentTarget.style.color = "var(--text-secondary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "var(--text-muted)"
          }}
        >
          {copied ? (
            <>
              <CheckCircle size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function AssistantMessage({
  message,
  isMobile = false,
}: {
  message: Message & { isStreaming?: boolean }
  isMobile?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error("Failed to copy response:", error)
    }
  }, [message.content])

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type)
    // In production, send feedback to backend
  }

  return (
    <div
      style={{
        display: "flex",
        gap: isMobile ? 8 : 12,
        alignItems: "flex-start",
        marginBottom: isMobile ? 16 : 24,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: isMobile ? 28 : 32,
          height: isMobile ? 28 : 32,
          borderRadius: 10,
          background: "var(--bg-surface-hover)",
          border: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Bot size={isMobile ? 16 : 18} color="var(--text-secondary)" />
      </div>

      {/* Message Content */}
      <div
        style={{
          maxWidth: isMobile ? "90%" : "80%",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 6 : 8,
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "4px 16px 16px 16px",
            padding: isMobile ? "12px 14px" : "14px 16px",
            fontSize: isMobile ? 15 : 14,
            color: "var(--text-primary)",
            lineHeight: 1.7,
          }}
        >
          {message.isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8,
              position: "relative",
            }}
          >
            {message.sources.slice(0, 4).map((source, idx) => (
              <SourceCitationBubble key={idx} source={source} index={idx + 1} />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {!message.isStreaming && message.content && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
            role="group"
            aria-label="Message actions"
          >
            <button
              onClick={handleCopy}
              type="button"
              aria-label={copied ? "Copied to clipboard" : "Copy response"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                color: feedback ? "var(--text-muted)" : "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-hover)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-surface)"
              }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>

            <div
              style={{
                height: 20,
                width: 1,
                background: "var(--border-default)",
                margin: "0 4px",
              }}
              aria-hidden="true"
            />

            <button
              onClick={() => handleFeedback("up")}
              type="button"
              aria-label={feedback === "up" ? "Helpful response" : "Mark as helpful"}
              aria-pressed={feedback === "up"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                background:
                  feedback === "up"
                    ? "var(--success-muted)"
                    : "var(--bg-surface)",
                border: `1px solid ${feedback === "up" ? "var(--success)" : "var(--border-default)"}`,
                borderRadius: 6,
                color:
                  feedback === "up"
                    ? "var(--success)"
                    : "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (feedback !== "up") {
                  e.currentTarget.style.background = "var(--success-muted)"
                  e.currentTarget.style.borderColor = "var(--success)"
                }
              }}
              onMouseLeave={(e) => {
                if (feedback !== "up") {
                  e.currentTarget.style.background = "var(--bg-surface)"
                  e.currentTarget.style.borderColor = "var(--border-default)"
                }
              }}
            >
              <ThumbsUp size={14} />
            </button>

            <button
              onClick={() => handleFeedback("down")}
              type="button"
              aria-label={feedback === "down" ? "Not helpful" : "Mark as not helpful"}
              aria-pressed={feedback === "down"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                background:
                  feedback === "down"
                    ? "var(--warning-muted)"
                    : "var(--bg-surface)",
                border: `1px solid ${feedback === "down" ? "var(--warning)" : "var(--border-default)"}`,
                borderRadius: 6,
                color:
                  feedback === "down"
                    ? "var(--warning)"
                    : "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (feedback !== "down") {
                  e.currentTarget.style.background = "var(--warning-muted)"
                  e.currentTarget.style.borderColor = "var(--warning)"
                }
              }}
              onMouseLeave={(e) => {
                if (feedback !== "down") {
                  e.currentTarget.style.background = "var(--bg-surface)"
                  e.currentTarget.style.borderColor = "var(--border-default)"
                }
              }}
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SourceCitationBubble({
  source,
  index,
}: {
  source: Source
  index: number
}) {
  const [open, setOpen] = useState(false)
  const score = Math.round(source.score * 100)
  const isHigh = score >= 90

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(v => !v)
    }
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(v => !v)}
      onKeyDown={handleKeyDown}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 16,
        background: open ? "var(--accent-muted)" : "var(--bg-surface)",
        border: "1px solid " + (open ? "var(--accent)" : "var(--border-default)"),
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontSize: 11,
        maxWidth: '100%',
        appearance: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-muted)"
        e.currentTarget.style.borderColor = "var(--accent)"
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        if (!open) {
          e.currentTarget.style.background = "var(--bg-surface)"
          e.currentTarget.style.borderColor = "var(--border-default)"
        }
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      {/* Index badge */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: open ? 'var(--accent)' : 'var(--text-muted)',
        minWidth: 14,
      }}>
        {index}
      </span>

      {/* Document name */}
      <span style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 120,
      }}>
        {source.documentName}
      </span>

      {/* Page number if available */}
      {source.page && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
          padding: '1px 4px',
          background: 'var(--bg-secondary)',
          borderRadius: 4,
        }}>
          p.{source.page}
        </span>
      )}

      {/* Score dot */}
      <span
        title={score + "% match"}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isHigh ? 'var(--success)' : 'var(--warning)',
          flexShrink: 0,
        }}
      />

      {/* Expanded tooltip-like content */}
      {open && source.text && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            padding: '10px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 10,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          &ldquo;{source.text}&rdquo;
        </div>
      )}
    </button>
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
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background:
            "linear-gradient(135deg, var(--accent-muted) 0%, var(--bg-surface) 100%)",
          border: "1px solid var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 4px 16px rgba(122, 158, 126, 0.15)",
        }}
      >
        <MessageSquare size={28} color="var(--accent)" />
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.3px",
          margin: "0 0 8px",
        }}
      >
        Start a conversation
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          maxWidth: 360,
          lineHeight: 1.6,
          margin: "0 0 32px",
        }}
      >
        Ask questions about your documents and get instant, source-grounded
        answers.
      </p>

      {/* Suggestions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          width: "100%",
          maxWidth: 600,
        }}
      >
        {SUGGESTIONS.map((suggestion, idx) => {
          const ariaLabel = "Ask: " + suggestion.text
          return (
            <button
              key={idx}
              onClick={() => onChipClick(suggestion.text)}
              type="button"
              aria-label={ariaLabel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border-default)",
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-hover)"
                e.currentTarget.style.borderColor = suggestion.color
                e.currentTarget.style.color = "var(--text-primary)"
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-secondary)"
                e.currentTarget.style.borderColor = "var(--border-default)"
                e.currentTarget.style.color = "var(--text-secondary)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <suggestion.icon size={16} color={suggestion.color} aria-hidden="true" />
              {suggestion.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ChatColumn({
  notebookId,
  notebookName,
  chat,
  isMobile = false,
  showLeftSidebar = true,
  showRightSidebar = true,
  onToggleLeft,
  onToggleRight,
}: ChatColumnProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming } = chat
  const { data: documents } = useDocuments(notebookId)
  const { selectedIds } = useSourceSelection()
  const [inputValue, setInputValue] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasIndexed = documents?.some((d) => d.status === "INDEXED")
  const selectedSourceIds = Array.from(selectedIds)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px"
  }, [inputValue])

  const handleSend = () => {
    if (inputValue.trim() && hasIndexed) {
      sendMessage(inputValue.trim(), selectedSourceIds)
      setInputValue("")
    }
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
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: isMobile ? 60 : 56,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 16px" : "0 20px",
          flexShrink: 0,
          gap: 12,
        }}
      >
        {/* Left toggle button (mobile) */}
        {isMobile && onToggleLeft && (
          <button
            onClick={onToggleLeft}
            type="button"
            aria-label={showLeftSidebar ? "Close conversations" : "Open conversations"}
            aria-pressed={showLeftSidebar}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid var(--border-default)",
              background: showLeftSidebar ? "var(--accent-muted)" : "var(--bg-surface)",
              color: showLeftSidebar ? "var(--accent)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.2s ease",
              boxShadow: showLeftSidebar ? "0 2px 8px rgba(122, 158, 126, 0.25)" : "none",
              transform: showLeftSidebar ? "translateY(-1px)" : "translateY(0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-muted)"
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(122, 158, 126, 0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showLeftSidebar ? "var(--accent-muted)" : "var(--bg-surface)"
              e.currentTarget.style.borderColor = "var(--border-default)"
              e.currentTarget.style.transform = showLeftSidebar ? "translateY(-1px)" : "translateY(0)"
              e.currentTarget.style.boxShadow = showLeftSidebar ? "0 2px 8px rgba(122, 158, 126, 0.25)" : "none"
            }}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Title */}
        <span
          style={{
            fontSize: isMobile ? 16 : 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            flex: 1,
            textAlign: isMobile ? "center" : "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {notebookName || "Notebook"}
        </span>

        {/* Right toggle button (mobile) */}
        {isMobile && onToggleRight && (
          <button
            onClick={onToggleRight}
            type="button"
            aria-label={showRightSidebar ? "Close studio" : "Open studio"}
            aria-pressed={showRightSidebar}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid var(--border-default)",
              background: showRightSidebar ? "var(--accent-muted)" : "var(--bg-surface)",
              color: showRightSidebar ? "var(--accent)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.2s ease",
              boxShadow: showRightSidebar ? "0 2px 8px rgba(122, 158, 126, 0.25)" : "none",
              transform: showRightSidebar ? "translateY(-1px)" : "translateY(0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-muted)"
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(122, 158, 126, 0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showRightSidebar ? "var(--accent-muted)" : "var(--bg-surface)"
              e.currentTarget.style.borderColor = "var(--border-default)"
              e.currentTarget.style.transform = showRightSidebar ? "translateY(-1px)" : "translateY(0)"
              e.currentTarget.style.boxShadow = showRightSidebar ? "0 2px 8px rgba(122, 158, 126, 0.25)" : "none"
            }}
          >
            <PanelRight size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: isMobile ? "16px 12px" : "24px 20px",
        }}
      >
        {messages.length === 0 ? (
          <ChatEmptyState
            onChipClick={(text) => sendMessage(text, selectedSourceIds)}
          />
        ) : (
          <>
            {messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} message={message} isMobile={isMobile} />
              ) : (
                <AssistantMessage key={message.id} message={message} isMobile={isMobile} />
              )
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: "12px 20px",
            background: "var(--bg-destructive)",
            borderTop: "1px solid var(--destructive)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={16} color="var(--destructive)" />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--destructive)",
              fontWeight: 500,
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
            padding: "12px 20px",
            background: "var(--warning-muted)",
            borderTop: "1px solid var(--warning)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle
            size={16}
            style={{ color: "var(--warning)", flexShrink: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--warning)",
              lineHeight: 1.5,
            }}
          >
            No sources selected. All indexed documents will be searched.{" "}
            <span style={{ fontWeight: 600 }}>Select specific sources</span> for
            targeted results.
          </p>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: isMobile ? "12px 16px" : "20px",
          flexShrink: 0,
          borderTop: "1px solid var(--border-default)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: isMobile ? 8 : 12,
              padding: isMobile ? "12px 14px" : "14px 16px",
              borderRadius: 14,
              background: "var(--bg-primary)",
              border: "1px solid " + (error ? "var(--destructive)" : "var(--border-default)"),
              transition: "all 0.15s",
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasIndexed
                  ? "Ask a question..."
                  : "Upload documents to start"
              }
              disabled={!hasIndexed}
              rows={1}
              aria-label="Chat message input"
              aria-disabled={!hasIndexed}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: isMobile ? 16 : 14,
                color: "var(--text-primary)",
                resize: "none",
                maxHeight: 120,
                lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />

            {isStreaming ? (
              <button
                onClick={stopStreaming}
                type="button"
                aria-label="Stop generating response"
                style={{
                  width: isMobile ? 44 : 38,
                  height: isMobile ? 44 : 38,
                  borderRadius: 10,
                  border: "none",
                  background: "rgba(185, 74, 72, 0.15)",
                  color: "var(--destructive)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(185, 74, 72, 0.25)"
                  e.currentTarget.style.transform = "scale(1.05)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(185, 74, 72, 0.15)"
                  e.currentTarget.style.transform = "scale(1)"
                }}
              >
                <Square size={isMobile ? 20 : 18} fill="currentColor" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                type="button"
                disabled={!inputValue.trim() || !hasIndexed}
                aria-label="Send message"
                style={{
                  width: isMobile ? 44 : 38,
                  height: isMobile ? 44 : 38,
                  borderRadius: 10,
                  border: "none",
                  background:
                    inputValue.trim() && hasIndexed
                      ? "var(--accent)"
                      : "var(--bg-surface)",
                  color:
                    inputValue.trim() && hasIndexed
                      ? "var(--primary-foreground)"
                      : "var(--text-muted)",
                  cursor:
                    inputValue.trim() && hasIndexed ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && hasIndexed) {
                    e.currentTarget.style.transform = "scale(1.05)"
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(122, 158, 126, 0.3)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                <Send size={isMobile ? 20 : 18} aria-hidden="true" />
              </button>
            )}
          </div>

          <p
            style={{
              fontSize: isMobile ? 12 : 11,
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            AI-generated responses may be inaccurate. Verify important
            information.
          </p>
        </div>
      </div>
    </div>
  )
}
