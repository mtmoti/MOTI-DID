const Datastore = require('nedb-promises');
const {
  taskNodeAdministered,
  TASK_ID,
  namespaceWrapper,
} = require('@_koii/namespace-wrapper');
const path = require('path');

class DatabaseManager {
  #db2; // ENDORSEMENT (verified endorsements)
  #db3; // PENDING ENDORSEMENT
  #db4; // PENDING PROFILES
  #db5; // BLOCKED IPS
  #db6; // SCRAPER PUBLICS LIST

  constructor() {
    if (taskNodeAdministered) {
      this.initializeDB();
    } else {
      this.#db2 = Datastore.create('./localENDORSEMENT.db');
      this.#db3 = Datastore.create('./localPendingENDORSEMENT.db');
      this.#db4 = Datastore.create('./localPendingPROFILES.db');
      this.#db5 = Datastore.create('./localBLOCKEDIPS.db');
      this.#db6 = Datastore.create('./localSCRAPERPUBLICLIST.db');
    }
  }

  // initialize the database
  async initializeDB() {
    if (this.#db2 && this.#db3 && this.#db4 && this.#db5 && this.#db6) return;
    try {
      if (taskNodeAdministered) {
        // custom path
        const path = await namespaceWrapper.getBasePath();

        // ENDORSEMENT
        this.#db2 = Datastore.create(`${path}/ENDORSEMENT`);
        // pending ENDORSEMENT
        this.#db3 = Datastore.create(`${path}/PendingENDORSEMENT`);
        // pending profiles
        this.#db4 = Datastore.create(`${path}/PendingPROFILES`);
        // BLOCKED IPS
        this.#db5 = Datastore.create(`${path}/BLOCKEDIPS`);
        // SCRAPER PUBLICS LIST
        this.#db6 = Datastore.create(`${path}/SCRAPERPUBLICLIST`);
      } else {
        this.#db2 = Datastore.create('./localENDORSEMENT.db');
        this.#db3 = Datastore.create('./localPendingENDORSEMENT.db');
        this.#db4 = Datastore.create('./localPendingPROFILES.db');
        this.#db5 = Datastore.create('./localBLOCKEDIPS.db');
        this.#db6 = Datastore.create('./localPendingPROFILES.db');
      }
    } catch (e) {
      const baseDir = path.join(__dirname, TASK_ID);
      this.#db2 = Datastore.create(path.join(baseDir, 'ENDORSEMENTLevelDB.db'));
      this.#db3 = Datastore.create(
        path.join(baseDir, 'PendingENDORSEMENTLevelDB.db'),
      );
      this.#db4 = Datastore.create(
        path.join(baseDir, 'PendingPROFILESLevelDB.db'),
      );
      this.#db5 = Datastore.create(path.join(baseDir, 'BLOCKEDIPSLevelDB.db'));
      this.#db6 = Datastore.create(
        path.join(baseDir, 'SCRAPERPUBLICLISTLevelDB.db'),
      );
    }
  }

  // get the ENDORSEMENT
  async getDb2() {
    if (this.#db2) return this.#db2;
    await this.initializeDB();
    return this.#db2;
  }

  // get the PENDING ENDORSEMENT
  async getDb3() {
    if (this.#db3) return this.#db3;
    await this.initializeDB();
    return this.#db3;
  }

  // get the PENDING PROFILES
  async getDb4() {
    if (this.#db4) return this.#db4;
    await this.initializeDB();
    return this.#db4;
  }

  // get the BLOCKED IPS
  async getDb5() {
    if (this.#db5) return this.#db5;
    await this.initializeDB();
    return this.#db5;
  }

  // get the SCRAPER PUBLICS LIST
  async getDb6() {
    if (this.#db6) return this.#db6;
    await this.initializeDB();
    return this.#db6;
  }

  /**
   * Namespace wrapper of storeGetAsync
   * @param {string} key // Path to get
   */
  async storeGet(key) {
    try {
      await this.initializeDB();
      const resp2 = await this.#db2.findOne({ key: key });
      const resp3 = await this.#db3.findOne({ key: key });
      const resp4 = await this.#db4.findOne({ key: key });
      const resp5 = await this.#db5.findOne({ key: key });
      const resp6 = await this.#db6.findOne({ key: key });
      if (resp2) {
        return resp2[key];
      } else if (resp3) {
        return resp3[key];
      } else if (resp4) {
        return resp4[key];
      } else if (resp5) {
        return resp5[key];
      } else if (resp6) {
        return resp6[key];
      } else {
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   * Namespace wrapper over storeSetAsync
   * @param {string} key Path to set
   * @param {*} value Data to set
   */
  async storeSet(key, value, db_number) {
    try {
      await this.initializeDB();
      if (db_number === 2) {
        await this.#db2.update(
          { key: key },
          { [key]: value, key },
          { upsert: true },
        );
      } else if (db_number === 3) {
        await this.#db3.update(
          { key: key },
          { [key]: value, key },
          { upsert: true },
        );
      } else if (db_number === 4) {
        await this.#db4.update(
          { key: key },
          { [key]: value, key },
          { upsert: true },
        );
      } else if (db_number === 5) {
        await this.#db5.update(
          { key: key },
          { [key]: value, key },
          { upsert: true },
        );
      } else if (db_number === 6) {
        await this.#db6.update(
          { key: key },
          { [key]: value, key },
          { upsert: true },
        );
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
}

const dbManager = new DatabaseManager();
module.exports = {
  dbManager,
};
