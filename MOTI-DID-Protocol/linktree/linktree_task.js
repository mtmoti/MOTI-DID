const {
  namespaceWrapper,
  taskNodeAdministered,
} = require('../environment/namespaceWrapper');
const { TASK_ID } = require('../environment/init');
const dotenv = require('dotenv');
dotenv.config();
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const db = require('../database/db_model');
const { Keypair } = require('@solana/web3.js'); // TEST For local testing
// for the storage
const { KoiiStorageClient } = require('@_koii/storage-task-sdk');
const { createWriteStream, existsSync, unlinkSync } = require('fs');

/**
 * @function linktree_task
 * @description
 * This is the main Linktree task function
 * It will call the database to get the linktree list
 * Then it will sign the list with the node's keypair
 * Then it will upload the signed list to IPFS and reture the CID
 */
const main = async () => {
  console.log('******/  IN Linktree Task FUNCTION /******');

  // Load node's keypair from the JSON file
  let keypair;
  if (taskNodeAdministered) {
    keypair = await namespaceWrapper.getSubmitterAccount();
  } else {
    // TEST For local testing, hardcode the keypair
    keypair = Keypair.generate();
  }

  // Get linktree list fron localdb
  const proofs_list_object = await db.getAllProofs();

  // check if it empty return null
  if (Array.isArray(proofs_list_object) && proofs_list_object.length === 0) {
    console.log('Error submission_value');
    return null;
  }

  // Use the node's keypair to sign the linktree list
  const messageUint8Array = new Uint8Array(
    Buffer.from(JSON.stringify(proofs_list_object)),
  );

  const signedMessage = nacl.sign(messageUint8Array, keypair.secretKey);
  const signature = signedMessage.slice(0, nacl.sign.signatureLength);

  const submission_value = {
    proofs: proofs_list_object,
    node_publicKey: keypair.publicKey,
    node_signature: bs58.encode(signature),
  };

  // upload the proofs of the linktree on KoiiStorageClient
  try {
    // check if exists then delete it
    if (existsSync(`namespace/${TASK_ID}/proofs.json`)) {
      unlinkSync(`namespace/${TASK_ID}/proofs.json`);
    }

    const gameSalesJson = JSON.stringify(submission_value, null, 2);
    const buffer = Buffer.from(gameSalesJson, 'utf8');

    const writer = createWriteStream(`namespace/${TASK_ID}/proofs.json`);
    writer.write(buffer);
    writer.end();

    const client = new KoiiStorageClient(undefined, undefined, true);
    const userStaking = await namespaceWrapper.getSubmitterAccount();
    const fileUploadResponse = await client.uploadFile(
      `namespace/${TASK_ID}/proofs.json`,
      userStaking,
    );

    // check if exists then delete it
    if (existsSync(`namespace/${TASK_ID}/proofs.json`)) {
      unlinkSync(`namespace/${TASK_ID}/proofs.json`);
    }

    console.log(
      'User Linktrees proof uploaded to IPFS: ',
      fileUploadResponse.cid,
    );

    return fileUploadResponse.cid;
  } catch (err) {
    console.log('Error submission_value', err);
    return null;
  }
};

module.exports = main;
