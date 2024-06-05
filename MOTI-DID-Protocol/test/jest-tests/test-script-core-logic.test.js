const { v4: uuidv4 } = require('uuid');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const { Keypair } = require('@solana/web3.js');
const controllers = require('../../controllers/controller');
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

// supportive function for the submission and audits
async function verifyLinktrees(proofs_list_object) {
  let allSignaturesValid = true;
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
  await controllers.getAllAuthList({}, res);
  const AuthUserList = res.send.mock.calls[0][0];
  console.log('Authenticated Users List:', AuthUserList);

  for (const proofs of proofs_list_object) {
    console.log(proofs);
    let publicKey = proofs.publicKey;
    let nodeUrlList = ['http://localhost:10000'];
    for (const nodeUrl of nodeUrlList) {
      console.log('cheking linktree on ', nodeUrl);

      // get all linktree in this node
      const res2 = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      await controllers.getLinkTreeWithPublicKey(
        {
          params: {
            publicKey: publicKey,
          },
        },
        res2,
      );

      // get the payload
      const linktree = res2.send.mock.calls[0][0];

      console.log('linktree ::::::::::::::::::: ', linktree);

      //  check if the user's pubkey is on the authlist
      if (AuthUserList.hasOwnProperty(linktree.publicKey)) {
        console.log('User is on the auth list');
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
            const req3 = {
              body: {
                authdata: {
                  pubkey: publicKey,
                },
              },
            };
            const res3 = {
              status: jest.fn().mockReturnThis(),
              send: jest.fn(),
            };
            await controllers.postAuthList(req3, res3);
            console.log('postAuthList ::::: ', res3.send.mock.calls[0][0]);
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
            const req3 = {
              body: {
                authdata: {
                  pubkey: publicKey,
                },
              },
            };
            const res3 = {
              status: jest.fn().mockReturnThis(),
              send: jest.fn(),
            };
            await controllers.postAuthList(req3, res3);
            console.log('postAuthList ::::: ', res3.send.mock.calls[0][0]);
          } else {
            allSignaturesValid = false;
          }
        }
      }
    }
  }

  console.log(
    'allSignaturesValid :::::::SHOULD BE TRUE::::::::::: ',
    allSignaturesValid,
  );
  return allSignaturesValid;
}
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
  // for the pubic ket and signature
  let pubkey;
  let sign;

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
  });

  // post the payload
  test('Posting linktree payload - Success', async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const payload = createPayload(data, pubkey, sign);

    const req = {
      body: {
        payload,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controllers.createLinkTree(req, res);

    const response = res.send.mock.calls[0][0];
    console.log(response);

    // expect(response.status).toBe(200);
    // expect(response.data).toBeDefined();
  });

  // get the linktree
  test('get the linktree payload - Success', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const req = {
      params: {
        publicKey: pubkey,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controllers.getLinkTreeWithPublicKey(req, res);
    const response = res.send.mock.calls[0][0];
    console.log(response);
    // expect(response.status).toBe(200);
    // expect(response.data).toBeDefined();
  });

  // create a task
  test('create a task - Success', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('******/  IN Linktree Task FUNCTION /******');
    try {
      let keypair = Keypair.generate();
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      await controllers.getAllProofs({}, res);

      const response = res.send.mock.calls[0][0];
      console.log(response);

      if (Array.isArray(response) && response.length === 0) {
        throw new Error('Error submission_value: proofs_list_object is empty');
      }

      // Use the node's keypair to sign the linktree list
      const messageUint8Array = new Uint8Array(
        Buffer.from(JSON.stringify(response)),
      );
      const signedMessage = nacl.sign(messageUint8Array, keypair.secretKey);
      const signature = signedMessage.slice(0, nacl.sign.signatureLength);
      const submission_value = {
        proofs: response,
        node_publicKey: `${keypair.publicKey}`,
        node_signature: bs58.encode(signature),
      };
      const index = 0;

      console.log(submission_value);

      const req2 = {
        params: {
          round: 100,
          cid: `DUMMYCIDS${keypair.publicKey}`,
        },
      };
      const res2 = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      await controllers.setNodeProofCid(req2, res2);

      const response2 = res2.send.mock.calls[0][0];
      console.log(response2);

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
    const req = {
      params: {
        round: 100,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    await controllers.nodeProofWithRounds(req, res);
    const response = res.send.mock.calls[0][0];
    console.log(response);
  });

  // audit task calls
  test('audit task calls', async () => {
    await new Promise(resolve => setTimeout(resolve, 1400));
    console.log('================ validateNode ================');
    // Each submission can be validated by replicating the process of creating it
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

  //   // delete the linktree
  //   //   test('delete the linktree payload - Success', async () => {
  //   //     await new Promise(resolve => setTimeout(resolve, 3000));
  //   //     console.log(setTaskSubmission);
  //   //     const response = await deletePayload(deletePath);
  //   //     expect(response.status).toBe(200);
  //   //     expect(response.data).toBeDefined();
  //   //   });
});
