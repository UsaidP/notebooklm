"use client"

import { Clock, FileText, HelpCircle, LayoutList, Loader2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface StudioSidebarProps {
  notebookId: string
  onGenerate: (prompt: string) => void
  isMobile?: boolean
  onClose?: () => void
}

const OUTPUTS = [
  {
    id: "summary",
    icon: FileText,
    title: "Summary",
    desc: "Concise summary of all selected sources",
    prompt:
      "Generate a comprehensive summary of all selected sources. Focus on the most important information and key takeaways.",
  },
  {
    id: "briefing",
    icon: LayoutList,
    title: "Briefing doc",
    desc: "Structured briefing with key points and insights",
    prompt:
      "Create a structured briefing document. Include: Executive Summary, Key Findings, Analysis, and Recommendations based on the sources.",
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "FAQ",
    desc: "Common questions and answers from sources",
    prompt:
      "Generate a list of frequently asked questions based on the content. Include 5-8 relevant questions with detailed answers.",
  },
  {
    id: "timeline",
    icon: Clock,
    title: "Timeline",
    desc: "Extract chronological events and dates",
    prompt:
      "Extract and organize all chronological events, dates, and milestones mentioned in the sources. Present as a structured timeline.",
  },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

export function StudioSidebar({ notebookId, onGenerate, isMobile = false, onClose }: StudioSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleGenerate = (id: string, prompt: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setActiveId(id)
    onGenerate(prompt)
    timeoutRef.current = setTimeout(() => {
      setActiveId(null)
      timeoutRef.current = null
    }, 1000)
  }

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: "1px solid var(--border-default)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--bg-surface-hover)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Studio
          </span>
        </div>

        {/* Close button (mobile only) */}
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close studio"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-hover)"
              e.currentTarget.style.color = "var(--text-primary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-surface)"
              e.currentTarget.style.color = "var(--text-secondary)"
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionLabel>Generate</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {OUTPUTS.map((out) => {
              const isActive = activeId === out.id
              return (
                <button
                  key={out.id}
                  type="button"
                  onClick={() => handleGenerate(out.id, out.prompt)}
                  disabled={isActive}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border-default)"}`,
                    background: isActive
                      ? "var(--accent-muted)"
                      : "var(--bg-surface-hover)",
                    cursor: isActive ? "default" : "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    opacity: isActive ? 0.8 : 1,
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "var(--text-primary)"
                      e.currentTarget.style.background = "var(--bg-secondary)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor =
                        "var(--border-default)"
                      e.currentTarget.style.background =
                        "var(--bg-surface-hover)"
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {isActive ? (
                      <Loader2
                        size={14}
                        color="var(--accent)"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <out.icon size={14} color="var(--text-muted)" />
                    )}
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isActive
                          ? "var(--accent)"
                          : "var(--text-primary)",
                      }}
                    >
                      {isActive ? "Generating..." : out.title}
                    </span>
                  </div>
                  {!isActive && (
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {out.desc}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
