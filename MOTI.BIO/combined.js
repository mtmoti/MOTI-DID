/* File: dbSharing.js */
const { SERVICE_URL, TASK_ID } = require("../environment/init");
const { default: axios } = require("axios");
const db = require("./db_model");
const nacl = require("tweetnacl");
const bs58 = require("bs58");

//
//
//

/**
 * @function share
 * @description
 * This function is called when the node is selected to share the linktree with other nodes.
 * It will fetch the linktrees from other nodes and store them locally.
 */
const share = async () => {
  try {
    // console.log('start dbSharing');

    // find another node
    const nodesUrl = `${SERVICE_URL}/nodes/${TASK_ID}`;

    // check if the node is online
    const res = await axios.get(nodesUrl);
    if (res.status != 200) {
      console.error("Error", res.status);
      return;
    }

    if (!res.data) {
      console.error("No valid nodes running");
      return;
    }

    let nodeUrlList = res.data.map((e) => {
      return e.data.url;
    });

    // console.log('node List: ', nodeUrlList);

    // fetch local linktrees
    let allLinktrees = await db.getAllLinktrees();
    allLinktrees = allLinktrees || "[]";

    // for each node, get all linktrees
    for (let url of nodeUrlList) {
      // console.log(url);
      const res = await axios.get(`${url}/task/${TASK_ID}/linktree/list`);
      if (res.status != 200) {
        console.error("ERROR", res.status);
        continue;
      }
      const payload = res.data;

      if (!payload || payload.length == 0) continue;
      for (let i = 0; i < payload.length; i++) {
        const value = payload[i];
        // Verify the signature
        try {
          const isVerified = nacl.sign.detached.verify(
            new TextEncoder().encode(JSON.stringify(value.data)),
            bs58.decode(value.signature),
            bs58.decode(value.publicKey)
          );

          if (!isVerified) {
            console.warn(`${url} is not able to verify the signature`);
            continue;
          } else {
            console.log("[IN DBSHARING] Signature Verified");
          }

          let localExistingLinktree = allLinktrees.find((e) => {
            return e.uuid == value.data.uuid;
          });
          if (localExistingLinktree) {
            if (localExistingLinktree.data.timestamp < value.data.timestamp) {
              console.log("Updating linktree data");
              let proofs = {
                publicKey: value.publicKey,
                signature: value.signature,
              };
              await db.setLinktree(value.publicKey, value);
              await db.setProofs(value.publicKey, proofs);
            }
          } else {
            console.log("Linktree data already updated");
          }
        } catch (e) {
          console.error("ERROR", e);
        }
      }
    }
  } catch (error) {
    console.error("Something went wrong:", error);
  }
};

module.exports = { share };

/* File: db_model.js */
const { namespaceWrapper } = require("../environment/namespaceWrapper");
const { ensureIndex } = require("./ensureIndex");
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

