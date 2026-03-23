import { Client, Storage, ID } from "node-appwrite";
import { InputFile } from 'node-appwrite/file';


const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.NEXT_APP_WRITE_API_KEY); // Required for Node.js

const storage = new Storage(client);
/**
 * @param {Buffer} fileBuffer - The buffer from multer (req.file.buffer)
 * @param {string} fileName - The original name (req.file.originalname)
 */
export const uploadPDF = async (fileBuffer, fileName) => {
  try {
    console.log(`${fileName}`)
    // The modern signature uses POSITIONAL arguments:
    // bucketId, fileId, file, [permissions]
    const response = await storage.createFile({
      bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
      fileId: ID.unique(),
      file: InputFile.fromBuffer(fileBuffer, fileName),
      // permissions: [Permission.Role.any()], // optional

    });

    return response;
  } catch (error) {
    console.error("Appwrite Upload Error:", error.message);
    throw error;
  }
};

export const listAllFiles = async () => {
  const result = await storage.listFiles({
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
    // queries: [], // optional
    // search: '<SEARCH>', // optional
    // total: false // optional
  });
  return result
  // console.log(result);
}

export const downloadFile = async function downloadFromAppwrite(fileId) {
  // Returns the file as an ArrayBuffer
  const arrayBuffer = await storage.getFileDownload(
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
    fileId
  )
  console.log(`Downloaded file ${fileId} from Appwrite (size: ${arrayBuffer.byteLength} bytes)`);
  return Buffer.from(arrayBuffer)
}
