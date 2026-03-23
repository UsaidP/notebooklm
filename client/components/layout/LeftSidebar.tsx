"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import {
  BookOpen,
  CheckCircle,
  FileText,
  Loader2,
  LogOut,
  Plus,
  Settings,
  Trash2,
  X,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { useDocumentMutations, useDocuments } from "@/hooks/useDocuments"
import { useSourceSelection } from "@/hooks/useSourceSelection"

function formatBytes(b: number) {
  if (!b) return ""
  if (b > 1048576) return (b / 1048576).toFixed(1) + " MB"
  return (b / 1024).toFixed(0) + " KB"
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
// FIX: Replaced hardcoded colors with CSS variables; added --success/--warning/--error
// as inline fallbacks since they're not yet in globals.css
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    INDEXED: { label: "Ready", color: "#7a9e7e", bg: "rgba(122,158,126,0.18)" },
    PROCESSING: {
      label: "Processing",
      color: "var(--privy-clay)",
      bg: "rgba(193,105,79,0.12)",
    },
    PENDING: {
      label: "Pending",
      color: "var(--text-tertiary)",
      bg: "var(--bg-elevated)",
    },
    FAILED: { label: "Failed", color: "#b94a48", bg: "rgba(185,74,72,0.1)" },
  }
  const c = cfg[status] ?? cfg.PENDING

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 4,
        background: c.bg,
        fontSize: 10,
        fontWeight: 600,
        color: c.color,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {status === "PROCESSING" && (
        <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
      )}
      {status === "INDEXED" && <CheckCircle size={10} />}
      {status === "FAILED" && <XCircle size={10} />}
      {c.label}
    </div>
  )
}

// ─── Source Item ──────────────────────────────────────────────────────────────
function SourceItem({
  doc,
  selected,
  onToggle,
  onDelete,
}: {
  doc: any
  selected: boolean
  onToggle: () => void
  onDelete?: (e: React.MouseEvent) => void
}) {
  const [showDelete, setShowDelete] = useState(false)
  const isIndexed = doc.status === "INDEXED"

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (isIndexed) onToggle()
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "9px 10px",
        borderRadius: 8,
        marginBottom: 4,
        // FIX: was using var(--border-strong) which maps to ink in light mode —
        // using sidebar-border for selected and sidebar-accent for hover bg
        border: `1px solid ${selected ? "var(--sidebar-primary)" : "transparent"}`,
        background: selected ? "var(--sidebar-accent)" : "transparent",
        cursor: isIndexed ? "pointer" : "default",
        transition: "all 0.12s",
        position: "relative",
      }}
    >
      {/* Checkbox — only for indexed docs */}
      {isIndexed && (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: selected ? "none" : `1.5px solid var(--sidebar-border)`,
            // FIX: was using var(--accent) which is sage in light but clay in dark.
            // sidebar-primary always maps to sage regardless of theme
            background: selected ? "var(--sidebar-primary)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            transition: "all 0.12s",
          }}
        >
          {selected && (
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--sidebar-primary-foreground)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {/* File icon */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          // FIX: was var(--bg-elevated) — sidebar-accent keeps it in sidebar palette
          background: "var(--sidebar-accent)",
          border: "1px solid var(--sidebar-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileText
          size={14}
          color="var(--sidebar-foreground)"
          style={{ opacity: 0.6 }}
        />
      </div>

      {/* Meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--sidebar-foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 2,
          }}
        >
          {doc.name}
        </div>
        <div
          style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}
        >
          {doc.pageCount ? `${doc.pageCount}p · ` : ""}
          {doc.chunkCount ? `${doc.chunkCount} chunks · ` : ""}
          {formatBytes(doc.sizeBytes)}
        </div>
        <StatusBadge status={doc.status} />

        {doc.status === "PROCESSING" && (
          <div
            style={{
              height: 2,
              background: "var(--sidebar-border)",
              borderRadius: 1,
              marginTop: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "60%",
                // FIX: sidebar-primary keeps the progress bar theme-aware
                background: "var(--sidebar-primary)",
                borderRadius: 1,
                animation: "shimmer 1.5s ease infinite",
              }}
            />
          </div>
        )}
      </div>

      {/* Delete button */}
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(e)
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "none",
            background: "rgba(185,74,72,0.1)",
            color: "var(--destructive)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(185,74,72,0.2)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(185,74,72,0.1)"
          }}
          title="Delete document"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ─── User Profile ─────────────────────────────────────────────────────────────
function UserProfile() {
  const router = useRouter()
  const { signOut } = useClerk()
  const { user } = useUser()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/sign-in")
  }

  const getInitials = () => {
    if (!user) return "U"
    return (
      user.firstName?.[0] ||
      user.emailAddresses[0]?.emailAddress?.[0] ||
      "U"
    ).toUpperCase()
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setShowMenu((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 8,
          border: "none",
          // FIX: was hardcoded transparent with #4A4F5A hover — now uses sidebar tokens
          background: "transparent",
          cursor: "pointer",
          width: "100%",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--sidebar-accent)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1.5px solid var(--sidebar-border)",
            // FIX: sidebar-primary instead of var(--accent) so it stays sage in all themes
            background: "var(--sidebar-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--sidebar-primary-foreground)",
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
        >
          {getInitials()}
        </div>

        <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
          {/* FIX: was hardcoded #EEEEEE — now uses sidebar-foreground */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--sidebar-foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.fullName || "User"}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.primaryEmailAddress?.emailAddress}
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {showMenu && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowMenu(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setShowMenu(false)
              }
            }}
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              right: 0,
              minWidth: 180,
              // FIX: was var(--bg-secondary) which is paper in light mode — use sidebar token
              background: "var(--sidebar)",
              border: "1px solid var(--sidebar-border)",
              borderRadius: 8,
              // FIX: shadow was too dark for light theme
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                color: "var(--destructive)",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--sidebar-accent)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
interface LeftSidebarProps {
  notebookId: string
  isMobile?: boolean
  onClose?: () => void
}

