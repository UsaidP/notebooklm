import { Queue } from "bullmq";

let queue = null;

const redisConfig = {
  connection: {
    host: process.env.REDISHOST || process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDISPORT || process.env.REDIS_PORT) || 6379,
    password: process.env.REDISPASSWORD || process.env.REDIS_PASSWORD || undefined
  }
};

/**
 * Get or create the queue (lazy initialization)
 * Returns null if Redis is not configured
 */
function getQueue() {
  if (!queue) {
    // Only create queue if Redis is configured
    if (process.env.REDISHOST || process.env.REDIS_HOST) {
      try {
        queue = new Queue("document-processing-queue", redisConfig);

        // Graceful error handling for Redis connection
        queue.on("error", (err) => {
          if (err.code === "ECONNREFUSED") {
            console.warn("⚠️  Redis connection failed. Queue unavailable.");
          } else {
            console.error("Queue error:", err);
          }
        });

        queue.on("closed", () => {
          console.log("Queue connection closed");
        });

        console.log("✓ Document processing queue initialized");
      } catch (error) {
        console.warn("⚠️  Failed to initialize queue:", error.message);
        queue = null;
      }
    } else {
      console.warn("⚠️  Redis not configured (missing REDISHOST/REDIS_HOST). Queue disabled.");
    }
  }
  return queue;
}

/**
 * Add a document processing job to the queue
 * @param {Object} jobData - Job data
 * @param {string} jobData.documentId - Document ID in PostgreSQL
 * @param {string} jobData.userId - User ID for tenant isolation
 * @param {string} jobData.notebookId - Notebook ID
 * @param {string} jobData.appwriteFileId - Appwrite file ID
 * @param {string} jobData.fileName - Original file name
 * @returns {Promise<Job|null>} The created job or null if queue unavailable
 */
async function addDocumentJob({ documentId, userId, notebookId, appwriteFileId, fileName }) {
  const q = getQueue();
  if (!q) {
    console.warn("⚠️  Cannot add job: Queue not available. Processing synchronously.");
    // Fall back to synchronous processing
    const { processPDFs } = await import("../workers/pdf-worker.js");
    const { updateDocumentStatus } = await import("../services/documentService.js");

    try {
      await updateDocumentStatus(documentId, "PROCESSING");
      const chunks = await processPDFs({ fileIds: [appwriteFileId] });
      await updateDocumentStatus(documentId, "INDEXED", { chunkCount: chunks?.length || 0 });
      return { success: true, synchronous: true };
    } catch (error) {
      await updateDocumentStatus(documentId, "FAILED", { errorMessage: error.message });
      throw error;
    }
  }

  return q.add("process-document", {
    documentId,
    userId,
    notebookId,
    appwriteFileId,
    fileName,
    timestamp: new Date().toISOString()
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      age: 3600 // Keep completed jobs for 1 hour
    },
    removeOnFail: {
      age: 86400 // Keep failed jobs for 24 hours
    }
  });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use addDocumentJob instead
 */
function addToQueue(fileIds) {
  console.warn('addToQueue is deprecated. Use addDocumentJob instead.');
  const q = getQueue();
  if (!q) {
    console.warn("Queue not available");
    return Promise.resolve(null);
  }
  return q.add("file-upload", { fileIds });
}

export { queue, getQueue, addDocumentJob, addToQueue };
export default addDocumentJob;
