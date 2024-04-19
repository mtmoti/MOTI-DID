const express = require('express');
const router = express.Router();
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const controllers = require('../controllers/controller');

router.use(cors());
router.use(bodyParser.json());

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

router.get('/taskState', controllers.taskState);

// API to register the linktree
router.post('/linktree', controllers.createLinkTree);

// get all linktree
router.get('/linktree/list', controllers.getLinkTrees);

// delete linktree with the publicKey
router.delete('/linktree/:publicKey', controllers.deleteLinkTrees);

// update the linktree
router.put('/linktree', controllers.updateLinkTree);

// get LinkTree With PublicKey
router.get('/linktree/get/:publicKey', controllers.getLinkTreeWithPublicKey);

// get LinkTree With username
router.get(
  '/linktree/get/username/:username',
  controllers.getLinkTreeWithUsername,
);

// get LinkTree With signature
router.get(
  '/linktree/get/signature/:signature',
  controllers.getLinkTreeWithSignature,
);

// get all proofs
router.get('/proofs/all', controllers.getAllProofs);

// get proofs with the publicKey
router.get('/proofs/get/:publicKey', controllers.getProofsWithUsername);

// get all node proof
router.get('/node-proof/all', controllers.nodeProofAll);

// get node proof with rounds
router.get('/node-proof/:round', controllers.nodeProofWithRounds);

// get authList with public key
router.get('/authlist/get/:publicKey', controllers.getAuthListWithPublicKey);

// get all authList
router.get('/authlist/list', controllers.getAllAuthList);

// get the authlist and set the public key
router.post('/authlist', controllers.postAuthList);

// get the node url
router.get('/nodeurl', controllers.getNodeUrl);

// get logs.txt
router.get('/logs', async (req, res) => {
  const logs = fs.readFileSync('./namespace/logs.txt', 'utf8');
  res.status(200).send(logs);
});

// get the image
router.get('/img/:publicKey', controllers.getImage);
router.post('/img/:publicKey', controllers.postImage);

// router.post('/register-authlist', async (req, res) => {
//   const pubkey = req.body.pubkey;
//   await db.setAuthList(pubkey);
//   return res.status(200).send({message: 'Authlist registered successfully'});
// }
// )

// endpoint for specific linktree data by publicKey
// router.get('/linktree/get', async (req, res) => {
//   const log = 'Nothing to see here, check /:publicKey to get the linktree';
//   return res.status(200).send(log);
// });

module.exports = router;
