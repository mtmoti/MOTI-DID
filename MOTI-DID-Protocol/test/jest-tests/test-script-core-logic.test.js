const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const { Keypair } = require('@solana/web3.js');
const {
  setNodeProofCid,
  getNodeProofCid,
  getAllAuthList,
  setAuthList,
  getLinktreeWithPubKey,
} = require('../../database/db_model');
require('dotenv').config();

// might be delete
const Web3 = require('web3');
const web3 = new Web3();
const ethUtil = require('ethereumjs-util');

// Create linktree payload
function createPayload(data, pubkey, sign) {
  return {
    data,
    publicKey: pubkey,
    signature: sign,
    username: `linkTree_test_${pubkey}`,
  };
}

// Post payload to given path
async function postPayload(path, payload) {
  try {
    const response = await axios.post(path, { payload });
    return response;
  } catch (error) {
    return error.response;
  }
}

// get data from the db
async function getPayload(path) {
  try {
    const response = await axios.get(path);
    return response;
  } catch (error) {
    return error.response;
  }
}

// get data from the db
async function deletePayload(path) {
  try {
    const response = await axios.delete(path);
    return response;
  } catch (error) {
    return error.response;
  }
}

// get data from the db PROOFS
async function getAllProofs(path) {
  try {
    const response = await axios.get(path);
    return response;
  } catch (error) {
    return error.response;
  }
}

// verify the linktree signature by querying the other node to get it's copy of the linktree
async function verifyLinktrees(proofs_list_object) {
  let allSignaturesValid = true;
  let AuthUserList = await getAllAuthList;
  console.log('Authenticated Users List:', AuthUserList);

  for (const proofs of proofs_list_object) {
    console.log(proofs);
    let publicKey = proofs.publicKey;
    let nodeUrlList = ['http://localhost:10000'];
    for (const nodeUrl of nodeUrlList) {
      console.log('cheking linktree on ', nodeUrl);

      let res;
      // get all linktree in this node
      data = await getLinktreeWithPubKey(publicKey);
      res = { data };

      // get the payload
      const linktree = res.data;

      // check if the user's pubkey is on the authlist
      if (AuthUserList.hasOwnProperty(linktree.publicKey)) {
        console.log('User is on the auth list');
      } else {
        // Check if the public key is an ETH address
        if (linktree.linktree.publicKey.length == 42) {
          // Verify the ETH signature
          const { data, publicKey, signature } = linktree.linktree;

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
            await setAuthList(publicKey);
          } else {
            console.log('Payload signature is invalid');
            allSignaturesValid = false;
          }
        } else {
          // Verify the signature
          const messageUint8Array = new Uint8Array(
            Buffer.from(JSON.stringify(linktree.linktree.data)),
          );
          const signature = linktree.linktree.signature;
          const publicKey = linktree.linktree.publicKey;
          const signatureUint8Array = bs58.decode(signature);
          const publicKeyUint8Array = bs58.decode(publicKey);
          const isSignatureValid = await verifySignature(
            messageUint8Array,
            signatureUint8Array,
            publicKeyUint8Array,
          );
          console.log(`IS SIGNATURE ${publicKey} VALID?`, isSignatureValid);

          if (isSignatureValid) {
            await setAuthList(publicKey);
          } else {
            allSignaturesValid = false;
          }
        }
      }
    }
  }
  return allSignaturesValid;
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

