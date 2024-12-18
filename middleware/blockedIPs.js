const db = require('../database/db_model');

const blockedIPs = async (req, res, next) => {
  try {
    // this needs to be updated with respect to the blocked IPs
    // const validKeys = await db.getScraperPublicKey();
    // if (validKeys.length === 0) {
    //   return res
    //     .status(403)
    //     .json({ error: 'Forbidden: No valid API keys available' });
    // }
    // const apiKey = req.headers['x-api-key'];
    // const isValidKey = validKeys.some(keys => keys === apiKey);
    // if (isValidKey) {
    //   next();
    // } else {
    //   res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    // }
  } catch (error) {
    console.error('Error checking API key:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = blockedIPs;