const getLinktree = async (publicKey) => {
  const db = await namespaceWrapper.getDb();
  const linktreeId = getLinktreeId(publicKey);
  try {
    const resp = await db.findOne({ linktreeId });
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

const getLinktreeWithUsername = async (username) => {
  const db = await namespaceWrapper.getDb();
  try {
    const resp = await db.findOne({ username });
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

const deleteLinktree = async (publicKey) => {
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
    return console.log("Linktree set");
  } catch (err) {
    return undefined;
  }
};

const updateLinktree = async (publicKey, linktree) => {
  const db = await namespaceWrapper.getDb();
  try {
    const linktreeId = getLinktreeId(publicKey);
    const resp = await db.findOne({ linktreeId });
    const username = resp.username;
    db.update(
      { _id: resp._id, linktreeId },
      { $set: { linktreeId, linktree, username } },
      {}, // this argument was missing
      function (err, numReplaced) {
        // console.log('replaced---->' + numReplaced);

        db.loadDatabase();
      }
    );
    return console.log("Linktree set");
  } catch (err) {
    return undefined;
  }
};

// Get all linktrees from the database

const getAllLinktrees = async () => {
  const db = await namespaceWrapper.getDb();
  const linktreeListRaw = await db.find({
    linktree: { $exists: true },
  });
  let linktreeList = linktreeListRaw.map(
    (linktreeList) => linktreeList.linktree
  );
  return linktreeList;
};

// Get proofs submited by a node given that node's public key

const getProofs = async (pubkey) => {
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
    const result = await db.insert({ proofsId, proofs });
    // console.log('Proofs set', result);
    return console.log("Proofs set");
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
  let proofsList = proofsListRaw.map((proofsList) => proofsList.proofs);
  return proofsList;
};

// Gets the CID associated with a given round of node proofs from the database.

const getNodeProofCid = async (round) => {
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
    return console.log("Node CID set");
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
    (NodeproofsList) => NodeproofsList.cid
  );
  return NodeproofsList;
};

// Get the AuthList from the database using the public key, if not found return null

const getAuthList = async (pubkey) => {
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

const setAuthList = async (pubkey) => {
  const db = await namespaceWrapper.getDb();
  try {
    const authListId = getAuthListId(pubkey);

    await db.insert({ authListId, pubkey });

    return console.log("auth List pubkey set");
  } catch (err) {
    return undefined;
  }
};

const getAllAuthList = async () => {
  const db = await namespaceWrapper.getDb();
  const authListRaw = await db.find({
    authListId: { $exists: true },
  });
  let authList = authListRaw.map((authList) => authList.pubkey);
  return authList;
};

const getNodeProofCidid = (round) => {
  return `node_proofs:${round}`;
};

const getLinktreeId = (publicKey) => {
  return `linktree:${publicKey}`;
};

const getProofsId = (pubkey) => {
  return `proofs:${pubkey}`;
};

const getAuthListId = (pubkey) => {
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
  getLinktreeWithUsername,
  updateLinktree,
};

/* File: ensureIndex.js */
const { namespaceWrapper } = require("../environment/namespaceWrapper");

/**
 * @function ensureIndex
 * @description
 * This function ensures that the database has the correct indexes for the task.
 * It is called when the task is instantiated.
 * This function will make sure that the field has the unique property, and that the field is sparse.
 */

async function ensureIndex() {
  const db = await namespaceWrapper.getDb();
  db.ensureIndex({ fieldName: "linktreeId", sparse: true }, function (err) {
    if (err) console.error("Index creation error:", err);
  });
  db.ensureIndex({ fieldName: "proofsId", sparse: true }, function (err) {
    if (err) console.error("Index creation error:", err);
  });
  db.ensureIndex(
    { fieldName: "NodeProofsCidId", unique: true, sparse: true },
    function (err) {
      if (err) console.error("Index creation error:", err);
    }
  );
  db.ensureIndex(
    { fieldName: "authListId", unique: true, sparse: true },
    function (err) {
      if (err) console.error("Index creation error:", err);
    }
  );
}

module.exports = { ensureIndex };
/* File: routes.js */
const express = require("express");
const router = express.Router();
const db = require("./db_model");
const fs = require("fs");
const cors = require("cors");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const { namespaceWrapper } = require("../environment/namespaceWrapper");

router.use(cors());

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

router.get("/taskState", async (req, res) => {
  const state = await namespaceWrapper.getTaskState();
  // console.log('TASK STATE', state);

  res.status(200).json({ taskState: state });
});

// API to register the linktree
router.post("/linktree", async (req, res) => {
  const linktree = req.body.payload;

  // Check data
  try {
    // Check req.body
    if (!linktree) {
      res.status(400).json({ error: "Invalid request, missing data" });
      return;
    } else if (
      !linktree.data.uuid ||
      !linktree.data.linktree ||
      !linktree.data.timestamp
    ) {
      res.status(400).json({ error: "Invalid request, missing data" });
      return;
    } else {
      console.log(linktree);
    }
    if (!linktree.publicKey && !linktree.signature && !linktree.username) {
      res.status(400).json({
        error: "Missing publicKey or signature or linktree username",
      });
      return;
    } else {
      // log the pubkey of the payload
      console.log("linktree", linktree.publicKey);
      try {
        // Verify the signature
        const isVerified = nacl.sign.detached.verify(
          new TextEncoder().encode(JSON.stringify(linktree.data)),
          bs58.decode(linktree.signature),
          bs58.decode(linktree.publicKey)
        );
        if (!isVerified) {
          res.status(400).json({ error: "Invalid signature" });
          return;
        }
      } catch (e) {
        res.status(400).json({ error: "Invalid signature" });
      }
      console.log("Signature verified");
    }
    // Use the code below to sign the data payload
    let signature = linktree.signature;
    let pubkey = linktree.publicKey;

    let proofs = {
      publicKey: pubkey,
      signature: signature,
    };

    await db.setLinktree(pubkey, linktree);

    await db.setProofs(pubkey, proofs);

    return res
      .status(200)
      .send({ message: "Proof and linktree registered successfully" });
  } catch (e) {
    console.log(e);
  }
});

router.put("/linktree", async (req, res) => {
  const linktree = req.body.payload;
  if (!linktree.publicKey && !linktree.signature) {
    res.status(400).json({ error: "Missing publicKey or signature" });
    return;
  } else {
    try {
      // Verify the signature
      const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(JSON.stringify(linktree.data)),
        bs58.decode(linktree.signature),
        bs58.decode(linktree.publicKey)
      );
      if (!isVerified) {
        res.status(400).json({ error: "Invalid signature" });
        return;
      }
      // Use the code below to sign the data payload
      let signature = linktree.signature;
      let pubkey = linktree.publicKey;

      let proofs = {
        publicKey: pubkey,
        signature: signature,
      };

      await db.updateLinktree(pubkey, linktree);

      await db.setProofs(pubkey, proofs);

      return res
        .status(200)
        .send({ message: "Proof and linktree registered successfully" });
    } catch (e) {
      res.status(400).json({ error: "Invalid signature" });
    }
    console.log("Signature verified");
  }
});

router.delete("/linktree/:publicKey", async (req, res) => {
  const { publicKey } = req.params;
  let linktree = await db.deleteLinktree(publicKey);
  return res.status(200).send(publicKey);
});

router.get("/logs", async (req, res) => {
  const logs = fs.readFileSync("./namespace/logs.txt", "utf8");
  res.status(200).send(logs);
});
// endpoint for specific linktree data by publicKey
router.get("/linktree/get", async (req, res) => {
  const log = "Nothing to see here, check /:publicKey to get the linktree";
  return res.status(200).send(log);
});
router.get("/linktree/get/:publicKey", async (req, res) => {
  const { publicKey } = req.params;
  let linktree = await db.getLinktree(publicKey);
  linktree = linktree || "[]";
  return res.status(200).send(linktree);
});
router.get("/linktree/get/username/:username", async (req, res) => {
  const { username } = req.params;
  let linktree = await db.getLinktreeWithUsername(username);
  linktree = linktree || "[]";
  return res.status(200).send(linktree);
});

router.get("/linktree/list", async (req, res) => {
  let linktree = (await db.getAllLinktrees(true)) || "[]";
  return res.status(200).send(linktree);
});
router.get("/proofs/all", async (req, res) => {
  let linktree = (await db.getAllProofs()) || "[]";
  return res.status(200).send(linktree);
});
router.get("/proofs/get/:publicKey", async (req, res) => {
  const { publicKey } = req.params;
  let proof = await db.getProofs(publicKey);
  proof = proof || "[]";
  return res.status(200).send(proof);
});
router.get("/node-proof/all", async (req, res) => {
  let linktree = (await db.getAllNodeProofCids()) || "[]";
  return res.status(200).send(linktree);
});
router.get("/node-proof/:round", async (req, res) => {
  const { round } = req.params;
  let nodeproof = (await db.getNodeProofCid(round)) || "[]";
  return res.status(200).send(nodeproof);
});
router.get("/authlist/get/:publicKey", async (req, res) => {
  const { publicKey } = req.params;
  // console.log('publicKey req', publicKey);
  let authlist = await db.getAuthList(publicKey);
  // console.log('AUTHLIST', authlist);
  authlist = authlist || "[]";
  return res.status(200).send(authlist);
});
router.get("/authlist/list", async (req, res) => {
  let authlist = (await db.getAllAuthList(false)) || "[]";
  authlist.forEach((authuser) => {
    authuser = authuser.toString().split("auth_list:")[0];
  });
  return res.status(200).send(authlist);
});
router.post("/authlist", async (req, res) => {
  const pubkey = req.body.authdata.pubkey;
  // console.log("AUTHLIST", pubkey);
  //TODO Interprete the authdata value and set the authlist
  await db.setAuthList(pubkey);
  return res.status(200).send(pubkey);
});
router.get("/nodeurl", async (req, res) => {
  const nodeUrlList = await namespaceWrapper.getNodes();
  return res.status(200).send(nodeUrlList);
});
// router.post('/register-authlist', async (req, res) => {
//   const pubkey = req.body.pubkey;
//   await db.setAuthList(pubkey);
//   return res.status(200).send({message: 'Authlist registered successfully'});
// }
// )

module.exports = router;

/* File: coreLogic.js */
const { namespaceWrapper } = require("./namespaceWrapper");
const Linktree = require("../linktree");
class CoreLogic {
  constructor() {
    this.linktree = new Linktree();
  }

  async task(roundNumber) {
    await this.linktree.task(roundNumber);
    return;
  }

  async fetchSubmission(roundNumber) {
    return await this.linktree.generateSubmissionCID(roundNumber);
  }

  async generateDistributionList(round, _dummyTaskState) {
    return await this.generateDistributionList(round, _dummyTaskState);
  }

  async submitDistributionList(round) {
    // This upload the generated dustribution List

    console.log("SubmitDistributionList called");

    try {
      const distributionList = await this.generateDistributionList(round);

      const decider = await namespaceWrapper.uploadDistributionList(
        distributionList,
        round
      );
      // console.log('DECIDER', decider);

      if (decider) {
        const response =
          await namespaceWrapper.distributionListSubmissionOnChain(round);
        // console.log('RESPONSE FROM DISTRIBUTION LIST', response);
      }
    } catch (err) {
      console.log("ERROR IN SUBMIT DISTRIBUTION", err);
    }
  }

  // this function is called when a node is selected to validate the submission value
  async validateNode(submission_value, round) {
    return await this.linktree.validateSubmissionCID(submission_value, round);
  }

  async shallowEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (let key of keys1) {
      if (object1[key] !== object2[key]) {
        return false;
      }
    }
    return true;
  }

  validateDistribution = async (
    distributionListSubmitter,
    round,
    _dummyDistributionList,
    _dummyTaskState
  ) => {
    try {
      // console.log('Distribution list Submitter', distributionListSubmitter);
      const rawDistributionList = await namespaceWrapper.getDistributionList(
        distributionListSubmitter,
        round
      );
      let fetchedDistributionList;
      if (rawDistributionList == null) {
        fetchedDistributionList = _dummyDistributionList;
      } else {
        fetchedDistributionList = JSON.parse(rawDistributionList);
      }

      // console.log('FETCHED DISTRIBUTION LIST', fetchedDistributionList);
      const generateDistributionList = await this.generateDistributionList(
        round,
        _dummyTaskState
      );

      // compare distribution list

      const parsed = fetchedDistributionList;
      // console.log(
      //   'compare distribution list',
      //   parsed,
      //   generateDistributionList,
      // );
      const result = await this.shallowEqual(parsed, generateDistributionList);
      // console.log('RESULT', result);
      return result;
    } catch (err) {
      console.log("ERROR IN VALIDATING DISTRIBUTION", err);
      return false;
    }
  };
  // Submit Address with distributioon list to K2
  async submitTask(roundNumber) {
    // console.log('submitTask called with round', roundNumber);
    try {
      // console.log('inside try');
      // console.log(
      //   await namespaceWrapper.getSlot(),
      //   'current slot while calling submit',
      // );
      const submission = await this.fetchSubmission(roundNumber);
      // console.log('SUBMISSION', submission);
      // submit the submission to the K2
      await namespaceWrapper.checkSubmissionAndUpdateRound(
        submission,
        roundNumber
      );
      console.log("after the submission call");
    } catch (error) {
      console.log("error in submission", error);
    }
  }

  async auditTask(roundNumber) {
    // console.log('auditTask called with round', roundNumber);
    // console.log(
    //   await namespaceWrapper.getSlot(),
    //   'current slot while calling auditTask',
    // );
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNode,
      roundNumber
    );
  }

  async auditDistribution(roundNumber) {
    // console.log('auditDistribution called with round', roundNumber);
    await namespaceWrapper.validateAndVoteOnDistributionList(
      this.validateDistribution,
      roundNumber
    );
  }
}
const coreLogic = new CoreLogic();

