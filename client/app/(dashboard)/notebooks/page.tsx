import { auth } from "@clerk/nextjs/server"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { CreateNotebookButton } from "@/components/CreateNotebookButton"
import { NotebookCard } from "@/components/notebook/NotebookCard"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface NotebookWithCounts {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    documents: number
    chatSessions: number
  }
}

/**
 * Fetch notebooks from backend API with Clerk JWT token
 */
async function getNotebooks(): Promise<NotebookWithCounts[]> {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${API_BASE_URL}/api/notebooks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      if (res.status === 401) {
        redirect("/sign-in")
      }
      // Log the error to your Railway console instead of crashing the user's page
      console.error(`Backend returned status ${res.status}`)
      return []
    }

    const data = await res.json()
    // Parse date strings to Date objects
    return (data.data || []).map((notebook: any) => ({
      ...notebook,
      createdAt: new Date(notebook.createdAt),
      updatedAt: new Date(notebook.updatedAt),
    }))
  } catch (error) {
    // Catches network errors (e.g., if the backend is completely unreachable)
    console.error("Failed to fetch notebooks:", error)
    return []
  }
}

export default async function NotebooksPage() {
  const notebooks = await getNotebooks()

  return (
    <div
      style={{
        padding: "clamp(16px, 3vw, 32px) clamp(16px, 3vw, 40px)",
        maxWidth: "1200px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "clamp(24px, 4vw, 32px)",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(20px, 4vw, 24px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 4px",
              letterSpacing: "-0.3px",
            }}
          >
            Notebooks
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-tertiary)",
              margin: 0,
            }}
          >
            {notebooks.length}{" "}
            {notebooks.length === 1 ? "notebook" : "notebooks"}
          </p>
        </div>

        <CreateNotebookButton />
      </div>

      {/* Notebook Grid */}
      {notebooks.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(60px, 10vw, 100px) clamp(16px, 3vw, 40px)",
            border: "1px dashed var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-secondary)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "clamp(48px, 10vw, 64px)",
              height: "clamp(48px, 10vw, 64px)",
              borderRadius: "clamp(12px, 3vw, 16px)",
              background: "var(--accent-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                fontSize: "clamp(24px, 5vw, 32px)",
                color: "var(--accent)",
              }}
            >
              +
            </span>
          </div>
          <h3
            style={{
              fontSize: "clamp(18px, 4vw, 20px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 8px",
              letterSpacing: "-0.4px",
            }}
          >
            Create your first notebook
          </h3>
          <p
            style={{
              fontSize: "clamp(14px, 3vw, 15px)",
              color: "var(--text-tertiary)",
              margin: "0 0 32px",
              maxWidth: "min(380px, 90vw)",
              lineHeight: 1.6,
            }}
          >
            Notebooks are isolated workspaces where you can upload documents and
            have focused AI conversations.
          </p>
          <CreateNotebookButton />

          <div
            style={{
              marginTop: "48px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "24px",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "32px",
              width: "100%",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Step 1
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                Create a notebook for your research topic.
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Step 2
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                Upload PDFs to the notebook as sources.
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Step 3
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                Ask questions to get source-grounded answers.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {notebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              id={notebook.id}
              title={notebook.title}
              description={notebook.description}
              updatedAt={notebook.updatedAt}
              documentCount={notebook._count?.documents || 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
