import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { asyncHandler } from "./src/utils/async-handler.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import { ChatGroq } from "@langchain/groq";
import { uploadPDF } from './src/services/appwrite.js';
import addToQueue from './src/queues/pdf-queue.js';
import { embedQuery } from './src/services/embeddings.js';
import { EMBED_CONFIG, logVectorConfig } from './src/config/vector-config.js';
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

// Phase 1: Auth & Notebook imports
import { requireAuth, extractUserId } from './src/middleware/auth.js';
import { requireTenant } from './src/middleware/tenantScope.js';
import notebookRoutes from './src/api/routes/notebook.js';

// Phase 2: Document routes
import documentRoutes from './src/api/routes/documents.js';

// Phase 3: Chat routes
import chatRoutes from './src/api/routes/chat.js';
const app = express();

// CORS configuration - must allow credentials for Clerk JWT
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// ── Phase 1: Notebook API Routes (Protected) ─────────────────────────────────
app.use('/api/notebooks', requireAuth, extractUserId, requireTenant, notebookRoutes);

// ── Phase 2: Document API Routes (Protected) ─────────────────────────────────
app.use('/api/documents', requireAuth, extractUserId, requireTenant, documentRoutes);

// ── Phase 3: Chat API Routes (Protected) ─────────────────────────────────────
app.use('/api/chat', requireAuth, extractUserId, requireTenant, chatRoutes);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ── Shared singletons ────────────────────────────────────────────────────────

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
  streaming: true,
});

// ── Upload ───────────────────────────────────────────────────────────────────

app.post("/upload/pdf", upload.array("pdf"), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ err: "No file found" });
  }

  const uploaded_files = await Promise.all(
    req.files.map(file => uploadPDF(file.buffer, file.originalname))
  );
  const fileIds = uploaded_files.map(f => f.$id);

  console.log("Uploaded and Queuing File IDs:", fileIds);
  await addToQueue(fileIds);

  res.json({ message: "PDFs queued for processing", fileIds });
}));

// ── Search ───────────────────────────────────────────────────────────────────
console.log("DEBUG ENV:", process.env.VECTOR_DIMENSION);
logVectorConfig();

app.post("/search", asyncHandler(async (req, res) => {
  const { query, limit = 5 } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  const queryVector = await embedQuery(query);
  const searchResults = await qdrant.search(EMBED_CONFIG.COLLECTION_NAME, {
    vector: queryVector,
    limit: parseInt(limit),
    with_payload: true,
  });

  const passages = searchResults.map(r => ({
    content: r.payload.pageContent,
    metadata: r.payload.metadata,
    score: r.score,
  }));

  res.json({ passages });
}));

// ── Chat (basic RAG, keep for backward compat) ───────────────────────────────

app.post("/chat", asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const queryVector = await embedQuery(message);
  const searchResults = await qdrant.search(EMBED_CONFIG.COLLECTION_NAME, {
    vector: queryVector,
    limit: 4,
    with_payload: true,
  });

  const results = searchResults.map(r => ({
    pageContent: r.payload.pageContent,
    metadata: r.payload.metadata,
  }));
  const context = results.map(r => r.pageContent).join("\n\n---\n\n");

  const prompt = `You are a helpful assistant that answers questions based on the provided document context. If the context doesn't contain relevant information, say so honestly.

Context from documents:
${context}

Question: ${message}

Provide a clear, well-structured answer based on the context above.`;

  const response = await llm.invoke(prompt);

  res.json({
    reply: response.content,
    sources: results.map(r => ({
      content: r.pageContent.substring(0, 200) + "...",
      metadata: r.metadata,
    })),
  });
}));

// ── Agent (ReAct + SSE streaming) ────────────────────────────────────────────

const AGENT_SYSTEM_PROMPT = `You are a private research assistant with access to the user's personal document library via the search_documents tool.

Rules:
- ALWAYS call search_documents before answering. Never rely on memory alone.
- If the first search is insufficient, search again with a refined query.
- Cite sources clearly using [Source N] references in your answer.
- If documents don't contain the answer, say so honestly — do not hallucinate.
- Be concise, accurate, and well-structured.`;

function buildAgentTools(userId) {
  const searchTool = tool(
    async ({ query, limit = 5 }) => {
      const vector = await embedQuery(query);
      const results = await qdrant.search(EMBED_CONFIG.COLLECTION_NAME, {
        vector,
        limit,
        with_payload: true,
        filter: {
          must: [{ key: "metadata.userId", match: { value: userId } }],
        },
      });

      if (!results.length) return "No relevant content found in your documents.";

      return results
        .map((r, i) =>
          `[Source ${i + 1}] score:${r.score.toFixed(3)}\n${r.payload.pageContent}`
        )
        .join("\n\n---\n\n");
    },
    {
      name: "search_documents",
      description:
        "Semantic search over the user's private document library. Call this before answering any question.",
      schema: z.object({
        query: z.string().describe("Semantic search query derived from the user's question"),
        limit: z.number().int().min(1).max(10).optional().describe("Results to return (default 5)"),
      }),
    }
  );

  return [searchTool];
}

app.post("/agent", asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  // ── TODO: swap this with your real auth middleware (Clerk, JWT, etc.) ──
  const userId = req.headers["x-user-id"];

  if (!message) return res.status(400).json({ error: "message is required" });
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const agent = createReactAgent({
    llm,
    tools: buildAgentTools(userId),
    prompt: AGENT_SYSTEM_PROMPT,
  });

  const formattedHistory = history.map(({ role, content }) => [role, content]);

  const stream = await agent.stream(
    { messages: [...formattedHistory, ["human", message]] },
    { streamMode: "messages" }
  );

  const sources = [];

  for await (const [chunk, metadata] of stream) {
    // Capture tool results as sources
    if (chunk.name === "search_documents" && chunk.content) {
      sources.push(chunk.content.slice(0, 300) + "...");
    }

    // Stream AI tokens to client
    if (chunk.content && metadata.langgraph_node === "agent") {
      res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true, sources })}\n\n`);
  res.end();
}));

// ────────────────────────────────────────────────────────────────────────────

app.listen(8000, () => console.log("Server started on PORT: 8000"));