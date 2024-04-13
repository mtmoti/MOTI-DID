// const db = require('./database/db_model');
const Datastore = require('nedb-promises');
const db = Datastore.create('./localKOIIDB.db');

const fs = require('fs')

let start = async () => {
    await setEnsureIndex();
    let linktreeListRaw = await db.find({
        linktree: { $exists: true },
      });
      console.log(linktreeListRaw.length)
      let linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
      console.log('list', linktreeList.length)
    console.log('started')
    let data = await fs.readFileSync( './data_/data.txt')
    let array = JSON.parse(data)
    let i = 0;
    do {
        let item = array[i]
        // console.log(item)
        console.log('parsed', array.length)
        const linktreeId = getLinktreeId(item.publicKey);
        const username = item.username;
        // let linktree = item.data;
        await db.insert({ 
            'linktreeId': linktreeId, 
            'linktree' : item , 
            'username' : username 
        });
        i++;
    } while(array.length > i)

     linktreeListRaw = await db.find({
        linktree: { $exists: true },
      });
      console.log(linktreeListRaw.length)
       linktreeList = linktreeListRaw.map(linktreeList => linktreeList.linktree);
      console.log('list', linktreeList.length)
}

start()


const getLinktreeId = publicKey => {
    return `linktree:${publicKey}`;
  };


  async function setEnsureIndex() {
      db.ensureIndex(
        { fieldName: 'linktreeId', sparse: true },
        function (err) {
          if (err) console.error('Index creation error:', err);
        },
      );
      db.ensureIndex(
        { fieldName: 'proofsId', sparse: true },
        function (err) {
          if (err) console.error('Index creation error:', err);
        },
      );
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
  