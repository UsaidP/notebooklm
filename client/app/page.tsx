"use client"

import { useAuth } from "@clerk/nextjs"
import { FileText, MessageSquare, Search, Shield } from "lucide-react"
import Link from "next/link"
import LogoImage from "@/components/ui/logo-image"

// ─── Reusable style tokens ─────────────────────────────────────────────────
// These tokens now use CSS variables for consistent theming with the app
const token = {
  // Primary colors - mapped to PrivyLM theme
  ink: "var(--text-primary)",
  ink2: "var(--text-secondary)",
  ink3: "var(--text-tertiary)",
  ink4: "var(--text-muted)",
  // Paper/background colors
  paper: "var(--bg-primary)",
  paper2: "var(--bg-surface-hover)",
  // Border color
  border: "var(--border-default)",
  // Accent colors - PrivyLM sage and clay
  teal: "var(--accent)",
  teal2: "var(--privy-sage)",
  tealBg: "var(--accent-muted)",
  tealBorder: "var(--accent-muted)",
  gold: "var(--privy-clay)",
}

// Dark section tokens (for Architecture, CTA sections)
const darkSection = {
  bg: "var(--bg-secondary)",
  text: "var(--text-primary)",
  textMuted: "var(--text-secondary)",
  textSubtle: "var(--text-tertiary)",
  border: "var(--border-default)",
  cardBg: "var(--bg-surface-hover)",
}

// ─── Data ────────────────────────────────────────────────────────────────────
const DOCS = [
  {
    name: "Clinical_Trial_Report.pdf",
    pages: "47 pages",
    chunks: "312 chunks",
    progress: 100,
    active: true,
  },
  {
    name: "Research_Paper_2024.pdf",
    pages: "23 pages",
    chunks: "156 chunks",
    progress: 100,
    active: false,
  },
  {
    name: "Safety_Analysis.pdf",
    pages: "89 pages",
    chunks: "534 chunks",
    progress: 85,
    active: false,
  },
]

const CITATIONS = [
  "Clinical_Trial · p.23",
  "Clinical_Trial · p.31",
  "Research_Report · p.8",
]

const FEATURES = [
  {
    icon: FileText,
    title: "Document Upload",
    desc: "Upload PDFs and let AI understand every page.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: "Find exact information across all your documents.",
  },
  {
    icon: MessageSquare,
    title: "Chat Interface",
    desc: "Natural conversation with your research materials.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Your documents stay private on your infrastructure.",
  },
]

const PIPELINE_STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Parse" },
  { num: 3, label: "Embed" },
  { num: 4, label: "Index" },
  { num: 5, label: "Query" },
]

const ARCH_CARDS = [
  {
    name: "Qdrant",
    desc: "Vector storage for semantic search",
    tag: "Vector DB",
  },
  { name: "Groq", desc: "Fast inference with Llama models", tag: "LLM" },
  {
    name: "PostgreSQL",
    desc: "Reliable metadata & user data",
    tag: "Database",
  },
]

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: [
      "3 notebooks",
      "10 documents each",
      "Basic RAG",
      "Community support",
    ],
    cta: "Get started",
    ctaStyle: "outline",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited notebooks",
      "Unlimited documents",
      "Advanced RAG",
      "Priority support",
      "API access",
    ],
    cta: "Start free trial",
    ctaStyle: "white",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Self-hosted option",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact sales",
    ctaStyle: "outline",
    featured: false,
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z"
          fill="white"
          opacity="0.9"
        />
        <rect x="4" y="4" width="3" height="3" fill="white" opacity="0.3" />
      </svg>
    </div>
  )
}

function SourceBar({
  progress,
  active,
}: {
  progress: number
  active?: boolean
}) {
  return (
    <div
      style={{
        width: 40,
        height: 3,
        borderRadius: 99,
        background: "var(--bg-surface-hover)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 99,
          background: active ? token.gold : token.teal2,
          width: `${progress}%`,
        }}
      />
    </div>
  )
}