export function LeftSidebar({ notebookId, isMobile = false, onClose }: LeftSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { data: documents, isLoading } = useDocuments(notebookId)
  const { uploadDocument, deleteDocument } = useDocumentMutations(notebookId)
  const { selectedIds, toggle } = useSourceSelection()

  async function handleFiles(files: FileList) {
    const pdf = Array.from(files).find((f) => f.type === "application/pdf")
    if (!pdf) {
      toast.error("Only PDF files are supported")
      return
    }
    if (pdf.size > 50 * 1024 * 1024) {
      toast.error("File must be under 50MB")
      return
    }
    try {
      await uploadDocument({ file: pdf })
      toast.success("Upload started — processing…")
    } catch {
      toast.error("Upload failed. Please try again.")
    }
  }

  async function handleDelete(docId: string, docName: string) {
    if (
      !confirm(
        `Delete "${docName}"? This will remove the document and its vectors.`
      )
    )
      return
    try {
      await deleteDocument(docId)
      toast.success(`Deleted "${docName}"`)
    } catch {
      toast.error(`Failed to delete "${docName}"`)
    }
  }

  const docCount = documents?.length ?? 0

  return (
    // FIX: was hardcoded #393E46 — now var(--sidebar) which adapts to light/dark
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Logo / Back link ── */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--sidebar-border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Link
          href="/notebooks"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            transition: "background 0.12s",
            flex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sidebar-accent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--sidebar-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={15} color="var(--sidebar-primary-foreground)" />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--sidebar-foreground)",
              letterSpacing: -0.3,
            }}
          >
            Notebooks
          </span>
        </Link>

        {/* Close button (mobile only) */}
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--sidebar-border)",
              background: "var(--sidebar-accent)",
              color: "var(--sidebar-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--sidebar-primary)"
              e.currentTarget.style.color = "var(--sidebar-primary-foreground)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--sidebar-accent)"
              e.currentTarget.style.color = "var(--sidebar-foreground)"
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Add sources button ── */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--sidebar-border)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "9px 14px",
            borderRadius: 8,
            // FIX: was hardcoded #4A4F5A border/bg with #B0B0B0 text
            border: "1px solid var(--sidebar-border)",
            background: "var(--sidebar-accent)",
            color: "var(--sidebar-foreground)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.12s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--sidebar-primary)"
            e.currentTarget.style.color = "var(--sidebar-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--sidebar-border)"
            e.currentTarget.style.color = "var(--sidebar-foreground)"
          }}
        >
          <Plus size={14} />
          Add sources
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* ── Document list ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 0" }}>
        {docCount > 0 && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "2px 4px 8px",
            }}
          >
            Sources ({docCount})
          </div>
        )}

        {/* Skeleton loaders */}
        {isLoading &&
          [1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 58,
                borderRadius: 8,
                marginBottom: 6,
                // FIX: was var(--bg-elevated) — sidebar-accent keeps it in sidebar palette
                background: "var(--sidebar-accent)",
                opacity: 0.6,
              }}
            />
          ))}

        {/* Empty state */}
        {!isLoading && docCount === 0 && (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--sidebar-accent)",
                border: "1px solid var(--sidebar-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
              }}
            >
              <FileText size={17} color="var(--text-muted)" />
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Upload a PDF to get started
            </p>
          </div>
        )}

        {/* Document items */}
        {!isLoading &&
          documents?.map((doc) => (
            <SourceItem
              key={doc.id}
              doc={doc}
              selected={selectedIds.has(doc.id)}
              onToggle={() => toggle(doc.id)}
              onDelete={(e) => {
                e.stopPropagation()
                handleDelete(doc.id, doc.name)
              }}
            />
          ))}

        {/* Drop zone — only shown when docs exist */}
        {docCount > 0 && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload PDF"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              e.dataTransfer.files && handleFiles(e.dataTransfer.files)
            }}
            style={{
              margin: "8px 0 12px",
              border: `1.5px dashed ${isDragging ? "var(--sidebar-primary)" : "var(--sidebar-border)"}`,
              borderRadius: 8,
              padding: "12px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? "var(--sidebar-accent)" : "transparent",
              transition: "all 0.12s",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Drop PDF or{" "}
              <span
                style={{ color: "var(--sidebar-primary)", fontWeight: 500 }}
              >
                browse
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Footer: Settings + User ── */}
      <div
        style={{ flexShrink: 0, borderTop: "1px solid var(--sidebar-border)" }}
      >
        <button
          type="button"
          onClick={() => (window.location.href = "/settings")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            border: "none",
            background: "transparent",
            // FIX: was hardcoded #B0B0B0 — now sidebar-foreground with opacity
            color: "var(--sidebar-foreground)",
            fontSize: 13,
            cursor: "pointer",
            transition: "background 0.12s",
            fontFamily: "inherit",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sidebar-accent)"
            e.currentTarget.style.opacity = "1"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.opacity = "0.7"
          }}
        >
          <Settings size={15} />
          Settings
        </button>

        <UserProfile />
      </div>
    </div>
  )
}
