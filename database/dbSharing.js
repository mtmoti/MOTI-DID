const { default: axios } = require('axios');
const db = require('./db_model');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const {
  namespaceWrapper,
  TASK_ID,
  SERVICE_URL,
} = require('@_koii/namespace-wrapper');
const { customFsWriteStream } = require('../helpers/customFunction');
const crypto = require('crypto');

/**
 * @function share
 * @description
 * This function is called when the node is selected to share the linktree with other nodes.
 * It will fetch the linktrees from other nodes and store them locally.
 */
const share = async nodeUrlList => {
  console.time('shareFunction');
  console.log('start dbSharing');
  try {
    if (nodeUrlList.length === 0) {
      console.error('No valid nodes to share data with');
      return;
    }

    const allLinktrees = new Map(
      ((await db.getAllLinktrees()) || []).map(item => [item.data.uuid, item]),
    );

    // get all the data from the all other nodes
    const nodeDataPromises = nodeUrlList.map(async url => {
      try {
        const res = await axios.get(`${url}/task/${TASK_ID}/linktree/list`);
        return res.data;
      } catch (err) {
        console.error(`Error fetching data from ${url}:`, err.message);
        return null;
      }
    });

    const nodeDataResults = await Promise.all(nodeDataPromises);

    // remove all the null values
    const validPayloads = nodeDataResults.filter(data => data !== null);

    const concurrencyLimit = 60;
    const processQueue = async tasks => {
      let index = 0;
      const running = [];

      const enqueueTask = async () => {
        if (index < tasks.length) {
          const currentIndex = index++;
          const task = tasks[currentIndex];
          const promise = task().finally(() =>
            running.splice(running.indexOf(promise), 1),
          );
          running.push(promise);
          await promise;
          await enqueueTask();
        }
      };

      for (let i = 0; i < concurrencyLimit; i++) {
        enqueueTask();
      }

      await Promise.all(running);
    };

    const processPromises = validPayloads.flat().map(value => async () => {
      try {
        const localExisting = allLinktrees.get(value.data.uuid);

        if (
          !localExisting ||
          localExisting.data.timestamp < value.data.timestamp
        ) {
          const isVerified = nacl.sign.detached.verify(
            new TextEncoder().encode(JSON.stringify(value.data)),
            bs58.decode(value.signature),
            bs58.decode(value.publicKey),
          );

          if (!isVerified) {
            console.warn(`Invalid signature for UUID: ${value.data.uuid}`);
            return;
          }

          const proofs = {
            publicKey: value.publicKey,
            signature: value.signature,
          };

          if (localExisting) {
            await db.updateLinktree(value.publicKey, value);
            await db.updateProofs(value.publicKey, proofs);
          } else {
            await db.setLinktree(value.publicKey, value, 'createLinkTree');
            await db.setProofs(value.publicKey, proofs, 'createLinkTree');
          }
        }
      } catch (error) {
        console.error(
          `Error processing UUID: ${value.data.uuid}`,
          error.message,
        );
      }
    });

    await processQueue(processPromises);
  } catch (error) {
    console.error('Error in share function:', error.message);
  }

  console.timeEnd('shareFunction');
};

/**
 * @function shareEndorsement
 * @description
 * This function is called when the node is selected to share the Endorsement with other nodes.
 * It will fetch the Endorsement from other nodes and store them locally.
 */
const shareEndorsement = async nodeUrlList => {
  console.time('shareEndorsement');
  try {
    if (nodeUrlList.length === 0) {
      console.error('No valid nodes to share data with');
      return;
    }

    // fetch local getAllEndorsements
    const allEndorsements = new Map(
      ((await db.getAllEndorsements()) || []).map(item => [
        item.endorsementId,
        item,
      ]),
    );

    // get all the data from the all other nodes
    const nodeDataPromises = nodeUrlList.map(async url => {
      try {
        const res = await axios.get(
          `${url}/task/${TASK_ID}/endorsement/list/all`,
        );
        return res.data;
      } catch (err) {
        console.error(`Error fetching data from ${url}:`, err.message);
        return null;
      }
    });

    const nodeDataResults = await Promise.all(nodeDataPromises);
    // remove all the null values
    const validPayloads = nodeDataResults.filter(data => data !== null);

    const concurrencyLimit = 60;
    const processQueue = async tasks => {
      let index = 0;
      const running = [];
      const enqueueTask = async () => {
        if (index < tasks.length) {
          const currentIndex = index++;
          const task = tasks[currentIndex];
          const promise = task().finally(() =>
            running.splice(running.indexOf(promise), 1),
          );
          running.push(promise);
          await promise;
          await enqueueTask();
        }
      };
      for (let i = 0; i < concurrencyLimit; i++) {
        enqueueTask();
      }

      // Wait for all tasks to finish
      await Promise.all(running);
    };

    const processPromises = validPayloads.flat().map(value => async () => {
      try {
        const localExisting = allEndorsements.get(value.endorsementId);

        if (localExisting === null || localExisting === undefined) {
          // verify the signature
          const payload = nacl.sign.open(
            await namespaceWrapper.bs58Decode(value.signature),
            await namespaceWrapper.bs58Decode(value.issuer),
          );
          // decode it
          const getDecodeSignature = JSON.parse(
            new TextDecoder().decode(payload),
          );
          if (getDecodeSignature.recipient === value.recipient) {
            const proofs = {
              publicKey: value.issuer,
              recipient: value.recipient,
              nonce: value.nonce,
              endorsementId: value.endorsementId,
            };

            await db.setEndorsement(value.endorsementId, value, 'endorsements');
            await db.setEndorsementProofs(
              value.endorsementId,
              proofs,
              'endorsements',
            );
          }
        }
      } catch (e) {
        console.error(
          `Error processing UUID: ${value.endorsementId}`,
          e.message,
        );
      }
    });

    await processQueue(processPromises);
  } catch (error) {
    console.error('Error in share Endorsement:', error.message);
  }
  console.timeEnd('shareEndorsement');
};

