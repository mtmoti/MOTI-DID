require('dotenv').config();
const db = require('../database/db_model');
const { namespaceWrapper } = require('@_koii/namespace-wrapper');

// Define the postStakingPublicKey function
const postStakingPublicKey = async () => {
  try {
    console.log('::: CALLING POST STAKING PUBLIC KEY :::');
    const getTaskID = process.env.MOTI_SCRAPER_TASK;
    if (typeof getTaskID !== 'string' || getTaskID.trim() === '') {
      console.log('Invalid or missing getTaskID environment variable');
      return;
    }

    // get the task using the task state ID
    const getInfo = await namespaceWrapper.getTaskStateById(getTaskID, 'KOII', {
      is_submission_required: false,
      is_distribution_required: false,
      is_available_balances_required: false,
      is_stake_list_required: true,
    });

    // if it is empty then make sure log error and return it
    if (
      getInfo == null ||
      typeof getInfo !== 'object' ||
      Array.isArray(getInfo) ||
      Object.keys(getInfo).length === 0 ||
      !('stake_list' in getInfo) ||
      !('ip_address_list' in getInfo)
    ) {
      console.log('Invalid or missing getInfo object');
      return;
    }

    // add the staking public keys
    const { stake_list: stakeList } = getInfo;
    const stakingKeys = Object.keys(stakeList);
    const getAllStakingKey = db.getScraperPublicKey();
    const allUniqueKeys = Array.from(
      new Set([...stakingKeys, ...getAllStakingKey]),
    );

    await db.setScraperPublicKey(getTaskID, allUniqueKeys);

    console.log('Successfully Added');
    return;
  } catch (error) {
    console.error('Error:', error.message);
    return;
  }
};

module.exports = postStakingPublicKey;
