const axios = require('axios');
require('dotenv').config();

// describe('update linktree API', () => {
// let path;

// beforeAll(() => {
//   if (process.env.ENVIRONMENT === 'development') {
//     path = `http://localhost:10000/linktree`;
//   } else {
//     path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree`;
//   }
// });

//   // this need to be fix
//   test('Updating linktree payload - Success', async () => {
//     const payload = updatePayload();
//     const response = await putPayload(path, payload);
//     expect(response.status).toBe(200);
//     expect(response.data).toBeDefined();
//   });

//   test('Updating linktree payload - 404 Not Found', async () => {
//     const invalidPath = `${path}/invalid`;
//     const payload = updatePayload();
//     const response = await putPayload(invalidPath, payload);
//     expect(response.status).toBe(404);
//   });

//   test('Updating linktree payload - 400 Bad Request', async () => {
//     const invalidPayload = {};
//     const response = await putPayload(path, invalidPayload);
//     expect(response.status).toBe(400);
//   });

//   test('Updating linktree payload - Invalid signature', async () => {
//     const payload = invalidSignaturePayload();
//     const response = await putPayload(path, payload);
//     expect(response.status).toBe(400);
//     console.log(response.data);
//     expect(response.data).toBeDefined();
//   });
// });

// Post Auth list to given path
async function postPayload(path, payload) {
  try {
    const response = await axios.post(path, payload);
    return response;
  } catch (error) {
    return error.response;
  }
}

describe('POST AUTH LIST', () => {
  let path;

  beforeAll(() => {
    if (process.env.ENVIRONMENT === 'development') {
      path = `http://localhost:10000/authlist`;
    } else {
      path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/authlist`;
    }
  });

  it('submits linktrees from different publicKey to the service and stores in localdb', async () => {
    const pubkey = '8vo9Myt88WM2tHrneR3Q3uxpmE7edAzvpo34hZUzGoWeaa';
    const authdata = { pubkey };
    const response = await postPayload(path, { authdata });
    console.log(response.data);
    console.log(response.status);
    console.log(response);

    expect(response.status).toBe(200);
    expect(response.data).toBe('Auth list pubkey set successfully');
  });
});
