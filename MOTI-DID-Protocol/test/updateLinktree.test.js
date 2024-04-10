const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
require('dotenv').config();

// update linktree payload
function updatePayload() {
  const data = {
    uuid: 'a093c2a2-9d96-4fa8-97d6-fde3d58dde6e',
    linktree: {
      name: 'Update Linktree test',
      description: 'Linktree test description',
      image:
        'https://www.koii.network/_next/image?url=%2FKoiiNetwork-logo_128.png&w=48&q=75',
      background: '',
      links: [
        {
          key: 'official',
          label: 'Koii Network',
          redirectUrl: 'https://www.koii.network/',
        },
      ],
    },
    timestamp: Date.now(),
  };

  const keyPair = nacl.sign.keyPair();
  const privateKey = keyPair.secretKey;
  const messageUint8Array = new Uint8Array(Buffer.from(JSON.stringify(data)));
  const signedMessage = nacl.sign(messageUint8Array, privateKey);
  const signature = signedMessage.slice(0, nacl.sign.signatureLength);
  const sign = bs58.encode(signature);

  return {
    data,
    publicKey: '27rKrPfsTo1VPbGQQpgQJbyhkhFh3wGeXdeCDzLs6y1K',
    signature: sign,
    username: 'linkTree_test',
  };
}

function invalidSignaturePayload() {
  const keyPair = nacl.sign.keyPair();
  const publicKey = keyPair.publicKey;

  const data = {
    uuid: uuidv4(),
    linktree: {
      name: 'Linktree test',
      description: 'Linktree test description',
      image:
        'https://www.koii.network/_next/image?url=%2FKoiiNetwork-logo_128.png&w=48&q=75',
      background: '',
      links: [
        {
          key: 'official',
          label: 'Koii Network',
          redirectUrl: 'https://www.koii.network/',
        },
        {
          key: 'website',
          label: 'Koii Docs',
          redirectUrl: 'https://docs.koii.network/',
        },
      ],
    },
    timestamp: Date.now(),
  };

  const pubkey = bs58.encode(publicKey);

  return {
    data,
    publicKey: pubkey,
    signature: '',
    username: 'linkTree_test',
  };
}

// Post payload to given path
async function putPayload(path, payload) {
  try {
    const response = await axios.put(path, { payload });
    return response;
  } catch (error) {
    return error.response;
  }
}

describe('update linktree API', () => {
  let path;

  beforeAll(() => {
    if (process.env.ENVIRONMENT === 'development') {
      path = `http://localhost:10000/linktree`;
    } else {
      path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree`;
    }
  });

  // this need to be fix
  test('Updating linktree payload - Success', async () => {
    const payload = updatePayload();
    const response = await putPayload(path, payload);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  test('Updating linktree payload - 404 Not Found', async () => {
    const invalidPath = `${path}/invalid`;
    const payload = updatePayload();
    const response = await putPayload(invalidPath, payload);
    expect(response.status).toBe(404);
  });

  test('Updating linktree payload - 400 Bad Request', async () => {
    const invalidPayload = {};
    const response = await putPayload(path, invalidPayload);
    expect(response.status).toBe(400);
  });

  test('Updating linktree payload - Invalid signature', async () => {
    const payload = invalidSignaturePayload();
    const response = await putPayload(path, payload);
    expect(response.status).toBe(400);
    console.log(response.data);
    expect(response.data).toBeDefined();
  });
});
