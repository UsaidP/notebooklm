"use client"

import { CopyIcon, FileText, LinkIcon, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApiClient } from "@/lib/api"

export function CreateNotebookButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const api = useApiClient()

  async function handleCreate() {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setLoading(true)
    try {
      const response = await api.post("/api/notebooks", {
        title: trimmedName,
        description: description.trim() || null,
      })

      const newNotebookId = response.data?.data?.id
      toast.success("Notebook created successfully")

      setName("")
      setDescription("")
      setOpen(false)

      // Refresh the current notebooks list and navigate to the new one
      router.refresh()
      if (newNotebookId) {
        router.push(`/notebooks/${newNotebookId}`)
      }
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error("Failed to create notebook", {
        description:
          error.response?.data?.error || error.message || "Please try again",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          background: "var(--accent)",
          color: "white",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          transition: "background 0.15s",
        }}
      >
        <Plus size={18} />
        New Notebook
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <DialogHeader>
            <DialogTitle>Create notebook</DialogTitle>
            <DialogDescription style={{ color: "var(--text-tertiary)" }}>
              Start an isolated workspace for a set of related documents.
            </DialogDescription>
          </DialogHeader>

          <div
            style={{
              marginTop: "16px",
              marginBottom: "8px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Name input */}
            <div>
              <label
                htmlFor="notebook-name"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Name
              </label>
              <input
                id="notebook-name"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
                placeholder="e.g. Research Papers 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Description textarea */}
            <div>
              <label
                htmlFor="notebook-description"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Description{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                id="notebook-description"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 14,
                  resize: "none",
                  minHeight: 80,
                  lineHeight: 1.5,
                }}
                placeholder="What will you research in this notebook?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                color: "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: !name.trim() || loading ? "not-allowed" : "pointer",
                opacity: !name.trim() || loading ? 0.5 : 1,
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
