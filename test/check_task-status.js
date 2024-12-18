const { Connection, PublicKey } = require('@_koii/web3.js');
const { TASK_ID } = require('@_koii/namespace-wrapper');

async function main() {
  const connection = new Connection('https://k2-testnet.koii.live/');
  const accountInfo = await connection.getAccountInfo(new PublicKey(TASK_ID));
  console.log(JSON.parse(accountInfo.data + ''));
}

main();
