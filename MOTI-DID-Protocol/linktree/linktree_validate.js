const dataFromCid = require('../helpers/dataFromCid');
const {
  namespaceWrapper,
  taskNodeAdministered,
} = require('../environment/namespaceWrapper');
const db = require('../database/db_model');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { default: axios } = require('axios');
const { TASK_ID, SERVICE_URL } = require('../environment/init');
const Web3 = require('web3');
const web3 = new Web3();
const ethUtil = require('ethereumjs-util');

/**
 * @function linktree_validate
 * @description
 * This function is called when the node is selected to validate the submission value.
 * It will fetch the linktrees from other nodes.
 * It will then verify that the node is holding the linktree and that the signature is valid.
 */
const main = async (submission_value, round) => {
  try {
    console.log('******/ Linktree CID VALIDATION Task FUNCTION /******');
    const outputraw = await dataFromCid(submission_value);
    const output = outputraw;

    // Check if output is empty, null, or has 0 length and return false if so
    if (
      !output ||
      (Array.isArray(output) && output.length === 0) ||
      (typeof output === 'object' && Object.keys(output).length === 0)
    ) {
      console.log('::::OUTPUT IS EMPTY::::');
      return false;
    }

    // console.log('OUTPUT', output);
    // console.log('RESPONSE DATA length', output.proofs.length);
    // console.log('PUBLIC KEY', output.node_publicKey);
    // console.log('SIGNATURE', output.node_signature);

    // Check that the node who submitted the proofs is a valid staked node
    let isNode = await verifyNode(
      output.proofs,
      output.node_signature,
      output.node_publicKey,
    );

    console.log("Is the node's signature on the CID payload correct?", isNode);

    // check each item in the linktrees list and verify that the node is holding that payload, and the signature matches
    let isLinktree;
    if (output.proofs.length > 0) {
      isLinktree = await verifyLinktrees(output.proofs);
      console.log('IS LINKTREE True?', isLinktree);
    } else {
      console.log('No linktree found in round', round);
      isLinktree = true;
    }
    if (isNode && isLinktree) return true; // if both are true, return true
    else return false; // if one of them is false, return false
  } catch (error) {
    console.log('LINKTREE VALIDATE ERROR :::: ', error);
    return false;
  }
};

// verify the linktree signature by querying the other node to get it's copy of the linktree
async function verifyLinktrees(proofs_list_object) {
  try {
    console.log('******/ verifyLinktrees START /******');
    let allSignaturesValid = true;
    let AuthUserList = await db.getAllAuthList();

    for (const proofs of proofs_list_object) {
      let publicKey = proofs.publicKey;

      // call other nodes to get the node list
      let nodeUrlList;
      if (taskNodeAdministered) {
        const nodesUrl = `${SERVICE_URL}/nodes/${TASK_ID}`;
        const nodesUrlRes = await axios.get(nodesUrl);
        if (nodesUrlRes.status != 200) {
          console.error('verifyLinktrees Error', nodesUrlRes.status);
          continue;
        }
        if (!nodesUrlRes.data) {
          console.error('verifyLinktrees No valid nodes running');
          continue;
        }
        nodeUrlList = nodesUrlRes.data.map(e => {
          return e.data.url;
        });
        if (nodeUrlList.length > 3) {
          const shuffledArray = nodeUrlList.sort(() => Math.random() - 0.5);
          nodeUrlList = shuffledArray.slice(0, 3);
        }
      } else {
        nodeUrlList = ['http://localhost:10000'];
      }

      // verify the signature of the linktree for each nodes
      for (const nodeUrl of nodeUrlList) {
        let res;
        // get all linktree in this node
        if (taskNodeAdministered) {
          res = await axios.get(
            `${nodeUrl}/task/${TASK_ID}/linktree/get/${publicKey}`,
          );
          // check node's status
          if (res.status != 200) {
            console.error('ERROR', res.status);
            continue;
          }
        } else {
          res = await db.getLinktreeWithPubKey(publicKey);
        }

        // get the payload
        const linktree = res.data;

        let AuthUserListFound =
          AuthUserList && AuthUserList.includes(linktree.publicKey);

        console.log(
          'AuthUserListFound ::::::::::::::::::: ',
          AuthUserListFound,
        );

        // check if the user's pubkey is on the authlist
        if (AuthUserListFound) {
          console.log('User is on the auth list yay');
        } else {
          // Check if the public key is an ETH address
          if (linktree.publicKey.length == 42) {
            // Verify the ETH signature
            const { data, publicKey, signature } = linktree;

            // Decode the signature
            const signatureBuffer = bs58.decode(signature);
            const r = signatureBuffer.slice(0, 32);
            const s = signatureBuffer.slice(32, 64);
            const v = signatureBuffer.slice(64);

            // Hash the message
            const message = JSON.stringify(data);
            const messageHash = web3.utils.keccak256(message);

            // Recover the signer's public key
            const publicKeyRecovered = ethUtil.ecrecover(
              ethUtil.toBuffer(messageHash),
              v[0],
              r,
              s,
            );

            // Convert the recovered public key to an Ethereum address
            const recoveredAddress = ethUtil.bufferToHex(
              ethUtil.pubToAddress(publicKeyRecovered),
            );

            // Check if the recovered address matches the provided public key
            if (recoveredAddress.toLowerCase() === publicKey.toLowerCase()) {
              console.log('Payload signature is valid');
              await db.setAuthList(publicKey);
            } else {
              console.log('Payload signature is invalid');
              allSignaturesValid = false;
            }
          } else {
            // Verify the signature
            const messageUint8Array = new Uint8Array(
              Buffer.from(JSON.stringify(linktree.data)),
            );
            const signature = linktree.signature;
            const publicKey = linktree.publicKey;
            const signatureUint8Array = bs58.decode(signature);
            const publicKeyUint8Array = bs58.decode(publicKey);
            const isSignatureValid = await verifySignature(
              messageUint8Array,
              signatureUint8Array,
              publicKeyUint8Array,
            );
            console.log(`IS SIGNATURE ${publicKey} VALID?`, isSignatureValid);

            if (isSignatureValid) {
              console.log('Payload signature is valid');
              await db.setAuthList(publicKey);
            } else {
              console.log('Payload signature is invalid');
              allSignaturesValid = false;
            }
          }
        }
      }
    }

    console.log('******/ verifyLinktrees END /******');
    return allSignaturesValid;
  } catch (error) {
    console.log('ERROR IN FETCHING OR SOMETHING ELSE', error);
    console.log('******/ verifyLinktrees END /******');
    return false;
  }
}

// verifies that a node's signature is valid, and rejects situations where CIDs from IPFS return no data or are not JSON
async function verifyNode(proofs_list_object, signature, publicKey) {
  const messageUint8Array = new Uint8Array(
    Buffer.from(JSON.stringify(proofs_list_object)),
  );
  const signatureUint8Array = bs58.decode(signature);
  const publicKeyUint8Array = bs58.decode(publicKey);

  if (!proofs_list_object || !signature || !publicKey) {
    console.error('No data received from web3.storage');
    return false;
  }

  // verify the node signature
  const isSignatureValid = await verifySignature(
    messageUint8Array,
    signatureUint8Array,
    publicKeyUint8Array,
  );

  return isSignatureValid;
}

async function verifySignature(message, signature, publicKey) {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

module.exports = main;
