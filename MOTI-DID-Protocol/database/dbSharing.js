const { SERVICE_URL, TASK_ID } = require('../environment/init');
const { default: axios } = require('axios');
const db = require('./db_model');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { namespaceWrapper } = require('../environment/namespaceWrapper');

/**
 * @function share
 * @description
 * This function is called when the node is selected to share the linktree with other nodes.
 * It will fetch the linktrees from other nodes and store them locally.
 */
const share = async () => {
  console.time('shareFunction');
  try {
    console.log('start dbSharing');

    // find another node
    const nodesUrl = `${SERVICE_URL}/nodes/${TASK_ID}`;

    // check if the node is online
    const res = await axios.get(nodesUrl);

    console.log('res db sharing --: ', res.status);
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
      console.error(SERVICE_URL, ' === ', url);
      if (url === SERVICE_URL) continue;

      // get all linktree
      const res = await axios.get(`${url}/task/${TASK_ID}/linktree/list`);
      if (res.status != 200) {
        console.error('ERROR', res.status);
        continue;
      }

      const payload = res.data;

      if (!payload || payload.length == 0) continue;

      // loop data
      for (let i = 0; i < payload.length; i++) {
        const value = payload[i];

        // Verify the signature
        try {
          let localExistingLinktree = allLinktrees.find(e => {
            return e.data.uuid == value.data.uuid;
          });
          if (localExistingLinktree) {
            // console.log(
            //   localExistingLinktree.data.timestamp,
            //   ' <<<<< ',
            //   value.data.timestamp,
            // );
            if (localExistingLinktree.data.timestamp < value.data.timestamp) {
              console.log('IN THE localExistingLinktree');

              const isVerified = nacl.sign.detached.verify(
                new TextEncoder().encode(JSON.stringify(value.data)),
                bs58.decode(value.signature),
                bs58.decode(value.publicKey),
              );

              if (!isVerified) {
                console.warn(`${url} is not able to verify the signature`);
                continue;
              }

              console.log('[IN DBSHARING] Signature Verified');
              let proofs = {
                publicKey: value.publicKey,
                signature: value.signature,
              };

              try {
                const linktree_data = value.data.linktree;
                const koii_image_path = linktree_data.koiiImagePath;

                if (!koii_image_path) {
                  console.log(
                    `Updating linktree data && ${koii_image_path} is Image not found`,
                  );
                } else {
                  const result = await axios.get(
                    `${url}/task/${TASK_ID}/img/${value.publicKey}`,
                    {
                      params: { imagePath: koii_image_path },
                    },
                  );

                  const base64Data = result.data.replace(
                    /^data:image\/[\w.]+;base64,/,
                    '',
                  );
                  const buffer = Buffer.from(base64Data, 'base64');
                  const getEndorsementImageMatch =
                    koii_image_path.match(/\/img\/(.+)/);
                  const imagePath = getEndorsementImageMatch[0];
                  const fileName = `/${getEndorsementImageMatch[1]}`;

                  console.log(
                    `Update linktree data && ${koii_image_path} Image is found`,
                  );

                  await namespaceWrapper.fsWriteStream(
                    imagePath,
                    buffer,
                    koii_image_path,
                    fileName,
                    false,
                  );
                }
              } catch (error) {
                console.log(
                  `Update linktree data && ${error}: got the error with image`,
                );
              } finally {
                await db.updateLinktree(value.publicKey, value);
                await db.updateProofs(value.publicKey, proofs);
              }
            }
          } else {
            console.log('localExistingLinktree not found');

            const isVerified = nacl.sign.detached.verify(
              new TextEncoder().encode(JSON.stringify(value.data)),
              bs58.decode(value.signature),
              bs58.decode(value.publicKey),
            );

            if (!isVerified) {
              console.warn(`${url} is not able to verify the signature`);
              continue;
            }

            console.log('[IN DBSHARING] Signature Verified');
            let proofs = {
              publicKey: value.publicKey,
              signature: value.signature,
            };

            try {
              const linktree_data = value.data.linktree;
              const koii_image_path = linktree_data.koiiImagePath;

              if (!koii_image_path) {
                console.log(
                  `Adding linktree data && ${koii_image_path}: Image not found`,
                );
              } else {
                const result = await axios.get(
                  `${url}/task/${TASK_ID}/img/${value.publicKey}`,
                  {
                    params: { imagePath: koii_image_path },
                  },
                );

                const base64Data = result.data.replace(
                  /^data:image\/[\w.]+;base64,/,
                  '',
                );
                const buffer = Buffer.from(base64Data, 'base64');
                const getEndorsementImageMatch =
                  koii_image_path.match(/\/img\/(.+)/);
                const imagePath = getEndorsementImageMatch[0];
                const fileName = `/${getEndorsementImageMatch[1]}`;

                console.log(
                  `Adding linktree data && ${koii_image_path}: Image is found`,
                );

                await namespaceWrapper.fsWriteStream(
                  imagePath,
                  buffer,
                  '',
                  fileName,
                  false,
                );
              }
            } catch (error) {
              console.log(
                `Adding linktree data && ${error}: got the error with image`,
              );
            } finally {
              await db.setLinktree(value.publicKey, value);
              await db.setProofs(value.publicKey, proofs);
            }
          }
        } catch (e) {
          console.error('ERROR', e);
        }
      }
    }
  } catch (error) {
    console.error('Something went wrong:', error);
  }
  console.timeEnd('shareFunction');
};

