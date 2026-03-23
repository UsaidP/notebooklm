import { EMBED_CONFIG, validateVectorDimension } from "../config/vector-config.js";

// Use Perplexity AI embeddings API (1024 dimensions)
const EMBED_API_URL = process.env.EMBED_API_URL || "https://arkammulla--privylm-embeddings-embeddingserver-embed.modal.run";
const EMBED_MODEL = process.env.EMBED_MODEL || "pplx-embed-v1-0.6b"; // 1024 dimensions

// ─── Embed multiple texts ────────────────────────────────────────────────────
export const embedTexts = async (texts) => {
  const embeddings = await Promise.all(
    texts.map(async (text) => {
      const res = await fetch(EMBED_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: text
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Embed API failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      // Perplexity API returns: { data: [{ embedding: [...], index: 0 }] }
      return data.data?.[0]?.embedding;
    })
  );

  // Validate vector dimensions using the first embedding
  if (embeddings.length > 0) {
    const actualDim = embeddings[0].length;
    validateVectorDimension(actualDim);
  }

  return embeddings;
};

// ─── Embed a single query ────────────────────────────────────────────────────
export const embedQuery = async (text) => {
  const embeddings = await embedTexts([text]);
  return embeddings[0];
};

// Export config for other modules
export { EMBED_CONFIG };