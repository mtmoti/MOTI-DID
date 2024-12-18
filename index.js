// For testing
// const localShim = require("./localTestingShim");
const dbSharing = require('./database/dbSharing');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { coreLogic } = require('./coreLogic');
const {
  namespaceWrapper,
  taskNodeAdministered,
  app,
} = require('@_koii/namespace-wrapper');
const cookieSession = require('cookie-session');
const routes = require('./routes/route');
const postStakingPublicKey = require('./controllers/postStakingPublicKeys');
let isRunning = false;

/**
 * setup
 * @description sets up the task node, particularly the inter-process communication to start and stop the task
 * @returns {void}
 */
async function setup() {
  console.log('setup function called');
  // Run default setup
  await namespaceWrapper.defaultTaskSetup();
  process.on('message', m => {
    try {
      console.log('CHILD got message:', m);
      if (m.functionCall == 'submitPayload') {
        console.log('submitPayload called');
        coreLogic.submitTask(m.roundNumber);
      } else if (m.functionCall == 'auditPayload') {
        console.log('auditPayload called');
        coreLogic.auditTask(m.roundNumber);
      } else if (m.functionCall == 'executeTask') {
        console.log('executeTask called');
        coreLogic.task(m.roundNumber);
      } else if (m.functionCall == 'generateAndSubmitDistributionList') {
        // TODO FIX THIS NO DISTRIBUTION THIS TIME
        console.log('generateAndSubmitDistributionList called');
        coreLogic.selectAndGenerateDistributionList(
          m.roundNumber,
          m.isPreviousRoundFailed,
        );
      } else if (m.functionCall == 'distributionListAudit') {
        // TODO FIX THIS FUNCTION
        console.log('distributionListAudit called');
        coreLogic.auditDistribution(m.roundNumber, m.isPreviousRoundFailed);
      }
    } catch (e) {
      console.error(e);
    }
  });

  setInterval(async () => {
    if (isRunning) {
      console.log('Previous execution is still running, skipping!!');
      return;
    }
    isRunning = true;
    try {
      dbSharing.getNodeUrls();
    } catch (error) {
      console.error('Error running functions in parallel:', error);
    } finally {
      isRunning = false;
    }
  }, 2 * 60 * 1000);

  // every 5 mins call this function to get the staking keys
  // setInterval(postStakingPublicKey, 300000);
}

if (taskNodeAdministered) {
  setup();
}

if (app) {
  app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
  app.use(bodyParser.json({ limit: '200mb' }));
  app.use(bodyParser.text({ limit: '200mb', type: 'text/plain' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));
  app.use(express.json({ limit: '200mb' }));
  app.use(express.text({ limit: '200mb', type: 'text/plain' }));

  app.use(
    cors({
      origin: function (origin, callback) {
        callback(null, true);
      },
      credentials: true,
    }),
  );
  app.set('trust proxy', 1);
  app.use(
    cookieSession({
      name: 'motisession',
      keys: ['your-secret-key-1', 'your-secret-key-2'],
      maxAge: 4 * 60 * 60 * 1000,
      domain: '.moti.bio',
      secure: false,
      httpOnly: false,
    }),
  );
  app.use((req, res, next) => {
    req.sessionOptions.maxAge = req.session.maxAge || req.sessionOptions.maxAge;
    if (!req.session.views) {
      req.session.views = 0;
    }
    req.session.views += 1;
    next();
  });
  app.use('/', routes);
}
