const { default: axios } = require('axios');

module.exports = async cid => {
  console.log('============= LINKTREE VALIDATE ==================');
  console.log('CID', cid);
  try {
    const res = await axios.get(
      `https://ipfs-gateway.koii.live/ipfs/${cid}/proofs.json`,
    );

    console.log('VALIDATE res: ', res.status);
    if (res.status !== 200) {
      console.log('VOTE FALSE');
      console.log('SLASH VOTE DUE TO FAKE VALUE');
      return {};
    }

    const getData = await res.data;

    // Checking linktree
    if (
      !getData.linktree ||
      !getData.linktree.proofs ||
      Object.keys(getData.linktree.proofs).length === 0
    ) {
      console.log('VOTE FALSE');
      console.log('SLASH VOTE DUE TO FAKE VALUE');
      return {};
    } else {
      return getData.linktree;
    }
  } catch (error) {
    console.error('DATA FROM CID IS GIVING ERROR: ', error);
    console.error('VOTE FALSE');
    console.error('SLASH VOTE DUE TO FAKE VALUE');
    return {};
  }
};
