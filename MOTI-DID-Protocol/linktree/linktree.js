const { namespaceWrapper } = require('../environment/namespaceWrapper');
const db = require('../database/db_model');
const linktree_task = require('./linktree_task');
const linktree_validate = require('./linktree_validate');
const { LAMPORTS_PER_SOL } = require('@_koi/web3.js');

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
  task = async round => {
    // run linktree task
    console.log('*********task() started*********');

    const proof_cid = await linktree_task();

    if (proof_cid) {
      await db.setNodeProofCid(round, proof_cid); // store CID in levelDB
    } else {
      console.log('CID NOT FOUND');
    }

    console.log('*********task() completed*********');
  };

  // To prove work, each node will submit it's 'submission' at the end of the round, by collecting data from it's Local Database and uploading to IPFS
  generateSubmissionCID = async round => {
    // fetching round number to store work accordingly
    console.log('***********IN FETCH SUBMISSION**************');
    // The code below shows how you can fetch your stored value from level DB
    let proof_cid = await db.getNodeProofCid(round); // retrieves the cid
    // console.log('Linktree proofs CID', proof_cid, 'in round', round);
    return proof_cid;
  };

  // Each submission can be validated by replicating the process of creating it
  validateSubmissionCID = async (submission_value, round) => {
    console.log('Received submission_value', submission_value, round);
    const vote = await linktree_validate(submission_value, round);
    console.log('Vote', vote);
    return vote;
  };

  // Once all submissions have been audited, they can be scored to distribute rewards
  generateDistribution = async (round, _dummyTaskState) => {
    try {
      console.log('GenerateDistributionList called');
      console.log('I am selected node');

      let distributionList = {};
      let distributionCandidates = [];
      let taskAccountDataJSON = null;
      let taskStakeListJSON = null;
      try {
        taskAccountDataJSON = await namespaceWrapper.getTaskSubmissionInfo(
          round,
          true,
        );
      } catch (error) {
        console.error('ERROR IN FETCHING TASK SUBMISSION DATA', error);
        return distributionList;
      }
      if (taskAccountDataJSON == null) {
        console.error('ERROR IN FETCHING TASK SUBMISSION DATA');
        return distributionList;
      }
      const submissions = taskAccountDataJSON.submissions[round];
      const submissions_audit_trigger =
        taskAccountDataJSON.submissions_audit_trigger[round];

      if (submissions == null) {
        console.log('No submisssions found in N-2 round');
        return distributionList;
      } else {
        const keys = Object.keys(submissions);
        const values = Object.values(submissions);
        const size = values.length;
        taskStakeListJSON = await namespaceWrapper.getTaskState({
          is_stake_list_required: true,
        });
        if (taskStakeListJSON == null) {
          console.error('ERROR IN FETCHING TASK STAKING LIST');
          return distributionList;
        }
        // Logic for slashing the stake of the candidate who has been audited and found to be false
        for (let i = 0; i < size; i++) {
          const candidatePublicKey = keys[i];
          if (
            submissions_audit_trigger &&
            submissions_audit_trigger[candidatePublicKey]
          ) {
            const votes = submissions_audit_trigger[candidatePublicKey].votes;
            if (votes.length === 0) {
              // slash 70% of the stake as still the audit is triggered but no votes are casted
              // Note that the votes are on the basis of the submission value
              // to do so we need to fetch the stakes of the candidate from the task state
              const stake_list = taskStakeListJSON.stake_list;
              const candidateStake = stake_list[candidatePublicKey];
              const slashedStake = candidateStake * 0.7;
              distributionList[candidatePublicKey] = -slashedStake;
              console.log('Candidate Stake', candidateStake);
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
                const stake_list = taskStakeListJSON.stake_list;
                const candidateStake = stake_list[candidatePublicKey];
                const slashedStake = candidateStake * 0.7;
                distributionList[candidatePublicKey] = -slashedStake;
                console.log('Candidate Stake', candidateStake);
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

      // test code to generate 1001 nodes
      // for (let i = 0; i < 1002; i++) {
      //   distributionCandidates.push(`element ${i + 1}`);
      // }

      console.log(
        'LENGTH OF DISTRIBUTION CANDIDATES',
        distributionCandidates.length,
      );

      //console.log("LENGTH", distributionCandidates.length);
      console.log('Bounty Amount', taskAccountDataJSON.bounty_amount_per_round);

      // const reward =
      //   taskAccountDataJSON.bounty_amount_per_round /
      //   distributionCandidates.length;
      // the reward is now fixed to 1 KOII per round per node
      const reward = 1 * LAMPORTS_PER_SOL;
      // console.log("REWARD PER NODE IN LAMPORTS", reward);
      // console.log("REWARD RECEIVED BY EACH NODE", reward);
      if (distributionCandidates.length < 20000) {
        for (let i = 0; i < distributionCandidates.length; i++) {
          distributionList[distributionCandidates[i]] = reward;
        }
      } else {
        // randomly select 1000 nodes
        const selectedNodes = [];

        while (selectedNodes.length < 20000) {
          const randomIndex = Math.floor(
            Math.random() * distributionCandidates.length,
          );
          const randomNode = distributionCandidates[randomIndex];
          if (!selectedNodes.includes(randomNode)) {
            selectedNodes.push(randomNode);
          }
          //console.log("selected Node length",selectedNodes.length);
          //console.log("SELECTED nodes ARRAY",selectedNodes);
        }
        for (let i = 0; i < selectedNodes.length; i++) {
          distributionList[selectedNodes[i]] = reward;
        }
      }
      // console.log('Distribution List', distributionList);
      return distributionList;
    } catch (err) {
      console.log('ERROR IN GENERATING DISTRIBUTION LIST', err);
    }
  };
}

module.exports = Linktree;
