/**
 * Vector Configuration
 * Centralized configuration for embedding dimensions and model settings
 * to ensure consistency between indexing and query operations.
 */

// Embedding model configuration
export const EMBED_CONFIG = {
  // API endpoint for embeddings
  API_URL: process.env.EMBED_API_URL || "https://kimbery-grippier-renownedly.ngrok-free.dev/v1/embeddings",

  // Model identifier
  MODEL: process.env.EMBED_MODEL || "pplx-embed-v1",

  // Expected vector dimension - update this if you change the model
  // pplx-embed-v1: 1024 dimensions (Perplexity AI)
  // jina-embeddings-v5-text-small: 1024 dimensions
  // text-embedding-3-large: 1024 dimensions
  DIMENSION: parseInt(process.env.VECTOR_DIMENSION) || 1024,

  // Collection name in Qdrant
  COLLECTION_NAME: process.env.QDRANT_COLLECTION || "docs",

  // Distance metric for vector similarity
  DISTANCE: "Cosine",
};

// Validate vector dimension matches expected value
export function validateVectorDimension(actualSize, expectedSize = EMBED_CONFIG.DIMENSION) {
  if (actualSize !== expectedSize) {
    throw new Error(
      `Vector dimension mismatch: expected ${expectedSize}, got ${actualSize}. ` +
      `Check your EMBED_MODEL configuration or update VECTOR_DIMENSION in environment.`
    );
  }
  return true;
}

// Get collection config for Qdrant
export function getCollectionConfig() {
  return {
    vectors: {
      size: EMBED_CONFIG.DIMENSION,
      distance: EMBED_CONFIG.DISTANCE,
    },
  };
}

// Log current configuration on startup
export function logVectorConfig() {
  console.log("📐 Vector Configuration:");
  console.log(`   Model: ${EMBED_CONFIG.MODEL}`);
  console.log(`   Dimension: ${EMBED_CONFIG.DIMENSION}`);
  console.log(`   Collection: ${EMBED_CONFIG.COLLECTION_NAME}`);
  console.log(`   Distance: ${EMBED_CONFIG.DISTANCE}`);
}
