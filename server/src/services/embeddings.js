import { EMBED_CONFIG, validateVectorDimension } from "../config/vector-config.js";

// Use Perplexity AI embeddings API (1024 dimensions)
const EMBED_API_URL = process.env.EMBED_API_URL || "https://kimbery-grippier-renownedly.ngrok-free.dev/embed";
const EMBED_MODEL = process.env.EMBED_MODEL || "pplx-embed-v1";

// Batch size for embedding requests (prevent OOM on GPU)
// Kaggle server uses 32 internally, so we match that
const BATCH_SIZE = 32;

// Timeout for embedding requests (10 minutes for large documents)
const REQUEST_TIMEOUT = 600000; // 10 minutes

// ─── Embed multiple texts with batching ──────────────────────────────────────
export const embedTexts = async (texts) => {
  const allEmbeddings = [];
  const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

  console.log(`📐 Embedding ${texts.length} texts in ${totalBatches} batches...`);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`  [Batch ${batchNum}/${totalBatches}] Processing ${batch.length} texts...`);

    try {
      console.log(`  → Sending request to: ${EMBED_API_URL}`);

      const res = await fetch(EMBED_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" // Skip ngrok warning page
        },
        body: JSON.stringify({
          input: batch, // Send array of texts
          prompt_name: "passage" // Default to passage type
        }),
        // Increase timeout for large batches (10 minutes)
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        console.error(`  ✗ API returned ${res.status}: ${errText}`);
        throw new Error(`Embed API failed (${res.status}): ${errText}`);
      }

      const data = await res.json();
      console.log(`  ← Received ${data.data?.length || 0} embeddings`);

      // Handle API response format
      let batchEmbeddings;
      if (data.data && Array.isArray(data.data)) {
        // Standard format: { data: [{ embedding: [...], index: 0 }] }
        batchEmbeddings = data.data
          .sort((a, b) => a.index - b.index) // Ensure correct order
          .map(item => item.embedding);
      } else {
        console.error("Unexpected API response:", data);
        throw new Error("Unexpected API response format");
      }

      allEmbeddings.push(...batchEmbeddings);
      console.log(`  ✓ Batch ${batchNum}/${totalBatches} complete`);
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.error(`  ✗ Batch ${batchNum} timed out after ${REQUEST_TIMEOUT / 1000}s`);
        throw new Error(`Embedding request timed out. Check if Kaggle server is running.`);
      }
      console.error(`  ✗ Batch ${batchNum} failed:`, error.message);
      throw error;
    }
  }

  // Validate vector dimensions using the first embedding
  if (allEmbeddings.length > 0) {
    const actualDim = allEmbeddings[0].length;
    console.log(`  ✓ Vector dimension: ${actualDim}`);
    validateVectorDimension(actualDim);
  }

  console.log(`✅ Embedding complete: ${allEmbeddings.length} vectors`);
  return allEmbeddings;
};

// ─── Embed a single query ────────────────────────────────────────────────────
export const embedQuery = async (text) => {
  const embeddings = await embedTexts([text]);
  return embeddings[0];
};

// Export config for other modules
export { EMBED_CONFIG };