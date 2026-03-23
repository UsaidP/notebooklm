import { auth } from "@clerk/nextjs/server"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { CreateNotebookButton } from "@/components/CreateNotebookButton"
import { NotebookCard } from "@/components/notebook/NotebookCard"
import { prisma } from "@/lib/prisma"

/**
 * Notebook List Page (React Server Component)
 * Displays all notebooks for the authenticated user
 */

interface NotebookWithCounts {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  _count: {
    documents: number
    chatSessions: number
  }
}

async function getNotebooks(userId: string): Promise<NotebookWithCounts[]> {
  // Find internal user by clerkUserId
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  })

  if (!user) {
    return []
  }

  return prisma.notebook.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { documents: true, chatSessions: true },
      },
    },
  }) as Promise<NotebookWithCounts[]>
}

export default async function NotebooksPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const notebooks = await getNotebooks(userId)

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
              documentCount={notebook._count.documents}
            />
          ))}
        </div>
      )}
    </div>
  )
}
