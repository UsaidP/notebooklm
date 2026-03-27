"use client"

import { useAuth } from "@clerk/nextjs"
import { FileText, MessageSquare, Search, Shield } from "lucide-react"
import Link from "next/link"
import LogoImage from "@/components/ui/logo-image"

// ─── Data ────────────────────────────────────────────────────────────────────
const DOCS = [
  { name: "Clinical_Trial_Report.pdf", pages: "47 pages", chunks: "312 chunks", progress: 100, active: true },
  { name: "Research_Paper_2024.pdf", pages: "23 pages", chunks: "156 chunks", progress: 100, active: false },
  { name: "Safety_Analysis.pdf", pages: "89 pages", chunks: "534 chunks", progress: 85, active: false },
]

const CITATIONS = ["Clinical_Trial · p.23", "Clinical_Trial · p.31", "Research_Report · p.8"]

const FEATURES = [
  { Icon: FileText, title: "Document Upload", desc: "Upload PDFs and let AI understand every page." },
  { Icon: Search, title: "Semantic Search", desc: "Find exact information across all your documents." },
  { Icon: MessageSquare, title: "Chat Interface", desc: "Natural conversation with your research materials." },
  { Icon: Shield, title: "Private & Secure", desc: "Your documents stay private on your infrastructure." },
]

const PIPELINE_STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Parse" },
  { num: 3, label: "Embed" },
  { num: 4, label: "Index" },
  { num: 5, label: "Query" },
]

const ARCH_CARDS = [
  { name: "Qdrant", desc: "Vector storage for semantic search", tag: "Vector DB" },
  { name: "Groq", desc: "Fast inference with Llama models", tag: "LLM" },
  { name: "PostgreSQL", desc: "Reliable metadata & user data", tag: "Database" },
]

const PLANS = [
  {
    name: "Free", price: "$0", period: "/month",
    features: ["3 notebooks", "10 documents each", "Basic RAG", "Community support"],
    cta: "Get started", featured: false,
  },
  {
    name: "Pro", price: "$29", period: "/month",
    features: ["Unlimited notebooks", "Unlimited documents", "Advanced RAG", "Priority support", "API access"],
    cta: "Start free trial", featured: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    features: ["Everything in Pro", "Self-hosted option", "SSO & SAML", "Dedicated support", "Custom integrations"],
    cta: "Contact sales", featured: false,
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ progress, active }: { progress: number; active?: boolean }) {
  return (
    <div className="w-10 h-0.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden shrink-0">
      <div
        className="h-full rounded-full"
        style={{
          width: `${progress}%`,
          background: active ? "var(--privy-clay)" : "var(--privy-sage)",
        }}
      />
    </div>
  )
}

function CheckIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-muted)] shrink-0 flex items-center justify-center">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 4L3.5 6L6.5 2" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ scrollBehavior: "smooth" }}>

      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-4 border-b border-[var(--border-default)] bg-[var(--bg-primary)] backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <LogoImage size={32} />
          <span className="font-bold text-[17px] tracking-tight text-[var(--text-primary)]">
            Privy<span className="text-[var(--privy-sage)]">LM</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {["features", "architecture", "pricing"].map((id) => (
            <Link
              key={id}
              href={`#${id}`}
              className="text-[13px] font-medium text-[var(--text-tertiary)] no-underline capitalize hover:text-[var(--text-primary)] transition-colors"
            >
              {id}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isSignedIn ? (
            <Link
              href="/notebooks"
              className="text-[13px] font-semibold text-white bg-[var(--accent)] px-4 py-2 rounded-md no-underline hover:opacity-90 transition-opacity"
            >
              Go to App →
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden sm:block text-[13px] font-medium text-[var(--text-primary)] border border-[var(--border-default)] px-4 py-2 rounded-md no-underline hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-[13px] font-semibold text-white bg-[var(--accent)] px-4 py-2 rounded-md no-underline hover:opacity-90 transition-opacity"
              >
                Get started →
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-5 sm:px-8 lg:px-12 pt-16 pb-16 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-20 items-start">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[1.5px] text-[var(--privy-sage)] uppercase mb-7 border border-[var(--accent-muted)] px-3 py-1.5 rounded-full bg-[var(--accent-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--privy-sage)] inline-block" />
              Private AI Research Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-[var(--text-primary)] leading-[1.08] mb-6 tracking-[-1.5px]">
              Your documents.
              <br />
              <span className="text-[var(--privy-sage)]">Your insights.</span>
              <br />
              Your control.
            </h1>

            <p className="text-base sm:text-[17px] text-[var(--text-secondary)] leading-[1.65] mb-9 max-w-[480px]">
              Upload PDFs, ask questions, and get instant answers with citations.
              PrivyLM keeps your research private with self-hosted AI.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={isSignedIn ? "/notebooks" : "/sign-up"}
                className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white px-6 py-3 rounded-lg text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
              >
                {isSignedIn ? "Open Dashboard" : "Get started free"} →
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-1.5 bg-transparent text-[var(--text-primary)] border border-[var(--border-default)] px-6 py-3 rounded-lg text-sm font-medium no-underline hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Learn more
              </Link>
            </div>

            <p className="font-mono text-[11px] text-[var(--text-muted)] mt-5 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1a3 3 0 000 6 3 3 0 000-6zM2 9.5C2 8.1 3.8 7 6 7s4 1.1 4 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              No credit card · SOC 2 Type II · GDPR compliant
            </p>
          </div>

          {/* Right — preview card (intentionally dark) */}
          <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: "#1e2833" }}>
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(122,158,126,0.15) 0%, transparent 60%)" }}
            />

            {/* Card header */}
            <div className="relative mb-5 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#7f858c" }}>
                Active notebook
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: "#7a9e7e" }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#7a9e7e" }} />
                3 sources indexed
              </span>
            </div>

            {/* Source list */}
            <div className="relative flex flex-col gap-2 mb-5">
              {DOCS.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ background: "#273240", border: "1px solid #374354" }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "#2a3442" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 2h7l3 3v7H2z" stroke="#9aa0a6" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M9 2v3h3" stroke="#9aa0a6" strokeWidth="1.2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate mb-0.5" style={{ color: "#f3ece0" }}>
                      {doc.name}
                    </div>
                    <div className="font-mono text-[10px]" style={{ color: "#7f858c" }}>
                      {doc.pages} · {doc.chunks}
                    </div>
                  </div>
                  <ProgressBar progress={doc.progress} active={doc.active} />
                </div>
              ))}
            </div>

            {/* Chat preview */}
            <div className="relative pt-4" style={{ borderTop: "1px solid #374354" }}>
              <div className="text-[12px] mb-2.5 italic" style={{ color: "#c1c5c8" }}>
                &ldquo;What were the primary endpoints in phase 2?&rdquo;
              </div>
              <div className="text-[13px] leading-relaxed mb-3" style={{ color: "#f3ece0" }}>
                The primary endpoints focused on{" "}
                <strong className="font-medium" style={{ color: "#7a9e7e" }}>reduction in biomarker levels</strong>{" "}
                at week 12, with secondary endpoints tracking quality-of-life scores.
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {CITATIONS.map((chip) => (
                  <span
                    key={chip}
                    className="font-mono text-[9px] px-2 py-0.5 rounded tracking-[0.5px]"
                    style={{ background: "rgba(122,158,126,0.18)", color: "#7a9e7e", border: "1px solid rgba(122,158,126,0.25)" }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="h-px bg-[var(--border-default)] mx-5 sm:mx-8 lg:mx-12" />

      {/* ── Features ── */}
      <section id="features" className="px-5 sm:px-8 lg:px-12 py-16 sm:py-20 max-w-[1200px] mx-auto">
        <div className="font-mono text-[10px] tracking-[2px] text-[var(--text-muted)] uppercase mb-4">
          Features
        </div>
        <h2 className="text-2xl sm:text-[36px] font-semibold text-[var(--text-primary)] mb-12">
          Everything you need for document research
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title}>
              <div className="w-10 h-10 rounded-[10px] border border-[var(--border-default)] flex items-center justify-center mb-4 bg-[var(--bg-surface-hover)]">
                <Icon size={18} className="text-[var(--accent)]" />
              </div>
              <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">{title}</div>
              <div className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture ── */}
      <section id="architecture" className="px-5 sm:px-8 lg:px-12 py-16 sm:py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-[1200px] mx-auto">
          <div className="font-mono text-[10px] tracking-[2px] text-[var(--text-tertiary)] uppercase mb-4">
            Architecture
          </div>
          <h2 className="text-2xl sm:text-[36px] font-semibold text-[var(--text-primary)] mb-12">
            Built for privacy and performance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {ARCH_CARDS.map((card) => (
              <div
                key={card.name}
                className="bg-[var(--bg-surface-hover)] border border-[var(--border-default)] rounded-xl p-5"
              >
                <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-1.5">{card.name}</div>
                <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{card.desc}</div>
                <span className="inline-block mt-2.5 font-mono text-[9px] bg-[var(--accent-muted)] text-[var(--privy-sage)] border border-[var(--accent-muted)] px-2 py-0.5 rounded">
                  {card.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div className="flex items-center overflow-x-auto pb-1 gap-0">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={step.num} className="flex items-center shrink-0">
                <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-center min-w-[90px] sm:min-w-[100px]">
                  <div className="font-mono text-lg font-bold text-[var(--privy-sage)]">{step.num}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{step.label}</div>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="w-6 sm:w-8 h-px bg-[var(--border-default)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-5 sm:px-8 lg:px-12 py-16 sm:py-20 max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <div className="font-mono text-[10px] tracking-[2px] text-[var(--text-muted)] uppercase mb-4">
            Pricing
          </div>
          <h2 className="text-2xl sm:text-[36px] font-semibold text-[var(--text-primary)] mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-[15px] text-[var(--text-tertiary)]">Start free. Scale when you need.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl p-6 border"
              style={{
                borderColor: plan.featured ? "var(--privy-sage)" : "var(--border-default)",
                background: plan.featured ? "var(--accent-muted)" : "transparent",
              }}
            >
              {plan.featured && (
                <div className="font-mono text-[9px] tracking-[1px] text-[var(--privy-sage)] uppercase mb-3">
                  Most popular
                </div>
              )}
              <div className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{plan.name}</div>
              <div className="text-[32px] font-bold text-[var(--text-primary)] mb-1">
                {plan.price}
                <span className="text-sm font-normal text-[var(--text-tertiary)]">{plan.period}</span>
              </div>

              <ul className="list-none p-0 my-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-[13px] text-[var(--text-tertiary)] flex items-center gap-2">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "#" : "/sign-up"}
                className="block w-full text-center text-[13px] font-semibold py-2.5 rounded-lg no-underline transition-opacity hover:opacity-80"
                style={{
                  background: plan.featured ? "#2c3e50" : "none",
                  color: plan.featured ? "#f5f0e8" : "var(--text-primary)",
                  border: plan.featured ? "none" : "1px solid var(--border-default)",
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
        className="px-5 sm:px-8 lg:px-12 py-16 sm:py-20 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1b232e 0%, #1e2833 100%)" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(122,158,126,0.12) 0%, transparent 60%)" }}
        />
        <div className="max-w-[600px] mx-auto relative">
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: "#7f858c" }}>
            Get started
          </div>
          <h2 className="text-3xl sm:text-[48px] leading-[1.1] mb-5 font-normal" style={{ color: "#f3ece0" }}>
            Research smarter.
            <br />
            <em className="italic" style={{ color: "#7a9e7e" }}>Stay private.</em>
          </h2>
          <p className="text-[15px] leading-[1.7] mb-9" style={{ color: "#c1c5c8" }}>
            Join researchers who trust PrivyLM to keep their most sensitive work secure and searchable.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={isSignedIn ? "/notebooks" : "/sign-up"}
              className="bg-[var(--accent)] text-white px-7 py-3.5 rounded-lg text-[15px] font-semibold no-underline hover:opacity-90 transition-opacity"
            >
              {isSignedIn ? "Open Dashboard" : "Start for free"}
            </Link>
            <Link
              href="#pricing"
              className="bg-transparent px-7 py-3.5 rounded-lg text-[15px] font-medium no-underline hover:bg-white/10 transition-colors"
              style={{ color: "#f3ece0", border: "1px solid #374354" }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-5 sm:px-8 py-8 border-t border-[var(--border-default)] text-center">
        <p className="text-[12px] text-[var(--text-muted)] m-0">
          © {new Date().getFullYear()} PrivyLM. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
