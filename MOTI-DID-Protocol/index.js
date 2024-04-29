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

async function setup() {
  console.log('setup function called');
  // Run default setup
  await namespaceWrapper.defaultTaskSetup();
  process.on('message', m => {
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
      coreLogic.submitDistributionList(m.roundNumber);
    } else if (m.functionCall == 'distributionListAudit') {
      console.log('distributionListAudit called');
      coreLogic.auditDistribution(m.roundNumber);
    }
  });

  // Code for the data replication among the nodes
  setInterval(() => {
    dbSharing.share();
  }, 3 * 60 * 1000);
}

if (taskNodeAdministered) {
  setup();
}

if (app) {
  app.use(express.json({ limit: '50mb' }));
  app.use('/', routes);
}
