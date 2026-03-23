"use client"

import { Clock, FileText, HelpCircle, LayoutList } from "lucide-react"
import { useEffect, useState } from "react"
import type { Notebook } from "@/hooks/useNotebooks"

interface StudioPanelProps {
  notebookId: string
  notebook: Notebook | undefined
  onGenerate: (prompt: string) => void
}

const OUTPUTS = [
  {
    id: "summary",
    icon: FileText,
    title: "Summary",
    desc: "Concise summary of all selected sources",
    prompt: "Generate a comprehensive summary of all selected sources",
  },
  {
    id: "briefing",
    icon: LayoutList,
    title: "Briefing doc",
    desc: "Structured briefing with key points and insights",
    prompt: "Create a structured briefing document with key insights",
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "FAQ",
    desc: "Common questions and answers from sources",
    prompt: "Generate frequently asked questions from the sources",
  },
  {
    id: "timeline",
    icon: Clock,
    title: "Timeline",
    desc: "Extract chronological events and dates",
    prompt: "Extract and organize all chronological events and dates",
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

function StudioTab({
  notebookId,
  onGenerate,
}: {
  notebookId: string
  onGenerate: (prompt: string) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionLabel>Generate</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {OUTPUTS.map((out) => (
          <button
            key={out.id}
            type="button"
            onClick={() => onGenerate(out.prompt)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)"
              e.currentTarget.style.background = "var(--bg-secondary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)"
              e.currentTarget.style.background = "var(--bg-elevated)"
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
              <out.icon size={14} color="var(--text-tertiary)" />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {out.title}
              </span>
            </div>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--text-tertiary)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {out.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function NotesTab({ notebookId }: { notebookId: string }) {
  const [text, setText] = useState("")
  const [notes, setNotes] = useState<
    { id: string; text: string; createdAt: Date }[]
  >([])

  // Load notes from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`notes:${notebookId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setNotes(parsed.map((n: { id: string; text: string; createdAt: string }) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [notebookId])

  // Persist notes to localStorage whenever they change
  const persistNotes = (newNotes: { id: string; text: string; createdAt: Date }[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`notes:${notebookId}`, JSON.stringify(newNotes))
    }
  }

  const addNote = () => {
    if (!text.trim()) return
    const newNotes = [
      { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date() },
      ...notes,
    ]
    setNotes(newNotes)
    persistNotes(newNotes)
    setText("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionLabel>My Notes</SectionLabel>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            addNote()
          }
        }}
        placeholder="Add a note... (Ctrl+Enter to save)"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          fontSize: 12,
          lineHeight: 1.6,
          resize: "none",
          height: 80,
          outline: "none",
        }}
      />
      <button
        type="button"
        onClick={addNote}
        disabled={!text.trim()}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          fontSize: 12,
          cursor: text.trim() ? "pointer" : "not-allowed",
          opacity: text.trim() ? 1 : 0.5,
        }}
      >
        Save note
      </button>
      {notes.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 8,
          }}
        >
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-primary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {note.text}
              </p>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 6,
                  display: "block",
                }}
              >
                {note.createdAt.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OverviewTab({ notebook }: { notebook: Notebook | undefined }) {
  const stats = [
    { label: "Total sources", value: notebook?._count?.documents ?? 0 },
    { label: "Vector chunks", value: "-" },
    { label: "Embedding dim", value: "1024d" },
    { label: "LLM", value: "llama-3.3-70b" },
    { label: "Vector DB", value: "Qdrant" },
    { label: "Embeddings", value: "nomic-embed" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionLabel>Overview</SectionLabel>

      <div
        style={{
          padding: 20,
          borderRadius: 8,
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            margin: 0,
          }}
        >
          Mind map coming soon
        </p>
      </div>

      <SectionLabel>Stack Info</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderRadius: 8,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {s.label}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StudioPanel({
  notebookId,
  notebook,
  onGenerate,
}: StudioPanelProps) {
  const [activeTab, setActiveTab] = useState<"studio" | "notes" | "overview">(
    "studio"
  )

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {(["studio", "notes", "overview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "12px 10px",
              fontSize: 12,
              fontWeight: 500,
              color:
                activeTab === tab
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
              textTransform: "capitalize",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 14,
        }}
      >
        {activeTab === "studio" && (
          <StudioTab notebookId={notebookId} onGenerate={onGenerate} />
        )}
        {activeTab === "notes" && <NotesTab notebookId={notebookId} />}
        {activeTab === "overview" && <OverviewTab notebook={notebook} />}
      </div>
    </div>
  )
}
