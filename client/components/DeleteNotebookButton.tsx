"use client"

import { Trash2 } from "lucide-react"
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

export function DeleteNotebookButton({
  notebookId,
  notebookName,
}: {
  notebookId: string
  notebookName: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const api = useApiClient()

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    try {
      await api.delete(`/api/notebooks/${notebookId}`)
      toast.success("Notebook deleted successfully")
      setOpen(false)
      router.refresh()
      router.push("/notebooks")
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error("Failed to delete notebook", {
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
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          color: "var(--text-muted)",
          border: "none",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--error)"
          e.currentTarget.style.background = "var(--bg-elevated)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)"
          e.currentTarget.style.background = "transparent"
        }}
        aria-label="Delete notebook"
      >
        <Trash2 size={16} />
      </button>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!loading) setOpen(val)
        }}
      >
        <DialogContent
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete notebook</DialogTitle>
            <DialogDescription style={{ color: "var(--text-tertiary)" }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {notebookName}
              </strong>
              ? This will permanently remove all documents and chat history
              associated with it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter style={{ marginTop: "16px" }}>
            <button
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
              onClick={handleDelete}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--error)",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
