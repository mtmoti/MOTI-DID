const axios = require('axios');
// const { Web3Storage, getFilesFromPath } = require("web3.storage");
// const storageClient = new Web3Storage({
//   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGY0ODYxMzAzOTdDNTY1QzlDYTRCOTUzZTA2RWQ4NUI4MGRBQzRkYTIiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjYzNjU1OTk5MDMsIm5hbWUiOiJTb21hIn0.TU-KUFS9vjI9blN5dx6VsLLuIjJnpjPrxDHBvjXQUxw",
// });
const { KoiiStorageClient } = require('@_koii/storage-task-sdk');

module.exports = async cid => {
  console.log('============= LINKTREE VALIDATE ==================');
  console.log('CID', cid);
  try {
    const client = new KoiiStorageClient(undefined, undefined, true);
    const res = await client.getFile(cid, 'proofs.json');
    console.log('VALIDATE res: ', res);
    // const res = await storageClient.get(cid);
    if (!res.ok) {
      // voting false
      console.log('VOTE FALSE');
      console.log('SLASH VOTE DUE TO FAKE VALUE');
      return false;
    }
    return res;
    // const file = await res.files();
    // console.log('FILE', file);
    // console.log('CID', file[0].cid);
    // const fullProtocolLink = `https://ipfs-gateway.koii.live/ipfs/${cid}/proofs.json`;
    // const url = `https://${file[0].cid}.ipfs.w3s.link/?filename=${file[0].name}`;
    // console.log('URL', url);
    // try {
    //   const output = await axios.get(url);
    //   return output;
    // } catch (error) {
    //   console.log('ERROR', error);
    // }
  } catch (error) {
    console.log('DATA FROM CID IS GIVING ERROR: ', error);
    console.log('VOTE FALSE');
    console.log('SLASH VOTE DUE TO FAKE VALUE');
    return false;
  }
};
