const { namespaceWrapper } = require('./namespaceWrapper');
const Linktree = require('../linktree');
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
    return await this.linktree.generateDistribution(round, _dummyTaskState);
  }

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

  async submitDistributionList(round) {
    console.log('SUBMIT DISTRIBUTION LIST CALLED WITH ROUND', round);
    try {
      const distributionList = await this.generateDistributionList(round);
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

  // this function is called when a node is selected to validate the submission value
  validateNode = async (submission_value, round) => {
    try {
      return await this.linktree.validateSubmissionCID(submission_value, round);
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  async shallowEqual(parsed, generateDistributionList) {
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

    generateDistributionList = JSON.parse(
      JSON.stringify(generateDistributionList),
    );

    const keys1 = Object.keys(parsed);
    const keys2 = Object.keys(generateDistributionList);

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
        fetchedDistributionList = _dummyDistributionList;
      } else {
        fetchedDistributionList = JSON.parse(rawDistributionList);
      }

      // console.log('FETCHED DISTRIBUTION LIST', fetchedDistributionList);
      const generateDistributionList = await this.generateDistributionList(
        round,
        _dummyTaskState,
      );

      // compare distribution list

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

  async submitTask(roundNumber) {
    console.log('submitTask called with round', roundNumber);
    try {
      console.log('inside try');
      console.log(
        await namespaceWrapper.getSlot(),
        'current slot while calling submit',
      );
      const submission = await this.fetchSubmission(roundNumber);

      if (!submission) return;

      // console.log('SUBMISSION', submission);
      // submit the submission to the K2
      await namespaceWrapper.checkSubmissionAndUpdateRound(
        submission,
        roundNumber,
      );
      console.log('after the submission call');
    } catch (error) {
      console.log('error in submission', error);
    }
  }

  async auditTask(roundNumber) {
    console.log('auditTask called with round', roundNumber);
    console.log(
      await namespaceWrapper.getSlot(),
      'current slot while calling auditTask',
    );
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNode,
      roundNumber,
    );
  }

  async auditDistribution(roundNumber, isPreviousRoundFailed) {
    console.log('auditDistribution called with round', roundNumber);
    await namespaceWrapper.validateAndVoteOnDistributionList(
      this.validateDistribution,
      roundNumber,
      isPreviousRoundFailed,
    );
  }
}
const coreLogic = new CoreLogic();

module.exports = coreLogic;
