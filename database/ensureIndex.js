const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const { dbManager } = require('./createCustomDB');

/**
 * @function ensureIndex
 * @description
 * This function ensures that the database has the correct indexes for the task.
 * It is called when the task is instantiated.
 * This function will make sure that the field has the unique property, and that the field is sparse.
 */

async function ensureIndex() {
  // get the KOIIDB
  const db = await namespaceWrapper.getDb();
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

  // get the ENDORSEMENT
  const db2 = await dbManager.getDb2();
  db2.ensureIndex(
    { fieldName: 'endorsementId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db2.ensureIndex(
    { fieldName: 'endorsementsProofsId', sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db2.ensureIndex(
    { fieldName: 'NodeProofsCidId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db2.ensureIndex(
    { fieldName: 'authListId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );

  // get the PENDING ENDORSEMENT
  const db3 = await dbManager.getDb3();
  db3.ensureIndex(
    { fieldName: 'endorsementId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db3.ensureIndex(
    { fieldName: 'endorsementsProofsId', sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db3.ensureIndex(
    { fieldName: 'NodeProofsCidId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db3.ensureIndex(
    { fieldName: 'authListId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );

  // get the PENDING PROFILES
  const db4 = await dbManager.getDb4();
  db4.ensureIndex({ fieldName: 'linktreeId', sparse: true }, function (err) {
    if (err) console.error('Index creation error:', err);
  });
  db4.ensureIndex({ fieldName: 'proofsId', sparse: true }, function (err) {
    if (err) console.error('Index creation error:', err);
  });
  db4.ensureIndex(
    { fieldName: 'NodeProofsCidId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db4.ensureIndex(
    { fieldName: 'authListId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );

  // get the BLOCKED IPS
  const db5 = await dbManager.getDb5();
  db5.ensureIndex(
    { fieldName: 'blockIPsID', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db5.ensureIndex({ fieldName: 'blockIPsID', sparse: true }, function (err) {
    if (err) console.error('Index creation error:', err);
  });
  db5.ensureIndex(
    { fieldName: 'NodeProofsCidId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db5.ensureIndex(
    { fieldName: 'authListId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );

  // get the SCRAPER PUBLICS LIST
  const db6 = await dbManager.getDb6();
  // username
  db6.ensureIndex(
    { fieldName: 'publicKeyListID', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db6.ensureIndex(
    { fieldName: 'publicKeyListProofsId', sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db6.ensureIndex(
    { fieldName: 'NodeProofsCidId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
  db6.ensureIndex(
    { fieldName: 'authListId', unique: true, sparse: true },
    function (err) {
      if (err) console.error('Index creation error:', err);
    },
  );
}

module.exports = { ensureIndex };
