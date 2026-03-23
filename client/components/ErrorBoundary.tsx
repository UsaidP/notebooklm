"use client"

import { Home, OctagonX, RefreshCcw } from "lucide-react"
import Link from "next/link"
import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  constructor(props: Props) {
    super(props)
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(248,113,113,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <OctagonX size={32} color="#f87171" />
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              maxWidth: 400,
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. We've been notified and are looking
            into it.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
            }}
          >
            <button
              onClick={this.handleReset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCcw size={16} />
              Retry
            </button>
            <Link
              href="/notebooks"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Home size={16} />
              Go Home
            </Link>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <div
              style={{
                marginTop: "3rem",
                padding: "1rem",
                background: "var(--bg-secondary)",
                borderRadius: 8,
                textAlign: "left",
                maxWidth: "100%",
                overflow: "auto",
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  color: "#f87171",
                  marginBottom: "0.5rem",
                }}
              >
                {this.state.error.name}: {this.state.error.message}
              </p>
              <pre
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
