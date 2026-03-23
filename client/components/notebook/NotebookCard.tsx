"use client"

import {
  ArrowRight,
  Clock,
  Database,
  FileText,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { DeleteNotebookButton } from "@/components/DeleteNotebookButton"

interface NotebookCardProps {
  id: string
  title: string
  description: string | null
  updatedAt: Date
  documentCount: number
  chatSessionCount?: number
}

// AI-generated description templates based on notebook topics
const AI_DESCRIPTION_TEMPLATES: Record<string, string[]> = {
  research: [
    "AI-powered research assistant analyzing academic papers and extracting key insights",
    "Comprehensive analysis of research findings with source-grounded answers",
    "Smart document synthesis for evidence-based research conclusions",
  ],
  legal: [
    "Legal document analysis with case law references and precedent identification",
    "Contract review assistant highlighting key clauses and obligations",
    "Regulatory compliance checker with automated risk assessment",
  ],
  medical: [
    "Clinical trial analysis with endpoint extraction and safety profiling",
    "Medical literature synthesis for evidence-based treatment insights",
    "Healthcare research assistant for drug interaction analysis",
  ],
  finance: [
    "Financial report analysis with KPI extraction and trend identification",
    "Investment research assistant for market analysis and due diligence",
    "Risk assessment tool for portfolio analysis and compliance",
  ],
  technical: [
    "Technical documentation analyzer with API reference extraction",
    "Code documentation assistant for architecture and pattern analysis",
    "System design reviewer with best practice recommendations",
  ],
  general: [
    "Smart document workspace for intelligent Q&A and insights",
    "AI-powered knowledge base with semantic search capabilities",
    "Intelligent research hub for collaborative document analysis",
  ],
}

// Topic keywords for categorization
const TOPIC_KEYWORDS: Record<string, string[]> = {
  research: [
    "research",
    "study",
    "analysis",
    "academic",
    "paper",
    "journal",
    "citation",
  ],
  legal: [
    "legal",
    "law",
    "contract",
    "court",
    "case",
    "regulation",
    "compliance",
  ],
  medical: [
    "medical",
    "clinical",
    "patient",
    "treatment",
    "drug",
    "trial",
    "healthcare",
  ],
  finance: [
    "finance",
    "investment",
    "market",
    "portfolio",
    "risk",
    "financial",
    "banking",
  ],
  technical: [
    "technical",
    "code",
    "api",
    "software",
    "system",
    "architecture",
    "documentation",
  ],
}

function detectTopic(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return topic
    }
  }

  return "general"
}

function getTopicColor(topic: string): string {
  const colors: Record<string, string> = {
    research: "var(--privy-sage)",
    legal: "var(--privy-clay)",
    medical: "#dc2626",
    finance: "#16a34a",
    technical: "#2563eb",
    general: "var(--text-secondary)",
  }
  return colors[topic] || "var(--text-secondary)"
}

function getTopicIcon(topic: string) {
  const icons: Record<string, any> = {
    research: Sparkles,
    legal: Database,
    medical: Zap,
    finance: MessageSquare,
    technical: FileText,
    general: MessageSquare,
  }
  return icons[topic] || MessageSquare
}

// Move timeAgo outside component to avoid hydration issues
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  const intervals: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`
    }
  }
  return "Just now"
}

// Deterministic description selection using title hash
function getAIDescription(
  title: string,
  description: string | null
): string {
  if (description) return description

  const topic = detectTopic(title, "")
  const templates =
    AI_DESCRIPTION_TEMPLATES[topic] || AI_DESCRIPTION_TEMPLATES.general

  // Use title hash for deterministic selection
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const randomIndex = hash % templates.length
  return templates[randomIndex]
}

export function NotebookCard({
  id,
  title,
  description,
  updatedAt,
  documentCount,
  chatSessionCount = 0,
}: NotebookCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [timeText, setTimeText] = useState("Just now")
  const topic = detectTopic(title, description || "")
  const topicColor = getTopicColor(topic)
  const TopicIcon = getTopicIcon(topic)
  const aiDescription = getAIDescription(title, description)

  // Calculate timeAgo on client side only to avoid hydration mismatch
  useEffect(() => {
    setTimeText(formatTimeAgo(updatedAt))
  }, [updatedAt])

  return (
    <Link
      href={`/notebooks/${id}`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        background: "var(--bg-secondary)",
        border: `1px solid ${isHovered ? topicColor : "var(--border-default)"}`,
        borderRadius: "var(--radius-lg)",
        textDecoration: "none",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        boxShadow: isHovered
          ? `0 12px 24px -8px ${topicColor}40`
          : "0 1px 3px rgba(0, 0, 0, 0.1)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Topic Badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 100,
            background: `${topicColor}15`,
            border: `1px solid ${topicColor}30`,
          }}
        >
          <TopicIcon size={10} color={topicColor} />
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: topicColor,
              textTransform: "capitalize",
            }}
          >
            {topic}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px", flex: 1 }}>
        {/* Icon + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 12,
            paddingRight: 24,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${topicColor}20 0%, ${topicColor}05 100%)`,
              border: `1px solid ${topicColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={22} color={topicColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </h3>
          </div>
        </div>

        {/* AI Description */}
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {description ? (
            description
          ) : (
            <span style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
              <Sparkles
                size={12}
                color={topicColor}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ fontStyle: "italic" }}>{aiDescription}</span>
            </span>
          )}
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 16,
            borderTop: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <FileText size={14} />
            <span>{documentCount}</span>
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              docs
            </span>
          </div>

          {chatSessionCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <MessageSquare size={14} />
              <span>{chatSessionCount}</span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                chats
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            <Clock size={14} />
            {timeText}
          </div>
        </div>
      </div>

      {/* Hover Arrow Indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateX(0)" : "translateX(-8px)",
          transition: "all 0.2s",
        }}
      >
        <ArrowRight size={20} color={topicColor} />
      </div>

      {/* Delete Button (shown on hover) */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.2s",
          zIndex: 20,
        }}
      >
        <DeleteNotebookButton notebookId={id} notebookName={title} />
      </div>
    </Link>
  )
}
