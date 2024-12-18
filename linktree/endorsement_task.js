const {
  namespaceWrapper,
  taskNodeAdministered,
} = require('@_koii/namespace-wrapper');
const dotenv = require('dotenv');
dotenv.config();
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const db = require('../database/db_model');
const { Keypair } = require('@solana/web3.js');

const main = async () => {
  try {
    console.log('******/ IN Endorsement Task FUNCTION /******');

    // Load node's keypair from the JSON file
    let keypair;
    if (taskNodeAdministered) {
      keypair = await namespaceWrapper.getSubmitterAccount();
    } else {
      // TEST For local testing, hardcode the keypair
      keypair = Keypair.generate();
    }

    // Get Endorsement list fron localdb
    const proofs_list_object = await db.getAllEndorsementProofs();

    // check if it empty return null
    if (Array.isArray(proofs_list_object) && proofs_list_object.length === 0) {
      console.log('Error submission_value Endorsement');
      return {};
    }

    // Use the node's keypair to sign the Endorsement list
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
    return submission_value;
  } catch (error) {
    console.log('main ::: Error submission_value Endorsement', error);
    return {};
  }
};

module.exports = main;