function FeatureIcon({ icon }: { icon: number }) {
  const icons = [
    <svg
      key="1"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ color: token.teal }}
    >
      <path
        d="M9 2l2 5h5l-4 3 1.5 5L9 12.5 4.5 15 6 10 2 7h5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>,
    <svg
      key="2"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ color: token.teal }}
    >
      <path
        d="M9 2a5 5 0 100 10A5 5 0 009 2zM4 14c0-1.7 2.2-3 5-3s5 1.3 5 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>,
    <svg
      key="3"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ color: token.teal }}
    >
      <rect
        x="3"
        y="5"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M6 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" />
    </svg>,
    <svg
      key="4"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ color: token.teal }}
    >
      <path
        d="M3 9l4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>,
    <svg
      key="5"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ color: token.teal }}
    >
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M9 6v4l3 2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>,
    <svg
      key="6"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ color: token.teal }}
    >
      <rect
        x="2"
        y="3"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M2 7h14" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 3v4M12 3v4" stroke="currentColor" strokeWidth="1.3" />
    </svg>,
  ]
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        border: `1px solid ${token.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        background: token.paper2,
      }}
    >
      {icons[icon]}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn } = useAuth()

  return (
    <div
      style={{
        minHeight: "100vh",
        background: token.paper,
        scrollBehavior: "smooth",
      }}
    >
      {/* Grain */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 100,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Nav ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px",
          borderBottom: `1px solid ${token.border}`,
          position: "sticky",
          top: 0,
          background: "var(--bg-primary)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <LogoImage size={32} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.4px",
              color: token.ink,
            }}
          >
            Privy<span style={{ color: token.teal2 }}>LM</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link
            href="#features"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: token.ink3,
              textDecoration: "none",
            }}
          >
            Features
          </Link>
          <Link
            href="#architecture"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: token.ink3,
              textDecoration: "none",
            }}
          >
            Architecture
          </Link>
          <Link
            href="#pricing"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: token.ink3,
              textDecoration: "none",
            }}
          >
            Pricing
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isSignedIn ? (
            <Link
              href="/notebooks"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--primary-foreground)",
                background: token.teal,
                padding: "9px 20px",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Go to App →
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: token.ink,
                  background: "none",
                  border: `1px solid ${token.border}`,
                  padding: "8px 18px",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--primary-foreground)",
                  background: token.teal,
                  padding: "9px 20px",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Get started →
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          padding: "100px 48px 80px",
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: 80,
          alignItems: "start",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "1.5px",
              color: token.teal2,
              textTransform: "uppercase",
              marginBottom: 28,
              border: `1px solid ${token.tealBorder}`,
              padding: "5px 12px",
              borderRadius: 99,
              background: token.tealBg,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: token.teal2,
                display: "inline-block",
              }}
            />
            Private AI Research Platform
          </div>

          <h1
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: token.ink,
              lineHeight: 1.08,
              marginBottom: 24,
              letterSpacing: "-1.5px",
            }}
          >
            Your documents.
            <br />
            <span style={{ color: token.teal2 }}>Your insights.</span>
            <br />
            Your control.
          </h1>

          <p
            style={{
              fontSize: 17,
              color: token.ink2,
              lineHeight: 1.65,
              marginBottom: 36,
              maxWidth: 480,
            }}
          >
            Upload PDFs, ask questions, and get instant answers with citations.
            PrivyLM keeps your research private with self-hosted AI.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href={isSignedIn ? "/notebooks" : "/sign-up"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: token.teal,
                color: "white",
                padding: "13px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {isSignedIn ? "Open Dashboard" : "Get started free"} →
            </Link>
            <Link
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                color: token.ink,
                padding: "13px 24px",
                border: `1px solid ${token.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Learn more
            </Link>
          </div>

          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: token.ink4,
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1a3 3 0 000 6 3 3 0 000-6zM2 9.5C2 8.1 3.8 7 6 7s4 1.1 4 2.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            No credit card · SOC 2 Type II · GDPR compliant
          </p>
        </div>

        {/* Right — preview card */}
        <div
          style={{
            background: token.ink,
            borderRadius: 16,
            padding: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 80% 20%, var(--accent-muted) 0%, transparent 60%)",
            }}
          />

          {/* Card header */}
          <div
            style={{
              position: "relative",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "1px",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              Active notebook
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "monospace",
                fontSize: 10,
                color: token.teal2,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: token.teal2,
                  display: "inline-block",
                }}
              />
              3 sources indexed
            </span>
          </div>

          {/* Source list */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {DOCS.map((doc) => (
              <div
                key={doc.name}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "var(--bg-surface-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 2h7l3 3v7H2z"
                      stroke="var(--text-secondary)"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 2v3h3"
                      stroke="var(--text-secondary)"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
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
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "var(--text-muted)",
                    }}
                  >
                    {doc.pages} · {doc.chunks}
                  </div>
                </div>
                <SourceBar progress={doc.progress} active={doc.active} />
              </div>
            ))}
          </div>

          {/* Chat preview */}
          <div
            style={{
              position: "relative",
              borderTop: "1px solid var(--border-default)",
              paddingTop: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 10,
                fontStyle: "italic",
              }}
            >
              &ldquo;What were the primary endpoints in phase 2?&rdquo;
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              The primary endpoints focused on{" "}
              <strong style={{ color: token.teal2, fontWeight: 500 }}>
                reduction in biomarker levels
              </strong>{" "}
              at week 12, with secondary endpoints tracking quality-of-life
              scores.
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CITATIONS.map((chip) => (
                <span
                  key={chip}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    background: "var(--accent-muted)",
                    color: token.teal2,
                    border: "1px solid var(--accent-muted)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    letterSpacing: "0.5px",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: token.border, margin: "0 48px" }} />

      {/* ── Features ── */}
      <section
        id="features"
        style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "2px",
            color: token.ink4,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Features
        </div>
        <h2
          style={{
            fontSize: 36,
            color: token.ink,
            marginBottom: 48,
            fontWeight: 600,
          }}
        >
          Everything you need for document research
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
        >
          {FEATURES.map((f, i) => (
            <div key={f.title}>
              <FeatureIcon icon={i} />
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: token.ink,
                  marginBottom: 8,
                }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: token.ink3, lineHeight: 1.6 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture ── */}
      <section
        id="architecture"
        style={{ padding: "80px 48px", background: darkSection.bg }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "2px",
              color: darkSection.textSubtle,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Architecture
          </div>
          <h2
            style={{
              fontSize: 36,
              color: darkSection.text,
              marginBottom: 48,
              fontWeight: 600,
            }}
          >
            Built for privacy and performance
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 48,
            }}
          >
            {ARCH_CARDS.map((card) => (
              <div
                key={card.name}
                style={{
                  background: darkSection.cardBg,
                  border: `1px solid ${darkSection.border}`,
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: darkSection.text,
                    marginBottom: 6,
                  }}
                >
                  {card.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: darkSection.textMuted,
                    lineHeight: 1.6,
                  }}
                >
                  {card.desc}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 10,
                    fontFamily: "monospace",
                    fontSize: 9,
                    background: "var(--accent-muted)",
                    color: token.teal2,
                    border: "1px solid var(--accent-muted)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {card.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              marginTop: 40,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {PIPELINE_STEPS.map((step, idx) => (
              <div
                key={step.num}
                style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                <div
                  style={{
                    background: darkSection.cardBg,
                    border: `1px solid ${darkSection.border}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                    textAlign: "center",
                    minWidth: 100,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 18,
                      fontWeight: 700,
                      color: token.teal2,
                    }}
                  >
                    {step.num}
                  </div>
                  <div style={{ fontSize: 11, color: darkSection.textMuted }}>
                    {step.label}
                  </div>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    style={{
                      width: 32,
                      height: 1,
                      background: darkSection.border,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "2px",
              color: token.ink4,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Pricing
          </div>
          <h2
            style={{
              fontSize: 36,
              color: token.ink,
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 15, color: token.ink3 }}>
            Start free. Scale when you need.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: `1px solid ${plan.featured ? token.teal2 : token.border}`,
                borderRadius: 12,
                padding: 24,
                background: plan.featured
                  ? "var(--accent-muted)"
                  : "transparent",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: token.ink,
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: token.ink,
                  marginBottom: 4,
                }}
              >
                {plan.price}
                <span
                  style={{ fontSize: 14, fontWeight: 400, color: token.ink3 }}
                >
                  {plan.period}
                </span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0" }}>
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 13,
                      color: plan.featured ? darkSection.textMuted : token.ink3,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "var(--accent-muted)",
                        border: "1px solid var(--accent-muted)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4L3.5 6L6.5 2"
                          stroke="var(--accent)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === "Enterprise" ? "#" : "/sign-up"}
                style={{
                  width: "100%",
                  display: "block",
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: 11,
                  borderRadius: 8,
                  textDecoration: "none",
                  letterSpacing: "0.2px",
                  background:
                    plan.ctaStyle === "white" ? darkSection.text : "none",
                  color:
                    plan.ctaStyle === "white"
                      ? token.ink
                      : plan.featured
                        ? darkSection.textMuted
                        : token.ink,
                  border:
                    plan.ctaStyle === "white"
                      ? "none"
                      : `1px solid ${plan.featured ? darkSection.border : token.border}`,
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          margin: 0,
          padding: "80px 48px",
          background: `linear-gradient(135deg, ${darkSection.bg} 0%, var(--privy-ink-strong) 100%)`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 0%, var(--accent-muted) 0%, transparent 60%)",
          }}
        />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "2px",
              color: darkSection.textSubtle,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Get started
          </div>
          <h2
            style={{
              fontSize: 48,
              color: darkSection.text,
              lineHeight: 1.1,
              marginBottom: 20,
              fontWeight: 400,
            }}
          >
            Research smarter.
            <br />
            <em style={{ color: token.teal2, fontStyle: "italic" }}>
              Stay private.
            </em>
          </h2>
          <p
            style={{
              fontSize: 15,
              color: darkSection.textMuted,
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Join researchers who trust PrivyLM to keep their most sensitive work
            secure and searchable.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
            <Link
              href={isSignedIn ? "/notebooks" : "/sign-up"}
              style={{
                background: token.teal,
                color: "white",
                padding: "14px 28px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {isSignedIn ? "Open Dashboard" : "Start for free"}
            </Link>
            <Link
              href="#pricing"
              style={{
                background: "transparent",
                color: darkSection.text,
                border: `1px solid ${darkSection.border}`,
                padding: "14px 28px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "32px 48px",
          borderTop: `1px solid ${token.border}`,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: token.ink4, margin: 0 }}>
          © {new Date().getFullYear()} PrivyLM. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
