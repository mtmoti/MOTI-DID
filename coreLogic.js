const dotenv = require('dotenv');
dotenv.config();
const { namespaceWrapper, TASK_ID } = require('@_koii/namespace-wrapper');
const Linktree = require('./linktree/linktree');
const Endorsement = require('./linktree/endorsement');
// for the storage
const { KoiiStorageClient } = require('@_koii/storage-task-sdk');
const { createWriteStream, existsSync, unlinkSync } = require('fs');
const db = require('./database/db_model');

class CoreLogic {
  constructor() {
    this.linktree = new Linktree();
    this.endorsement = new Endorsement();
  }

  async task(roundNumber) {
    // get the json linktree
    const linktreePromise = this.linktree.task().catch(error => {
      console.error('Linktree task failed:', error);
      return {};
    });

    // get the json of the endorsement
    const endorsementPromise = this.endorsement.task().catch(error => {
      console.error('Endorsement task failed:', error);
      return {};
    });

    // wait to get the both of the result
    const [linktreeResult, endorsementResult] = await Promise.all([
      linktreePromise,
      endorsementPromise,
    ]);

    // if both are empty then just return it
    if (
      Object.keys(linktreeResult).length === 0 &&
      Object.keys(endorsementResult).length === 0
    ) {
      return;
    }

    // get result and Create a 1 json object for both the results
    const combinedJson = {
      linktree: linktreeResult,
      endorsement: endorsementResult,
    };

    // update to the ipfs an object of the linktree and Endorsement on KoiiStorageClient
    let fileUploadResponseCID;
    try {
      // check if exists then delete the file
      if (existsSync(`namespace/${TASK_ID}/proofs.json`)) {
        unlinkSync(`namespace/${TASK_ID}/proofs.json`);
      }

      const gameSalesJson = JSON.stringify(combinedJson, null, 2);
      const buffer = Buffer.from(gameSalesJson, 'utf8');

      // create the path and write a file
      const writer = createWriteStream(`namespace/${TASK_ID}/proofs.json`);
      writer.write(buffer);
      writer.end();

      const client = new KoiiStorageClient(undefined, undefined, true);
      const userStaking = await namespaceWrapper.getSubmitterAccount();
      const fileUploadResponse = await client.uploadFile(
        `namespace/${TASK_ID}/proofs.json`,
        userStaking,
      );

      // check if exists then delete it
      if (existsSync(`namespace/${TASK_ID}/proofs.json`)) {
        unlinkSync(`namespace/${TASK_ID}/proofs.json`);
      }

      console.log('User proof uploaded to IPFS: ', fileUploadResponse.cid);

      fileUploadResponseCID = fileUploadResponse.cid;
    } catch (err) {
      console.log('Error submission_value', err);
      fileUploadResponseCID = '';
    }

    if (fileUploadResponseCID && fileUploadResponseCID.length > 0) {
      console.log('User proof uploaded to IPFS: ', fileUploadResponseCID);

      // store CID in levelDB
      await Promise.all([
        db.setNodeProofCid(roundNumber, fileUploadResponseCID),
        db.setNodeProofCidEndorsement(roundNumber, fileUploadResponseCID),
      ]);
    } else {
      console.log('CID NOT FOUND LINKTREE OR Endorsement FOR THE TASK');
    }
    return;
  }

  // ===================== SUBMIT TASK (SUBMISSION) =====================
  async fetchSubmission(roundNumber) {
    try {
      return await this.linktree.generateSubmissionCID(roundNumber);
    } catch (err) {
      console.log('Error', err);
      return null;
    }
  }
  async fetchSubmissionEndorsement(roundNumber) {
    try {
      return await this.endorsement.generateSubmissionCID(roundNumber);
    } catch (err) {
      console.log('Error', err);
      return null;
    }
  }
  async submitTask(roundNumber) {
    console.log('================ submitTask start ================');
    console.log('submitTask called with round', roundNumber);
    try {
      console.log('inside try');
      console.log(
        await namespaceWrapper.getSlot(),
        'current slot while calling submit',
      );

      const submissionPromise = this.fetchSubmission(roundNumber);
      const submissionEndorsementPromise =
        this.fetchSubmissionEndorsement(roundNumber);

      const [submission, submissionEndorsement] = await Promise.all([
        submissionPromise,
        submissionEndorsementPromise,
      ]);

      console.log('submission::::: ', submission);
      console.log('submissionEndorsement::::: ', submissionEndorsement);

      if (!submission && !submissionEndorsement) return;

      if (submission) {
        await namespaceWrapper.checkSubmissionAndUpdateRound(
          submission,
          roundNumber,
        );
      }

      if (submissionEndorsement) {
        await namespaceWrapper.checkSubmissionAndUpdateRound(
          submissionEndorsement,
          roundNumber,
        );
      }

      console.log('after the submission call');
      console.log('================ submitTask end ================');
    } catch (error) {
      console.log('error in submission', error);
      console.log('================ submitTask end ================');
    }
  }

