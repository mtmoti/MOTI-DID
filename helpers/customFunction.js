require('dotenv').config();
const { createWriteStream, existsSync, mkdirSync, unlinkSync } = require('fs');
const { join } = require('path');
const { KoiiStorageClient } = require('@_koii/storage-task-sdk');
import { namespaceWrapper } from '@_koii/namespace-wrapper';

export async function customFsWriteStream(
  imagepath,
  buffer,
  previousImagePath,
  fileName,
  storeInIPFS,
) {
  try {
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
      return { imagepath };
    }

    // create a write stream and write the new image
    const writer = createWriteStream(fullPath);
    writer.write(buffer);
    writer.end();

    // if storeInIPFS is true, upload the file to IPFS
    if (storeInIPFS) {
      const client = new KoiiStorageClient(undefined, undefined, true);
      const userStaking = await namespaceWrapper.getSubmitterAccount();
      const fileUploadResponse = await client.uploadFile(fullPath, userStaking);
      const fullProtocolLink = `https://ipfs-gateway.koii.live/ipfs/${fileUploadResponse.cid}${fileName}`;
      return { imagepath, protocolLink: fullProtocolLink };
    }
    return { imagepath, protocolLink: null };
  } catch (error) {
    console.error('Error writing file:', error);
    return { imagepath, protocolLink: null };
  }
}
