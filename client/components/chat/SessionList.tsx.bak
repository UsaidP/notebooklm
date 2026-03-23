"use client"

import { MessageSquare, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  type ChatSession,
  useSessionMutations,
  useSessions,
} from "@/hooks/useSessions"

interface SessionSidebarProps {
  notebookId: string
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        cursor: "pointer",
        background: isActive ? "var(--bg-surface-hover)" : "transparent",
        borderLeft: isActive
          ? "3px solid var(--accent)"
          : "3px solid transparent",
        transition: "background 0.1s",
        position: "relative",
        border: "none",
        width: "100%",
        textAlign: "left",
        appearance: "none",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: isActive ? "var(--accent)" : "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <MessageSquare
          size={18}
          style={{
            color: isActive ? "var(--primary-foreground)" : "var(--text-muted)",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {session.title || "New Chat"}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            {formatTime(session.updatedAt)}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Click to open conversation
        </div>
      </div>

      {/* Delete button */}
      {showDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "none",
            background: "var(--destructive)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: 0.9,
          }}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
    </button>
  )
}

export function SessionSidebar({
  notebookId,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: sessions, isLoading } = useSessions(notebookId)
  const { deleteSession, createSession, isCreating } =
    useSessionMutations(notebookId)

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Delete this conversation?")) return
    try {
      await deleteSession(sessionId)
      toast.success("Conversation deleted")
      if (sessionId === activeSessionId) {
        onNewSession()
      }
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleNewSession = async () => {
    try {
      const session = await createSession()
      onSelectSession(session.id)
    } catch (err) {
      console.error("Failed to create session:", err)
      toast.error("Failed to create session")
    }
  }

  const filteredSessions = sessions?.filter((s) =>
    (s.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-default)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Chats
          </span>
          <button
            type="button"
            onClick={handleNewSession}
            disabled={isCreating}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "var(--primary-foreground)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isCreating ? 0.6 : 1,
            }}
            title="New chat"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* Sessions list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Loading...
            </span>
          </div>
        ) : !filteredSessions?.length ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <MessageSquare size={22} style={{ color: "var(--text-muted)" }} />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {searchQuery ? "No chats found" : "No conversations yet"}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                margin: "4px 0 0",
              }}
            >
              Click + to start a new chat
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSelectSession(session.id)}
              onDelete={() => handleDelete(session.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