module.exports = coreLogic;

/* File: init.js */
const express = require("express");
const TASK_NAME = process.argv[2] || "Local";
const TASK_ID = process.argv[3];
const EXPRESS_PORT = process.argv[4] || 10000;
const NODE_MODE = process.argv[5];
const MAIN_ACCOUNT_PUBKEY = process.argv[6];
const SECRET_KEY = process.argv[7];
const K2_NODE_URL = process.argv[8];
const SERVICE_URL = process.argv[9];
const STAKE = Number(process.argv[10]);
const TASK_NODE_PORT = Number(process.argv[11]);

const app = express();

console.log("SETTING UP EXPRESS");
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(EXPRESS_PORT, () => {
  console.log(`${TASK_NAME} listening on port ${EXPRESS_PORT}`);
});

module.exports = {
  app,
  NODE_MODE,
  TASK_ID,
  MAIN_ACCOUNT_PUBKEY,
  SECRET_KEY,
  K2_NODE_URL,
  SERVICE_URL,
  STAKE,
  TASK_NODE_PORT,
};

/* File: namespaceWrapper.js */
const { default: axios } = require("axios");
const { TASK_ID, SECRET_KEY, TASK_NODE_PORT } = require("./init");
const { Connection, PublicKey, Keypair } = require("@_koi/web3.js");
const taskNodeAdministered = !!TASK_ID;
const BASE_ROOT_URL = `http://localhost:${TASK_NODE_PORT}/namespace-wrapper`;
const Datastore = require("nedb-promises");
class NamespaceWrapper {
  #db;
  constructor() {
    if (taskNodeAdministered) {
      this.initializeDB();
    } else {
      this.#db = Datastore.create("./localKOIIDB.db");
    }
  }

