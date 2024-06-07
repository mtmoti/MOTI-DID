const { namespaceWrapper } = require('./namespaceWrapper');
const Linktree = require('../linktree/linktree');
const Endorsement = require('../linktree/endorsement');

class CoreLogic {
  constructor() {
    this.linktree = new Linktree();
    this.endorsement = new Endorsement();
  }

  async task(roundNumber) {
    await Promise.all([
      this.linktree
        .task(roundNumber)
        .catch(error => console.error('Linktree task failed:', error)),
      this.endorsement
        .task(roundNumber)
        .catch(error => console.error('Endorsement task failed:', error)),
    ]);
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
    console.log('================ validateNode start ================');
    let vote;
    try {
      console.log('validateNode: ', submission_value, ' :: ', round);
      vote = await this.endorsement.validateSubmissionCID(
        submission_value,
        round,
      );
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
      this.validateNode,
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
      isPreviousRoundFailed,
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
      return false;
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
module.exports = coreLogic;
