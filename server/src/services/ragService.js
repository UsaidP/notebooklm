import { streamGroqResponse } from "../lib/groq.js"
import { embedQuery } from "./embeddings.js"
import { getCollectionName, searchVectors } from "./qdrant.js"

const SYSTEM_PROMPT = `You are an expert research assistant, similar to Google NotebookLM. Your role is to help users analyze documents, extract insights, and answer questions based on the provided sources.

Guidelines:
1. Always cite sources when using information from documents (e.g., "[Source: DocumentName, p.X]")
2. Be thorough but concise - focus on actionable insights
3. When information isn't available in the sources, clearly state that
4. Organize complex information with clear headings and bullet points
5. Distinguish between direct quotes and paraphrased information
6. Highlight key findings and important data points
7. If the answer isn't in the provided context, clearly state that

Response Format:
- Start with a direct answer to the question
- Provide supporting details from sources
- Include relevant citations using the provided source numbers [1], [2], etc.
- End with related questions the user might want to explore

CONTEXT:
`

/**
 * Handle a RAG chat request.
 * - Embed the incoming message
 * - Search Qdrant for similar vectors (using notebook isolation)
 * - Optionally filter by selected source IDs
 * - Format the context chunks and history
 * - Stream the Groq LLM response through the provided Response object via SSE
 */
export const chat = async ({
  message,
  notebookId,
  userId,
  sessionId,
  history,
  selectedSourceIds,
  res,
}) => {
  // 1. Embed the user's message
  const queryVector = await embedQuery(message)

  // 2. Search Qdrant
  const collectionName = getCollectionName(userId, notebookId)

  // Build filter if selectedSourceIds provided
  let filter
  if (selectedSourceIds && selectedSourceIds.length > 0) {
    filter = {
      must: [
        {
          key: "metadata.documentId",
          match: { any: selectedSourceIds },
        },
      ],
    }
  }

  console.log(`[RAG] Query: "${message.slice(0, 60)}..."`)
  console.log(`[RAG] Collection: ${collectionName}`)
  console.log(
    `[RAG] Source filter: ${selectedSourceIds?.length ? selectedSourceIds.join(", ") : "none (all docs)"}`
  )

  const searchResults = await searchVectors(
    collectionName,
    queryVector,
    8, // Limit chunks
    filter
  )

  // Configurable relevance threshold (default 0.5, validated between 0 and 1)
  const relevanceThreshold = Math.min(
    1,
    Math.max(0, parseFloat(process.env.RAG_RELEVANCE_THRESHOLD ?? "0.5") || 0.5)
  )
  console.log(
    `[RAG] Raw results: ${searchResults.length}, scores: ${searchResults.map((r) => r.score.toFixed(3)).join(", ")}`
  )
  console.log(`[RAG] Using relevance threshold: ${relevanceThreshold}`)

  const filteredChunks = searchResults.filter(
    (result) => result.score >= relevanceThreshold
  )

  console.log(
    `[RAG] After threshold (≥${relevanceThreshold}): ${filteredChunks.length} chunks`
  )

  // 3. Deduplicate chunks (by documentId + chunk index or text to avoid redundant context)
  const uniqueChunks = []
  const seenTexts = new Set()

  const sources = []

  for (const chunk of filteredChunks) {
    const text = chunk.payload.pageContent
    if (!seenTexts.has(text)) {
      seenTexts.add(text)
      uniqueChunks.push(chunk)

      // Extract metadata for sources
      sources.push({
        documentId: chunk.payload.metadata.documentId,
        documentName: chunk.payload.metadata.fileName || "Document",
        page: chunk.payload.metadata.pageNumber || null,
        score: chunk.score,
        text: text.substring(0, 150) + "...", // Snippet for the UI
      })
    }
  }

  // Handle case when no relevant chunks found
  if (uniqueChunks.length === 0) {
    res.write(
      `data: ${JSON.stringify({ type: "token", content: "I couldn't find relevant information in the selected documents for that question. Try selecting different sources or rephrasing your query." })}\n\n`
    )
    res.write(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`)
    res.end()
    return { fullResponse: "", sources: [] }
  }

  // Build the context string
  let contextString = ""
  uniqueChunks.forEach((chunk, idx) => {
    const name = chunk.payload.metadata.fileName || "Unnamed"
    const page = chunk.payload.metadata.pageNumber
      ? ` p.${chunk.payload.metadata.pageNumber}`
      : ""
    contextString += `\n\n[${idx + 1}] ${name}${page} (relevance: ${chunk.score.toFixed(2)})\n`
    contextString += chunk.payload.pageContent
  })

  // 4. Build messages array for the LLM
  const messages = [
    { role: "system", content: SYSTEM_PROMPT + contextString },
    ...history,
    { role: "user", content: message },
  ]

  // 5. Stream from Groq to the client
  try {
    const fullResponse = await streamGroqResponse(messages, res)

    // 6. Send the sources after the last token
    res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)

    // 7. Send the done signal
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`)

    return { fullResponse, sources }
  } catch (err) {
    console.error("LLM streaming error:", err)
    res.write(
      `data: ${JSON.stringify({ type: "error", message: "Failed to generate response." })}\n\n`
    )
    res.end()
    throw err
  }
}
