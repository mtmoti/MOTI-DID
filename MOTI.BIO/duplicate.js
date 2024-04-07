const fetch = require("node-fetch");
const fs = require("fs");
const csv = require("csv-parser");
const moment = require("moment");
const results = [];

const hello = async function () {
  const resp = await fetch(
    "http://tasknet.pexelsoft.com/task/GK5QGAve3dMpKJrmuAhFVQGeHnbTPKXgGdrTib9rZ9b5/linktree/list"
  );
  console.log(resp.status)
  let data = await resp.json();
  console.log(data.length);
  const addressCountMap = new Map();

  // Adjusting to store count and publicKeys array
  data.forEach((item) => {
    const address = item.data.linktree.linktreeAddress;
    const publicKey = item.publicKey;

    if (addressCountMap.has(address)) {
      let entry = addressCountMap.get(address);
      entry.count += 1;
      entry.publicKeys.push(publicKey);
      addressCountMap.set(address, entry);
    } else {
      addressCountMap.set(address, { count: 1, publicKeys: [publicKey] });
    }
  });

  // Filtering duplicates based on count
  const duplicates = Array.from(addressCountMap)
    .filter(([_, value]) => value.count > 1)
    .map(([key, value]) => ({ address: key, ...value }));

  //   console.log("Duplicate linktreeAddresses with PublicKeys:", duplicates);

  fs.createReadStream("./data.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      // Assuming there's a field named 'signup_time' in your CSV
      results.forEach((row) => {
        if (row.signup_time) {
          row.signup_time = moment(row.signup_time, "YYYY-MM-DD HH:mm:ss");
          // Example usage
          //   console.log(row.signup_time.format("YYYY-MM-DD HH:mm:ss")); // Log formatted signup time
        }
      });
      let d = {};
      console.log(duplicates)
      for (let i of duplicates) {
        let h = [];
        for (let j of i["publicKeys"]) {
          h.push(results.filter((e) => j === e["SOLANA"]).map((e) => e.SOLANA));
        }
        // console.log(h);
        d[i.address] = h;
      }
      console.log(d);
    });
};

hello();
