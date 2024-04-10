const axios = require('axios');
require('dotenv').config();

// Get All LinkTree
async function getLinkTreeWithPublicKey(path) {
  try {
    const response = await axios.get(path);
    return response;
  } catch (error) {
    return error.response;
  }
}

describe('Get linktree API', () => {
  let path;

  beforeAll(() => {
    if (process.env.ENVIRONMENT === 'development') {
      path = `http://localhost:10000/linktree/get/`;
    } else {
      path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree/get/`;
    }
  });

  let publicKey = '27rKrPfsTo1VPbGQQpgQJbyhkhFh3wGeXdeCDzLs6y1K';

  test('Get LinkTree - Success', async () => {
    const response = await getLinkTreeWithPublicKey(path + publicKey);

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(typeof response.data).toBe('object');
    expect(Object.keys(response.data).length).toBeGreaterThan(0);
  });

  test('Get LinkTree - Not Found', async () => {
    // Assuming the publicKey is non-existent or invalid
    const nonExistentPublicKey = 'wefwefsTo1VPbGQQpgQJbyhkhFh3wGeXdeCDzLs6y1K';
    const response = await getLinkTreeWithPublicKey(
      path + nonExistentPublicKey,
    );
    expect(response.status).toBe(404);
    expect(response.data).toBe('Linktree Not Found');
  });
});