  // ===================== AUDIT && validateNode =====================
  validateNode = async (submission_value, round) => {
    console.log('================ validateNode start ================');
    let vote;
    try {
      console.log('validateNode: ', submission_value, ' :: ', round);
      vote = await this.linktree.validateSubmissionCID(submission_value, round);
    } catch (e) {
      console.error(e);
      vote = false;
    }
    console.log(
      '================ validateNode end vote ================',
      vote,
    );
    return vote;
  };
  validateNodeEndorsement = async (submission_value, round) => {
    console.log(
      '================ validateNodeEndorsement start ================',
    );
    let vote;
    try {
      console.log('validateNodeEndorsement: ', submission_value, ' :: ', round);
      vote = await this.endorsement.validateSubmissionCID(
        submission_value,
        round,
      );
    } catch (e) {
      console.error(e);
      vote = false;
    }
    console.log(
      '================ validateNodeEndorsement end vote ================',
      vote,
    );
    return vote;
  };
  async auditTask(roundNumber) {
    console.log('================ auditTask start ================');
    console.log('auditTask called with round', roundNumber);
    console.log(
      await namespaceWrapper.getSlot(),
      'current slot while calling auditTask',
    );
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNode,
      roundNumber,
    );
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNodeEndorsement,
      roundNumber,
    );
    console.log('================ auditTask end ================');
  }
  async auditDistribution(roundNumber, isPreviousRoundFailed) {
    console.log('================ auditDistribution start ================');
    console.log('auditDistribution called with round', roundNumber);
    await namespaceWrapper.validateAndVoteOnDistributionList(
      this.validateDistribution,
      roundNumber,
    );
    console.log('================ auditDistribution end ================');
  }

  // ===================== Distribution =====================
  async generateDistributionList(round, _dummyTaskState) {
    return await this.linktree.generateDistribution(round, _dummyTaskState);
  }
  async submitDistributionList(round) {
    console.log('SubmitDistributionList called', round);
    try {
      const distributionList = await this.generateDistributionList(round);
      if (Object.keys(distributionList).length === 0) {
        console.log('NO DISTRIBUTION LIST GENERATED');
        return;
      }
      const decider = await namespaceWrapper.uploadDistributionList(
        distributionList,
        round,
      );
      console.log('DECIDER', decider);
      if (decider) {
        const response =
          await namespaceWrapper.distributionListSubmissionOnChain(round);
        console.log('RESPONSE FROM DISTRIBUTION LIST', response);
      }
    } catch (err) {
      console.log('ERROR IN SUBMIT DISTRIBUTION', err);
    }
  }
  async shallowEqual(parsed, generateDistributionList) {
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

    // Normalize key quote usage for generateDistributionList
    generateDistributionList = JSON.parse(
      JSON.stringify(generateDistributionList),
    );

    const keys1 = Object.keys(parsed);
    const keys2 = Object.keys(generateDistributionList);

    if (keys1.length !== keys2.length) {
      return false;
    }
    for (let key of keys1) {
      if (parsed[key] !== generateDistributionList[key]) {
        return false;
      }
    }

    return true;
  }
  validateDistribution = async (
    distributionListSubmitter,
    round,
    _dummyDistributionList,
    _dummyTaskState,
  ) => {
    try {
      console.log('Distribution list Submitter', distributionListSubmitter);
      const rawDistributionList = await namespaceWrapper.getDistributionList(
        distributionListSubmitter,
        round,
      );
      let fetchedDistributionList;
      if (rawDistributionList == null) {
        return true;
      } else {
        fetchedDistributionList = JSON.parse(rawDistributionList);
      }

      // console.log('FETCHED DISTRIBUTION LIST', fetchedDistributionList);
      const generateDistributionList = await this.generateDistributionList(
        round,
        _dummyTaskState,
      );

      // compare distribution list
      if (Object.keys(generateDistributionList).length === 0) {
        console.log('UNABLE TO GENERATE DISTRIBUTION LIST');
        return true;
      }

      const parsed = fetchedDistributionList;
      // console.log(
      //   'compare distribution list',
      //   parsed,
      //   generateDistributionList,
      // );
      const result = await this.shallowEqual(parsed, generateDistributionList);
      console.log('RESULT', result);
      return result;
    } catch (err) {
      console.log('ERROR IN VALIDATING DISTRIBUTION', err);
      return true;
    }
  };
  async selectAndGenerateDistributionList(
    round,
    isPreviousRoundFailed = false,
  ) {
    await namespaceWrapper.selectAndGenerateDistributionList(
      this.submitDistributionList,
      round,
      isPreviousRoundFailed,
    );
  }
}

const coreLogic = new CoreLogic();
module.exports = { coreLogic };
