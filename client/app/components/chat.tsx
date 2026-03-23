"use client"

import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { useParams } from "next/navigation"
import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  timestamp: Date
}

interface Source {
  content: string
  metadata: Record<string, unknown>
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  {
    icon: "📋",
    label: "Summarize",
    text: "Summarize the key points of this document",
  },
  {
    icon: "🔍",
    label: "Deep dive",
    text: "What are the main arguments and supporting evidence?",
  },
  {
    icon: "💡",
    label: "Key insights",
    text: "What are the most important insights or findings?",
  },
  {
    icon: "❓",
    label: "Questions",
    text: "What questions does this document raise?",
  },
]

// ─── Shimmer Loading ──────────────────────────────────────────────────────────
const ShimmerLoader = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "20px 0",
      maxWidth: "560px",
    }}
  >
    {[100, 85, 65].map((w, i) => (
      <div
        key={i}
        style={{
          height: "12px",
          width: `${w}%`,
          borderRadius: "6px",
          background:
            "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-hover) 50%, var(--bg-surface) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
    ))}
  </div>
)

// ─── Source Citation Badge ─────────────────────────────────────────────────────
const SourceBadge = ({
  index,
  onClick,
}: {
  index: number
  onClick: () => void
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
      border: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      color: "var(--accent)",
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

// ─── Message Component ────────────────────────────────────────────────────────
const MessageItem = ({ message }: { message: Message }) => {
  const isUser = message.role === "user"
  const [expandedSource, setExpandedSource] = useState<number | null>(null)

  if (isUser) {
    return (
      <div
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
            fontWeight: 400,
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        animation: "fadeIn 0.2s ease",
        maxWidth: "720px",
      }}
    >
      {/* Assistant label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
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
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          Assistant
        </span>
      </div>

      {/* Response content */}
      <div
        className="assistant-message"
        style={{
          fontSize: "14px",
          lineHeight: 1.7,
          color: "var(--text-primary)",
          paddingLeft: "26px",
        }}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>

      {/* Source citations */}
      {message.sources && message.sources.length > 0 && (
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
              marginTop: "4px",
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
            {message.sources.map((_, i) => (
              <SourceBadge
                key={i}
                index={i + 1}
                onClick={() =>
                  setExpandedSource(expandedSource === i ? null : i)
                }
              />
            ))}
          </div>

          {expandedSource !== null && message.sources[expandedSource] && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                animation: "fadeIn 0.15s ease",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Source {expandedSource + 1}
              </span>
              <p style={{ margin: "4px 0 0" }}>
                {message.sources[expandedSource].content}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({
  onPromptClick,
}: {
  onPromptClick: (text: string) => void
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      padding: "48px 32px",
      textAlign: "center",
      gap: "24px",
    }}
  >
    <div>
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: "var(--accent-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2
        style={{
          margin: "0 0 4px",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.3px",
        }}
      >
        Research your documents
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "var(--text-tertiary)",
          maxWidth: "360px",
          lineHeight: 1.5,
        }}
      >
        Ask questions about your uploaded PDFs and get answers with source
        citations.
      </p>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        width: "100%",
        maxWidth: "420px",
      }}
    >
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          key={prompt.label}
          type="button"
          onClick={() => onPromptClick(prompt.text)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 14px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-default)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 450,
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
            lineHeight: 1.4,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)"
            e.currentTarget.style.background = "var(--accent-subtle)"
            e.currentTarget.style.color = "var(--text-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-default)"
            e.currentTarget.style.background = "var(--bg-secondary)"
            e.currentTarget.style.color = "var(--text-secondary)"
          }}
        >
          <span style={{ fontSize: "16px", flexShrink: 0 }}>{prompt.icon}</span>
          {prompt.label}
        </button>
      ))}
    </div>
  </div>
)

