import 'dotenv/config'
import { Worker } from 'bullmq';
import { embedTexts, EMBED_CONFIG } from './src/services/embeddings.js';
import { ensureCollection, upsertVectors, getCollectionName } from './src/services/qdrant.js';
import { processPDFs } from './src/workers/pdf-worker.js';
import { logVectorConfig } from './src/config/vector-config.js';
import { updateDocumentStatus } from './src/services/documentService.js';

const BATCH_SIZE = 50; // Reduced for better progress updates

// Log configuration on startup
logVectorConfig();

const worker = new Worker(
  'document-processing-queue',
  async job => {
    const { documentId, userId, notebookId, appwriteFileId, fileName } = job.data;

    console.log(`\n📄 Processing document: ${fileName}`);
    console.log(`   Document ID: ${documentId}`);
    console.log(`   User: ${userId}`);
    console.log(`   Notebook: ${notebookId}`);

    try {
      // 1. Update status to PROCESSING
      await updateDocumentStatus(documentId, 'PROCESSING');
      await job.updateProgress(5);

      // 2. Get collection name for per-notebook isolation
      const collectionName = getCollectionName(userId, notebookId);
      console.log(`   Collection: ${collectionName}`);

      // 3. Process PDF and extract chunks
      const chunks = await processPDFs({ fileIds: [appwriteFileId] });

      if (!chunks || chunks.length === 0) {
        console.warn(`⚠️  No chunks found for ${fileName}, marking as FAILED`);
        await updateDocumentStatus(documentId, 'FAILED');
        throw new Error('No text content extracted from PDF');
      }

      console.log(`   Extracted ${chunks.length} chunks`);
      await job.updateProgress(20);

      // 4. Get vector dimension from first chunk
      const testVec = await embedTexts([chunks[0].pageContent]);
      const vectorSize = testVec[0].length;
      console.log(`   Vector dimension: ${vectorSize}`);

      // 5. Ensure collection exists with correct dimension
      await ensureCollection(collectionName, vectorSize);
      await job.updateProgress(25);

      // 6. Process in batches
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
      console.log(`   Processing ${totalBatches} batches...`);

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map(d => d.pageContent);
        const vectors = await embedTexts(texts);

        await upsertVectors(collectionName, vectors, batch, batchNum, totalBatches, userId, documentId);

        // Update progress (25% to 90%)
        const progress = 25 + Math.round((batchNum / totalBatches) * 65);
        await job.updateProgress(progress);
      }

      // 7. Update status to INDEXED
      await updateDocumentStatus(documentId, 'INDEXED', { chunkCount: chunks.length });
      await job.updateProgress(100);

      console.log(`✅ Document ${fileName} indexed successfully!`);
      console.log(`   Total chunks: ${chunks.length}`);

      return {
        success: true,
        documentId,
        chunkCount: chunks.length,
        collectionName
      };

    } catch (error) {
      console.error(`❌ Error processing document ${documentId}:`, error.message);

      // Update status to FAILED
      await updateDocumentStatus(documentId, 'FAILED', {
        errorMessage: error.message
      });

      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379
    },
    lockDuration: 600000,  // 10 minutes
    lockRenewTime: 30000,  // 30 seconds
    concurrency: 2,        // Process 2 documents at a time
  }
);

worker.on('completed', job => {
  console.log(`\n✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`\n❌ Job ${job?.id} FAILED:`, err.message);
});

worker.on('error', err => {
  console.error('Worker error:', err);
});

console.log('🚀 Document processing worker started');
console.log(`   Queue: document-processing-queue`);
console.log(`   Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

