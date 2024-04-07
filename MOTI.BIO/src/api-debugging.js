import axios from "axios";
import bs58 from "bs58";
import { TASK_ADDRESS, RECIPIENT_ADDRESS, TRANSFER_AMOUNT } from "./config";
import {
  SystemProgram,
  Transaction,
  Connection,
  clusterApiUrl,
} from "@_koi/web3.js";

let backend_route = `${process.env["REACT_APP_TASKNET_URL"]}/task/${process.env["REACT_APP_TASK_ID"]}`;

if (process.env.development) {
  backend_route = `localhost:10000`; // when on localhost, no /task/task_id is required
}

function routerProvider(node_mode) {
  // node_mode can be set or unset as a flag to determine whether we want one specific node or the whole thing

  if (!process.env.development) {
    // in prod, two options
    // Node => IP or Network => DNS
    if (node) {
      // return single node path + route
    }
    // return tasknet path + route
  }

  // in dev
  // Node => IP (no tasks/task_id)
  // return localhost:...
}

export async function deleteLinktree(nodeList, publicKey) {
  try {
    // const requests = nodeList.map((node) =>
    //   axios
    //     .delete(`${node}/task/${TASK_ADDRESS}/linktree/${publicKey}`)
    //     .then((res) => res.data)
    //     .catch((error) =>
    //       console.log(`Error fetching authlist from ${node}:`, error)
    //     )
    // );

    const requests = nodeList.map((node) => {
      return axios
        .delete(`${routeProvider(true)}/linktree/${publicKey}`)
        .then((res) => res.data)
        .catch((error) =>
          console.log(`Error fetching authlist from ${node}:`, error)
        );
    });

    const results = await Promise.allSettled(requests);

    await axios.delete(
      `${nodeList[1]}/task/${TASK_ADDRESS}/linktree/${publicKey}`
    );
    for (const result of results) {
      if (result.status === "fulfilled" && result.value === publicKey) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log(error);
  }
}

export async function allLinktrees(nodeList) {
  try {
    let nodeListIndex = 0;
    let result;

    if (nodeList.length) {
      while (!result && nodeList[nodeListIndex]) {
        result = await axios
          .get(`${backend_route}/linktree/list`)
          .then((res) => res.data)
          .catch((error) => console.log(`Error fetching all linktree:`, error));
        nodeListIndex++;
      }

      if (result) {
        const linktrees = [...result];
        const total = linktrees.length;
        return total;
      }
      return;
    }
  } catch (error) {
    console.log("Error getting node list:", error);
  }
}

export async function getLinktreeWithUsername(username, nodeList) {
  try {
    let nodeListIndex = 0;
    let result = {
      value: [],
    };
    while (
      (result?.value || result?.value?.length === 0) &&
      nodeList[nodeListIndex]
    ) {
      const data = await axios
        .get(`${backend_route}/linktree/get/username/${username}`)
        .then((res) => res.data)
        .catch((error) =>
          console.log(
            `Error fetching linktree with username from ${nodeList[nodeListIndex]}:`,
            error
          )
        );
      console.log(data);
      if (data && data?.length !== 0) {
        result = data;
      }
      nodeListIndex++;
    }

    if (result && result?.length !== 0 && !result?.value) {
      return {
        data: result,
        status: true,
      };
    }
    return {
      data: "",
      status: true,
    };
  } catch (error) {
    console.log("Error getting node list:", error);
  }

  return false;
}

export async function getLinktreeWithUsername2(username, nodeList) {
  try {
    let nodeListIndex = 0;
    let result = {
      value: [],
    };
    while (
      (result?.value || result?.value?.length === 0) &&
      nodeList[nodeListIndex]
    ) {
      const data = await axios
        .get(`${backend_route}/linktree/get/username/${username}`)
        .then((res) => res.data)
        .catch((error) =>
          console.log(
            `Error fetching linktree with username from ${nodeList[nodeListIndex]}:`,
            error
          )
        );
      console.log(data);
      if (data && data?.length !== 0) {
        result = data;
      }
      nodeListIndex++;
    }

    if (result && result?.length !== 0 && !result?.value) {
      return {
        data: result,
        status: true,
      };
    }
    return {
      data: "",
      status: true,
    };
  } catch (error) {
    console.log("Error getting node list:", error);
  }

  return false;
}

export async function getLinktree(publicKey, nodeList) {
  try {
    let nodeListIndex = 0;
    let result = {
      value: [],
    };

    while (
      (!result || result?.value || result?.value?.length === 0) &&
      nodeList[nodeListIndex]
    ) {
      const data = await axios
        .get(`${backend_route}/linktree/get/${publicKey}`)
        .then((res) => res.data)
        .catch((error) => console.log(`Error fetching linktree data:`, error));
      if (data && data?.length !== 0) result = data;
      nodeListIndex++;
    }
    //home.moti.bio/

    https: if (result && result?.length !== 0 && !result.value) {
      return {
        data: result,
        status: true,
      };
    }
    return {
      data: "",
      status: true,
    };
  } catch (error) {
    console.log("Error getting node list:", error);
  }

  return false;
}

export async function setLinktree(data, publicKey, nodeList, username) {
  const messageString = JSON.stringify(data);
  console.log("message Strging===== ", messageString);
  try {
    const koiiTransfer = await transferKoii(nodeList);
    const signatureRaw = await window.k2.signMessage(messageString);
    console.log("Signature Raw===== ", signatureRaw);
    const payload = {
      data,
      publicKey: publicKey,
      signature: bs58.encode(signatureRaw.signature),
      username,
    };
    console.log("Payload===== ", payload);
    let nodeListIndex = 0;
    let result;

    while (!result && nodeList[nodeListIndex]) {
      console.log("check one", !result && nodeList[nodeListIndex]);
      result = await axios
        .post(`${backend_route}/linktree`, {
          payload,
        })
        .then((res) => res.data)
        .then((res) => console.log("res==== ", res))
        .catch((error) => console.log(`Error setting linktree:`, error));
      nodeListIndex++;
    }

    if (result?.message) {
      console.log("result==== ", result);
      return result;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function setLinktreeMagic(data, publicKey, nodeList, username) {
  const messageString = JSON.stringify(data);
  try {
    const signatureRaw = await window.k2.signMessage(messageString);
    const payload = {
      data,
      publicKey: publicKey,
      signature: bs58.encode(signatureRaw.signature),
      username,
    };
    let nodeListIndex = 0;
    let result;

    while (!result && nodeList[nodeListIndex]) {
      console.log("check one", !result && nodeList[nodeListIndex]);
      result = await axios
        .post(`${backend_route}/linktree`, {
          payload,
        })
        .then((res) => res.data)
        .catch((error) => console.log(`Error setting linktree:`, error));
      nodeListIndex++;
    }

    if (result?.message) {
      return result;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function updateLinktree(data, publicKey, nodeList, username) {
  const messageString = JSON.stringify(data);
  try {
    const signatureRaw = await window.k2.signMessage(messageString);
    const payload = {
      data,
      publicKey: publicKey,
      signature: bs58.encode(signatureRaw.signature),
      username,
    };
    let nodeListIndex = 1;
    let result;

    while (!result && nodeList[nodeListIndex]) {
      result = await axios
        .put(`${backend_route}/linktree`, {
          payload,
        })
        .then((res) => res.data)
        .catch((error) => console.log(`Error updating linktree:`, error));
      nodeListIndex++;
    }

    if (result?.message) {
      return result;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function getAuthList(publicKey, nodeList) {
  try {
    const requests = nodeList.map((node) =>
      axios
        .get(`${node}/task/${TASK_ADDRESS}/authlist/get/${publicKey}`)
        .then((res) => res.data)
        .catch((error) =>
          console.log(`Error fetching authlist from ${node}:`, error)
        )
    );

    const results = await Promise.allSettled(requests);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value === publicKey) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log("Error getting node list:", error);
  }
}

export async function transferKoii(nodeList) {
  const connection = new Connection(clusterApiUrl("devnet"));
  const blockHash = await connection.getRecentBlockhash();
  const feePayer = window.k2.publicKey;

  const transaction = new Transaction();
  transaction.recentBlockhash = blockHash.blockhash;
  transaction.feePayer = feePayer;

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: window.k2.publicKey,
      toPubkey: new window.solanaWeb3.PublicKey(RECIPIENT_ADDRESS),
      lamports: Number(
        TRANSFER_AMOUNT +
          (await connection.getMinimumBalanceForRentExemption(100)) +
          1000
      ),
    })
  );

  const payload = transaction.serializeMessage();
  const signature = await window.k2.signAndSendTransaction(payload);

  if (signature) {
    const authdata = {
      pubkey: window.k2.publicKey.toString(),
    };
    let nodeListIndex = 1;
    let result;
    while (!result) {
      result = await axios
        .post(`${backend_route}/authlist`, {
          authdata,
        })
        .then((res) => res.data === window.k2.publicKey.toString())
        .catch((error) =>
          console.log(
            `Error fetching authlist from ${nodeList[nodeListIndex]}:`,
            error
          )
        );
      nodeListIndex++;
      if (result) return result;
    }
  }
}