/**
 * @function shareImage
 * @description
 * This function is called when the node is selected to share the Images with other nodes.
 * It will fetch the Images from other nodes and store them locally.
 */
const shareImage = async nodeUrlList => {
  console.time('shareImage');
  try {
    if (nodeUrlList.length === 0) {
      console.error('No valid nodes to share data with');
      return;
    }

    // this is for the LinkTree
    const nodeDataLinkTree = nodeUrlList.map(async url => {
      try {
        const res = await axios.get(`${url}/task/${TASK_ID}/linktree/list`);
        const filteredData = res.data.filter(item => {
          const linktree = item?.data?.linktree;
          if (linktree?.koiiImagePath) {
            if (linktree?.image) {
              if (
                linktree?.image.includes('https://ipfs-gateway.koii.live/ipfs/')
              ) {
                return true;
              }
            } else {
              return true;
            }
          }
          return false;
        });
        const result = filteredData.map(item => {
          const linktree = item?.data?.linktree;
          return {
            publicKey: item?.publicKey,
            image: linktree?.image,
            koiiPath: linktree?.koiiImagePath,
            imageHash: linktree?.imageHash,
          };
        });
        return result.length > 0 ? result : null;
      } catch (err) {
        console.error(`Error fetching data from ${url}:`, err.message);
        return null;
      }
    });
    const nodeDataResultsLinkTree = await Promise.all(nodeDataLinkTree);
    const validPayloadsLinkTree = nodeDataResultsLinkTree.filter(
      data => data !== null,
    );
    const getFinalListLinkTree = validPayloadsLinkTree.flat().filter(Boolean);

    // this is for the Endorsement
    const nodeDataEndorsement = nodeUrlList.map(async url => {
      try {
        const res = await axios.get(
          `${url}/task/${TASK_ID}/endorsement/list/all`,
        );
        const seenImages = new Set();
        const cleanedData = res.data.filter(endorsement => {
          if (
            endorsement.meta &&
            endorsement.meta.image &&
            endorsement.meta.koiiImage
          ) {
            const imageKey = `${endorsement.meta.image}-${endorsement.meta.koiiImage}`;
            if (seenImages.has(imageKey)) {
              return false;
            } else {
              seenImages.add(imageKey);
              return true;
            }
          }
          return false;
        });

        const result = cleanedData.map(item => {
          return {
            publicKey: item.issuer,
            image: item.meta.image,
            koiiPath: item.meta.koiiImage,
            imageHash: null,
          };
        });

        return result.length > 0 ? result : null;
      } catch (err) {
        console.error(`Error fetching data from ${url}:`, err.message);
        return null;
      }
    });
    const nodeDataResultsEndorsement = await Promise.all(nodeDataEndorsement);
    const validPayloadsEndorsement = nodeDataResultsEndorsement.filter(
      data => data !== null,
    );
    const getFinalListEndorsement = validPayloadsEndorsement
      .flat()
      .filter(Boolean);

    // combined list for all the images
    const combinedList = [
      ...getFinalListLinkTree,
      ...getFinalListEndorsement,
    ].filter(Boolean);

    const imageRes = await Promise.allSettled(
      combinedList.map(async ({ publicKey, image, koiiPath, imageHash }) => {
        for (const node of nodeUrlList) {
          try {
            const { data } = await axios.get(
              `${node}/task/${TASK_ID}/img/${publicKey}`,
              {
                params: { imagePath: koiiPath },
              },
            );
            if (data) return { data, koiiPath, imageHash };
          } catch (error) {
            return image ? { data: image, koiiPath, imageHash } : null;
          }
        }
      }),
    );
    const finalResults = imageRes.map(result =>
      result.status === 'fulfilled' ? result.value : null,
    );
    let a = 0;
    for (const e of finalResults) {
      try {
        if (e.data.includes('data:image/')) {
          const base64Data = e.data.replace(/^data:image\/[\w.]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const getImageSpecificPath = e.koiiPath.match(/\/img\/(.+)/);
          if (e.imageHash) {
            const hash = crypto
              .createHash('sha256')
              .update(buffer)
              .digest('hex');

            if (e.imageHash === hash) {
              await customFsWriteStream(
                getImageSpecificPath[0],
                buffer,
                '',
                `/${getImageSpecificPath[1]}`,
                false,
                '',
              );
            }
          }

          await customFsWriteStream(
            getImageSpecificPath[0],
            buffer,
            '',
            `/${getImageSpecificPath[1]}`,
            false,
            '',
          );
        } else {
          a++;
        }
      } catch (error) {
        console.log('image is ', e);
      }
    }
    console.log(' =========image error========= ', a);
  } catch (error) {
    console.error('Error in share Images:', error.message);
  }
  console.timeEnd('shareImage');
};

const getNodeUrls = async () => {
  try {
    // get node url from the node list
    const nodeUrlList = await getNodeUrlFromList();

    // get node url from the ip address list
    const ipAddressList = await getNodeUrlFromIPAddressList();

    let finalUrlList;
    // Check if either list is null
    if (nodeUrlList !== null && ipAddressList !== null) {
      finalUrlList = [...new Set([...nodeUrlList, ...ipAddressList])];
    } else {
      if (nodeUrlList !== null) {
        finalUrlList = nodeUrlList;
      } else if (ipAddressList !== null) {
        finalUrlList = ipAddressList;
      } else {
        finalUrlList = [];
      }
    }

    if (finalUrlList.length > 10) {
      finalUrlList = finalUrlList.sort(() => Math.random() - 0.5).slice(0, 10);
    }

    const activeUrls = [];
    for (const url of finalUrlList) {
      const isActive = await isUrlActive(url);
      if (isActive) {
        activeUrls.push(url);
      }
    }

    const results = await Promise.allSettled([
      share(activeUrls),
      shareEndorsement(activeUrls),
      shareImage(activeUrls),
    ]);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Promise ${index + 1} failed:`);
      } else {
        console.log(`Promise ${index + 1} succeeded:`);
      }
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
  }
};

// supporting methods
const getNodeUrlFromList = async () => {
  try {
    const getCurrentUrl =
      !SERVICE_URL || SERVICE_URL == 'undefined'
        ? 'http://localhost:30017'
        : SERVICE_URL;

    // get the node data
    const nodesUrl = `${getCurrentUrl}/nodes/${TASK_ID}`;
    const nodeResponse = await axios.get(nodesUrl);

    // get the main public key
    const getMainPublicKey = await namespaceWrapper.getMainAccountPubkey();
    if (nodeResponse.status !== 200 || !nodeResponse.data) {
      console.error('No valid nodes found or error in fetching nodes');
      return [];
    }

    let nodeUrlList = nodeResponse.data
      .filter(e => e.owner !== getMainPublicKey)
      .map(e => e.data.url);

    if (nodeUrlList.length === 0) {
      return [];
    }

    return nodeUrlList;
  } catch (error) {
    console.log('IN THE getNodeUrlFromList :: ', error);
    return [];
  }
};
const getNodeUrlFromIPAddressList = async () => {
  try {
    // get the task using the task state ID
    const getInfo = await namespaceWrapper.getTaskStateById(TASK_ID, 'KOII', {
      is_submission_required: false,
      is_distribution_required: false,
      is_available_balances_required: false,
      is_stake_list_required: true,
    });

    if (
      getInfo == null ||
      typeof getInfo !== 'object' ||
      Array.isArray(getInfo) ||
      Object.keys(getInfo).length === 0 ||
      !('stake_list' in getInfo) ||
      !('ip_address_list' in getInfo)
    ) {
      console.log('Invalid or missing getInfo object');
      return [];
    }
    const { ip_address_list } = getInfo;

    if (!ip_address_list || Object.keys(ip_address_list).length === 0) {
      return [];
    }

    const getSubmitterAcc = await namespaceWrapper.getSubmitterAccount();
    const getSubmitterAccString = getSubmitterAcc.publicKey.toString();

    if (getSubmitterAccString in ip_address_list) {
      delete ip_address_list[getSubmitterAccString];
    }

    const urls = Object.values(ip_address_list);
    return urls;
  } catch (error) {
    console.error('IN THE getNodeUrlFromIPAddressList :: ', error);
    return [];
  }
};

// check the active url
async function isUrlActive(url) {
  try {
    const response = await axios.get(url);
    return response.status === 200 || response.statusText === 'OK';
  } catch (error) {
    return false;
  }
}

module.exports = { getNodeUrls };
