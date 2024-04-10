const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
require('dotenv').config();

// Create linktree payload
function createPayload() {
  const keyPair = nacl.sign.keyPair();
  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.secretKey;

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

  const messageUint8Array = new Uint8Array(Buffer.from(JSON.stringify(data)));
  const signedMessage = nacl.sign(messageUint8Array, privateKey);
  const signature = signedMessage.slice(0, nacl.sign.signatureLength);
  const pubkey = bs58.encode(publicKey);
  const sign = bs58.encode(signature);

  return {
    data,
    publicKey: pubkey,
    signature: sign,
    username: 'linkTree_test',
  };
}

function invalidSignaturePayload() {
  const keyPair = nacl.sign.keyPair();
  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.secretKey;

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
    signature:
      'faefvawfxoxwxefswbef93hr2x933NUfooXjo7txMLxmWuvpyCTbh5v5faQai4CLNyJerSCwFRPdiQBLV9QWy9jMMRSrDaqWRKCB4fqjSQ6YrERUdwa',
    username: 'linkTree_test',
  };
}

// Post payload to given path
async function postPayload(path, payload) {
  try {
    const response = await axios.post(path, { payload });
    return response;
  } catch (error) {
    return error.response;
  }
}

describe('Create linktree API', () => {
  let path;

  beforeAll(() => {
    if (process.env.ENVIRONMENT === 'development') {
      path = `http://localhost:10000/linktree/`;
    } else {
      path = `https://k2-tasknet-ports-2.koii.live/task/HjWJmb2gcwwm99VhyNVJZir3ToAJTfUB4j7buWnMMUEP/linktree`;
    }
  });

  test('Posting linktree payload - Success', async () => {
    const payload = createPayload();
    const response = await postPayload(path, payload);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  test('Posting linktree payload - 404 Not Found', async () => {
    const invalidPath = `${path}/invalid`;
    const payload = createPayload();
    const response = await postPayload(invalidPath, payload);
    expect(response.status).toBe(404);
  });

  test('Posting linktree payload - 400 Bad Request', async () => {
    const invalidPayload = {};
    const response = await postPayload(path, invalidPayload);
    expect(response.status).toBe(400);
  });

  test('Posting linktree payload - User Name is Same', async () => {
    const payload = createPayload();
    const response = await postPayload(path, payload);
    expect(response.status).toBe(406);
    expect(response.data).toBeDefined();
  });

  test('Posting linktree payload - Invalid signature', async () => {
    const payload = invalidSignaturePayload();
    const response = await postPayload(path, payload);
    expect(response.status).toBe(400);
    console.log(response.data);
    expect(response.data).toBeDefined();
  });
});
