require('dotenv').config();
const { writeFileSync, existsSync, mkdirSync, unlinkSync } = require('fs');
const { KoiiStorageClient } = require('@_koii/storage-task-sdk');
import { namespaceWrapper } from '@_koii/namespace-wrapper';
const crypto = require('crypto');

export async function customFsWriteStream(
  imagepath,
  buffer,
  previousImagePath,
  fileName,
  storeInIPFS,
  ipfsURL,
) {
  try {
    let client;
    if (storeInIPFS) {
      client = new KoiiStorageClient(undefined, undefined, true);
    }

    const getBasePath = await namespaceWrapper.getBasePath();
    const imgPath = `${getBasePath}/img`;

    if (!existsSync(imgPath)) {
      mkdirSync(imgPath, { recursive: true });
    }

    // if previousImagePath is provided, check if it exists and delete it
    if (previousImagePath) {
      const fullPath = `${getBasePath}${previousImagePath}`;
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    }

    // define the full path for the new image
    const fullPath = `${getBasePath}${imagepath}`;

    // if file already exists, return the existing imagepath
    if (existsSync(fullPath)) {
      if (storeInIPFS && ipfsURL && ipfsURL.trim()) {
        const filenameMatch = ipfsURL.match(/[^/]+$/);
        const filename = filenameMatch ? filenameMatch[0] : null;
        const cidMatch = ipfsURL.match(/\/ipfs\/([^/]+)/);
        const cid = cidMatch ? cidMatch[1] : null;
        if (filename && cid) {
          const fileBlob = await getFileHash(client, cid, filename);
          if (fileBlob) {
            return { imagepath, protocolLink: ipfsURL, fileBlob };
          }
        }
      }
      return { imagepath, protocolLink: null, fileBlob: null };
    }

    try {
      writeFileSync(fullPath, buffer);
    } catch (err) {
      console.error('Error writing file:', err);
      return { imagepath: null, protocolLink: null, fileBlob: null };
    }

    // if storeInIPFS is true, upload the file to IPFS
    if (storeInIPFS) {
      try {
        // get staking key and upload the image
        const userStaking = await namespaceWrapper.getSubmitterAccount();
        const fileUploadResponse = await client.uploadFile(
          fullPath,
          userStaking,
        );
        const fullProtocolLink = `https://ipfs-gateway.koii.live/ipfs/${fileUploadResponse.cid}${fileName}`;

        // get the hash of the image
        const fileBlob = await getFileHash(
          client,
          fileUploadResponse.cid,
          fileName,
        );
        return { imagepath, protocolLink: fullProtocolLink, fileBlob };
      } catch (error) {
        return { imagepath, protocolLink: null, fileBlob: null };
      }
    }

    return { imagepath, protocolLink: null, fileBlob: null };
  } catch (error) {
    console.error('Error writing file:', error);
    return { imagepath: null, protocolLink: null, fileBlob: null };
  }
}

async function getFileHash(storageClient, cid, fileName) {
  try {
    // Retrieve the file as a Blob from storage
    const fileBlob = await storageClient.getFile(cid, fileName);

    // Convert Blob to Buffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute the hash directly from the Buffer
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return hash;
  } catch (error) {
    console.error('Error retrieving file or calculating hash:', error);
    return null;
  }
}
