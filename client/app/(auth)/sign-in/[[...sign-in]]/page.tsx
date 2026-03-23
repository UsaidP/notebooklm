import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          Sign in to continue to PDF Research
        </p>
      </div>

      <SignIn
        appearance={{
          elements: {
            rootBox: {
              width: "100%",
            },
            card: {
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "none",
            },
            headerTitle: {
              display: "none",
            },
            headerSubtitle: {
              display: "none",
            },
            socialButtonsBlockButton: {
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
            socialButtonsBlockButtonText: {
              color: "var(--text-primary)",
            },
            formFieldLabel: {
              color: "var(--text-secondary)",
              fontSize: "14px",
            },
            formFieldInput: {
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
            formButtonPrimary: {
              background: "var(--accent)",
              color: "var(--primary-foreground)",
              fontSize: "14px",
              fontWeight: 500,
            },
            footerActionLink: {
              color: "var(--accent-hover)",
            },
            dividerLine: {
              background: "var(--border-default)",
            },
            dividerText: {
              color: "var(--text-muted)",
            },
            identityPreviewText: {
              color: "var(--text-primary)",
            },
            identityPreviewEditButton: {
              color: "var(--accent-hover)",
            },
            formFieldAction: {
              color: "var(--accent-hover)",
            },
            alertText: {
              color: "var(--text-primary)",
            },
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  )
}