// ─── Main Chat Component ──────────────────────────────────────────────────────
const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { getToken } = useAuth()
  const params = useParams()
  const notebookId = params.notebookId as string

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }

    try {
      // Get Clerk JWT token
      const token = await getToken()

      // Use the new authenticated chat API with SSE streaming
      const response = await fetch(
        `${API_BASE_URL}/api/chat/${notebookId}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ message: trimmed }),
        }
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      // Handle SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let sources: Source[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === "token") {
                  fullContent += data.content
                  // Update message in real-time
                  setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1]
                    if (
                      lastMsg?.role === "assistant" &&
                      lastMsg.id === "streaming"
                    ) {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: fullContent },
                      ]
                    }
                    return [
                      ...prev,
                      {
                        id: "streaming",
                        role: "assistant",
                        content: fullContent,
                        timestamp: new Date(),
                      },
                    ]
                  })
                } else if (data.type === "sources") {
                  sources = data.sources
                } else if (data.type === "done") {
                  // Finalize message
                  setMessages((prev) => {
                    const filtered = prev.filter((m) => m.id !== "streaming")
                    return [
                      ...filtered,
                      {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: fullContent,
                        sources,
                        timestamp: new Date(),
                      },
                    ]
                  })
                } else if (data.type === "error") {
                  throw new Error(data.message)
                }
              } catch (parseErr) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Something went wrong. ${err instanceof Error ? err.message : "Please try again."}`,
        timestamp: new Date(),
      }
      toast.error("Chat Error", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }

  const handlePromptClick = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 24px 14px 60px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          minHeight: "var(--header-height)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            PDF Research Assistant
          </h1>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            Ask anything about your documents
          </p>
        </div>
        {messages.length > 0 && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
              background: "var(--bg-surface)",
              padding: "4px 10px",
              borderRadius: "10px",
            }}
          >
            {messages.filter((m) => m.role === "user").length} queries
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState onPromptClick={handlePromptClick} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div style={{ maxWidth: "720px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "4px",
                  }}
                >
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
                      letterSpacing: "0.3px",
                    }}
                  >
                    Researching...
                  </span>
                </div>
                <div style={{ paddingLeft: "26px" }}>
                  <ShimmerLoader />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "12px 32px 20px",
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            ; (e.currentTarget as HTMLFormElement).style.borderColor =
              "var(--accent)"
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              ; (e.currentTarget as HTMLFormElement).style.borderColor =
                "var(--border-default)"
            }
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents..."
            rows={1}
            id="chat-input"
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
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            id="chat-send-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background:
                input.trim() && !isLoading
                  ? "var(--accent)"
                  : "var(--bg-surface)",
              color:
                input.trim() && !isLoading
                  ? "var(--primary-foreground)"
                  : "var(--text-muted)",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
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
        </form>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #chat-input::placeholder {
          color: var(--text-muted);
        }

        /* ─── Markdown Styles ─── */
        .assistant-message h1,
        .assistant-message h2,
        .assistant-message h3 {
          margin: 16px 0 8px;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }
        .assistant-message h1 { font-size: 17px; }
        .assistant-message h2 { font-size: 15px; }
        .assistant-message h3 { font-size: 14px; }
        .assistant-message h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 12px 0 4px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .assistant-message p {
          margin: 8px 0;
          color: var(--text-primary);
        }
        .assistant-message ul,
        .assistant-message ol {
          margin: 8px 0;
          padding-left: 20px;
          color: var(--text-primary);
        }
        .assistant-message li {
          margin: 4px 0;
        }
        .assistant-message li::marker {
          color: var(--text-muted);
        }
        .assistant-message strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .assistant-message em {
          color: var(--text-secondary);
        }
        .assistant-message code {
          background: var(--accent-muted);
          color: var(--accent-hover);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: var(--font-mono);
        }
        .assistant-message pre {
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          overflow-x: auto;
          margin: 10px 0;
        }
        .assistant-message pre code {
          background: none;
          padding: 0;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }
        .assistant-message hr {
          border: none;
          border-top: 1px solid var(--border-subtle);
          margin: 14px 0;
        }
        .assistant-message blockquote {
          border-left: 2px solid var(--accent);
          padding-left: 14px;
          margin: 10px 0;
          color: var(--text-secondary);
          font-style: italic;
        }
        .assistant-message a {
          color: var(--accent-hover);
          text-decoration: none;
        }
        .assistant-message a:hover {
          text-decoration: underline;
        }
        .assistant-message *:first-child {
          margin-top: 0;
        }
        .assistant-message *:last-child {
          margin-bottom: 0;
        }
        .assistant-message table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
          font-size: 13px;
        }
        .assistant-message th,
        .assistant-message td {
          border: 1px solid var(--border-default);
          padding: 8px 12px;
          text-align: left;
        }
        .assistant-message th {
          background: var(--bg-surface);
          font-weight: 600;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}

export default ChatComponent
