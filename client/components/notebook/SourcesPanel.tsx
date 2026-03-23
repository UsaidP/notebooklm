"use client"

import {
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { useDocumentMutations, useDocuments } from "@/hooks/useDocuments"
import { useSourceSelection } from "@/hooks/useSourceSelection"

function formatBytes(b: number) {
  if (!b) return ""
  if (b > 1048576) return (b / 1048576).toFixed(1) + " MB"
  return (b / 1024).toFixed(0) + " KB"
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    INDEXED: {
      label: "Ready",
      color: "var(--success)",
      bg: "var(--success-muted)",
    },
    PROCESSING: {
      label: "Processing",
      color: "var(--warning)",
      bg: "var(--bg-elevated)",
    },
    PENDING: {
      label: "Pending",
      color: "var(--text-tertiary)",
      bg: "var(--bg-elevated)",
    },
    FAILED: {
      label: "Failed",
      color: "var(--destructive)",
      bg: "rgba(185, 74, 72, 0.1)",
    },
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

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "9px 10px",
        borderRadius: 8,
        marginBottom: 5,
        cursor: doc.status === "INDEXED" ? "pointer" : "default",
        border: `1px solid ${selected ? "var(--border-strong)" : "transparent"}`,
        background: selected ? "var(--bg-elevated)" : "transparent",
        transition: "all 0.12s",
        position: "relative",
      }}
    >
      {/* Checkbox */}
      {doc.status === "INDEXED" && (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: selected ? "none" : "1.5px solid var(--border-strong)",
            background: selected ? "var(--accent)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {selected && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="var(--text-primary)"
              strokeWidth="3"
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
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileText size={14} color="var(--text-secondary)" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 2,
          }}
        >
          {doc.name}
        </div>
        <div
          style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}
        >
          {doc.pageCount ? `${doc.pageCount}p · ` : ""}
          {doc.chunkCount ? `${doc.chunkCount} chunks · ` : ""}
          {formatBytes(doc.sizeBytes)}
        </div>
        <StatusBadge status={doc.status} />

        {/* Processing bar */}
        {doc.status === "PROCESSING" && (
          <div
            style={{
              height: 2,
              background: "var(--bg-secondary)",
              borderRadius: 1,
              marginTop: 5,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "60%",
                background: "var(--accent)",
                borderRadius: 1,
                animation: "shimmer 1.5s ease infinite",
              }}
            />
          </div>
        )}
      </div>

      {/* Delete Button */}
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(e)
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "none",
            background: "rgba(185, 74, 72, 0.1)",
            color: "var(--destructive)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(185, 74, 72, 0.2)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(185, 74, 72, 0.1)"
          }}
          title="Delete document"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

export function SourcesPanel({ notebookId }: { notebookId: string }) {
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
      toast.success("Upload started — processing...")
    } catch {
      toast.error("Upload failed. Try again.")
    }
  }

  async function handleDelete(docId: string, docName: string) {
    if (
      !confirm(
        `Delete "${docName}"? This will remove the document and its vectors.`
      )
    ) {
      return
    }
    try {
      await deleteDocument(docId)
      toast.success(`Deleted "${docName}"`)
    } catch {
      toast.error(`Failed to delete "${docName}"`)
    }
  }

  return (
    <div
      style={{
        width: 272,
        flexShrink: 0,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LOGO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="var(--text-primary)"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: -0.3,
          }}
        >
          PDF Research
        </span>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ADD SOURCES BUTTON
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "9px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.12s",
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SOURCES PDF LIST (scrollable)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 0" }}>
        {/* Section label */}
        {(documents?.length ?? 0) > 0 && (
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
            Sources ({documents!.length})
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading &&
          [1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 58,
                borderRadius: 8,
                marginBottom: 6,
                background: "var(--bg-elevated)",
                opacity: 0.5,
              }}
            />
          ))}

        {/* Empty state */}
        {!isLoading && documents?.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px 16px" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
              }}
            >
              <FileText size={17} color="var(--text-tertiary)" />
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Upload a PDF to get started
            </p>
          </div>
        )}

        {/* PDF items */}
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

        {/* Drop zone (only when docs exist) */}
        {(documents?.length ?? 0) > 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
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
              border: `1.5px dashed ${isDragging ? "var(--accent)" : "var(--border-subtle)"}`,
              borderRadius: 8,
              padding: "11px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? "var(--bg-elevated)" : "transparent",
              transition: "all 0.12s",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Drop PDF or{" "}
              <span style={{ color: "var(--text-secondary)" }}>browse</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
