/**
 * This is the main file for the task-template-linktree.
 *
 * This task is a simple example of a task that can be run on the K2 network.
 * The task is to store the linktree data, which is a list of links to social media profiles.
 * The task is run in rounds, and each round, each node submits a linktree.
 *
 *
 */

const coreLogic = require('./environment/coreLogic');
const dbSharing = require('./database/dbSharing');
// const localShim = require("./localTestingShim"); // TEST to enable testing with K2 without round timers, enable this line and line 59
const { app } = require('./environment/init');
const express = require('express');
const {
  namespaceWrapper,
  taskNodeAdministered,
} = require('./environment/namespaceWrapper');
const routes = require('./routes/route');
let isRunning = false;

async function setup() {
  /*######################################################
  ################## DO NOT EDIT BELOW #################
  ######################################################*/
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
        console.log('generateAndSubmitDistributionList called');
        coreLogic.selectAndGenerateDistributionList(
          m.roundNumber,
          m.isPreviousRoundFailed,
        );
      } else if (m.functionCall == 'distributionListAudit') {
        console.log('distributionListAudit called');
        coreLogic.auditDistribution(m.roundNumber, m.isPreviousRoundFailed);
      }
    } catch (e) {
      console.error(e);
    }
  });
  /*######################################################
  ################ DO NOT EDIT ABOVE ###################
  ######################################################*/

  setInterval(async () => {
    if (isRunning) {
      console.log('Previous execution is still running, skipping!!');
      return;
    }
    isRunning = true;
    try {
      await Promise.all([dbSharing.share(), dbSharing.shareEndorsement()]);
      console.log('Both functions completed successfully.');
    } catch (error) {
      console.error('Error running functions in parallel:', error);
    } finally {
      isRunning = false;
      console.log('isRunning:: false');
    }
  }, 2 * 60 * 1000);
}

if (taskNodeAdministered) {
  setup();
}

if (app) {
  app.use(express.json({ limit: '50mb' }));
  app.use('/', routes);
}
