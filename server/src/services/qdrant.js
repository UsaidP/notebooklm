import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "crypto";
import { EMBED_CONFIG, getCollectionConfig, validateVectorDimension } from "../config/vector-config.js";

const client = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env.QDRANT_KEY });

/**
 * Generate collection name for per-notebook isolation
 * Format: user_{userId}_notebook_{notebookId}
 */
export const getCollectionName = (userId, notebookId) => {
  return `user_${userId}_notebook_${notebookId}`;
};

export const ensureCollection = async (COLLECTION, vectorSize) => {
  try {
    // Use configured dimension if vectorSize not provided
    const expectedSize = vectorSize || EMBED_CONFIG.DIMENSION;

    // Validate the vector size matches expected
    validateVectorDimension(expectedSize);

    // Check if collection exists
    const collections = await client.getCollections();
    const existing = collections.collections.find(c => c.name === COLLECTION);
    if (existing) {
      // Get collection info
      const info = await client.getCollection(COLLECTION);
      const currentSize = info.config.params.vectors.size;
      if (currentSize !== expectedSize) {
        console.log(`⚠️ Collection "${COLLECTION}" exists with size ${currentSize}, but need ${expectedSize}. Deleting and recreating.`);
        await client.deleteCollection(COLLECTION);
      } else {
        console.log(`✓ Collection "${COLLECTION}" already exists with correct size ${expectedSize}.`);
        return;
      }
    }

    const config = getCollectionConfig();
    await client.createCollection(COLLECTION, config);
    console.log(`✓ Collection "${COLLECTION}" created with vector size ${expectedSize}.`);
  } catch (error) {
    console.error(`Error ensuring collection "${COLLECTION}":`, error);
    throw error;
  }
};

/**
 * Upsert vectors with userId and documentId in payload
 */
export const upsertVectors = async (COLLECTION, vectors, batch, batchNum, totalBatches, userId, documentId) => {
  const points = vectors.map((vec, idx) => ({
    id: randomUUID(),
    vector: vec,
    payload: {
      pageContent: batch[idx].pageContent,
      metadata: {
        ...batch[idx].metadata,
        userId,        // Add userId for tenant isolation
        documentId,    // Add documentId for tracking
      },
    },
  }));

  await client.upsert(COLLECTION, { points });
  console.log(`  ✓ Batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);
};

// Check if a fileId has already been indexed in the collection
export const fileAlreadyIndexed = async (COLLECTION, fileId) => {
  try {
    const result = await client.scroll(COLLECTION, {
      filter: {
        must: [{ key: "metadata.fileId", match: { value: fileId } }],
      },
      limit: 1,
      with_payload: false,
      with_vector: false,
    });
    return result.points.length > 0;
  } catch {
    // Collection doesn't exist yet — file definitely not indexed
    return false;
  }
};

/**
 * Search vectors with optional filter for tenant/source isolation
 * @param {string} COLLECTION - Collection name
 * @param {number[]} queryVector - Query embedding
 * @param {number} limit - Max results
 * @param {object|null} filter - Optional Qdrant filter object
 */
export const searchVectors = async (COLLECTION, queryVector, limit = 5, filter = null) => {
  try {
    // Validate query vector dimension before searching
    if (queryVector && queryVector.length) {
      validateVectorDimension(queryVector.length);
    }

    const searchParams = {
      vector: queryVector,
      limit: limit,
      with_payload: true,
      with_vector: false,
    };

    // Apply filter if provided
    if (filter) {
      searchParams.filter = filter;
    }

    const result = await client.search(COLLECTION, searchParams);
    return result;
  } catch (error) {
    console.error(`Error searching vectors in ${COLLECTION}:`, error);
    throw error;
  }
};

/**
 * Delete all vectors for a document
 */
export const deleteDocumentVectors = async (COLLECTION, documentId) => {
  try {
    await client.delete(COLLECTION, {
      filter: {
        must: [{ key: "metadata.documentId", match: { value: documentId } }]
      }
    });
    console.log(`✓ Deleted vectors for document ${documentId} from ${COLLECTION}`);
  } catch (error) {
    console.error(`Error deleting document vectors:`, error);
    throw error;
  }
};

/**
 * Delete entire collection (for notebook deletion)
 */
export const deleteCollection = async (COLLECTION) => {
  try {
    await client.deleteCollection(COLLECTION);
    console.log(`✓ Deleted collection ${COLLECTION}`);
  } catch (error) {
    console.error(`Error deleting collection:`, error);
    throw error;
  }
};
