require('dotenv').config();
const db = require('../database/db_model');
const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { ethers } = require('ethers');
const { Verifier } = require('bip322-js');
const { customFsWriteStream } = require('../helpers/customFunction');

// ========= LINKTREE AND TASK STAKE =========
// take stakes
let taskState = async (req, res) => {
  try {
    const state = await namespaceWrapper.getTaskState();
    if (!state) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(200).json({ taskState: state });
  } catch (error) {
    res.status(500).send({ error: error });
    return;
  }
};
// helper function for the bitcoin
function bytesToBase64(bytes) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}
// create a linktree
let createLinkTree = async (req, res) => {
  try {
    const linktree = req.body.payload;
    if (
      !linktree ||
      !linktree.data ||
      Object.keys(linktree).length === 0 ||
      !linktree.data.uuid ||
      !linktree.data.linktree ||
      !linktree.data.timestamp
    ) {
      res.status(400).json({ error: 'Invalid request, missing data' });
      return;
    }
    if (!linktree.publicKey || !linktree.signature || !linktree.username) {
      res.status(400).json({
        error: 'Missing publicKey or signature or linktree username',
      });
      return;
    }

    // DID signature verification
    try {
      const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(JSON.stringify(linktree.data)),
        bs58.decode(linktree.signature),
        bs58.decode(linktree.publicKey),
      );
      if (!isVerified) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // wallet signature verification
    try {
      if (linktree.data.linktree.myWallets) {
        for (let i = 0; i < linktree.data.linktree.myWallets.length; i++) {
          const wallet = linktree.data.linktree.myWallets[i];
          if (wallet.address && wallet.signature && wallet.key) {
            if (
              wallet.address.length > 0 &&
              wallet.signature.length > 0 &&
              wallet.key.length > 0
            ) {
              const signerAddress = wallet.address;
              const nonce = wallet.key;
              const message = `Welcome to MOTI.BIO!\n\nClick to sign in and accept the MOTI.BIO Terms of Service (https://home.moti.bio/terms) and Privacy Policy (https://home.moti.bio/privacy).\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${signerAddress}\n\nNonce:\n${nonce}`;
              const signature = wallet.signature;

              if (wallet.label === 'Ethereum (ETH)') {
                const recoveredAddress = ethers.utils.verifyMessage(
                  message,
                  signature,
                );

                if (
                  recoveredAddress.toLowerCase() !== signerAddress.toLowerCase()
                ) {
                  return res.status(400).json({
                    error: `Invalid Wallet signature for ${wallet.label}`,
                  });
                }
              } else if (
                wallet.label === 'Solana (SOL)' ||
                wallet.label === 'Koii/K2 (KOII)'
              ) {
                const isVerified = nacl.sign.detached.verify(
                  new TextEncoder().encode(message),
                  bs58.decode(signature),
                  bs58.decode(signerAddress),
                );

                if (!isVerified) {
                  return res.status(400).json({
                    error: `Invalid Wallet signature for ${wallet.label}`,
                  });
                }
              } else if (wallet.label === 'Bitcoin (BTC)') {
                const isValidSignature = Verifier.verifySignature(
                  signerAddress,
                  new TextEncoder().encode(message),
                  bytesToBase64(bs58.decode(signature)),
                );
                if (!isValidSignature) {
                  return res.status(400).json({
                    error: `Invalid Wallet signature for ${wallet.label}`,
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid Wallet signature' });
    }

    // Use the code below to sign the data payload
    let signature = linktree.signature;
    let pubkey = linktree.publicKey;
    let proofs = {
      publicKey: pubkey,
      signature: signature,
    };

    // if user found then dont add user in the db
    const user = await db.getLinkTreeWithUsername(linktree.username);
    if (user) return res.status(406).send({ message: 'Not Acceptable' });

    // public key found then dont add user in the db
    const pubKey = await db.getLinktreeWithPubKey(pubkey);
    if (pubKey)
      return res.status(406).send({ message: 'Public Key Not Acceptable' });

    // if signature is already present then return error, user is already present
    const checkSignature = await db.getLinkTreeWithSignature(signature);
    if (checkSignature)
      return res
        .status(406)
        .send({ message: 'Not Acceptable. Signature is already' });

    // otherwise Add in the db all the info and create the linktree
    await db.setLinktree(pubkey, linktree, 'createLinkTree');
    await db.setProofs(pubkey, proofs, 'createLinkTree');
    return res
      .status(200)
      .send({ message: 'Proof and linktree registered successfully' });
  } catch (e) {
    console.error(e);
  }
};
// get all LinkTrees
let getLinkTrees = async (req, res) => {
  try {
    const linktree = await db.getAllLinktrees(true);
    if (!linktree || linktree.length === 0) {
      return res.status(404).send('No linktrees found');
    }
    return res.status(200).send(linktree);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// delete LinkTrees with public key
let deleteLinkTrees = async (req, res) => {
  try {
    const { publicKey } = req.params;

    if (!publicKey || publicKey === undefined) {
      return res.status(400).send({ message: 'Empty Parameters' });
    }

    await db.deleteLinktree(publicKey);
    return res.status(200).send(publicKey);
  } catch (error) {
    console.error('Error in deleteLinkTrees:', error);
    return res.status(500).send('Internal Server Error');
  }
};
// update the linktree
let updateLinkTree = async (req, res) => {
  try {
    const { publicKey, signature, data } = req.body.payload;
    if (!publicKey || !signature) {
      return res.status(400).json({ error: 'Missing publicKey or signature' });
    }

    try {
      // Verify the signature
      const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(JSON.stringify(data)),
        bs58.decode(signature),
        bs58.decode(publicKey),
      );

      if (!isVerified) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // wallet signature verification
    try {
      if (data.linktree.myWallets) {
        for (let i = 0; i < data.linktree.myWallets.length; i++) {
          const wallet = data.linktree.myWallets[i];
          if (wallet.address && wallet.signature && wallet.key) {
            if (
              wallet.address.length > 0 &&
              wallet.signature.length > 0 &&
              wallet.key.length > 0
            ) {
              const signerAddress = wallet.address;
              const nonce = wallet.key;
              const message = `Welcome to MOTI.BIO!\n\nClick to sign in and accept the MOTI.BIO Terms of Service (https://home.moti.bio/terms) and Privacy Policy (https://home.moti.bio/privacy).\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${signerAddress}\n\nNonce:\n${nonce}`;
              const signature = wallet.signature;

              if (wallet.label === 'Ethereum (ETH)') {
                const recoveredAddress = ethers.utils.verifyMessage(
                  message,
                  signature,
                );

                if (
                  recoveredAddress.toLowerCase() !== signerAddress.toLowerCase()
                ) {
                  return res.status(400).json({
                    error: `Invalid Wallet signature for ${wallet.label}`,
                  });
                }
              } else if (
                wallet.label === 'Solana (SOL)' ||
                wallet.label === 'Koii/K2 (KOII)'
              ) {
                const isVerified = nacl.sign.detached.verify(
                  new TextEncoder().encode(message),
                  bs58.decode(signature),
                  bs58.decode(signerAddress),
                );

                if (!isVerified) {
                  return res.status(400).json({
                    error: `Invalid Wallet signature for ${wallet.label}`,
                  });
                }
              } else if (wallet.label === 'Bitcoin (BTC)') {
                const isValidSignature = Verifier.verifySignature(
                  signerAddress,
                  new TextEncoder().encode(message),
                  bytesToBase64(bs58.decode(signature)),
                );
                if (!isValidSignature) {
                  return res.status(400).json({
                    error: `Invalid Wallet signature for ${wallet.label}`,
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid Wallet signature' });
    }

    // Update linktree and set proofs
    await Promise.all([
      db.updateLinktree(publicKey, req.body.payload),
      db.updateProofs(publicKey, { publicKey, signature }),
    ]);

    return res
      .status(200)
      .json({ message: 'Proof and linktree registered successfully' });
  } catch (error) {
    // Check if the error message indicates Linktree not found
    if (error.message === 'Linktree not found for the given publicKey') {
      return res.status(404).json({ error: 'Linktree not found' });
    }
    return res.status(400).json({ error: 'Invalid signature' });
  }
};
// get LinkTree With PublicKey
let getLinkTreeWithPublicKey = async (req, res) => {
  try {
    const { publicKey } = req.params;
    const linktree = await db.getLinktreeWithPubKey(publicKey);

    if (!linktree) {
      return res.status(404).send('Linktree Not Found');
    }

    return res.status(200).send(linktree);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get LinkTree With username
let getLinkTreeWithUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const linktree = await db.getLinkTreeWithUsername(username);

    if (!linktree) {
      return res.status(404).send('Linktree Not Found');
    }
    return res.status(200).send(linktree);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get with the signature
let getLinkTreeWithSignature = async (req, res) => {
  try {
    const { signature } = req.params;
    const linktree = await db.getLinkTreeWithSignature(signature);

    if (!linktree) {
      return res.status(404).send('Linktree Not Found');
    }
    return res.status(200).send(linktree);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get with the Email
// let getLinkTreeWithEmailAddress = async (req, res) => {
//   try {
//     const { emailAddress } = req.params;
//     const linktree = await db.getLinkTreeWithEmailAddress(emailAddress);

//     if (!linktree) {
//       return res.status(404).send('Linktree Not Found');
//     }
//     return res.status(200).send(linktree);
//   } catch (error) {
//     return res.status(500).send('Internal Server Error');
//   }
// };

// ========= PROOFS AND AUTH AND NODE URL =========
// get all proofs
let getAllProofs = async (req, res) => {
  try {
    const linktree = await db.getAllProofs();
    if (!linktree) {
      return res.status(404).send('Proofs not found');
    }
    return res.status(200).send(linktree);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get proofs with the publicKey
let getProofsWithUsername = async (req, res) => {
  try {
    const { publicKey } = req.params;
    const proof = await db.getProofs(publicKey);
    if (!proof) {
      return res
        .status(404)
        .send('Proofs not found for the provided public key');
    }
    return res.status(200).send(proof);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get all node proof
let nodeProofAll = async (req, res) => {
  try {
    const linktree = await db.getAllNodeProofCids();
    if (!linktree) {
      return res.status(404).send('Node proof CIDs not found');
    }
    return res.status(200).send(linktree);
  } catch (error) {
    console.error('Error in nodeProofAll:', error);
    return res.status(500).send('Internal Server Error');
  }
};
// get node proof with rounds
let nodeProofWithRounds = async (req, res) => {
  try {
    const { round } = req.params;

    if (!round || isNaN(round)) {
      return res.status(400).send({ message: 'Invalid round parameter' });
    }

    const nodeProof = await db.getNodeProofCid(parseInt(round));
    if (!nodeProof) {
      return res
        .status(404)
        .send({ message: 'Node proof CID not found for the provided round' });
    }

    return res.status(200).send(nodeProof);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get node proof with rounds
let setNodeProofCid = async (req, res) => {
  try {
    const { round, cid } = req.params;

    if (!round || isNaN(round)) {
      return res.status(400).send({ message: 'Invalid round parameter' });
    }

    const nodeProof = await db.setNodeProofCid(parseInt(round), cid);
    if (!nodeProof) {
      return res
        .status(404)
        .send({ message: 'Node proof CID not found for the provided round' });
    }

    return res.status(200).send(nodeProof);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get authList with public key
let getAuthListWithPublicKey = async (req, res) => {
  try {
    const { publicKey } = req.params;
    if (!publicKey) {
      return res
        .status(400)
        .send({ message: 'Public key parameter is missing' });
    }

    const authlist = await db.getAuthList(publicKey);
    if (!authlist) {
      return res
        .status(404)
        .send({ message: 'Auth list not found for the provided public key' });
    }

    return res.status(200).send(authlist);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get all authList
let getAllAuthList = async (req, res) => {
  try {
    const authlist = await db.getAllAuthList(false);

    if (!authlist || authlist.length === 0) {
      return res.status(404).send({ message: 'Auth list not found' });
    }

    // Processing each authUser
    authlist.forEach(authuser => {
      authuser = authuser.toString().split('auth_list:')[0];
    });

    return res.status(200).send(authlist);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get the authlist and set the public key
let postAuthList = async (req, res) => {
  try {
    const pubkey = req.body.authdata?.pubkey;
    if (!pubkey) {
      return res.status(400).send('pubkey is missing in the request body');
    }

    const result = await db.setAuthList(pubkey);

    if (result && result.success) {
      return res.status(200).send(result.message);
    } else {
      return res.status(500).send('Failed to set auth list');
    }
  } catch (error) {
    console.error('Error in postAuthList:', error);
    return res.status(500).send('Internal Server Error');
  }
};
// get node url
let getNodeUrl = async (req, res) => {
  try {
    const nodeUrlList = await namespaceWrapper.getNodes();

    if (nodeUrlList.length === 0 || !nodeUrlList) {
      return res.status(404).send({ message: 'Node URLs not found' });
    }

    return res.status(200).send(nodeUrlList);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};

// ******************** get request using the username ******************************
// get my links with respect to the username
let getUsernameLinks = async (req, res) => {
  try {
    const { username } = req.params;

    const linktree = await db.getLinkTreeWithUsername(username);
    if (!linktree) {
      return res.status(404).send('No Username found');
    }

    const links = linktree.data?.linktree?.links;
    if (!links) {
      return res.status(404).json('Links are not found');
    }

    return res.status(200).send(links);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get my socials with respect to the username
let getUsernameMySocial = async (req, res) => {
  try {
    const { username } = req.params;

    const linktree = await db.getLinkTreeWithUsername(username);
    if (!linktree) {
      return res.status(404).send('No Username found');
    }

    const mySocials = linktree.data?.linktree?.mySocials;
    if (!mySocials) {
      return res.status(404).json('My Socials are not found');
    }

    return res.status(200).send(mySocials);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get my wallets with respect to the username
let getUsernameMyWallet = async (req, res) => {
  try {
    const { username } = req.params;

    const linktree = await db.getLinkTreeWithUsername(username);
    if (!linktree) {
      return res.status(404).send('No Username found');
    }

    const myWallets = linktree.data?.linktree?.myWallets;
    if (!myWallets) {
      return res.status(404).json('My Wallets are not found');
    }

    return res.status(200).send(myWallets);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get endorsements with respect to the username
let getUsernameDIDEndorsements = async (req, res) => {
  try {
    const { username } = req.params;

    const linktree = await db.getLinkTreeWithUsername(username);
    if (!linktree) {
      return res.status(404).send('No Username found');
    }

    const getEndorsement = linktree.data?.linktree?.endorsement;
    if (!getEndorsement) {
      return res.status(404).json('My Wallets are not found');
    }

    return res.status(200).send(getEndorsement);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};

// ========= IMAGES =========
// add the image and get the image
let getImage = async (req, res) => {
  try {
    let { imagePath } = req.query;
    imagePath = imagePath.replace(/^['"`]+|['"`]+$/g, '');

    const getImage = await namespaceWrapper.fsReadStream(imagePath);

    // get the extension from the path
    const startIndex = imagePath.lastIndexOf('.');
    const fileExtension = imagePath.slice(startIndex);

    // Convert the data buffer into a Buffer object
    const buffer = Buffer.from(getImage.data);

    // Convert the buffer to Base64
    const base64Image =
      `data:image/${fileExtension};base64,` + buffer.toString('base64');

    if (!getImage) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    res.status(200).json(base64Image);
  } catch (error) {
    res.status(500).send({ error: error });
    return;
  }
};
let postImage = async (req, res) => {
  try {
    const previousImagePath = req.body.previousImagePath;
    const ipfsURL = req.body.ipfsURL;

    // convert image Data into buffer
    const imageData = req.body.imageData;
    const base64Data = imageData.replace(/^data:image\/[\w.]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const matches = imageData.match(/^data:image\/([\w.]+);base64,/);
    if (matches && matches[1]) {
      matches[1] = matches[1].replace('.', '');
    }
    const extension = matches ? matches[1] : null;

    // give me the path and name of the file
    const fileName = `/${req.params.publicKey}.${extension}`;
    const imagePath = `/img/${req.params.publicKey}.${extension}`;

    let getImageObject;

    // checking if the public key is empty
    if (
      req.params.publicKey === '' ||
      req.params.publicKey === null ||
      req.params.publicKey === undefined
    ) {
      if (
        previousImagePath === '' ||
        previousImagePath === null ||
        previousImagePath === undefined
      ) {
        return res.status(400).json({ getImage: null });
      }

      return res.status(400).json({ getImage: null });
    }

    if (
      previousImagePath === '' ||
      previousImagePath === null ||
      previousImagePath === undefined
    ) {
      getImageObject = await customFsWriteStream(
        imagePath,
        buffer,
        '',
        fileName,
        true,
        ipfsURL,
      );
    } else {
      getImageObject = await customFsWriteStream(
        imagePath,
        buffer,
        previousImagePath,
        fileName,
        true,
        ipfsURL,
      );
    }

    return res.status(200).json(getImageObject);
  } catch (error) {
    res.status(500).send({ error: error.message });
    return;
  }
};

// ========= ENDORSEMENT =========
let createEndorsement = async (req, res) => {
  try {
    const { signature, endorsement } = req.body;

    if (endorsement.issuer !== '2WReBevsFugdbdeEDi9fjwL5qRwwj9UVQLjasQ798FCs') {
      return { error: 'Invalid issuer: expected MOTI PUBLIC KEY' };
    }

    if (!signature || !endorsement) {
      return res.status(404).send('One or more required fields are missing.');
    }

    // verify the recipient_public
    const pubKey = await db.getLinktreeWithPubKey(endorsement.recipient);
    if (!pubKey) return res.status(404).send({ message: 'Not Found' });

    // verify the signature
    const hash = await namespaceWrapper.verifySignature(
      signature,
      endorsement.issuer,
    );

    if (hash.error) {
      return res
        .status(404)
        .send({ message: 'Bad request. Invalid signature.' });
    }

    endorsement.signature = signature;

    let proofs = {
      publicKey: endorsement.issuer,
      recipient: endorsement.recipient,
      nonce: endorsement.nonce,
      endorsementId: endorsement.endorsementId,
    };

    // Add in the db all the info and create the linktree
    const getStatus = await db.setEndorsement(
      endorsement.endorsementId,
      endorsement,
      'endorsements',
    );
    await db.setEndorsementProofs(
      endorsement.endorsementId,
      proofs,
      'endorsements',
    );

    if (getStatus === true) {
      res.status(200).send({ message: 'Endorsement added successfully' });
    } else {
      res.status(500).send({ error: 'Failed to add endorsement' });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
    return;
  }
};
let getEndorsement = async (req, res) => {
  try {
    const { publicKey } = req.params;

    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }

    const endorsements = await db.getEndorsements(publicKey);

    res.status(200).json(endorsements);
  } catch (error) {
    res.status(500).send({ error: error });
    return;
  }
};
// get all getAllEndorsement
let getEndorsementList = async (req, res) => {
  try {
    const allEndorsements = await db.getAllEndorsements(true);
    if (!allEndorsements || allEndorsements.length === 0) {
      return res.status(404).send('No endorsement found');
    }
    return res.status(200).send(allEndorsements);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// delete specific endorsement with the endorsementID and nonce and recipient pub key
let deleteEndorsement = async (req, res) => {
  try {
    const { endorsementID } = req.params;

    if (!endorsementID || endorsementID === undefined) {
      return res.status(400).send({ message: 'Empty Parameters' });
    }

    await db.deleteEndorsement(endorsementID, 'endorsements');
    return res.status(200).send({ endorsementID });
  } catch (error) {
    console.error('Error in deleteLinkTrees:', error);
    return res.status(500).send('Internal Server Error');
  }
};
// get all proofs endorsement
let getAllEndorsementProofs = async (req, res) => {
  try {
    const endorsement = await db.getAllEndorsementProofs();
    if (!endorsement) {
      return res.status(404).send('Endorsement Proofs not found');
    }
    return res.status(200).send(endorsement);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get proofs with the endorsementID
let getEndorsementProofsWithPublicKey = async (req, res) => {
  try {
    const { endorsementID } = req.params;
    const proof = await db.getEndorsementProofs(endorsementID);
    if (!proof) {
      return res
        .status(404)
        .send('Proofs not found for the provided endorsementID');
    }
    return res.status(200).send(proof);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get node proof with rounds
let nodeProofWithRoundsEndorsement = async (req, res) => {
  try {
    const { round } = req.params;

    if (!round || isNaN(round)) {
      return res.status(400).send({ message: 'Invalid round parameter' });
    }

    const nodeProof = await db.getNodeProofCidEndorsement(parseInt(round));
    if (!nodeProof) {
      return res
        .status(404)
        .send({ message: 'Node proof CID not found for the provided round' });
    }

    return res.status(200).send(nodeProof);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get all node proof
let nodeProofAllEndorsement = async (req, res) => {
  try {
    const linktree = await db.getAllNodeProofCidsEndorsement();
    if (!linktree) {
      return res.status(404).send('Node proof CIDs not found');
    }
    return res.status(200).send(linktree);
  } catch (error) {
    console.error('Error in nodeProofAll:', error);
    return res.status(500).send('Internal Server Error');
  }
};
// get authList with public key
let getAuthListEndorsementWithPublicKey = async (req, res) => {
  try {
    const { endorsementID } = req.params;
    if (!endorsementID) {
      return res
        .status(400)
        .send({ message: 'Endorsement ID parameter is missing' });
    }

    const authlist = await db.getAuthListEndorsement(endorsementID);
    if (!authlist) {
      return res
        .status(404)
        .send({ message: 'Auth list not found for the provided public key' });
    }

    return res.status(200).send(authlist);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get all authList
let getAllAuthListEndorsement = async (req, res) => {
  try {
    const authlist = await db.getAllAuthListEndorsement(false);

    if (!authlist || authlist.length === 0) {
      return res.status(404).send({ message: 'Auth list not found' });
    }

    // Processing each authUser
    authlist.forEach(authuser => {
      authuser = authuser.toString().split('auth_list:')[0];
    });

    return res.status(200).send(authlist);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// get the authlist and set the public key
let postAuthListEndorsement = async (req, res) => {
  try {
    const endorsementID = req.body.authdata?.endorsementID;
    if (!endorsementID) {
      return res
        .status(400)
        .send('endorsementID is missing in the request body');
    }

    const result = await db.setAuthListEndorsement(endorsementID);

    if (result && result.success) {
      return res.status(200).send(result.message);
    } else {
      return res.status(500).send('Failed to set auth list');
    }
  } catch (error) {
    console.error('Error in postAuthList:', error);
    return res.status(500).send('Internal Server Error');
  }
};

// ******************** CONNECTED WITH THE Moti Scraper Task ******************************
let createPendingEndorsement = async (req, res) => {
  try {
    const { signature, endorsement } = req.body;

    if (!signature || !endorsement) {
      return res.status(404).send('One or more required fields are missing.');
    }

    // verify the signature
    const hash = await namespaceWrapper.verifySignature(
      signature,
      endorsement.issuer,
    );

    if (hash.error) {
      return res
        .status(404)
        .send({ message: 'Bad request. Invalid signature.' });
    }

    endorsement.signature = signature;

    // const rateLimitMap = new Map();
    // const RATE_LIMIT = 100;
    // const INTERVAL = 60 * 1000;

    // need to figure this out about the ipAddressList
    // const rateLimitExceededIps = [];
    // for (const ip of Object.keys(ipAddressList)) {
    //   if (!rateLimitMap.has(ip)) {
    //     rateLimitMap.set(ip, { count: 1, startTime: Date.now() });
    //   } else {
    //     const rateInfo = rateLimitMap.get(ip);
    //     const currentTime = Date.now();
    //     if (currentTime - rateInfo.startTime > INTERVAL) {
    //       // Reset rate limit info if interval has passed
    //       rateInfo.count = 1;
    //       rateInfo.startTime = currentTime;
    //     } else {
    //       rateInfo.count += 1;
    //       if (rateInfo.count > RATE_LIMIT) {
    //         rateLimitExceededIps.push(ip);
    //       }
    //     }
    //     rateLimitMap.set(ip, rateInfo);
    //   }
    // }

    let proofs = {
      publicKey: endorsement.issuer,
      recipient: endorsement.recipient,
      nonce: endorsement.nonce,
      endorsementId: endorsement.endorsementId,
    };

    // Add in the db all the info and create the linktree
    const getStatus = await db.setEndorsement(
      endorsement.endorsementId,
      endorsement,
      'pendingEndorsements',
    );
    await db.setEndorsementProofs(
      endorsement.endorsementId,
      proofs,
      'pendingEndorsements',
    );

    if (getStatus === true) {
      res.status(200).send({ message: 'Endorsement added successfully' });
    } else {
      res.status(500).send({ error: 'Failed to add endorsement' });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
    return;
  }
};
// get all Pending Endorsement List
let getAllPendingEndorsementList = async (req, res) => {
  try {
    const allEndorsements = await db.getAllPendingEndorsement(true);
    if (!allEndorsements || allEndorsements.length === 0) {
      return res.status(404).send('No endorsement found');
    }
    return res.status(200).send(allEndorsements);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};
// delete specific endorsement with the endorsementID and nonce and recipient pub key
let deletePendingEndorsement = async (req, res) => {
  try {
    const { endorsementID } = req.params;

    if (!endorsementID || endorsementID === undefined) {
      return res.status(400).send({ message: 'Empty Parameters' });
    }

    await db.deleteEndorsement(endorsementID, 'pendingEndorsements');
    return res.status(200).send({ endorsementID });
  } catch (error) {
    console.error('Error in deleteLinkTrees:', error);
    return res.status(500).send('Internal Server Error');
  }
};
// let getAllScraperPublicKey = async (req, res) => {
//   try {
//     const getAllScraperPublicKey = await db.getScraperPublicKey(true);
//     if (!getAllScraperPublicKey || getAllScraperPublicKey.length === 0) {
//       return res.status(404).send('No Scraper Public Key found');
//     }
//     return res.status(200).send(getAllScraperPublicKey);
//   } catch (error) {
//     return res.status(500).send('Internal Server Error');
//   }
// };
let createPendingProfile = async (req, res) => {
  const linktree = req.body.payload;
  try {
    linktree.data.timestamp = Math.floor(Date.now() / 1000);

    if (
      !linktree ||
      !linktree.data ||
      Object.keys(linktree).length === 0 ||
      !linktree.data.linktree ||
      !linktree.data.timestamp
    ) {
      res.status(400).json({ error: 'Invalid request, missing data' });
      return;
    }

    const hasNonEmptyRedirectUrl = linktree.data.linktree.links.some(
      link => link.redirectUrl.trim() !== '',
    );
    const hasNonEmptyContent = linktree.data.linktree.mySocials.some(
      social => social.content.trim() !== '',
    );
    const hasNonEmptyAddress = linktree.data.linktree.myWallets.some(
      wallet => wallet.address.trim() !== '',
    );
    const allFieldsEmpty =
      !hasNonEmptyRedirectUrl &&
      !hasNonEmptyContent &&
      !hasNonEmptyAddress &&
      !linktree.data.linktree.name &&
      !linktree.data.linktree.description;

    if (allFieldsEmpty) {
      return res.status(400).json({
        success: false,
        message: `All fields are empty. At least one field must be non-empty.`,
      });
    }

    const expectedSocialLabels = [
      'X (Twitter)',
      'Instagram',
      'Facebook',
      'LinkedIn',
      'Telegram',
      'WhatsApp',
      'Email',
    ];
    const expectedWalletLabels = [
      'Bitcoin (BTC)',
      'Ethereum (ETH)',
      'Solana (SOL)',
      'Koii/K2 (KOII)',
      'Polygon (MATIC)',
      'TRON (TRX)',
      'Arbitrum (ARB)',
    ];

    // Ensure all expected social labels are present
    for (let label of expectedSocialLabels) {
      if (
        !linktree.data.linktree.mySocials.some(social => social.label === label)
      ) {
        return res.status(400).json({
          success: false,
          message: `Missing field in mySocials: ${label}`,
        });
      }
    }
    // Ensure all expected wallet labels are present
    for (let label of expectedWalletLabels) {
      if (
        !linktree.data.linktree.myWallets.some(wallet => wallet.label === label)
      ) {
        return res.status(400).json({
          success: false,
          message: `Missing field in myWallets: ${label}`,
        });
      }
    }

    // check for the custom links
    const getCustomLinks = linktree.data.linktree.links;
    if (!Array.isArray(getCustomLinks) || getCustomLinks.length === 0) {
      return {
        success: false,
        message: 'Links array is empty or not an array.',
      };
    }
    for (let i = 0; i < getCustomLinks.length; i++) {
      const link = getCustomLinks[i];

      const allowedKeys = ['label', 'redirectUrl'];
      const extraKeys = Object.keys(link).filter(
        key => !allowedKeys.includes(key),
      );

      if (extraKeys.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Extra keys found in link: ${extraKeys.join(', ')}`,
        });
      }

      if (typeof link.label !== 'string' || link.label.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Label is empty or not a string.',
        });
      }

      if (typeof link.redirectUrl !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Redirect URL is not a string.',
        });
      }

      // Check and update isFavorite property
      if (i === 0) {
        link.isFavorite = true;
      } else {
        link.isFavorite = false;
      }
    }

    // check for the mySocial from pending Profiles
    const getAllPendingProfiles = await db.getAllPendingLinktree();
    const getMyScoials = linktree.data.linktree.mySocials;
    const getMyWallets = linktree.data.linktree.myWallets;
    const getUserEmail = linktree.userEmail;
    if (getAllPendingProfiles.length > 0) {
      for (let linktree of getAllPendingProfiles) {
        const getMySocialsFromDb = linktree.data.linktree.mySocials;
        if (getMySocialsFromDb && getMySocialsFromDb.length > 0) {
          for (let social of getMyScoials) {
            if (social.content) {
              const matchingSocial = getMySocialsFromDb.find(
                s => s.label === social.label,
              );

              if (matchingSocial && matchingSocial.content === social.content) {
                if (
                  social.content.trim() !== '' &&
                  matchingSocial.content.trim() !== ''
                ) {
                  return res.status(400).json({
                    success: false,
                    message: `Content matches and is not empty for label: ${social.label}`,
                  });
                }
              }
            }
          }
        }

        const getMyWalletsFromDb = linktree.data.linktree.myWallets;
        if (getMyWalletsFromDb && getMyWalletsFromDb.length > 0) {
          for (let wallets of getMyWallets) {
            if (wallets.address) {
              const matchingSocial = getMyWalletsFromDb.find(
                s => s.label === wallets.label,
              );

              if (
                matchingSocial &&
                matchingSocial.address === wallets.address
              ) {
                if (
                  wallets.address.trim() !== '' &&
                  matchingSocial.address.trim() !== ''
                ) {
                  return res.status(400).json({
                    success: false,
                    message: `Content matches and is not empty for label: ${wallets.label}`,
                  });
                }
              }
            }
          }
        }

        // check the user email if exist or not if exist throw error
        if (linktree.userEmail) {
          const getUserEmailFromDb = linktree.userEmail;
          if (
            getUserEmailFromDb === getUserEmail &&
            getUserEmail.trim() !== '' &&
            getUserEmailFromDb.trim() !== ''
          ) {
            return res.status(400).json({
              success: false,
              message: `User Email Already Exist: ${getUserEmail}`,
            });
          }
        }
      }
    }

    // check for the mySocial from DID
    const getAllFromDID = await db.getAllLinktrees();
    if (getAllFromDID.length > 0) {
      for (let linktree of getAllFromDID) {
        // check if the any value from the socials match or not
        const getMySocialsFromDb = linktree.data.linktree.mySocials;
        if (getMySocialsFromDb && getMySocialsFromDb.length > 0) {
          for (let social of getMyScoials) {
            if (social.content) {
              const matchingSocial = getMySocialsFromDb.find(
                s => s.label === social.label,
              );

              if (matchingSocial && matchingSocial.content === social.content) {
                if (
                  social.content.trim() !== '' &&
                  matchingSocial.content.trim() !== ''
                ) {
                  return res.status(400).json({
                    success: false,
                    message: `Content matches and is not empty for label: ${social.label}`,
                  });
                }
              }
            }
          }
        }

        // check if any of wallets match or not
        const getMyWalletsFromDb = linktree.data.linktree.myWallets;
        if (getMyWalletsFromDb && getMyWalletsFromDb.length > 0) {
          for (let wallets of getMyWallets) {
            if (wallets.address) {
              const matchingSocial = getMyWalletsFromDb.find(
                s => s.label === wallets.label,
              );

              if (
                matchingSocial &&
                matchingSocial.address === wallets.address
              ) {
                if (
                  wallets.address.trim() !== '' &&
                  matchingSocial.address.trim() !== ''
                ) {
                  return res.status(400).json({
                    success: false,
                    message: `Content matches and is not empty for label: ${wallets.label}`,
                  });
                }
              }
            }
          }
        }

        // check the user email if exist or not if exist throw error
        if (linktree.userEmail) {
          const getUserEmailFromDb = linktree.userEmail;
          if (
            getUserEmailFromDb === getUserEmail &&
            getUserEmail.trim() !== '' &&
            getUserEmailFromDb.trim() !== ''
          ) {
            return res.status(400).json({
              success: false,
              message: `User Email Already Exist: ${getUserEmail}`,
            });
          }
        }
      }
    }

    let proofs = {
      publicKey: linktree.userEmail,
    };

    // otherwise Add in the db all the info and create the linktree
    await db.setLinktree(linktree.userEmail, linktree, 'pendingProfile');
    await db.setProofs(linktree.userEmail, proofs, 'pendingProfile');
    return res
      .status(200)
      .send({ message: 'Proof and linktree registered successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
};
let getPendingProfile = async (req, res) => {
  try {
    const linktree = await db.getAllPendingLinktree(true);
    if (!linktree || linktree.length === 0) {
      return res.status(404).send({ message: 'No Pending Profile found' });
    }
    return res.status(200).send(linktree);
  } catch (error) {
    return res.status(500).send({ message: 'Internal Server Error' });
  }
};
let getAllScraperPublicKey = async (req, res) => {
  try {
    const getAllScraperPublicKey = await db.getScraperPublicKey(true);
    if (!getAllScraperPublicKey || getAllScraperPublicKey.length === 0) {
      return res.status(404).send('No Scraper Public Key found');
    }
    return res.status(200).send(getAllScraperPublicKey);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};

let verifyTelegram = async (req, res) => {
  const BOT_TOKEN = process.env.MOTI_BOT_TOKEN_TELEGRAM;
  const data = req.body;

  console.log('data :::', data);

  if (!data.id || !data.username || !data.auth_date || !data.hash) {
    return res.status(400).send('Missing required data');
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > 60) {
    return res.status(403).send('Verification expired');
  }

  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  if (hash !== data.hash) {
    return res.status(403).send('Verification failed');
  }

  res.status(200).json({ username: data.username });

  // const jwt = require('jsonwebtoken');
  // const rateLimit = require('express-rate-limit');
  // const JWT_SECRET = 'YOUR_JWT_SECRET'; // Replace with your JWT secret key
  // const authLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000,
  //   max: 100,
  //   message: 'Too many requests from this IP, please try again later',
  // });
  // app.use('/auth/telegram', authLimiter);
  // -------------------------------------------------
  // const token = jwt.sign(
  //   {
  //     id: data.id,
  //     username: data.username,
  //   },
  //   JWT_SECRET,
  //   { expiresIn: '1h' },
  // );

  // Send token and username to frontend or handle as needed
  // res.status(200).json({ token, username: data.username });
};

module.exports = {
  taskState,
  // linktree
  createLinkTree,
  getLinkTrees,
  deleteLinkTrees,
  updateLinkTree,
  // get linktree with respect to specific inputs
  getLinkTreeWithPublicKey,
  getLinkTreeWithUsername,
  getLinkTreeWithSignature,
  // getLinkTreeWithEmailAddress,
  getUsernameLinks,
  getUsernameMySocial,
  getUsernameMyWallet,
  getUsernameDIDEndorsements,
  // proofs
  getAllProofs,
  getProofsWithUsername,
  // auth lists
  getAuthListWithPublicKey,
  getAllAuthList,
  postAuthList,
  // node urls
  getNodeUrl,
  nodeProofAll,
  nodeProofWithRounds,
  setNodeProofCid,
  // Images
  getImage,
  postImage,
  // Endorsement
  createEndorsement,
  getEndorsement,
  getEndorsementList,
  deleteEndorsement,
  getAllEndorsementProofs,
  getEndorsementProofsWithPublicKey,
  nodeProofWithRoundsEndorsement,
  nodeProofAllEndorsement,
  getAuthListEndorsementWithPublicKey,
  getAllAuthListEndorsement,
  postAuthListEndorsement,
  // pending Endorsement
  createPendingEndorsement,
  getAllPendingEndorsementList,
  deletePendingEndorsement,
  // pending Profiles
  createPendingProfile,
  getPendingProfile,
  // Scraper Public Key
  getAllScraperPublicKey,
  // verify telegram
  verifyTelegram,
};
