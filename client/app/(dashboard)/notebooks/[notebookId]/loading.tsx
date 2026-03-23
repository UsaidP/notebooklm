import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingNotebookView() {
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left Panel Structure (Matches FileUpload Component) */}
      <div
        style={{
          width: "320px",
          borderRight: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Header Area */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <Skeleton className="h-[24px] w-[180px] mb-2" />
          <Skeleton className="h-[14px] w-[240px]" />
        </div>

        {/* Upload Box Area */}
        <div style={{ padding: "20px" }}>
          <Skeleton className="w-full h-[120px] rounded-xl mb-6" />

          {/* Documents List Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <Skeleton className="h-[14px] w-[80px]" />
            <Skeleton className="h-[14px] w-[40px]" />
          </div>

          {/* Document Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Skeleton className="w-[32px] h-[32px] rounded-md shrink-0" />
                  <div style={{ flex: 1 }}>
                    <Skeleton className="h-[14px] w-full mb-2" />
                    <Skeleton className="h-[12px] w-[100px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel Structure (Matches Chat Component) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <Skeleton className="h-[20px] w-[200px]" />
        </div>
        <div
          style={{
            flex: 1,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Chat message skeletons */}
          <div style={{ alignSelf: "flex-end", width: "60%" }}>
            <Skeleton className="h-[60px] w-full rounded-2xl rounded-br-sm" />
          </div>
          <div style={{ display: "flex", gap: "12px", width: "80%" }}>
            <Skeleton className="w-[32px] h-[32px] rounded-full shrink-0" />
            <Skeleton className="h-[100px] w-full rounded-2xl rounded-bl-sm" />
          </div>
          <div style={{ alignSelf: "flex-end", width: "50%" }}>
            <Skeleton className="h-[40px] w-full rounded-2xl rounded-br-sm" />
          </div>
        </div>

        {/* Input box */}
        <div style={{ padding: "24px" }}>
          <Skeleton className="h-[60px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
