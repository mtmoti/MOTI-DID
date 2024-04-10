const axios = require('axios');
require('dotenv').config();

// Delete
async function deletePayload(path) {
  try {
    const response = await axios.delete(path);
    return response;
  } catch (error) {
    return error.response;
  }
}

describe('Delete linktree API', () => {
  let publicKey = '8vo9Myt88WM2tHrneR3Q3uxpmE7edAzvpo34hZUzGoWe';
  let path;

  beforeAll(() => {
    if (process.env.ENVIRONMENT === 'development') {
      path = `http://localhost:10000/linktree/`;
    } else {
      path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree/`;
    }
  });

  test('Deleting linktree payload - Success', async () => {
    const response = await deletePayload(path + publicKey);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  test('Deleting linktree payload - Not Found', async () => {
    const response = await deletePayload(path);
    expect(response.status).toBe(404);
    expect(response.data).toBeDefined();
  });
});
