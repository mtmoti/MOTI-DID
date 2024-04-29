const { SERVICE_URL, TASK_ID } = require('../environment/init');
const { default: axios } = require('axios');
const db = require('./db_model');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

/**
 * @function share
 * @description
 * This function is called when the node is selected to share the linktree with other nodes.
 * It will fetch the linktrees from other nodes and store them locally.
 */
const share = async () => {
  try {
    console.log('start dbSharing');

    // find another node
    const nodesUrl = `${SERVICE_URL}/nodes/${TASK_ID}`;

    console.log('nodesUrl db sharing --: ', nodesUrl);

    // check if the node is online
    const res = await axios.get(nodesUrl);

    console.log('res db sharing --: ', res);

    if (res.status != 200) {
      console.error('DB sharing Error', res.status);
      return;
    }

    if (!res.data) {
      console.error('DB sharing No valid nodes running');
      return;
    }

    let nodeUrlList = res.data.map(e => {
      return e.data.url;
    });

    if (nodeUrlList.length > 3) {
      const shuffledArray = nodeUrlList.sort(() => Math.random() - 0.5);
      nodeUrlList = shuffledArray.slice(0, 3);
    }

    console.log('node List: ', nodeUrlList);

    // fetch local linktrees
    let allLinktrees = await db.getAllLinktrees();
    allLinktrees = allLinktrees || '[]';

    // for each node, get all linktrees
    for (let url of nodeUrlList) {
      if (url === SERVICE_URL) continue;

      console.error(SERVICE_URL, ' === ', url);

      const res = await axios.get(`${url}/task/${TASK_ID}/linktree/list`);
      if (res.status != 200) {
        console.error('ERROR', res.status);
        continue;
      }
      const payload = res.data;

      if (!payload || payload.length == 0) continue;
      for (let i = 0; i < payload.length; i++) {
        const value = payload[i];

        // Verify the signature
        try {
          let localExistingLinktree = allLinktrees.find(e => {
            return e.data.uuid == value.data.uuid;
          });
          console.log(
            value.data.timestamp,
            '------------ ',
            localExistingLinktree,
          );

          if (localExistingLinktree) {
            console.log(
              localExistingLinktree.data.timestamp,
              ' <<<<< ',
              value.data.timestamp,
            );
            if (localExistingLinktree.data.timestamp < value.data.timestamp) {
              console.log('I AM HERE');

              const isVerified = nacl.sign.detached.verify(
                new TextEncoder().encode(JSON.stringify(value.data)),
                bs58.decode(value.signature),
                bs58.decode(value.publicKey),
              );

              if (!isVerified) {
                console.warn(`${url} is not able to verify the signature`);
                continue;
              } else {
                console.log('[IN DBSHARING] Signature Verified');
              }
              console.log('Updating linktree data');
              let proofs = {
                publicKey: value.publicKey,
                signature: value.signature,
              };
              await db.setLinktree(value.publicKey, value);
              await db.setProofs(value.publicKey, proofs);
            } else {
              console.log('I SHOULD BE HERE ELSEEEEEE');
            }
          } else {
            const isVerified = nacl.sign.detached.verify(
              new TextEncoder().encode(JSON.stringify(value.data)),
              bs58.decode(value.signature),
              bs58.decode(value.publicKey),
            );

            if (!isVerified) {
              console.warn(`${url} is not able to verify the signature`);
              continue;
            } else {
              console.log('[IN DBSHARING] Signature Verified');
            }
            let proofs = {
              publicKey: value.publicKey,
              signature: value.signature,
            };
            await db.setLinktree(value.publicKey, value);
            await db.setProofs(value.publicKey, proofs);
          }
        } catch (e) {
          console.error('ERROR', e);
        }
      }
    }
  } catch (error) {
    console.error('Something went wrong:', error);
  }
};

module.exports = { share };
