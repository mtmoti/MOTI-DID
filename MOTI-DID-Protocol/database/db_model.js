const { namespaceWrapper } = require('../environment/namespaceWrapper');
const { ensureIndex } = require('./ensureIndex');
ensureIndex();

/**
 * @function db_model
 * @description
 * This file contains the functions to interact with the database.
 * The database is used to store the linktree, proofs and authList.
 * The linktree is stored using the public key as the key.
 * The proofs are stored using the public key as the key.
 * The authList is stored using the public key as the key.
 * The node proofs CID is stored using the round number as the key.
 */

// Get a linktree from the database using the public key
const getLinktree = async publicKey => {
  try {
    const db = await namespaceWrapper.getDb();
    const linktreeId = getLinktreeId(publicKey);
    const resp = await db.findOne({ linktreeId });
    return resp ? resp.linktree : null;
  } catch (error) {
    return e;
  }
};

const getLinkTreeWithUsername = async username => {
  console.log({ username });
  const db = await namespaceWrapper.getDb();
  try {
    const resp = await db.find({ username });
    console.log({ resp });
    if (resp.length > 0) {
      return resp[resp.length - 1].linktree;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

// get with signature
const getLinkTreeWithSignature = async signature => {
  const db = await namespaceWrapper.getDb();
  try {
    const resp = await db.find({
      'linktree.signature': signature,
    });
    if (resp[0] != null && resp[0] !== undefined && resp[0] !== '') {
      return resp[0];
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
};

const deleteLinktree = async publicKey => {
  const db = await namespaceWrapper.getDb();
  const linktreeId = getLinktreeId(publicKey);
  try {
    const resp = await db.deleteOne({ linktreeId });
    if (resp) {
      return resp.linktree;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

// Store a linktree in the database using the public key
const setLinktree = async (publicKey, linktree) => {
  const db = await namespaceWrapper.getDb();
  try {
    const linktreeId = getLinktreeId(publicKey);
    const username = linktree.username;
    await db.insert({ linktreeId, linktree, username });
    return console.log('Linktree set');
  } catch (err) {
    return undefined;
  }
};

const updateLinktree = async (publicKey, linktree) => {
  const db = await namespaceWrapper.getDb();
  try {
    const linktreeId = getLinktreeId(publicKey);
    const resp = await db.findOne({ linktreeId });

    // If response is null, meaning linktreeId not found, throw an error
    if (!resp) {
      throw new Error('Linktree not found for the given publicKey');
    }

    const updateLinktree = await db.update(
      { _id: resp._id, linktreeId: linktreeId },
      {
        $set: {
          _id: resp._id,
          linktreeId: linktreeId,
          linktree: linktree,
          username: resp.username,
        },
      },
      {},
      function (err, numReplaced) {
        console.log('replaced---->' + numReplaced);
        db.loadDatabase();
      },
    );

    console.log('updateLinktree:   ', updateLinktree);

    return 'Linktree updated';
  } catch (err) {
    return err;
  }
};

// Get all linktrees from the database
const getAllLinktrees = async () => {
  const db = await namespaceWrapper.getDb();
  const linktreeListRaw = await db.find({
    linktree: { $exists: true },
  });
  console.log('list', linktreeListRaw.length);
  let linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
  console.log('list', linktreeList.length);
  return linktreeList;
};

// Get proofs submited by a node given that node's public key

const getProofs = async pubkey => {
  const db = await namespaceWrapper.getDb();
  const proofsId = getProofsId(pubkey);
  try {
    const resp = await db.findOne({ proofsId });
    if (resp) {
      return resp.proofs;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

// Store the proofs object in the database using the public key
const setProofs = async (pubkey, proofs) => {
  const db = await namespaceWrapper.getDb();
  try {
    const proofsId = getProofsId(pubkey);
    await db.insert({ proofsId, proofs });
    return console.log('Proofs set');
  } catch (err) {
    return undefined;
  }
};

// update the proof
const updateProofs = async (pubkey, newProofs) => {
  const db = await namespaceWrapper.getDb();
  try {
    const proofsId = getProofsId(pubkey);
    const existingProofs = await db.findOne({ proofsId });

    if (!existingProofs) {
      throw new Error('Linktree not found for the given publicKey');
    }

    const updatedProofs = { ...existingProofs.proofs, ...newProofs };
    await db.update({ proofsId }, { $set: { proofs: updatedProofs } });
    return 'Proofs updated';
  } catch (err) {
    return undefined;
  }
};

// Get all proofs from the database
const getAllProofs = async () => {
  const db = await namespaceWrapper.getDb();
  const proofsListRaw = await db.find({
    proofs: { $exists: true },
  });
  let proofsList = proofsListRaw.map(proofsList => proofsList.proofs);
  return proofsList;
};

// Gets the CID associated with a given round of node proofs from the database.

const getNodeProofCid = async round => {
  const db = await namespaceWrapper.getDb();
  const NodeProofsCidId = getNodeProofCidid(round);
  try {
    const resp = await db.findOne({ NodeProofsCidId });
    if (resp) {
      return resp.cid;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

// Sets the CID associated with a given round of node proofs in the database.

const setNodeProofCid = async (round, cid) => {
  const db = await namespaceWrapper.getDb();
  try {
    const NodeProofsCidId = getNodeProofCidid(round);
    await db.insert({ NodeProofsCidId, cid });
    return console.log('Node CID set');
  } catch (err) {
    return undefined;
  }
};

// Gets all CIDs associated with node proofs from the database.

const getAllNodeProofCids = async () => {
  const db = await namespaceWrapper.getDb();
  const NodeproofsListRaw = await db.find({
    cid: { $exists: true },
  });
  let NodeproofsList = NodeproofsListRaw.map(
    NodeproofsList => NodeproofsList.cid,
  );
  return NodeproofsList;
};
const getLinktreeWithPubKey = async pubkey => {
  const db = await namespaceWrapper.getDb();
  const NodeproofsListRaw = await db.findOne({
    'linktree.publicKey': pubkey,
  });

  return NodeproofsListRaw;
};

// Get the AuthList from the database using the public key, if not found return null

const getAuthList = async pubkey => {
  const db = await namespaceWrapper.getDb();
  const authListId = getAuthListId(pubkey);
  try {
    const resp = await db.findOne({ authListId });
    if (resp) {
      return resp.pubkey;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

// const setAuthList = async pubkey => {
//   const db = await namespaceWrapper.getDb();
//   try {
//     const authListId = getAuthListId(pubkey);
//     await db.insert({ authListId, pubkey });
//     return console.log('auth List pubkey set');
//   } catch (err) {
//     return undefined;
//   }
// };
const setAuthList = async pubkey => {
  try {
    const db = await namespaceWrapper.getDb();
    const authListId = getAuthListId(pubkey);

    await db.insert({ authListId, pubkey });

    return { success: true, message: 'Auth list pubkey set successfully' };
  } catch (error) {
    return { success: false, error: 'Error setting auth list' };
  }
};

const getAllAuthList = async () => {
  const db = await namespaceWrapper.getDb();
  const authListRaw = await db.find({
    authListId: { $exists: true },
  });
  let authList = authListRaw.map(authList => authList.pubkey);
  return authList;
};

const getNodeProofCidid = round => {
  return `node_proofs:${round}`;
};

const getLinktreeId = publicKey => {
  return `linktree:${publicKey}`;
};

const getProofsId = pubkey => {
  return `proofs:${pubkey}`;
};

const getAuthListId = pubkey => {
  return `auth_list:${pubkey}`;
};

module.exports = {
  getLinktree,
  setLinktree,
  deleteLinktree,
  getAllLinktrees,
  getProofs,
  setProofs,
  getAllProofs,
  getNodeProofCid,
  setNodeProofCid,
  getAllNodeProofCids,
  getAuthList,
  setAuthList,
  getAllAuthList,
  getAuthListId,
  getLinkTreeWithUsername,
  updateLinktree,
  getLinktreeWithPubKey,
  getLinkTreeWithSignature,
  updateProofs,
};
