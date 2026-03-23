import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { downloadFile } from "../services/appwrite.js";
import { asyncHandler } from "../utils/async-handler.js";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


export const processPDFs = async (data) => {

  console.log("Job received:", data);
  const allDocs = [];


  for (const fileId of data.fileIds) {
    console.log("Downloading PDF from Appwrite:", fileId);

    const fileBuffer = await downloadFile(fileId);

    console.log(`Downloaded PDF from Appwrite: ${fileId} (size: ${fileBuffer.length} bytes)`);

    // Convert Buffer to Blob for LangChain's PDFLoader
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });

    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    console.log("  →", docs.length, "pages");

    // Tag each chunk with its Appwrite fileId so we can detect duplicates in Qdrant
    docs.forEach(d => { d.metadata.fileId = fileId; });
    allDocs.push(...docs);
    // After pushing docs, tag each doc with its fileId

  }
  // ── 2. Filter & split ─────────────────────────────────────────────
  const validDocs = allDocs.filter(d => typeof d.pageContent === 'string' && d.pageContent.trim().length > 0);
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const splitDocs = await splitter.splitDocuments(validDocs);

  console.log("Split into", splitDocs.length, "chunks", typeof (splitDocs));

  return splitDocs
};
