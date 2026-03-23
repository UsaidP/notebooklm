import { FileText, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingNotebooks() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: "1200px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 4px",
              letterSpacing: "-0.3px",
            }}
          >
            Notebooks
          </h1>
          <Skeleton className="h-[20px] w-[120px]" />
        </div>
        <button
          type="button"
          disabled
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "var(--accent)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
            opacity: 0.5,
            cursor: "not-allowed",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <Plus size={18} /> New Notebook
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "20px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <Skeleton className="w-[40px] h-[40px] rounded-md shrink-0" />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "2px",
                }}
              >
                <Skeleton className="h-[18px] w-3/4" />
                <Skeleton className="h-[14px] w-1/2" />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "auto",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <Skeleton className="h-[14px] w-[50px]" />
              <Skeleton className="h-[14px] w-[70px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
