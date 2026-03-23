"use client"

import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import React, {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadStatus = "idle" | "uploading" | "success" | "error"
type DocumentStatus = "PENDING" | "QUEUED" | "PROCESSING" | "INDEXED" | "FAILED"

interface UploadFile {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  documentId?: string
  documentStatus?: DocumentStatus
}

interface FileUploadProps {
  notebookId: string
  onDocumentUploaded?: (documentIds: string[]) => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

const generateId = (): string => Math.random().toString(36).substring(2, 10)

const getStatusBadge = (
  status: DocumentStatus | undefined,
  uploadStatus: UploadStatus
) => {
  if (uploadStatus === "uploading") {
    return {
      text: "Uploading...",
      color: "var(--warning)",
      bg: "var(--warning-muted)",
    }
  }
  if (uploadStatus === "error") {
    return { text: "Error", color: "var(--error)", bg: "transparent" }
  }

  switch (status) {
    case "PENDING":
      return {
        text: "Pending",
        color: "var(--text-muted)",
        bg: "var(--bg-surface)",
      }
    case "QUEUED":
      return {
        text: "Queued",
        color: "var(--warning)",
        bg: "var(--warning-muted)",
      }
    case "PROCESSING":
      return {
        text: "Processing...",
        color: "var(--info)",
        bg: "var(--info-muted)",
      }
    case "INDEXED":
      return {
        text: "Ready",
        color: "var(--success)",
        bg: "var(--success-muted)",
      }
    case "FAILED":
      return { text: "Failed", color: "var(--error)", bg: "transparent" }
    default:
      return {
        text: "Ready",
        color: "var(--success)",
        bg: "var(--success-muted)",
      }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const FileUploadComponent: React.FC<FileUploadProps> = ({
  notebookId,
  onDocumentUploaded,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { getToken } = useAuth()

  // ─── Polling for Document Status ─────────────────────────────────────────────
  // We want to poll the server for the status of any files that are QUEUED or PROCESSING
  useEffect(() => {
    // Collect IDs of documents that need polling
    const pendingIds = files
      .filter(
        (f) =>
          f.documentId &&
          (f.documentStatus === "QUEUED" ||
            f.documentStatus === "PROCESSING" ||
            f.documentStatus === "PENDING")
      )
      .map((f) => f.documentId!)

    if (pendingIds.length === 0) return

    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const token = await getToken()
        // Just fetch the whole notebook or specific docs. Let's assume we have an endpoint that returns notebook docs
        const res = await axios.get(
          `${API_BASE_URL}/api/notebooks/${notebookId}/documents`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }
        )

        if (!isMounted) return

        const serverDocs = res.data.data

        setFiles((prev) =>
          prev.map((f) => {
            if (!f.documentId) return f
            const serverDoc = serverDocs.find(
              (sd: any) => sd.id === f.documentId
            )
            if (serverDoc) {
              return { ...f, documentStatus: serverDoc.status }
            }
            return f
          })
        )

        // If any are still pending, poll again in 3 seconds
        const stillPending = serverDocs.some(
          (sd: any) =>
            pendingIds.includes(sd.id) &&
            (sd.status === "QUEUED" ||
              sd.status === "PROCESSING" ||
              sd.status === "PENDING")
        )

        if (stillPending && isMounted) {
          timeoutId = setTimeout(pollStatus, 3000)
        }
      } catch (err) {
        console.error("Failed to poll document status:", err)
        // Retry anyway after a longer delay
        if (isMounted) {
          timeoutId = setTimeout(pollStatus, 5000)
        }
      }
    }

    // Initial poll kick-off
    timeoutId = setTimeout(pollStatus, 2000)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [files, notebookId, getToken])

  // Upload all files in a single request
  const uploadFiles = useCallback(
    async (items: { id: string; file: File }[]) => {
      const formData = new FormData()
      formData.append("notebookId", notebookId)

      items.forEach((item) => {
        formData.append("pdf", item.file)
      })

      // Get Clerk JWT token
      const token = await getToken()

      axios
        .post(`${API_BASE_URL}/api/documents/upload`, formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              )
              setFiles((prev) =>
                prev.map((f) =>
                  items.some((item) => item.id === f.id)
                    ? { ...f, progress: percent }
                    : f
                )
              )
            }
          },
        })
        .then((response) => {
          const uploadedDocs = response.data.data
          const succeededIds: string[] = []

          setFiles((prev) =>
            prev.map((f) => {
              const uploadedDoc = uploadedDocs.find(
                (d: { name: string }) => d.name === f.file.name
              )
              if (uploadedDoc && uploadedDoc.status === "QUEUED") {
                succeededIds.push(uploadedDoc.id)
                return {
                  ...f,
                  progress: 100,
                  status: "success",
                  documentId: uploadedDoc.id,
                  documentStatus: "QUEUED",
                }
              } else if (uploadedDoc && uploadedDoc.status === "FAILED") {
                return { ...f, status: "error", error: uploadedDoc.error }
              }
              return f
            })
          )

          if (succeededIds.length > 0 && onDocumentUploaded) {
            onDocumentUploaded(succeededIds)
          }
        })
        .catch((error) => {
          const errorMsg = error.response?.data?.error || "Upload failed"
          toast.error("Upload Failed", { description: errorMsg })
          setFiles((prev) =>
            prev.map((f) =>
              items.some((item) => item.id === f.id)
                ? { ...f, status: "error", error: errorMsg }
                : f
            )
          )
        })
    },
    [notebookId, onDocumentUploaded, getToken]
  )

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return
      const valid = Array.from(incoming).filter((f) => {
        if (f.type !== "application/pdf") {
          toast.error(`Invalid file type: ${f.name}`, {
            description: "Only PDF files are supported",
          })
          return false
        }
        if (f.size > 50 * 1024 * 1024) {
          toast.error(`File too large: ${f.name}`, {
            description: "Maximum file size is 50MB",
          })
          return false
        }
        return true
      })

      const newItems: UploadFile[] = valid.map((file) => ({
        id: generateId(),
        file,
        status: "uploading",
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...newItems])

      // Upload all files in a single request
      uploadFiles(newItems.map((item) => ({ id: item.id, file: item.file })))
    },
    [uploadFiles]
  )

  const onDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = ""
  }

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id))

  const pendingCount = files.filter((f) => f.status === "uploading").length

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
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.2px",
            }}
          >
            Sources
          </span>
          {files.length > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--text-tertiary)",
                background: "var(--bg-surface)",
                padding: "1px 7px",
                borderRadius: "10px",
              }}
            >
              {files.length}
            </span>
          )}
        </div>
      </div>

      {/* Add Source Button */}
      <div style={{ padding: "12px 16px 4px" }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          id="add-source-btn"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "9px 0",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius-md)",
            background: isDragging ? "var(--bg-elevated)" : "transparent",
            color: isDragging ? "var(--text-primary)" : "var(--text-tertiary)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
          }}
          onDragOver={
            onDragOver as unknown as React.DragEventHandler<HTMLButtonElement>
          }
          onDragLeave={
            onDragLeave as unknown as React.DragEventHandler<HTMLButtonElement>
          }
          onDrop={
            onDrop as unknown as React.DragEventHandler<HTMLButtonElement>
          }
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add source
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={onInputChange}
          style={{ display: "none" }}
          id="pdf-file-input"
        />
      </div>

      {/* File List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              padding: "32px 16px",
              textAlign: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: "12px", opacity: 0.5 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-tertiary)",
              }}
            >
              No sources yet
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Upload PDFs to build your knowledge base
            </p>
          </div>
        ) : (
          files.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                cursor: "default",
                transition: "background 0.12s ease",
                position: "relative",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* File Icon */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>

              {/* Name & Meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                  }}
                >
                  {item.file.name}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span
                    style={{ fontSize: "11px", color: "var(--text-muted)" }}
                  >
                    {formatBytes(item.file.size)}
                  </span>
                  {item.status === "uploading" && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "var(--warning)",
                        background: "var(--warning-muted)",
                        padding: "1px 6px",
                        borderRadius: "10px",
                      }}
                    >
                      {item.progress}%
                    </span>
                  )}
                  {item.status !== "uploading" &&
                    (() => {
                      const badge = getStatusBadge(
                        item.documentStatus,
                        item.status
                      )
                      return (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: badge.color,
                            background: badge.bg,
                            padding: "1px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          {badge.text}
                        </span>
                      )
                    })()}
                </div>
                {/* Progress bar */}
                {item.status === "uploading" && (
                  <div
                    style={{
                      marginTop: "4px",
                      height: "2px",
                      borderRadius: "1px",
                      background: "var(--border-subtle)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "1px",
                        background: "var(--accent)",
                        width: `${item.progress}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Remove */}
              {item.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  aria-label="Remove"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "22px",
                    height: "22px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    opacity: 0.5,
                    transition: "opacity 0.12s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.5"
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FileUploadComponent
