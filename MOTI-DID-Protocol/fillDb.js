// const fs = require('fs');
// const axios = require('axios');

// // Function to get linktree ID
// function getLinktreeId(publicKey) {
//   return `linktree:${publicKey}`;
// }

// // Function to fetch JSON data from the URL and save it to a file
// async function fetchAndSaveJson() {
//   const url =
//     'https://app.moti.bio/task/7nsVgpSEfGUJTcgfc1GN2FhMRb6k3mZHXftrWdVhhPgF/linktree/list';
//   try {
//     const response = await axios.get(url);
//     const jsonData = response.data;
//     fs.writeFileSync('./data.json', JSON.stringify(jsonData, null, 4));
//     console.log('JSON data saved to data.json');
//   } catch (error) {
//     console.log('Failed to retrieve JSON data from the URL:', error);
//   }
// }

// // Function to process JSON data and update file
// function processAndUpdate() {
//   let linktreeListRaw = [];
//   if (fs.existsSync('./x.txt')) {
//     linktreeListRaw = fs
//       .readFileSync('./x.txt', 'utf-8')
//       .split('\n')
//       .map(line => JSON.parse(line));
//   }

//   let array = [];
//   if (fs.existsSync('./data.json')) {
//     const data = fs.readFileSync('./data.json', 'utf-8');
//     array = JSON.parse(data);
//   }

//   console.log(linktreeListRaw.length);
//   console.log('list', linktreeListRaw.length);

//   console.log('started');

//   const fileStream = fs.createWriteStream('./x.txt', { flags: 'a' });

//   let i = 1;
//   array.forEach(item => {
//     console.log('parsed', i);
//     i++;
//     const linktreeId = getLinktreeId(item.publicKey);
//     const username = item.username;
//     fileStream.write(
//       JSON.stringify({
//         linktreeId: linktreeId,
//         linktree: item,
//         username: username,
//       }) + '\n',
//     );
//   });

//   fileStream.end();

//   // try {
//   //   fs.unlinkSync('./data.json');
//   //   console.log('data.json file removed');
//   // } catch (error) {
//   //   console.log('Error occurred during file operations:', error);
//   // }
// }

// // Main function
// async function main() {
//   await fetchAndSaveJson();
//   processAndUpdate();
// }

// // Run the main function
// main();

const Datastore = require('nedb-promises');
const fs = require('fs');
const db = Datastore.create('./localKOIIDB.db');

let start = async () => {
  await setEnsureIndex();
  let linktreeListRaw = await db.find({
    linktree: { $exists: true },
  });
  console.log(linktreeListRaw.length);
  let linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
  console.log('list', linktreeList.length);
  console.log('started');
  let data = await fs.readFileSync('./data.json');
  let array = JSON.parse(data);
  let i = 0;
  do {
    let item = array[i];
    // console.log(item)
    console.log('parsed', array.length);
    const linktreeId = getLinktreeId(item.publicKey);
    const username = item.username;
    // let linktree = item.data;
    await db.insert({
      linktreeId: linktreeId,
      linktree: item,
      username: username,
    });
    i++;
  } while (array.length > i);

  linktreeListRaw = await db.find({
    linktree: { $exists: true },
  });
  console.log(linktreeListRaw.length);
  linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
  console.log('list', linktreeList.length);
};

start();

const getLinktreeId = publicKey => {
  return `linktree:${publicKey}`;
};

async function setEnsureIndex() {
  db.ensureIndex({ fieldName: 'linktreeId', sparse: true }, function (err) {
    if (err) console.error('Index creation error:', err);
  });
  db.ensureIndex({ fieldName: 'proofsId', sparse: true }, function (err) {
    if (err) console.error('Index creation error:', err);
  });
  db.ensureIndex(
    { fieldName: 'NodeProofsCidId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db.ensureIndex(
    { fieldName: 'authListId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
}
