const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const { dbManager } = require('./createCustomDB');
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

// =========================== LINKTREE =============================================
// get with publicKey
const getLinktreeWithPubKey = async pubkey => {
  try {
    const db = await namespaceWrapper.getDb();
    const publicKeys = await db.findOne({
      'linktree.publicKey': pubkey,
    });

    return publicKeys ? publicKeys.linktree : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};
// get with username
const getLinkTreeWithUsername = async username => {
  try {
    const db = await namespaceWrapper.getDb();
    let resp = await db.find({ username });
    if (resp.length > 0) {
      return resp[resp.length - 1].linktree;
    }

    const db4 = await dbManager.getDb4();
    let resp4 = await db4.find({ username });
    if (resp4.length > 0) {
      return resp4[resp4.length - 1].linktree;
    }

    // If no match found in either database, return null
    return null;
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
      return resp[0].linktree;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
};
// get with email Address
// const getLinkTreeWithEmailAddress = async emailAddress => {
//   try {
//     const db = await namespaceWrapper.getDb();
//     const resp = await db.find({
//       'linktree.userEmail': emailAddress,
//     });
//     if (resp.length > 0) {
//       return resp[resp.length - 1].linktree;
//     }

//     const db4 = await dbManager.getDb4();
//     let resp4 = await db4.find({
//       'linktree.userEmail': emailAddress,
//     });
//     if (resp4.length > 0) {
//       return resp4[resp4.length - 1].linktree;
//     }

//     return null;
//   } catch (e) {
//     return null;
//   }
// };
// Get all linktrees from the database
const getAllLinktrees = async () => {
  const db = await namespaceWrapper.getDb();
  const linktreeListRaw = await db.find({
    linktree: { $exists: true },
  });
  let linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
  return linktreeList;
};
// delete linktree
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
const setLinktree = async (publicKey, linktree, databaseName) => {
  try {
    if (!databaseName || databaseName.trim() === '') {
      console.log('database name is empty');
      return undefined;
    }

    const db =
      databaseName === 'pendingProfile'
        ? await dbManager.getDb4()
        : await namespaceWrapper.getDb();

    const linktreeId = getLinktreeId(publicKey);
    const username = linktree.username;
    await db.insert({ linktreeId, linktree, username });
    return console.log('Linktree set');
  } catch (err) {
    return undefined;
  }
};
// update linktree
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

// =========================== LINKTREE PROOF =============================================
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
// Get all proofs from the database
const getAllProofs = async () => {
  const db = await namespaceWrapper.getDb();
  const proofsListRaw = await db.find({
    proofs: { $exists: true },
  });
  let proofsList = proofsListRaw.map(proofsList => proofsList.proofs);
  return proofsList;
};
// Store the proofs object in the database using the public key
const setProofs = async (pubkey, proofs, databaseName) => {
  try {
    if (!databaseName || databaseName.trim() === '') {
      console.log('database name is empty');
      return undefined;
    }

    const db =
      databaseName === 'pendingProfile'
        ? await dbManager.getDb4()
        : await namespaceWrapper.getDb();

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

// ================ NODES PROOF (ROUND or CIDs) FOR LINKTREE =======================================
// Gets the CID associated with a given round of node proofs from the database.
const getNodeProofCid = async round => {
  const db = await namespaceWrapper.getDb();
  const NodeProofsCidId = getNodeProofCidID(round);
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
// Sets the CID associated with a given round of node proofs in the database.
const setNodeProofCid = async (round, cid) => {
  const db = await namespaceWrapper.getDb();
  try {
    const NodeProofsCidId = getNodeProofCidID(round);
    await db.insert({ NodeProofsCidId, cid });
    return console.log('Node CID set');
  } catch (err) {
    return undefined;
  }
};

// =========================== AuthList =============================================
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
const getAllAuthList = async () => {
  const db = await namespaceWrapper.getDb();
  const authListRaw = await db.find({
    authListId: { $exists: true },
  });
  let authList = authListRaw.map(authList => authList.pubkey);
  return authList;
};
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

// =========================== IDS for SPECIFIC FUNCTION =============================================
const getNodeProofCidID = round => {
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

// =========================== ENDORSEMENTS =============================================
// Get the Endorsement from the database
const getEndorsements = async publicKey => {
  try {
    const db = await dbManager.getDb2();
    const endorsementRaw = await db.find({
      endorsement: { $exists: true },
      'endorsement.recipient': publicKey,
    });

    let endorsementList = endorsementRaw.map(
      endorsementItem => endorsementItem.endorsement,
    );
    return endorsementList;
  } catch (error) {
    return error;
  }
};
// get all getAllEndorsement
const getAllEndorsements = async () => {
  try {
    const db = await dbManager.getDb2();
    const endorsementRaw = await db.find({
      endorsement: { $exists: true },
    });

    let endorsementList = endorsementRaw.map(
      endorsementItem => endorsementItem.endorsement,
    );

    return endorsementList;
  } catch (error) {
    return error;
  }
};
// Store an Endorsement or Pending Endorsement in the database using the endorsementId
const setEndorsement = async (endorsementId, endorsement, databaseName) => {
  try {
    if (!databaseName || databaseName.trim() === '') {
      console.log('database name is empty');
      return false;
    }

    const db =
      databaseName === 'pendingEndorsements'
        ? await dbManager.getDb3()
        : await dbManager.getDb2();

    await db.insert({
      endorsementId: `endorsementId:${endorsementId}`,
      endorsement,
    });
    console.log('Endorsement added successfully');
    return true;
  } catch (err) {
    console.error('Error adding endorsement:', err);
    return false;
  }
};
// delete specific endorsement with the endorsementID and nonce and recipient pub key
const deleteEndorsement = async (endorsementID, databaseName) => {
  try {
    if (!databaseName || databaseName.trim() === '') {
      console.log('database name is empty');
      return false;
    }

    const db =
      databaseName === 'pendingEndorsements'
        ? await dbManager.getDb3()
        : await dbManager.getDb2();

    const resp = await db.deleteOne({
      endorsementId: `endorsementId:${endorsementID}`,
    });

    if (resp) {
      return resp.endorsement;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};
// =========================== ENDORSEMENTS PROOFS =============================================
// Get all endorsement proofs from the database
const getAllEndorsementProofs = async () => {
  const db = await dbManager.getDb2();
  const proofsListRaw = await db.find({
    endorsementsProofsId: { $exists: true },
  });
  let proofsList = proofsListRaw.map(proofsList => proofsList.proofs);
  return proofsList;
};
// Get proofs submited by a node given that node's public key and endorsement
const getEndorsementProofs = async endorsementID => {
  const db = await dbManager.getDb2();
  try {
    const resp = await db.findOne({
      endorsementsProofsId: `endorsementId:${endorsementID}`,
    });

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
// Store the proofs object in the database using the endorsementId
const setEndorsementProofs = async (endorsementId, proofs, databaseName) => {
  try {
    if (!databaseName || databaseName.trim() === '') {
      console.log('database name is empty');
      return false;
    }

    const db =
      databaseName === 'pendingEndorsements'
        ? await dbManager.getDb3()
        : await dbManager.getDb2();

    await db.insert({
      endorsementsProofsId: `endorsementId:${endorsementId}`,
      proofs,
    });
    return console.log('Proofs set');
  } catch (err) {
    return undefined;
  }
};
// ================ NODES PROOF (ROUND or CIDs) FOR ENDORSEMENTS =======================================
// Gets the CID associated with a given round of node proofs from the database.
const getNodeProofCidEndorsement = async round => {
  const db = await dbManager.getDb2();
  const NodeProofsCidId = `node_proofs:${round}`;
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
// Gets all CIDs associated with node proofs from the database.
const getAllNodeProofCidsEndorsement = async () => {
  const db = await dbManager.getDb2();
  const NodeproofsListRaw = await db.find({
    cid: { $exists: true },
  });
  let NodeproofsList = NodeproofsListRaw.map(
    NodeproofsList => NodeproofsList.cid,
  );
  return NodeproofsList;
};
// Sets the CID associated with a given round of node proofs in the database.
const setNodeProofCidEndorsement = async (round, cid) => {
  const db = await dbManager.getDb2();
  try {
    const NodeProofsCidId = `node_proofs:${round}`;
    await db.insert({ NodeProofsCidId, cid });
    return console.log('Node CID set');
  } catch (err) {
    return undefined;
  }
};
// =========================== AuthList FOR ENDORSEMENTS =============================================
// Get the AuthList from the database using the public key, if not found return null
const getAuthListEndorsement = async endorsementID => {
  const db = await dbManager.getDb2();
  const authListId = `auth_list:${endorsementID}`;
  try {
    const resp = await db.findOne({ authListId });
    if (resp) {
      return resp.endorsementID;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};
const getAllAuthListEndorsement = async () => {
  const db = await dbManager.getDb2();
  const authListRaw = await db.find({
    authListId: { $exists: true },
  });
  let authList = authListRaw.map(authList => authList.endorsementID);
  return authList;
};
const setAuthListEndorsement = async endorsementID => {
  try {
    const db = await dbManager.getDb2();
    const authListId = `auth_list:${endorsementID}`;

    await db.insert({ authListId, endorsementID });

    return {
      success: true,
      message: 'Auth list endorsementID set successfully',
    };
  } catch (error) {
    return { success: false, error: 'Error setting auth list' };
  }
};

// ******************** CONNECTED WITH THE Moti Scraper Task ******************************
// get all getAllEndorsement
const getAllPendingEndorsement = async () => {
  try {
    const db = await dbManager.getDb3();
    const endorsementRaw = await db.find({
      endorsement: { $exists: true },
    });

    let endorsementList = endorsementRaw.map(
      endorsementItem => endorsementItem.endorsement,
    );

    return endorsementList;
  } catch (error) {
    return error;
  }
};

// get all scraper public key list from the K2
const getScraperPublicKey = async () => {
  try {
    const db = await dbManager.getDb6();
    const scraperPublicKey = await db.find({
      stakingPublicKey: { $exists: true },
    });

    let publicKeyList = scraperPublicKey.map(item => item);

    return publicKeyList;
  } catch (error) {
    return error;
  }
};

// set all scraper public key list from the K2
const setScraperPublicKey = async (getTaskID, stakingPublicKey) => {
  try {
    const db = await dbManager.getDb6();
    await db.insert({
      publicKeyListID: `publicKeyListID:${getTaskID}`,
      stakingPublicKey,
    });
    console.log('stakingPublicKey added successfully');
    return true;
  } catch (err) {
    console.error('Error adding stakingPublicKey:', err);
    return false;
  }
};

// Get all Pending linktree from the database
const getAllPendingLinktree = async () => {
  const db = await dbManager.getDb4();
  const linktreeListRaw = await db.find({
    linktree: { $exists: true },
  });
  let linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
  return linktreeList;
};

module.exports = {
  // linktree
  setLinktree,
  deleteLinktree,
  getAllLinktrees,
  updateLinktree,
  // linktree Proofs
  getProofs,
  setProofs,
  getAllProofs,
  updateProofs,
  // node and node proofs
  getNodeProofCid,
  setNodeProofCid,
  getAllNodeProofCids,
  // auth list
  getAuthList,
  setAuthList,
  getAllAuthList,
  getAuthListId,
  // get linktree with respect to then field
  getLinkTreeWithUsername,
  getLinktreeWithPubKey,
  getLinkTreeWithSignature,
  // getLinkTreeWithEmailAddress,
  // Endorsement
  setEndorsement,
  getEndorsements,
  getAllEndorsements,
  deleteEndorsement,
  setEndorsementProofs,
  getAllEndorsementProofs,
  getEndorsementProofs,
  getNodeProofCidEndorsement,
  getAllNodeProofCidsEndorsement,
  setNodeProofCidEndorsement,
  getAuthListEndorsement,
  getAllAuthListEndorsement,
  setAuthListEndorsement,
  // pending Endorsement
  getAllPendingEndorsement,
  // pending Profiles,
  getAllPendingLinktree,
  // Scraper Public Key
  getScraperPublicKey,
  setScraperPublicKey,
};
