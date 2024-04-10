// jest.setup.js

const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { v4: uuidv4 } = require('uuid');

// Generate key pair
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

// Store generated values in global variables
global.generatedData = {
  data,
  publicKey: pubkey,
  signature: sign,
  username: 'linkTree_test',
};
