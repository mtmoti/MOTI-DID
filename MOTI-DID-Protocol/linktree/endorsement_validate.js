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
const dataFromCidEndorsement = require('../helpers/dataFromCidEndorsement');

/**
 * @function Endorsement_validate
 * @description
 * This function is called when the node is selected to validate the submission value.
 * It will fetch the Endorsement from other nodes.
 * It will then verify that the node is holding the endorsement and that the signature is valid.
 */
const main = async (submission_value, round) => {
  try {
    console.log('******/ Endorsement CID VALIDATION Task FUNCTION /******');
    const outputraw = await dataFromCidEndorsement(submission_value);
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

    console.log('OUTPUT Endorsement', output);
    console.log('RESPONSE DATA length Endorsement', output.proofs.length);
    console.log('PUBLIC KEY Endorsement', output.node_publicKey);
    console.log('SIGNATURE Endorsement', output.node_signature);

    // Check that the node who submitted the proofs is a valid staked node
    let isNode = await verifyNode(
      output.proofs,
      output.node_signature,
      output.node_publicKey,
    );

    console.log(
      "Is the node's signature on the CID payload correct Endorsement?",
      isNode,
    );

    // check each item in the Endorsements list and verify that the node is holding that payload, and the signature matches
    let isEndorsement;
    if (output.proofs.length > 0) {
      isEndorsement = await verifyEndorsements(output.proofs);
      console.log('IS Endorsement True?', isEndorsement);
    } else {
      console.log('No endorsement found in round', round);
      isEndorsement = true;
    }
    if (isNode && isEndorsement) return true; // if both are true, return true
    else return false; // if one of them is false, return false
  } catch (error) {
    console.log('Endorsement VALIDATE ERROR :::: ', error);
    return false;
  }
};

// verify the endorsement signature by querying the other node to get it's copy of the endorsement
async function verifyEndorsements(proofs_list_object) {
  try {
    console.log('******/ verifyEndorsements START /******');
    let allSignaturesValid = true;
    let AuthUserList = await db.getAllAuthListEndorsement();
    console.log('Authenticated Users List:', AuthUserList);

    for (const proofs of proofs_list_object) {
      let recipient = proofs.recipient;

      // call other nodes to get the node list
      let nodeUrlList;
      if (taskNodeAdministered) {
        const nodesUrl = `${SERVICE_URL}/nodes/${TASK_ID}`;
        const nodesUrlRes = await axios.get(nodesUrl);
        if (nodesUrlRes.status != 200) {
          console.error('verifyEndorsements Error', nodesUrlRes.status);
          continue;
        }
        if (!nodesUrlRes.data) {
          console.error('verifyEndorsements No valid nodes running');
          continue;
        }
        nodeUrlList = nodesUrlRes.data.map(e => {
          return e.data.url;
        });

        console.log('nodeUrlList.length :::: ', nodeUrlList.length);
        if (nodeUrlList.length > 3) {
          const shuffledArray = nodeUrlList.sort(() => Math.random() - 0.5);
          nodeUrlList = shuffledArray.slice(0, 3);
        }
      } else {
        nodeUrlList = ['http://localhost:10000'];
      }

      // verify the signature of the endorsement for each nodes
      for (const nodeUrl of nodeUrlList) {
        console.error(SERVICE_URL, ' = verifyEndorsements = ', nodeUrl);
        if (nodeUrl === SERVICE_URL) continue;

        console.log('checking endorsement on ', nodeUrl);

        let res;
        // get all endorsement in this node
        if (taskNodeAdministered) {
          res = await axios.get(
            `${nodeUrl}/task/${TASK_ID}/endorsement/${recipient}`,
          );
          if (res.status != 200) {
            console.error('ERROR', res.status);
            continue;
          }
        } else {
          res = await db.getEndorsements(recipient);
          if (res.status != 200) {
            console.error('ERROR', res.status);
            continue;
          }
        }

        // get the payload
        const endorsement = res.data;

        if (endorsement.length > 0) {
          endorsement.forEach(async endorsementObj => {
            if (endorsementObj.endorsementId) {
              console.log(endorsementObj.endorsementId);

              let AuthUserListFound =
                AuthUserList &&
                AuthUserList.includes(endorsementObj.endorsementId);

              if (AuthUserListFound) {
                console.log('User is on the auth list endorsement Obj');
              } else {
                // Verify the signature
                const payload = nacl.sign.open(
                  await namespaceWrapper.bs58Decode(endorsementObj.signature),
                  await namespaceWrapper.bs58Decode(endorsementObj.issuer),
                );
                // decode it
                const getDecodeSignature = JSON.parse(
                  new TextDecoder().decode(payload),
                );

                if (getDecodeSignature.recipient === endorsementObj.recipient) {
                  console.log(`hash SIGNATURE endorsementId`, true);
                  await db.setAuthListEndorsement(endorsementObj.endorsementId);
                } else {
                  console.log(`allSignaturesValid = false;`);
                  allSignaturesValid = false;
                }
              }
            } else {
              console.log('endorsementId is not found');
            }
          });
        }
      }
    }

    console.log('******/ verifyEndorsements END /******');
    return allSignaturesValid;
  } catch (error) {
    console.log('ERROR IN FETCHING OR SOMETHING ELSE', error);
    console.log('******/ verifyEndorsements END /******');
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
    console.error('No data received from web3.storage Endorsement');
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
