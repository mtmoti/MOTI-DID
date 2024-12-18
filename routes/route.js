const express = require('express');
const router = express.Router();
const controllers = require('../controllers/controller');
const authorizedScraperKeysMiddleware = require('../middleware/authorizedScraperKeys');
const authorizedBlockedIPsMiddleware = require('../middleware/blockedIPs');

// // for the caching
// router.use((req, res, next) => {
//   res.setHeader('Cache-Control', 'public, max-age=30, must-revalidate');
//   next();
// });

router.get('/taskState', controllers.taskState);

// create linktree
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

// ******************** get request using the username ******************************
router.get(
  '/linktree/get/username/:username/links',
  controllers.getUsernameLinks,
);
router.get(
  '/linktree/get/username/:username/mySocials',
  controllers.getUsernameMySocial,
);
router.get(
  '/linktree/get/username/:username/myWallets',
  controllers.getUsernameMyWallet,
);
router.get(
  '/linktree/get/username/:username/endorsements',
  controllers.getUsernameDIDEndorsements,
);

// get LinkTree With Email Address
// router.get(
//   '/linktree/get/emailAddress/:emailAddress',
//   controllers.getLinkTreeWithEmailAddress,
// );

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

// get the image
router.get('/img/:publicKey', controllers.getImage);
router.post('/img/:publicKey', controllers.postImage);

// =============================== ENDORSEMENT  ===============================
// post to the endorsement
router.post('/endorsement/create', controllers.createEndorsement);
// get from the receipt public key for the endorsement
router.get('/endorsement/:publicKey', controllers.getEndorsement);
// get all endorsement
router.get('/endorsement/list/all', controllers.getEndorsementList);
// delete specific endorsement
router.delete(
  '/deleteEndorsement/:endorsementID',
  controllers.deleteEndorsement,
);
// get all endorsement proofs
router.get('/endorsement/proofs/all', controllers.getAllEndorsementProofs);
// get proofs with the publicKey
router.get(
  '/endorsement/proofs/get/:endorsementID',
  controllers.getEndorsementProofsWithPublicKey,
);
// get all node proof
router.get('/endorsement/node-proof/all', controllers.nodeProofAllEndorsement);
// get node proof with rounds
router.get(
  '/endorsement/node-proof/:round',
  controllers.nodeProofWithRoundsEndorsement,
);
// get authList with public key
router.get(
  '/endorsement/authlist/get/:endorsementID',
  controllers.getAuthListEndorsementWithPublicKey,
);
// get all authList
router.get('/endorsement/authlist/list', controllers.getAllAuthListEndorsement);
// get the authlist and set the public key
router.post('/endorsement/authlist', controllers.postAuthListEndorsement);

// ******************** CONNECTED WITH THE Moti Scraper Task ******************************

// get and post for the pending profiles
router.get('/pendingProfile/list/all', controllers.getPendingProfile);
router.post('/pendingProfile/create', controllers.createPendingProfile);

// adding the middleware and also create pending endorsement
router.post(
  '/pendingEndorsement/create',
  authorizedScraperKeysMiddleware,
  authorizedBlockedIPsMiddleware,
  controllers.createPendingEndorsement,
);

// list all the pending endorsement
router.post(
  '/pendingEndorsement/list/all',
  controllers.getAllPendingEndorsementList,
);

// delete the pending endorsement
router.delete(
  '/deletePendingEndorsement/:endorsementID',
  controllers.deletePendingEndorsement,
);

// get all teh staking public keys
router.get('/stakingPublicKey/list/all', controllers.getAllScraperPublicKey);

// verify telegram
router.get('/api/verifyTelegram', controllers.verifyTelegram);

module.exports = router;

// -----------------------------------------------------------
// router.post('/register-authlist', async (req, res) => {
//   const pubkey = req.body.pubkey;
//   await db.setAuthList(pubkey);
//   return res.status(200).send({message: 'Authlist registered successfully'});
// })

// endpoint for specific linktree data by publicKey
// router.get('/linktree/get', async (req, res) => {
//   const log = 'Nothing to see here, check /:publicKey to get the linktree';
//   return res.status(200).send(log);
// });
