const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
require('dotenv').config();

// Get All LinkTree
async function getAllLinktree(path) {
  try {
    const response = await axios.get(path);
    return response;
  } catch (error) {
    return error.response;
  }
}

describe('Create linktree API', () => {
  let path;

  beforeAll(() => {
    if (process.env.ENVIRONMENT === 'development') {
      path = `http://localhost:10000/linktree/list`;
    } else {
      path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree/list`;
    }
  });

  test('Get All linktree - Success', async () => {
    const response = await getAllLinktree(path);
    expect(response.status).toBe(200);
    console.log(response.data);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length === 0 || response.data.length > 0).toBe(true);
  });
});
