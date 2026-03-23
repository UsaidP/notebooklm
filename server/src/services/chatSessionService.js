import { prisma } from "../lib/prisma.js";
import Groq from "groq-sdk";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_HISTORY_LIMIT = 20;
const DEFAULT_TITLE = "New Research Session";
const MAX_TITLE_LENGTH = 60;
const LLM_MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Research Assistant System Prompt ─────────────────────────────────────────

const RESEARCH_SYSTEM_PROMPT = `You are an expert research assistant, similar to Google NotebookLM. Your role is to help users analyze documents, extract insights, and answer questions based on the provided sources.

Guidelines:
1. Always cite sources when using information from documents (e.g., "[Source: DocumentName, p.X]")
2. Be thorough but concise - focus on actionable insights
3. When information isn't available in the sources, clearly state that
4. Organize complex information with clear headings and bullet points
5. Distinguish between direct quotes and paraphrased information
6. Highlight key findings and important data points
7. Ask clarifying questions if the query is ambiguous

Response Format:
- Start with a direct answer to the question
- Provide supporting details from sources
- Include relevant citations
- End with related questions the user might want to explore`;

// ─── Title Generation Prompt ───────────────────────────────────────────────────

const TITLE_SYSTEM_PROMPT = `You are an expert at creating concise, descriptive titles for research sessions.
Guidelines:
- 3-5 words maximum
- No quotes, punctuation, or explanation
- Use clear, specific language that captures the research topic
- Focus on key themes or questions

Examples:
- "what is machine learning" → Machine Learning Overview
- "summarize this document" → Document Summary
- "compare python vs javascript" → Language Comparison
- "extract key findings" → Key Findings Analysis

Respond with ONLY the title.`;

// ─── Custom Errors ────────────────────────────────────────────────────────────

export class SessionNotFoundError extends Error {
  constructor(sessionId) {
    super(`Session "${sessionId}" not found or access denied`);
    this.name = "SessionNotFoundError";
    this.statusCode = 404;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

// ─── Validators ───────────────────────────────────────────────────────────────

function assertString(value, field) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`"${field}" must be a non-empty string`);
  }
}

function assertRole(role) {
  const valid = ["user", "assistant", "system"];
  if (!valid.includes(role?.toLowerCase())) {
    throw new ValidationError(`Role must be one of: ${valid.join(", ")}`);
  }
}

// ─── Session Operations ───────────────────────────────────────────────────────

/**
 * Creates a new chat session for a user and notebook.
 * @param {string} notebookId
 * @param {string} userId
 * @returns {Promise<import("@prisma/client").ChatSession>}
 */
export async function createSession(notebookId, userId) {
  assertString(notebookId, "notebookId");
  assertString(userId, "userId");

  return prisma.chatSession.create({
    data: { notebookId, userId },
  });
}

/**
 * Retrieves a session, enforcing per-user tenant isolation.
 * @throws {SessionNotFoundError}
 */
export async function getSession(sessionId, userId) {
  assertString(sessionId, "sessionId");
  assertString(userId, "userId");

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) throw new SessionNotFoundError(sessionId);
  return session;
}

/**
 * Lists all sessions for a given notebook, newest first.
 */
export async function getSessions(notebookId, userId) {
  assertString(notebookId, "notebookId");
  assertString(userId, "userId");

  return prisma.chatSession.findMany({
    where: { notebookId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Updates the title of a session.
 * Validates ownership before updating.
 */
export async function updateSessionTitle(sessionId, userId, title) {
  assertString(sessionId, "sessionId");
  assertString(userId, "userId");
  assertString(title, "title");

  await getSession(sessionId, userId);

  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { title: title.trim().substring(0, MAX_TITLE_LENGTH) },
  });
}

/**
 * Deletes a session and all its messages (cascade expected in schema).
 * Returns true if deleted, false if not found.
 */
export async function deleteSession(sessionId, userId) {
  assertString(sessionId, "sessionId");
  assertString(userId, "userId");

  const { count } = await prisma.chatSession.deleteMany({
    where: { id: sessionId, userId },
  });

  return count > 0;
}

// ─── Message Operations ───────────────────────────────────────────────────────

/**
 * Adds a message to a session.
 * @param {string} sessionId
 * @param {"user"|"assistant"|"system"} role
 * @param {string} content
 * @param {object|null} [sources]
 */
export async function addMessage(sessionId, role, content, sources = null) {
  assertString(sessionId, "sessionId");
  assertString(content, "content");
  assertRole(role);

  return prisma.chatMessage.create({
    data: {
      sessionId,
      role: role.toUpperCase(),
      content: content.trim(),
      ...(sources && { sources }),
    },
  });
}

/**
 * Returns the last `limit` messages in chronological order.
 * If limit is not provided or is null, returns all messages.
 */
export async function getHistory(sessionId, limit = DEFAULT_HISTORY_LIMIT) {
  assertString(sessionId, "sessionId");

  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    throw new ValidationError("limit must be a positive integer or null");
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    ...(limit !== null && { take: limit }),
  });

  return messages.reverse().map((m) => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }));
}

/**
 * Returns the total number of messages in a session.
 */
export async function getMessageCount(sessionId) {
  assertString(sessionId, "sessionId");

  return prisma.chatMessage.count({ where: { sessionId } });
}

// ─── Title Generation ─────────────────────────────────────────────────────────

/**
 * Generates a short session title from the user's first message using Groq.
 * @param {string} firstMessage
 * @returns {Promise<string>}
 */
export async function generateTitle(firstMessage) {
  if (!firstMessage?.trim()) return DEFAULT_TITLE;

  try {
    const completion = await groq.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: TITLE_SYSTEM_PROMPT },
        { role: "user", content: `Create a title for: "${firstMessage.trim()}"` },
      ],
      temperature: 0.3,
      max_tokens: 15,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const title = raw.replace(/['"]/g, "").trim().substring(0, MAX_TITLE_LENGTH);

    return title || DEFAULT_TITLE;
  } catch (err) {
    console.error("[generateTitle] Failed:", err?.message ?? err);
    return DEFAULT_TITLE;
  }
}

/**
 * Builds conversation messages for the LLM with system context.
 * @param {Array} history - Previous conversation messages
 * @param {string} userMessage - Current user message
 * @param {Array} selectedSources - Selected document sources (optional)
 * @returns {Array} - Formatted messages for LLM
 */
export function buildConversationMessages(history, userMessage, selectedSources = []) {
  const messages = [];

  // Add system prompt
  messages.push({
    role: "system",
    content: RESEARCH_SYSTEM_PROMPT,
  });

  // Add context about available sources if provided
  if (selectedSources.length > 0) {
    const sourceContext = selectedSources
      .map((s, i) => `[${i + 1}] ${s.documentName}${s.page ? ` (p.${s.page})` : ''}`)
      .join("\n");

    messages.push({
      role: "system",
      content: `Available Sources:\n${sourceContext}\n\nWhen citing sources, reference them as [1], [2], etc.`,
    });
  }

  // Add conversation history (skip the first system message if already added)
  const cleanHistory = history.filter(
    (m, i) => !(i === 0 && m.role === "system")
  );
  messages.push(...cleanHistory);

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  return messages;
}

// Export all functions and constants
export {
  RESEARCH_SYSTEM_PROMPT,
  TITLE_SYSTEM_PROMPT,
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_TITLE,
  MAX_TITLE_LENGTH,
  LLM_MODEL,
};