  async initializeDB() {
    if (this.#db) return;
    try {
      const path = await this.getTaskLevelDBPath();
      this.#db = Datastore.create(path);
    } catch (e) {
      this.#db = Datastore.create(`../namespace/${TASK_ID}/KOIILevelDB.db`);
    }
  }

  async getDb() {
    if (this.#db) return this.#db;
    await this.initializeDB();
    return this.#db;
  }
  /**
   * Namespace wrapper of storeGetAsync
   * @param {string} key // Path to get
   */
  async storeGet(key) {
    try {
      await this.initializeDB();
      const resp = await this.#db.findOne({ key: key });
      if (resp) {
        return resp[key];
      } else {
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  /**
   * Namespace wrapper over storeSetAsync
   * @param {string} key Path to set
   * @param {*} value Data to set
   */
  async storeSet(key, value) {
    try {
      await this.initializeDB();
      await this.#db.insert({ [key]: value, key });
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  /**
   * Namespace wrapper over fsPromises methods
   * @param {*} method The fsPromise method to call
   * @param {*} path Path for the express call
   * @param  {...any} args Remaining parameters for the FS call
   */
  async fs(method, path, ...args) {
    return await genericHandler("fs", method, path, ...args);
  }
  async fsStaking(method, path, ...args) {
    return await genericHandler("fsStaking", method, path, ...args);
  }

  async fsWriteStream(imagepath) {
    return await genericHandler("fsWriteStream", imagepath);
  }
  async fsReadStream(imagepath) {
    return await genericHandler("fsReadStream", imagepath);
  }

  /**
   * Namespace wrapper for getting current slots
   */
  async getSlot() {
    return await genericHandler("getCurrentSlot");
  }

  async payloadSigning(body) {
    return await genericHandler("signData", body);
  }

  /**
   * Namespace wrapper of storeGetAsync
   * @param {string} signedMessage r // Path to get
   */

  async verifySignature(signedMessage, pubKey) {
    return await genericHandler("verifySignedData", signedMessage, pubKey);
  }

  // async submissionOnChain(submitterKeypair, submission) {
  //   return await genericHandler(
  //     'submissionOnChain',
  //     submitterKeypair,
  //     submission,
  //   );
  // }

  async stakeOnChain(
    taskStateInfoPublicKey,
    stakingAccKeypair,
    stakePotAccount,
    stakeAmount
  ) {
    return await genericHandler(
      "stakeOnChain",
      taskStateInfoPublicKey,
      stakingAccKeypair,
      stakePotAccount,
      stakeAmount
    );
  }
  async claimReward(stakePotAccount, beneficiaryAccount, claimerKeypair) {
    return await genericHandler(
      "claimReward",
      stakePotAccount,
      beneficiaryAccount,
      claimerKeypair
    );
  }
  async sendTransaction(serviceNodeAccount, beneficiaryAccount, amount) {
    return await genericHandler(
      "sendTransaction",
      serviceNodeAccount,
      beneficiaryAccount,
      amount
    );
  }

  async getSubmitterAccount() {
    const submitterAccountResp = await genericHandler("getSubmitterAccount");
    return Keypair.fromSecretKey(
      Uint8Array.from(Object.values(submitterAccountResp._keypair.secretKey))
    );
  }

  /**
   * sendAndConfirmTransaction wrapper that injects mainSystemWallet as the first signer for paying the tx fees
   * @param {connection} method // Receive method ["get", "post", "put", "delete"]
   * @param {transaction} path // Endpoint path appended to namespace
   * @param {Function} callback // Callback function on traffic receive
   */
  async sendAndConfirmTransactionWrapper(transaction, signers) {
    const blockhash = (await connection.getRecentBlockhash("finalized"))
      .blockhash;
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(MAIN_ACCOUNT_PUBKEY);
    return await genericHandler(
      "sendAndConfirmTransactionWrapper",
      transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }),
      signers
    );
  }

  // async signArweave(transaction) {
  //   let tx = await genericHandler('signArweave', transaction.toJSON());
  //   return arweave.transactions.fromRaw(tx);
  // }
  // async signEth(transaction) {
  //   return await genericHandler('signEth', transaction);
  // }
  async getTaskState() {
    const response = await genericHandler("getTaskState");
    if (response.error) {
      return null;
    }
    return response;
  }

  async auditSubmission(candidatePubkey, isValid, voterKeypair, round) {
    return await genericHandler(
      "auditSubmission",
      candidatePubkey,
      isValid,
      voterKeypair,
      round
    );
  }

  async distributionListAuditSubmission(
    candidatePubkey,
    isValid,
    voterKeypair,
    round
  ) {
    return await genericHandler(
      "distributionListAuditSubmission",
      candidatePubkey,
      isValid,
      round
    );
  }

  async getRound() {
    return await genericHandler("getRound");
  }

  async nodeSelectionDistributionList() {
    return await genericHandler("nodeSelectionDistributionList");
  }

  async payoutTrigger() {
    return await genericHandler("payloadTrigger");
  }

  async uploadDistributionList(distributionList, round) {
    return await genericHandler(
      "uploadDistributionList",
      distributionList,
      round
    );
  }

  async distributionListSubmissionOnChain(round) {
    return await genericHandler("distributionListSubmissionOnChain", round);
  }

  async payloadTrigger() {
    return await genericHandler("payloadTrigger");
  }

  async checkSubmissionAndUpdateRound(submissionValue = "default", round) {
    return await genericHandler(
      "checkSubmissionAndUpdateRound",
      submissionValue,
      round
    );
  }
  async getProgramAccounts() {
    return await genericHandler("getProgramAccounts");
  }
  async defaultTaskSetup() {
    return await genericHandler("defaultTaskSetup");
  }
  async getRpcUrl() {
    return await genericHandler("getRpcUrl");
  }
  async getNodes(url) {
    return await genericHandler("getNodes", url);
  }

  // Wrapper for selection of node to prepare a distribution list

  async nodeSelectionDistributionList(round) {
    return await genericHandler("nodeSelectionDistributionList", round);
  }

  async getDistributionList(publicKey, round) {
    const response = await genericHandler(
      "getDistributionList",
      publicKey,
      round
    );
    if (response.error) {
      return null;
    }
    return response;
  }

  async validateAndVoteOnNodes(validate, round) {
    console.log("******/  IN VOTING /******");
    const taskAccountDataJSON = await this.getTaskState();

    // console.log(
    //   'Fetching the submissions of N - 1 round',
    //   taskAccountDataJSON.submissions[round],
    // );
    const submissions = taskAccountDataJSON.submissions[round];
    if (submissions == null) {
      console.log("No submisssions found in N-1 round");
      return "No submisssions found in N-1 round";
    } else {
      const keys = Object.keys(submissions);
      const values = Object.values(submissions);
      const size = values.length;
      // console.log('Submissions from last round: ', keys, values, size);
      let isValid;
      const submitterAccountKeyPair = await this.getSubmitterAccount();
      const submitterPubkey = submitterAccountKeyPair.publicKey.toBase58();
      for (let i = 0; i < size; i++) {
        let candidatePublicKey = keys[i];
        // console.log('FOR CANDIDATE KEY', candidatePublicKey);
        let candidateKeyPairPublicKey = new PublicKey(keys[i]);
        if (candidatePublicKey == submitterPubkey) {
          console.log("YOU CANNOT VOTE ON YOUR OWN SUBMISSIONS");
        } else {
          try {
            // console.log(
            //   'SUBMISSION VALUE TO CHECK',
            //   values[i].submission_value,
            // );
            isValid = await validate(values[i].submission_value, round);
            // console.log(`Voting ${isValid} to ${candidatePublicKey}`);

            if (isValid) {
              // check for the submissions_audit_trigger , if it exists then vote true on that otherwise do nothing
              const submissions_audit_trigger =
                taskAccountDataJSON.submissions_audit_trigger[round];
              // console.log('SUBMIT AUDIT TRIGGER', submissions_audit_trigger);
              // console.log(
              //   "CANDIDATE PUBKEY CHECK IN AUDIT TRIGGER",
              //   submissions_audit_trigger[candidatePublicKey]
              // );
              if (
                submissions_audit_trigger &&
                submissions_audit_trigger[candidatePublicKey]
              ) {
                console.log("VOTING TRUE ON AUDIT");
                const response = await this.auditSubmission(
                  candidateKeyPairPublicKey,
                  isValid,
                  submitterAccountKeyPair,
                  round
                );
                // console.log('RESPONSE FROM AUDIT FUNCTION', response);
              }
            } else if (isValid == false) {
              // Call auditSubmission function and isValid is passed as false
              console.log("RAISING AUDIT / VOTING FALSE");
              const response = await this.auditSubmission(
                candidateKeyPairPublicKey,
                isValid,
                submitterAccountKeyPair,
                round
              );
              // console.log('RESPONSE FROM AUDIT FUNCTION', response);
            }
          } catch (err) {
            console.log("ERROR IN ELSE CONDITION", err);
          }
        }
      }
    }
  }

  async validateAndVoteOnDistributionList(validateDistribution, round) {
    // await this.checkVoteStatus();
    console.log("******/  IN VOTING OF DISTRIBUTION LIST /******");
    const taskAccountDataJSON = await this.getTaskState();
    // console.log(
    //   'Fetching the Distribution submissions of N - 2 round',
    //   taskAccountDataJSON.distribution_rewards_submission[round],
    // );
    const submissions =
      taskAccountDataJSON.distribution_rewards_submission[round];
    if (submissions == null) {
      console.log("No submisssions found in N-2 round");
      return "No submisssions found in N-2 round";
    } else {
      const keys = Object.keys(submissions);
      const values = Object.values(submissions);
      const size = values.length;
      // console.log(
      //   'Distribution Submissions from last round: ',
      //   keys,
      //   values,
      //   size,
      // );
      let isValid;
      const submitterAccountKeyPair = await this.getSubmitterAccount();
      const submitterPubkey = submitterAccountKeyPair.publicKey.toBase58();

      for (let i = 0; i < size; i++) {
        let candidatePublicKey = keys[i];
        // console.log('FOR CANDIDATE KEY', candidatePublicKey);
        let candidateKeyPairPublicKey = new PublicKey(keys[i]);
        if (candidatePublicKey == submitterPubkey) {
          console.log("YOU CANNOT VOTE ON YOUR OWN DISTRIBUTION SUBMISSIONS");
        } else {
          try {
            // console.log(
            //   'DISTRIBUTION SUBMISSION VALUE TO CHECK',
            //   values[i].submission_value,
            // );
            isValid = await validateDistribution(
              values[i].submission_value,
              round
            );
            // console.log(`Voting ${isValid} to ${candidatePublicKey}`);

            if (isValid) {
              // check for the submissions_audit_trigger , if it exists then vote true on that otherwise do nothing
              const distributions_audit_trigger =
                taskAccountDataJSON.distributions_audit_trigger[round];
              // console.log(
              //   'SUBMIT DISTRIBUTION AUDIT TRIGGER',
              //   distributions_audit_trigger,
              // );
              // console.log(
              //   "CANDIDATE PUBKEY CHECK IN AUDIT TRIGGER",
              //   distributions_audit_trigger[candidatePublicKey]
              // );
              if (
                distributions_audit_trigger &&
                distributions_audit_trigger[candidatePublicKey]
              ) {
                console.log("VOTING TRUE ON DISTRIBUTION AUDIT");
                const response = await this.distributionListAuditSubmission(
                  candidateKeyPairPublicKey,
                  isValid,
                  submitterAccountKeyPair,
                  round
                );
                // console.log(
                //   'RESPONSE FROM DISTRIBUTION AUDIT FUNCTION',
                //   response,
                // );
              }
            } else if (isValid == false) {
              // Call auditSubmission function and isValid is passed as false
              console.log("RAISING AUDIT / VOTING FALSE ON DISTRIBUTION");
              const response = await this.distributionListAuditSubmission(
                candidateKeyPairPublicKey,
                isValid,
                submitterAccountKeyPair,
                round
              );
              // console.log(
              //   'RESPONSE FROM DISTRIBUTION AUDIT FUNCTION',
              //   response,
              // );
            }
          } catch (err) {
            console.log("ERROR IN ELSE CONDITION FOR DISTRIBUTION", err);
          }
        }
      }
    }
  }
  async getTaskLevelDBPath() {
    return await genericHandler("getTaskLevelDBPath");
  }
}

async function genericHandler(...args) {
  try {
    let response = await axios.post(BASE_ROOT_URL, {
      args,
      taskId: TASK_ID,
      secret: SECRET_KEY,
    });
    if (response.status == 200) return response.data.response;
    else {
      console.error(response.status, response.data);
      return null;
    }
  } catch (err) {
    console.error(`Error in genericHandler: "${args[0]}"`, err.message);
    console.error(err?.response?.data);
    return { error: err };
  }
}
let connection;
const namespaceWrapper = new NamespaceWrapper();
if (taskNodeAdministered) {
  namespaceWrapper.getRpcUrl().then((rpcUrl) => {
    console.log(rpcUrl, "RPC URL");
    connection = new Connection(rpcUrl, "confirmed");
  });
}
module.exports = {
  namespaceWrapper,
  taskNodeAdministered,
};

/* File: createFile.js */
const fsPromise = require("fs/promises");

module.exports = async (path, data) => {
  //if (!fs.existsSync('userIndex')) fs.mkdirSync('userIndex');

  await fsPromise.writeFile(path, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    }
  });
};

/* File: dataFromCid.js */
const axios = require("axios");
const { Web3Storage, getFilesFromPath } = require("web3.storage");
const storageClient = new Web3Storage({
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGY0ODYxMzAzOTdDNTY1QzlDYTRCOTUzZTA2RWQ4NUI4MGRBQzRkYTIiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjYzNjU1OTk5MDMsIm5hbWUiOiJTb21hIn0.TU-KUFS9vjI9blN5dx6VsLLuIjJnpjPrxDHBvjXQUxw",
});

module.exports = async (cid) => {
  console.log("CID", cid);
  if (storageClient) {
    const res = await storageClient.get(cid);
    if (!res.ok) {
      // voting false
      console.log("VOTE FALSE");

      console.log("SLASH VOTE DUE TO FAKE VALUE");
      //console.log("VOTE", vote);
      return false;
    } else {
      const file = await res.files();
      //console.log("FILE", file);
      //console.log("CID", file[0].cid);
      const url = `https://${file[0].cid}.ipfs.w3s.link/?filename=${file[0].name}`;
      console.log("URL", url);
      try {
        const output = await axios.get(url);
        return output;
      } catch (error) {
        console.log("ERROR", error);
      }
    }
  }
};

/* File: deleteFile.js */
const fsPromise = require("fs/promises");

module.exports = async (path) => {
  //if (!fs.existsSync('userIndex')) fs.mkdirSync('userIndex');

  await fsPromise.unlink(path, (err) => {
    if (err) {
      console.error(err);
    }
  });
};

/* File: hashCompare.js */
const crypto = require("crypto");
const { namespaceWrapper } = require("../namespaceWrapper");

module.exports = async (index, signature, publicKey) => {
  const hash = await namespaceWrapper.verifySignature(signature, publicKey);
  if (hash.error) {
    console.error("Could not verify the signatures");
  }

  console.log("DATA HASH", hash.data);

  // comparing the data Hash
  const expectedHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(index))
    .digest("hex");

  const expectedString = JSON.stringify(expectedHash);
  console.log("EXPECTED HASH", expectedString);

  if (hash.data == expectedString) {
    return true;
  } else {
    return false;
  }
};

/* File: linktree_task.js */
const {
  namespaceWrapper,
  taskNodeAdministered,
} = require("../environment/namespaceWrapper");
const dotenv = require("dotenv");
dotenv.config();
const { Web3Storage } = require("web3.storage");
const storageClient = new Web3Storage({
  token: process.env.SECRET_WEB3_STORAGE_KEY,
});
const bs58 = require("bs58");
const nacl = require("tweetnacl");
const db = require("../database/db_model");
const { Keypair } = require("@solana/web3.js"); // TEST For local testing

/**
 * @function linktree_task
 * @description
 * This is the main Linktree task function
 * It will call the database to get the linktree list
 * Then it will sign the list with the node's keypair
 * Then it will upload the signed list to IPFS and reture the CID
 */
const main = async () => {
  console.log("******/  IN Linktree Task FUNCTION /******");

  // Load node's keypair from the JSON file
  let keypair;
  if (taskNodeAdministered) {
    keypair = await namespaceWrapper.getSubmitterAccount();
  } else {
    // TEST For local testing, hardcode the keypair
    keypair = Keypair.generate();
  }

  // Get linktree list fron localdb
  const proofs_list_object = await db.getAllProofs();

  // Use the node's keypair to sign the linktree list
  const messageUint8Array = new Uint8Array(
    Buffer.from(JSON.stringify(proofs_list_object))
  );

  const signedMessage = nacl.sign(messageUint8Array, keypair.secretKey);
  const signature = signedMessage.slice(0, nacl.sign.signatureLength);

  const submission_value = {
    proofs: proofs_list_object,
    node_publicKey: keypair.publicKey,
    node_signature: bs58.encode(signature),
  };

  // upload the proofs of the linktree on web3.storage
  try {
    const filename = `proofs.json`;

    // Uploading the image to IPFS
    const gameSalesJson = JSON.stringify(submission_value);
    const file = new File([gameSalesJson], filename, {
      type: "application/json",
    });
    const proof_cid = await storageClient.put([file]);
    console.log("User Linktrees proof uploaded to IPFS: ", proof_cid);

    return proof_cid;
  } catch (err) {
    console.log("Error submission_value", err);
    return null;
  }
};

module.exports = main;

/* File: linktree_validate.js */
const dataFromCid = require("../helpers/dataFromCid");
const {
  namespaceWrapper,
  taskNodeAdministered,
} = require("../environment/namespaceWrapper");
const db = require("../database/db_model");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const { default: axios } = require("axios");
const { TASK_ID } = require("../environment/init");
const Web3 = require("web3");
const web3 = new Web3();
const ethUtil = require("ethereumjs-util");

/**
 * @function linktree_validate
 * @description
 * This function is called when the node is selected to validate the submission value.
 * It will fetch the linktrees from other nodes.
 * It will then verify that the node is holding the linktree and that the signature is valid.
 */
module.exports = async (submission_value, round) => {
  console.log("******/ Linktree CID VALIDATION Task FUNCTION /******");
  const outputraw = await dataFromCid(submission_value);
  const output = outputraw.data;
  console.log("OUTPUT", output);
  console.log("RESPONSE DATA length", output.proofs.length);
  console.log("PUBLIC KEY", output.node_publicKey);
  console.log("SIGNATURE", output.node_signature);

  // Check that the node who submitted the proofs is a valid staked node
  let isNode = await verifyNode(
    output.proofs,
    output.node_signature,
    output.node_publicKey
  );
  console.log("Is the node's signature on the CID payload correct?", isNode);

  // check each item in the linktrees list and verify that the node is holding that payload, and the signature matches
  let isLinktree;
  if (output.proofs.length > 0) {
    isLinktree = await verifyLinktrees(output.proofs);
    console.log("IS LINKTREE True?", isLinktree);
  } else {
    console.log("No linktree found in round", round);
    isLinktree = true;
  }
  if (isNode && isLinktree) return true; // if both are true, return true
  else return false; // if one of them is false, return false
};

// verify the linktree signature by querying the other node to get it's copy of the linktree
async function verifyLinktrees(proofs_list_object) {
  let allSignaturesValid = true;
  let AuthUserList = await db.getAllAuthList();
  console.log("Authenticated Users List:", AuthUserList);

  for (const proofs of proofs_list_object) {
    console.log(proofs);
    let publicKey = proofs.publicKey;

    // call other nodes to get the node list
    let nodeUrlList;
    if (taskNodeAdministered) {
      nodeUrlList = await namespaceWrapper.getNodes();
    } else {
      nodeUrlList = ["http://localhost:10000"];
    }

    // verify the signature of the linktree for each nodes
    for (const nodeUrl of nodeUrlList) {
      console.log("cheking linktree on ", nodeUrl);

      let res;
      // get all linktree in this node
      if (taskNodeAdministered) {
        res = await axios.get(
          `${nodeUrl}/task/${TASK_ID}/linktree/get/${publicKey}`
        );
        // check node's status
        if (res.status != 200) {
          console.error("ERROR", res.status);
          continue;
        }
      } else {
        // TEST hardcode the node endpoint
        data = await db.getLinktree(publicKey);
        res = { data };
      }

      // get the payload
      const linktree = res.data;

      // check if the user's pubkey is on the authlist
      if (AuthUserList.hasOwnProperty(linktree.publicKey)) {
        console.log("User is on the auth list");
      } else {
        // Check if the public key is an ETH address
        if (linktree.publicKey.length == 42) {
          // Verify the ETH signature
          const { data, publicKey, signature } = payload;

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
            s
          );

          // Convert the recovered public key to an Ethereum address
          const recoveredAddress = ethUtil.bufferToHex(
            ethUtil.pubToAddress(publicKeyRecovered)
          );

          // Check if the recovered address matches the provided public key
          if (recoveredAddress.toLowerCase() === publicKey.toLowerCase()) {
            console.log("Payload signature is valid");
            await db.setAuthList(publicKey);
          } else {
            console.log("Payload signature is invalid");
            allSignaturesValid = false;
          }
        } else {
          // Verify the signature
          const messageUint8Array = new Uint8Array(
            Buffer.from(JSON.stringify(linktree.data))
          );
          const signature = linktree.signature;
          const publicKey = linktree.publicKey;
          const signatureUint8Array = bs58.decode(signature);
          const publicKeyUint8Array = bs58.decode(publicKey);
          const isSignatureValid = await verifySignature(
            messageUint8Array,
            signatureUint8Array,
            publicKeyUint8Array
          );
          console.log(`IS SIGNATURE ${publicKey} VALID?`, isSignatureValid);

          if (isSignatureValid) {
            await db.setAuthList(publicKey);
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
    Buffer.from(JSON.stringify(proofs_list_object))
  );
  const signatureUint8Array = bs58.decode(signature);
  const publicKeyUint8Array = bs58.decode(publicKey);

  if (!proofs_list_object || !signature || !publicKey) {
    console.error("No data received from web3.storage");
    return false;
  }

  // verify the node signature
  const isSignatureValid = await verifySignature(
    messageUint8Array,
    signatureUint8Array,
    publicKeyUint8Array
  );

  return isSignatureValid;
}

async function verifySignature(message, signature, publicKey) {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

/* File: check_task-status.js */
const { Connection, PublicKey } = require("@_koi/web3.js");
async function main() {
  const connection = new Connection("https://k2-devnet.koii.live");
  const accountInfo = await connection.getAccountInfo(
    new PublicKey("HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP")
  );
  // console.log(JSON.parse(accountInfo.data+""));
}

main();

/* File: localTestingShim.js */
const coreLogic = require("../environment/coreLogic");
const namespaceWrapper = require("../environment/namespaceWrapper");

// TEST Set round
// let round = 1000
const round = await namespaceWrapper.getRound();
const localShim = async () => {
  /* GUIDE TO CALLS K2 FUNCTIONS MANUALLY

  If you wish to do the development by avoiding the timers then you can do the intended calls to K2 
  directly using these function calls. 

  To disable timers please set the TIMERS flag in task-node ENV to disable

  NOTE : K2 will still have the windows to accept the submission value, audit, so you are expected
  to make calls in the intended slots of your round time. 

  */
  // console.log("*******************TESTING*******************")
  // Get the task state
  // console.log(await namespaceWrapper.getTaskState());
  // Get account public key
  // console.log(MAIN_ACCOUNT_PUBKEY);
  // GET ROUND
  // const round = await namespaceWrapper.getRound();
  // console.log("ROUND", round);
  // Call to do the work for the task
  // await coreLogic.task();
  // Submission to K2 (Preferablly you should submit the cid received from IPFS)
  // await coreLogic.submitTask(round - 1);
  // Audit submissions
  // await coreLogic.auditTask(round - 1);
  // upload distribution list to K2
  //await coreLogic.submitDistributionList(round - 2)
  // Audit distribution list
  //await coreLogic.auditDistribution(round - 2);
  // Payout trigger
  // const responsePayout = await namespaceWrapper.payoutTrigger();
  // console.log("RESPONSE TRIGGER", responsePayout);
};

module.exports = localShim;
/* File: test_authlist.js */
const { default: axios } = require("axios");

// This test submits linktrees from differnet publicKey to the service and stored in localdb
async function main() {
  try {
    const pubkey = "testpubkeyregisterpubkey";
    const authdata = { pubkey };

    // Check payload
    // console.log(payload);

    await axios
      .post("http://localhost:10000/authlist", { authdata })
      .then((e) => {
        if (e.status != 200) {
          console.log(e);
        }
        console.log(e.data);
      })
      .catch((e) => {
        console.error(e);
      });
  } catch (e) {
    console.error(e);
  }
}

main();

module.exports = main;
/* File: test_dbmodel.js */
const db = require("../database/db_model");

const PublicKey = "test-pubkey1";

async function testdb() {
  const round = 1000;
  const pubkey = PublicKey;

  // get linktree
  // let linktree = await dbmodel.getLinktree(PublicKey);
  // console.log(linktree);

  // get all linktrees
  // await dbmodel.getAllLinktrees();

  // set linktree
  // let linktree2 = {
  //     "name": "test1",
  //     "description": "test1",
  //     "avatar": "test1",
  //     "links": [
  //         {
  //             "name": "test1",
  //             "url": "test1"
  //         }
  //     ]
  // }
  // await dbmodel.setLinktree(PublicKey, linktree2);

  // set node proofs
  // let cid = "testcid"
  // await dbmodel.setNodeProofCid(round, cid);

  // get node proofs
  // let nodeProofs = await dbmodel.getNodeProofCid(round);
  // console.log(nodeProofs);

  // set proofs
  // let proofs = {
  //   publicKey: "test-pubkey1",
  //   signature: "test-signature1",
  // }
  // await dbmodel.setProofs(pubkey, proofs);

  // get proofs
  // let proofs = await dbmodel.getProofs(round);
  // console.log(proofs);

  // get all proofs
  // await dbmodel.getAllProofs();

  // set auth list

  // await db.setAuthList(pubkey);

  // let AuthUserList = await db.getAllAuthLists();
  // console.log('Authenticated Users List:', AuthUserList);
}

testdb();
/* File: test_endpoint.js */
const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const bs58 = require("bs58");
const nacl = require("tweetnacl");
const fs = require("fs");
try {
  axios
    .get("http://localhost:10000/linktree/list")
    .then((e) => {
      if (e.status != 200) {
        console.log(e);
      }
      console.log(e.data);
    })
    .catch((e) => {
      console.error(e);
    });
} catch (e) {
  console.error(e);
}
/* File: test_local_submitLinktree.js */
const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const bs58 = require("bs58");
const nacl = require("tweetnacl");
const fs = require("fs");
const solanaWeb3 = require("@solana/web3.js");
const crypto = require("crypto");

// This test submits linktrees from differnet publicKey to the service and stored in localdb
async function main() {
  try {
    const keyPair = nacl.sign.keyPair();
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.secretKey;
    // const {publicKey, secretKey} = nacl.sign.keyPair.fromSecretKey(
    //   new Uint8Array(JSON.parse(fs.readFileSync("./test_wallet.json", 'utf-8')))
    // );
    // console.log('publicKey', bs58.encode(publicKey));
    const data = {
      uuid: uuidv4(),
      linktree: {
        name: "Saim Iqbal",
        description: "Koii network",
        image:
          "https://bafybeifqlmydsok6qfg3vo33qsat4wswrjdneummyj7mc7w7sinziknriu.ipfs.w3s.link/Saim.jpg",
        background: "",
        links: [
          {
            key: "telegram",
            label: "Telegram",
            redirectUrl: "https://t.me/saimkoii",
          },
          {
            key: "twitter",
            label: "Twitter",
            redirectUrl: "https://twitter.com/s1mplecoder",
          },
          {
            key: "instagram",
            label: "Instagram",
            redirectUrl: "https://www.instagram.com/saimiiqbal7/",
          },
          {
            key: "official",
            label: "Koii Network",
            redirectUrl: "https://www.koii.network/",
          },
          {
            key: "website",
            label: "Koii Docs",
            redirectUrl: "https://docs.koii.network/",
          },
        ],
      },
      timestamp: Date.now(),
    };
    const messageUint8Array = new Uint8Array(Buffer.from(JSON.stringify(data)));
    const signedMessage = nacl.sign(messageUint8Array, privateKey);
    const signature = signedMessage.slice(0, nacl.sign.signatureLength);
    const payload = {
      data,
      publicKey: bs58.encode(publicKey),
      signature: bs58.encode(signature),
    };

    // Check payload
    console.log(payload);

    await axios
      .post("http://localhost:10000/linktree", { payload })
      .then((e) => {
        if (e.status != 200) {
          console.log(e);
        }
        console.log(e.data);
      })
      .catch((e) => {
        console.error(e);
      });
  } catch (e) {
    console.error(e);
  }
}

main();

module.exports = main;

/* File: test_nacl.js */
// test nacl verified

const nacl = require("tweetnacl");
const bs58 = require("bs58");

async function test_main() {
  const submission_value = await generateAndSubmitDistributionList();
  await validate(submission_value);
}

async function generateAndSubmitDistributionList() {
  const keyPair = nacl.sign.keyPair();
  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.secretKey;

  const message = {
    data: "data",
    publicKey: "7AwybFMYogGa8LJ3n9i8QthUs6ybEcanC8UPejM76U7h",
    signature:
      "P6McSGFMniTdaH5546b8b1xuL91UtjxS9RnXMxBcg8ewuvKuFwijqJHH9BSZnEnqs1niE1xx7DreRVCNqK4ZJSE",
  };
  const messageUint8Array = new Uint8Array(
    Buffer.from(JSON.stringify(message))
  );

  const signedMessage = nacl.sign(messageUint8Array, privateKey);
  const signature = signedMessage.slice(0, nacl.sign.signatureLength);

  const submission_value = {
    data: message,
    publicKey: bs58.encode(publicKey),
    signature: bs58.encode(signature),
  };
  return submission_value;
}

async function validate(submission_value) {
  const output = submission_value;
  const message = output.data;
  // console.log("RESPONSE DATA", message);
  const publicKey = output.publicKey;
  // console.log("PUBLIC KEY", publicKey);
  const signature = output.signature;
  // console.log("SIGNATURE", signature);
  const messageUint8Array = new Uint8Array(
    Buffer.from(JSON.stringify(message))
  );
  const signatureUint8Array = bs58.decode(signature);
  const publicKeyUint8Array = bs58.decode(publicKey);

  const isSignatureValid = await verifySignature(
    messageUint8Array,
    signatureUint8Array,
    publicKeyUint8Array
  );
  //   console.log(`Is the signature valid? ${isSignatureValid}`);
}

async function verifySignature(message, signature, publicKey) {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

test_main();

/* File: test_node_submitLinktree.js */
const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const bs58 = require("bs58");
const nacl = require("tweetnacl");
const fs = require("fs");
const solanaWeb3 = require("@solana/web3.js");
const crypto = require("crypto");

// This test submits linktrees from differnet publicKey to the service and stored in localdb
async function main() {
  try {
    const keyPair = nacl.sign.keyPair();
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.secretKey;

    const data = {
      uuid: uuidv4(),
      linktree: {
        name: "Linktree test",
        description: "Linktree test description",
        image:
          "https://www.koii.network/_next/image?url=%2FKoiiNetwork-logo_128.png&w=48&q=75",
        background: "",
        links: [
          {
            key: "official",
            label: "Koii Network",
            redirectUrl: "https://www.koii.network/",
          },
          {
            key: "website",
            label: "Koii Docs",
            redirectUrl: "https://docs.koii.network/",
          },
        ],
      },
      timestamp: Date.now(),
    };

    const messageUint8Array = new Uint8Array(Buffer.from(JSON.stringify(data)));
    const signedMessage = nacl.sign(messageUint8Array, privateKey);
    const signature = signedMessage.slice(0, nacl.sign.signatureLength);
    const pubkey = bs58.encode(publicKey);
    const sign = bs58.encode(signature);
    const payload = {
      data,
      publicKey: pubkey,
      signature: sign,
    };
    // console.log(pubkey)

    // Check payload
    // console.log(payload);

    await axios
      .post(
        "https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree",
        { payload }
      )
      .then((e) => {
        if (e.status != 200) {
          console.log(e);
        }
        console.log(e.data);
      })
      .catch((e) => {
        console.error(e);
      });
    await axios
      .post(
        "https://k2-tasknet-ports-1.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree",
        { payload }
      )
      .then((e) => {
        if (e.status != 200) {
          console.log(e);
        }
        console.log(e.data);
      })
      .catch((e) => {
        console.error(e);
      });
    await axios
      .post(
        "https://k2-tasknet.pexelsoft.com/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree",
        { payload }
      )
      .then((e) => {
        if (e.status != 200) {
          console.log(e);
        }
        console.log(e.data);
      })
      .catch((e) => {
        console.error(e);
      });
    await axios
      .post(
        "https://k2-tasknet-ports-3.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree",
        { payload }
      )
      .then((e) => {
        if (e.status != 200) {
          console.log(e);
        }
        console.log(e.data);
      })
      .catch((e) => {
        console.error(e);
      });
  } catch (e) {
    console.error(e);
  }
}

main();

module.exports = main;

/* File: unitTest.js */
/**
 * unitTest.js
 * @description
 * This file gonna test the whole linktree task logic in one go.
 * In the delay time the REST API is working and the task is running.
 * During this time the user can submit the data to the task.
 * After the delay time the submission function will start.
 */

const index = require("../index");
const dotenv = require("dotenv");
require("dotenv").config();
const Linktree = require("../linktree");
const db = require("../database/db_model");
dotenv.config();

async function test_coreLogic() {
  // Set up the number of times the task is repeated.
  let repeat = 10;

  // Set up the delay time in milliseconds. During this time the REST API is working and can receive data.
  let delay = 15000;

  // Instead of calling the task node, hardcode ther round number.
  let round = 5;

  // Instead of calling the task node, hardcode the task state.
  const _dummyTaskState = {
    stake_list: {
      "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHL": 20000000000,
      "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHH": 10000000000,
    },
    bounty_amount_per_round: 1000000000,

    submissions: {
      1: {
        "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHL": {
          submission_value: "8164bb07ee54172a184bf35f267bc3f0052a90cd",
          slot: 1889700,
          round: 1,
        },
        "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHH": {
          submission_value: "8164bb07ee54172a184bf35f267bc3f0052a90cc",
          slot: 1890002,
          round: 1,
        },
      },
    },
    submissions_audit_trigger: {
      1: {
        // round number
        "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHL": {
          // Data Submitter (send data to K2)
          trigger_by: "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHH", // Audit trigger
          slot: 1890002,
          votes: [
            {
              is_valid: false, // Submission is invalid(Slashed)
              voter: "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHZ", // Voter
              slot: 1890003,
            },
          ],
        },
        "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHH": {
          // Data Submitter (send data to K2)
          trigger_by: "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHL", // Audit trigger
          slot: 1890002,
          votes: [
            {
              is_valid: true, // Submission is valid
              voter: "2NstaKU4kif7uytmS2PQi9P5M5bDLYSF2dhUNFhJbxHZ", // Voter
              slot: 1890003,
            },
          ],
        },
      },
    },
  };

  // Start the task
  var linktreeTask = null;
  linktreeTask = new Linktree();
  console.log("started a new linktree test");

  setTimeout(async () => {
    // console.log('round', round);

    // Main function of the task
    await linktreeTask.task(round);
    console.log("task completed");

    // Fetch the submission CID
    let proof_cid = await linktreeTask.generateSubmissionCID(round);
    // console.log('got round result', proof_cid);

    // TEST in case upload to Web3Storage many times, use the hardcode CID below
    // let proof_cid ='bafybeiatlrlmpnzt6jqrj2rvfkc3n377kswwmwpzxst3awl6sgutwo6miy';

    // Validate the submission CID
    let vote = await linktreeTask.validateSubmissionCID(proof_cid, round);

    // TEST in case the submission is not valid, set the vote to true
    // let vote = true;
    // console.log('validated round result', vote);

    // Generate the distribution list
    if (vote == true) {
      console.log("Submission is valid, generating distribution list");
      const distributionList = await linktreeTask.generateDistribution(
        1,
        _dummyTaskState
      );
      // console.log('distributionList', distributionList);
    } else {
      console.log("Submission is invalid, not generating distribution list");
    }
  }, delay);
}

test_coreLogic();

/* File: index.js */
/**
 * This is the main file for the task-template-linktree.
 *
 * This task is a simple example of a task that can be run on the K2 network.
 * The task is to store the linktree data, which is a list of links to social media profiles.
 * The task is run in rounds, and each round, each node submits a linktree.
 *
 *
 */

const coreLogic = require("./environment/coreLogic");
const dbSharing = require("./database/dbSharing");
// const localShim = require("./localTestingShim"); // TEST to enable testing with K2 without round timers, enable this line and line 59
const {
  app,
  MAIN_ACCOUNT_PUBKEY,
  SERVICE_URL,
  TASK_ID,
} = require("./environment/init");
const express = require("express");
const {
  namespaceWrapper,
  taskNodeAdministered,
} = require("./environment/namespaceWrapper");
const { default: axios } = require("axios");
const bs58 = require("bs58");
const solanaWeb3 = require("@solana/web3.js");
const nacl = require("tweetnacl");
const fs = require("fs");
const db = require("./database/db_model");
const routes = require("./database/routes");
const path = require("path");

async function setup() {
  const originalConsoleLog = console.log;
  const logDir = "./namespace";
  const logFile = "logs.txt";
  const maxLogAgeInDays = 3;

  // Check if the log directory exists, if not, create it
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // Create a writable stream to the log file
  const logPath = path.join(logDir, logFile);
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  // Function to remove logs older than specified age (in 3 days)
  async function cleanOldLogs(logDir, logFile, maxLogAgeInDays) {
    const currentDate = new Date();
    const logPath = path.join(logDir, logFile);

    if (fs.existsSync(logPath)) {
      const fileStats = fs.statSync(logPath);
      const fileAgeInDays =
        (currentDate - fileStats.mtime) / (1000 * 60 * 60 * 24);

      if (fileAgeInDays > maxLogAgeInDays) {
        fs.unlinkSync(logPath);
      }
    }
  }

  // Overwrite the console.log function to write to the log file
  console.log = function (...args) {
    originalConsoleLog.apply(console, args);
    const message =
      args
        .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
        .join(" ") + "\n";

    // Write the message to the log file
    logStream.write(message);
  };

  // Clean old logs
  await cleanOldLogs(logDir, logFile, maxLogAgeInDays);

  console.log("setup function called");
  // Run default setup
  await namespaceWrapper.defaultTaskSetup();
  process.on("message", (m) => {
    // console.log("CHILD got message:", m);
    if (m.functionCall == "submitPayload") {
      console.log("submitPayload called");
      coreLogic.submitTask(m.roundNumber);
    } else if (m.functionCall == "auditPayload") {
      console.log("auditPayload called");
      coreLogic.auditTask(m.roundNumber);
    } else if (m.functionCall == "executeTask") {
      console.log("executeTask called");
      coreLogic.task(m.roundNumber);
    } else if (m.functionCall == "generateAndSubmitDistributionList") {
      console.log("generateAndSubmitDistributionList called");
      coreLogic.submitDistributionList(m.roundNumber);
    } else if (m.functionCall == "distributionListAudit") {
      console.log("distributionListAudit called");
      coreLogic.auditDistribution(m.roundNumber);
    }
  });

  // Code for the data replication among the nodes
  setInterval(() => {
    dbSharing.share();
  }, 20000);

  // localShim(); // TEST enable this to run the localShim for testing with K2 without timers
}

if (taskNodeAdministered) {
  setup();
}

if (app) {
  app.use(express.json());
  app.use("/", routes);
}

/* File: linktree.js */
const { namespaceWrapper } = require("./environment/namespaceWrapper");
const db = require("./database/db_model");
const linktree_task = require("./linktree/linktree_task");
const linktree_validate = require("./linktree/linktree_validate");

/**
 * @class Linktree
 * @description
 * Linktree is a class that contains all the logic for a task.
 * It is instantiated by the task runner, and is passed a database to store data in.
 *
 *
 * 1. task() -> generates submission data to local db
 * 2. generateSubmissionCID() -> uploads submission data to IPFS and returns CID
 * 3. validateSubmissionCID() -> validates submission data by replicating the process of creating it
 * 4. generateDistribution() -> scores submissions and distributes rewards
 * */
class Linktree {
  // Tasks produce submissions and log them to a LOCAL database
  task = async (round) => {
    // run linktree task
    console.log("*********task() started*********");

    const proof_cid = await linktree_task();

    if (proof_cid) {
      await db.setNodeProofCid(round, proof_cid); // store CID in levelDB
      // console.log('Node Proof CID stored in round', round);
    } else {
      console.log("CID NOT FOUND");
    }

    console.log("*********task() completed*********");
  };

  // To prove work, each node will submit it's 'submission' at the end of the round, by collecting data from it's Local Database and uploading to IPFS
  generateSubmissionCID = async (round) => {
    // The logic to fetch the submission values and return the cid string

    // fetching round number to store work accordingly

    console.log("***********IN FETCH SUBMISSION**************");
    // The code below shows how you can fetch your stored value from level DB

    let proof_cid = await db.getNodeProofCid(round); // retrieves the cid
    // console.log('Linktree proofs CID', proof_cid, 'in round', round);

    return proof_cid;
  };

  // Each submission can be validated by replicating the process of creating it
  validateSubmissionCID = async (submission_value, round) => {
    // console.log('Received submission_value', submission_value, round);

    // import the linktree validate module
    const vote = await linktree_validate(submission_value, round);
    // console.log('Vote', vote);
    return vote;
  };

  // Once all submissions have been audited, they can be scored to distribute rewards
  generateDistribution = async (round, _dummyTaskState) => {
    try {
      // console.log('GenerateDistributionList called');
      // console.log('I am selected node');
      // console.log('Round', round, 'Task State', _dummyTaskState);
      // The logic to generate the distribution list here

      let distributionList = {};
      let distributionCandidates = [];
      let taskAccountDataJSON = await namespaceWrapper.getTaskState();

      if (taskAccountDataJSON == null) taskAccountDataJSON = _dummyTaskState;

      // console.log('Task Account Data', taskAccountDataJSON);

      const submissions = taskAccountDataJSON.submissions[round];
      const submissions_audit_trigger =
        taskAccountDataJSON.submissions_audit_trigger[round];

      if (submissions == null) {
        // console.log('No submisssions found in N-2 round');
        return distributionList;
      } else {
        const keys = Object.keys(submissions);
        const values = Object.values(submissions);
        const size = values.length;
        // console.log('Submissions from last round: ', keys, values, size);

        // Logic for slashing the stake of the candidate who has been audited and found to be false
        for (let i = 0; i < size; i++) {
          const candidatePublicKey = keys[i];
          if (
            submissions_audit_trigger &&
            submissions_audit_trigger[candidatePublicKey]
          ) {
            // console.log(
            //   'distributions_audit_trigger votes ',
            //   submissions_audit_trigger[candidatePublicKey].votes,
            // );
            const votes = submissions_audit_trigger[candidatePublicKey].votes;
            if (votes.length === 0) {
              // slash 70% of the stake as still the audit is triggered but no votes are casted
              // Note that the votes are on the basis of the submission value
              // to do so we need to fetch the stakes of the candidate from the task state
              const stake_list = taskAccountDataJSON.stake_list;
              const candidateStake = stake_list[candidatePublicKey];
              const slashedStake = candidateStake * 0.7;
              distributionList[candidatePublicKey] = -slashedStake;
              // console.log('Candidate Stake', candidateStake);
            } else {
              let numOfVotes = 0;
              for (let index = 0; index < votes.length; index++) {
                if (votes[index].is_valid) numOfVotes++;
                else numOfVotes--;
              }

              if (numOfVotes < 0) {
                // slash 70% of the stake as the number of false votes are more than the number of true votes
                // Note that the votes are on the basis of the submission value
                // to do so we need to fetch the stakes of the candidate from the task state
                const stake_list = taskAccountDataJSON.stake_list;
                const candidateStake = stake_list[candidatePublicKey];
                const slashedStake = candidateStake * 0.7;
                distributionList[candidatePublicKey] = -slashedStake;
                // console.log('Candidate Stake', candidateStake);
              }

              if (numOfVotes > 0) {
                distributionCandidates.push(candidatePublicKey);
              }
            }
          } else {
            distributionCandidates.push(candidatePublicKey);
          }
        }
      }

      // now distribute the rewards based on the valid submissions
      // Here it is assumed that all the nodes doing valid submission gets the same reward

      const reward =
        taskAccountDataJSON.bounty_amount_per_round /
        distributionCandidates.length;
      // console.log('REWARD RECEIVED BY EACH NODE', reward);
      for (let i = 0; i < distributionCandidates.length; i++) {
        distributionList[distributionCandidates[i]] = reward;
      }

      // console.log('Distribution List', distributionList);

      return distributionList;
    } catch (err) {
      console.log("ERROR IN GENERATING DISTRIBUTION LIST", err);
    }
    // This function indexes a list of submissions, scores each of them, and returns a final reward for each submitter pubkey
    let distributionList = [];

    return distributionList;
  };

  // NOTE: There is no need for a 'validateDistribution' function, as distributions are fully deterministic based on the data submitted on-chain
  // In some cases a distribution may require special validation, in which case coreLogic.js can be edited directly
}

module.exports = Linktree;

/* File: webpack.config.js */
module.exports = {
  entry: "./index.js",
  target: "node",
  // When uploading to arweave use the production mode
  // mode:"production",
  mode: "development",
  devtool: "source-map",
  optimization: {
    usedExports: false, // <- no remove unused function
  },
  stats: {
    moduleTrace: false,
  },
  node: {
    __dirname: true,
  },
};
