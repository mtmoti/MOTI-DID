// const { namespaceWrapper } = require('../../environment/namespaceWrapper');
// const axios = require('axios');
// require('dotenv').config();
// const crypto = require('crypto');

// // Function to create a valid endorsement payload
// async function createEndorsementPayload(
//   title,
//   description,
//   image,
//   recipient_public,
// ) {
//   const endorsementId = crypto.randomBytes(16).toString('hex');
//   const endorsement = {
//     issuer: namespaceWrapper.testingMainSystemAccount.publicKey.toBase58(),
//     issuer_name: 'moti',
//     recipient: recipient_public,
//     meta: {
//       title: title,
//       description: description,
//       image: image,
//     },
//     endorsementId,
//   };

//   const signature = await namespaceWrapper.payloadSigning(endorsement);

//   endorsement.signature = signature;

//   return {
//     endorsement,
//     signature,
//   };
// }
// // Function to post payload to given path
// async function postPayload(path, payload) {
//   try {
//     const response = await axios.post(path, payload);
//     return response;
//   } catch (error) {
//     return error.response;
//   }
// }

// describe('Create Endorsement API', () => {
//   let path;

//   beforeAll(() => {
//     if (process.env.ENVIRONMENT === 'development') {
//       path = `http://localhost:10000/endorsement/create`;
//     }
//   });

//   test('Posting endorsement payload - Success', async () => {
//     const payload = createEndorsementPayload(
//       'VIP Member', // title
//       'Membership endorsement', // description
//       'IMAGE CID', //image cid
//       '8vo9Myt88WM2tHrneR3Q3uxpmE7edAzvpo34hZUzGoWe', //receipt public key
//     );
//     const response = await postPayload(path, payload);
//     expect(response.status).toBe(200);
//     expect(response.data).toBeDefined();
//   });
// });
