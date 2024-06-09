const { KoiiStorageClient } = require('@_koii/storage-task-sdk');

module.exports = async cid => {
  console.log('============= LINKTREE VALIDATE ==================');
  console.log('CID', cid);
  try {
    const client = new KoiiStorageClient(undefined, undefined, true);
    const res = await client.getFile(cid, 'proofs.json');
    console.log('VALIDATE res: ', res);

    if (res.size === 0) {
      console.log('VOTE FALSE');
      console.log('SLASH VOTE DUE TO FAKE VALUE');
      return {};
    }

    const getText = await res.text();
    const jsonData = JSON.parse(getText);

    // Checking linktree
    if (!jsonData.linktree || Object.keys(jsonData.linktree).length === 0) {
      console.log('VOTE FALSE');
      console.log('SLASH VOTE DUE TO FAKE VALUE');
      return {};
    } else {
      return jsonData.linktree;
    }
  } catch (error) {
    console.log('DATA FROM CID IS GIVING ERROR: ', error);
    console.log('VOTE FALSE');
    console.log('SLASH VOTE DUE TO FAKE VALUE');
    return {};
  }
};
