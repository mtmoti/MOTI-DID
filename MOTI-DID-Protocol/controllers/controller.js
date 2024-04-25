const db = require('../database/db_model');
const { namespaceWrapper } = require('../environment/namespaceWrapper');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

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

// create a linktree
let createLinkTree = async (req, res) => {
  const linktree = req.body.payload;
  try {
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

    // Verify the signature
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
      res.status(400).json({ error: 'Invalid signature' });
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
    if (pubKey) return res.status(406).send({ message: 'Not Acceptable' });

    // if signature is already present then return error, user is already present
    const checkSignature = await db.getLinkTreeWithSignature(signature);
    if (checkSignature)
      return res
        .status(406)
        .send({ message: 'Not Acceptable. Signature is already' });

    // otherwise Add in the db all the info and create the linktree
    await db.setLinktree(pubkey, linktree);
    await db.setProofs(pubkey, proofs);
    return res
      .status(200)
      .send({ message: 'Proof and linktree registered successfully' });
  } catch (e) {
    console.log(e);
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
    const linktree = await db.getLinktree(publicKey);

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
  //TODO Interprete the authdata value and set the authlist
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

// add the image and get the image
let getImage = async (req, res) => {
  try {
    const { imagePath } = req.query;

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
    const imageData = req.body.imageData;
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const matches = imageData.match(/^data:image\/(\w+);base64,/);
    const extension = matches ? matches[1] : null;
    const fileName = `/img/${req.body.cid}.${extension}`;

    let imagePath;
    if (
      req.body.cid === '' ||
      req.body.cid === null ||
      req.body.cid === undefined
    ) {
      if (
        previousImagePath === '' ||
        previousImagePath === null ||
        previousImagePath === undefined
      ) {
        return res.status(200).json({ getImage: null });
      }

      return res.status(200).json({ getImage: previousImagePath });
    }

    if (
      previousImagePath === '' ||
      previousImagePath === null ||
      previousImagePath === undefined
    ) {
      imagePath = await namespaceWrapper.fsWriteStream(fileName, buffer, '');
    } else {
      imagePath = await namespaceWrapper.fsWriteStream(
        fileName,
        buffer,
        previousImagePath,
      );
    }

    return res.status(200).json({ getImage: imagePath });
  } catch (error) {
    res.status(500).send({ error: error.message });
    return;
  }
};

module.exports = {
  taskState,
  createLinkTree,
  getLinkTrees,
  deleteLinkTrees,
  updateLinkTree,
  getLinkTreeWithPublicKey,
  getLinkTreeWithUsername,
  getAllProofs,
  getProofsWithUsername,
  nodeProofAll,
  nodeProofWithRounds,
  getAuthListWithPublicKey,
  getAllAuthList,
  postAuthList,
  getNodeUrl,
  getLinkTreeWithSignature,
  getImage,
  postImage,
};