/**
 * @function shareEndorsement
 * @description
 * This function is called when the node is selected to share the Endorsement with other nodes.
 * It will fetch the Endorsement from other nodes and store them locally.
 */
const shareEndorsement = async () => {
  console.time('shareEndorsement');
  try {
    console.log('start dbSharing Endorsement');

    // find another node
    const nodesUrl = `${SERVICE_URL}/nodes/${TASK_ID}`;

    // check if the node is online
    const res = await axios.get(nodesUrl);

    console.log('res db sharing Endorsement --: ', res.status);

    if (res.status != 200) {
      console.error('DB sharing Error Endorsement', res.status);
      return;
    }

    if (!res.data) {
      console.error('DB sharing No valid nodes running Endorsement');
      return;
    }

    let nodeUrlList = res.data.map(e => {
      return e.data.url;
    });

    if (nodeUrlList.length > 3) {
      const shuffledArray = nodeUrlList.sort(() => Math.random() - 0.5);
      nodeUrlList = shuffledArray.slice(0, 3);
    }

    console.log('node List: Endorsement ', nodeUrlList);

    // fetch local getAllEndorsements
    let allEndorsements = await db.getAllEndorsements();
    allEndorsements = allEndorsements || '[]';

    // for each node
    for (let url of nodeUrlList) {
      console.error(SERVICE_URL, ' === ', url);
      if (url === SERVICE_URL) continue;

      // get all endorsement
      const res = await axios.get(
        `${url}/task/${TASK_ID}/endorsement/list/all`,
      );
      if (res.status != 200) {
        console.error('ERROR', res.status);
        continue;
      }
      const payload = res.data;

      if (!payload || payload.length == 0) continue;

      // loop endorsement
      for (let i = 0; i < payload.length; i++) {
        const value = payload[i];

        // Verify the signature
        try {
          let localExistingEndorsement = allEndorsements.find(e => {
            return e.endorsementId == value.endorsementId;
          });
          if (localExistingEndorsement) {
            continue;
          } else {
            console.log('localExistingEndorsement not found');

            // verify the signature
            const payload = nacl.sign.open(
              await namespaceWrapper.bs58Decode(value.signature),
              await namespaceWrapper.bs58Decode(value.issuer),
            );
            // decode it
            const getDecodeSignature = JSON.parse(
              new TextDecoder().decode(payload),
            );

            console.log('[IN DBSHARING] Signature Verified for Endorsement');

            if (getDecodeSignature.recipient === value.recipient) {
              console.log(
                getDecodeSignature.recipient,
                ' :: Verified === recipient :: ',
                value.recipient,
              );

              let proofs = {
                publicKey: value.issuer,
                recipient: value.recipient,
                nonce: value.nonce,
                endorsementId: value.endorsementId,
              };

              try {
                const getEndorsementImage = value.meta.koiiImage;
                if (!getEndorsementImage) {
                  console.log(
                    `ADD setEndorsement data && ${getEndorsementImage} is Image not found`,
                  );
                } else {
                  const result = await axios.get(
                    `${url}/task/${TASK_ID}/img/${value.publicKey}`,
                    {
                      params: { imagePath: getEndorsementImage },
                    },
                  );
                  const base64Data = result.data.replace(
                    /^data:image\/[\w.]+;base64,/,
                    '',
                  );
                  const buffer = Buffer.from(base64Data, 'base64');
                  const getEndorsementImageMatch =
                    getEndorsementImage.match(/\/img\/(.+)/);
                  const imagePath = getEndorsementImageMatch[0];
                  const fileName = `/${getEndorsementImageMatch[1]}`;

                  console.log(
                    `ADD setEndorsement data && ${getEndorsementImage} Image is found`,
                  );
                  await namespaceWrapper.fsWriteStream(
                    imagePath,
                    buffer,
                    '',
                    fileName,
                    false,
                  );
                }
              } catch (error) {
                console.log(
                  `ADD setEndorsement data && ${error}: got the error with image`,
                );
              } finally {
                await db.setEndorsement(value.endorsementId, value);
                await db.setEndorsementProofs(value.endorsementId, proofs);
              }
            } else {
              console.log(
                getDecodeSignature.recipient,
                ' :: NOT Verified === recipient :: ',
                value.recipient,
                '=== WHYYYYYYYY ===',
              );
            }
          }
        } catch (e) {
          console.error('ERROR Endorsement:', e);
        }
      }
    }
  } catch (error) {
    console.error('Something went wrong with Endorsement:', error);
  }

  console.timeEnd('shareEndorsement');
};

module.exports = { share, shareEndorsement };
