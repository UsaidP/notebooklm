import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  addMessage,
  getHistory,
  getMessageCount,
  generateTitle,
} from "../../services/chatSessionService.js";
import { chat } from "../../services/ragService.js";

const router = Router();

/**
 * Helper: Get or create internal user from Clerk user ID
 */
const getOrCreateUser = async (clerkUserId) => {
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true }
  });

  if (!user) {
    console.log(`[Auth] Auto-creating user for Clerk ID: ${clerkUserId}`);
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: `${clerkUserId}@placeholder.local`,
        name: null,
      },
      select: { id: true }
    });
    console.log(`[Auth] Created user: ${user.id}`);
  }

  return user;
};

/**
 * One session per notebook — get or create it automatically.
 * No session ID needed from the client.
 */
const getOrCreateNotebookSession = async (notebookId, userId) => {
  const existing = await prisma.chatSession.findFirst({
    where: { notebookId, userId },
    orderBy: { createdAt: "asc" }, // always use the first/only session
  });
  if (existing) return existing;

  return prisma.chatSession.create({ data: { notebookId, userId } });
};

/**
 * GET /api/chat/:notebookId/history
 * Returns full chat history for this notebook
 */
router.get("/:notebookId/history", asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const user = await getOrCreateUser(req.userId);

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id }
  });
  if (!notebook) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const session = await getOrCreateNotebookSession(notebookId, user.id);

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ messages });
}));

/**
 * POST /api/chat/:notebookId/message
 * RAG chat — always uses the notebook's single session
 */
router.post("/:notebookId/message", asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { message, selectedSourceIds } = req.body;
  const clerkUserId = req.userId;

  // 1. Validate
  if (!message?.trim()) {
    return res.status(400).json({ error: "Message required" });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "Message too long" });
  }

  // 2. Get internal user ID
  const user = await getOrCreateUser(clerkUserId);

  // 3. Tenant check
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id },
  });
  if (!notebook) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 4. Check indexed documents exist
  const indexedDoc = await prisma.document.findFirst({
    where: { notebookId, status: "INDEXED" },
  });
  if (!indexedDoc) {
    return res.status(400).json({
      error: "No indexed documents. Upload and wait for processing.",
    });
  }

  // 5. Get/create the one session for this notebook
  const session = await getOrCreateNotebookSession(notebookId, user.id);

  // 6. Persist user message
  await addMessage(session.id, "user", message, null);

  // 7. Get full conversation history for LLM context (null = all messages)
  const history = await getHistory(session.id, null);

  // 8. Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Session-Id", session.id);
  res.flushHeaders();

  // 9. RAG pipeline
  const { fullResponse, sources } = await chat({
    message,
    notebookId,
    userId: user.id,
    sessionId: session.id,
    history,
    selectedSourceIds,
    res,
  });

  // 10. Persist assistant response
  await addMessage(session.id, "assistant", fullResponse, sources);

  // 11. Auto-generate title on first message
  const msgCount = await getMessageCount(session.id);
  if (msgCount === 2 && !session.title) {
    // 1 User + 1 Assistant = 2
    const title = await generateTitle(message);
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { title }
    });
  }

  res.end(); // Properly close the response when done
}));

/**
 * DELETE /api/chat/:notebookId/history
 * Clears chat history for this notebook (keeps the session, deletes messages)
 */
router.delete("/:notebookId/history", asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const user = await getOrCreateUser(req.userId);

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id }
  });
  if (!notebook) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const session = await prisma.chatSession.findFirst({
    where: { notebookId, userId: user.id }
  });
  if (session) {
    await prisma.chatMessage.deleteMany({ where: { sessionId: session.id } });
  }

  return res.json({ success: true });
}));

export default router;