describe('Create linktree API', () => {
  // set data
  let data;
  // for the path to CRUD (LINKTREEE)
  let postPath;
  let getPath;
  //   let updatePath;
  let deletePath;

  // for the path to CRUD (PROOF)
  let getAllProofPath;
  //   let postProofPath;
  //   let updateProofPath;
  //   let deleteProofPath;

  // for the pubic ket and signature
  let pubkey;
  let sign;

  // to store retrieved data
  let retrievedData;

  // create a task
  let setTaskSubmission = {};
  let arrayofCIDs = [];

  beforeAll(() => {
    const keyPair = nacl.sign.keyPair();
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.secretKey;

    data = {
      uuid: uuidv4(),
      linktree: {
        name: 'Linktree test',
        description: 'Linktree test description',
        image: '/img/cid/jpeg',
        background: '',
        links: [
          {
            key: 'official',
            label: 'Koii Network',
            redirectUrl: 'https://www.koii.network/',
          },
          {
            key: 'website',
            label: 'Koii Docs',
            redirectUrl: 'https://docs.koii.network/',
          },
        ],
      },
      timestamp: Date.now(),
    };

    const messageUint8Array = new Uint8Array(Buffer.from(JSON.stringify(data)));
    const signedMessage = nacl.sign(messageUint8Array, privateKey);
    const signature = signedMessage.slice(0, nacl.sign.signatureLength);
    pubkey = bs58.encode(publicKey);
    sign = bs58.encode(signature);

    // LINKTREE PATHS
    postPath = `http://localhost:10000/linktree/`;
    getPath = `http://localhost:10000/linktree/get/${pubkey}`;
    deletePath = `http://localhost:10000/linktree/${pubkey}`;

    // PROOF PATHS
    getAllProofPath = `http://localhost:10000/proofs/all`;
  });

  // post the payload
  test('Posting linktree payload - Success', async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const payload = createPayload(data, pubkey, sign);
    const response = await postPayload(postPath, payload);
    console.log(response.status);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  // get the linktree
  test('get the linktree payload - Success', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = await getPayload(getPath);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();

    // Store response data for further use
    retrievedData = response.data;
  });

  // create a task
  test('create a task - Success', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('******/  IN Linktree Task FUNCTION /******');
    try {
      let keypair = Keypair.generate();
      const proofs_list_object = await getAllProofs(getAllProofPath);

      if (
        Array.isArray(proofs_list_object) &&
        proofs_list_object.data.length === 0
      ) {
        throw new Error('Error submission_value: proofs_list_object is empty');
      }

      // Use the node's keypair to sign the linktree list
      const messageUint8Array = new Uint8Array(
        Buffer.from(JSON.stringify(proofs_list_object.data)),
      );
      const signedMessage = nacl.sign(messageUint8Array, keypair.secretKey);
      const signature = signedMessage.slice(0, nacl.sign.signatureLength);
      const submission_value = {
        proofs: proofs_list_object.data,
        node_publicKey: `${keypair.publicKey}`,
        node_signature: bs58.encode(signature),
      };
      const index = 0;

      await setNodeProofCid(index, `DUMMYCIDS${keypair.publicKey}`);

      arrayofCIDs[index] = `DUMMYCIDS${keypair.publicKey}`;
      setTaskSubmission[`DUMMYCIDS${keypair.publicKey}`] = submission_value;
    } catch (error) {
      console.log('ERROR :::: ', error);
    }
  });

  // fetchSubmission check if we made it or not
  test('generateSubmissionCID', async () => {
    await new Promise(resolve => setTimeout(resolve, 1400));
    console.log('***********generateSubmissionCID**************');
    let proof_cid = await getNodeProofCid(0);
    console.log(proof_cid);
  });

  // audit task calls
  test('audit task calls', async () => {
    await new Promise(resolve => setTimeout(resolve, 1400));
    console.log('================ validateNode ================');
    // Each submission can be validated by replicating the process of creating it
    console.log('Received submission_value', arrayofCIDs[0], 0);
    try {
      console.log('******/ Linktree CID VALIDATION Task FUNCTION /******');
      const outputraw = setTaskSubmission[arrayofCIDs[0]];
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

      console.log('OUTPUT', output);
      console.log('RESPONSE DATA length', output.proofs.length);
      console.log('PUBLIC KEY', output.node_publicKey);
      console.log('SIGNATURE', output.node_signature);

      // Check that the node who submitted the proofs is a valid staked node
      let isNode = await verifyNode(
        output.proofs,
        output.node_signature,
        output.node_publicKey,
      );

      console.log(
        "Is the node's signature on the CID payload correct?",
        isNode,
      );

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
  });

  // delete the linktree
  //   test('delete the linktree payload - Success', async () => {
  //     await new Promise(resolve => setTimeout(resolve, 3000));
  //     console.log(setTaskSubmission);
  //     const response = await deletePayload(deletePath);
  //     expect(response.status).toBe(200);
  //     expect(response.data).toBeDefined();
  //   });
});
