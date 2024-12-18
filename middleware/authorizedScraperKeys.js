const db = require('../database/db_model');

const authorizedScraperKeysMiddleware = async (req, res, next) => {
  try {
    const validKeys = await db.getScraperPublicKey();

    if (validKeys.length === 0) {
      return res
        .status(403)
        .json({ error: 'Forbidden: No valid API keys available' });
    }

    const apiKey = req.headers['x-api-key'];
    const isValidKey = validKeys.some(keys => keys === apiKey);

    if (isValidKey) {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }
  } catch (error) {
    console.error('Error checking API key:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = authorizedScraperKeysMiddleware;
