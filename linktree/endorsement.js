const db = require('../database/db_model');
const Endorsement_task = require('./endorsement_task');
const Endorsement_validate = require('./endorsement_validate');

/**
 * @class Endorsement
 * @description
 * Endorsement is a class that contains all the logic for a task.
 * It is instantiated by the task runner, and is passed a database to store data in.
 *
 *
 * 1. task() -> generates submission data to local db
 * 2. generateSubmissionCID() -> uploads submission data to IPFS and returns CID
 * 3. validateSubmissionCID() -> validates submission data by replicating the process of creating it
 * 4. generateDistribution() -> scores submissions and distributes rewards
 * */
class Endorsement {
  // Tasks produce submissions and log them to a LOCAL database
  task = async () => {
    console.log('*********task() started Endorsement*********');
    const endorsementJson = await Endorsement_task();
    console.log('*********task() completed Endorsement*********');
    return endorsementJson;
  };

  // To prove work, each node will submit it's 'submission' at the end of the round, by collecting data from it's Local Database and uploading to IPFS
  generateSubmissionCID = async round => {
    console.log('***********IN FETCH SUBMISSION Endorsement**************');
    let proof_cid = await db.getNodeProofCidEndorsement(round); // retrieves the cid
    return proof_cid;
  };

  // Each submission can be validated by replicating the process of creating it
  validateSubmissionCID = async (submission_value, round) => {
    console.log('Received submission_value', submission_value, round);
    const vote = await Endorsement_validate(submission_value, round);
    console.log('Vote', vote);
    return vote;
  };
}

module.exports = Endorsement;
