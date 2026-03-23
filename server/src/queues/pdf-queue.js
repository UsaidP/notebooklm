import { Queue } from "bullmq";

const queue = new Queue("document-processing-queue", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

/**
 * Add a document processing job to the queue
 * @param {Object} jobData - Job data
 * @param {string} jobData.documentId - Document ID in PostgreSQL
 * @param {string} jobData.userId - User ID for tenant isolation
 * @param {string} jobData.notebookId - Notebook ID
 * @param {string} jobData.appwriteFileId - Appwrite file ID
 * @param {string} jobData.fileName - Original file name
 * @returns {Promise<Job>} The created job
 */
async function addDocumentJob({ documentId, userId, notebookId, appwriteFileId, fileName }) {
  return queue.add("process-document", {
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
  return queue.add("file-upload", { fileIds });
}

export { queue, addDocumentJob, addToQueue };
export default addDocumentJob;