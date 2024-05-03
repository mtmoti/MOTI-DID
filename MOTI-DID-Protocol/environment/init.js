const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const TASK_NAME = process.argv[2] || 'Local';
const TASK_ID = process.argv[3];
const EXPRESS_PORT = process.argv[4] || 10000;
const LogLevel = {
  Log: 'log',
  Warn: 'warn',
  Error: 'error',
};
// const NODE_MODE = process.argv[5];
const MAIN_ACCOUNT_PUBKEY = process.argv[6];
const SECRET_KEY = process.argv[7];
const K2_NODE_URL = process.argv[8] || 'https://k2-testnet.koii.live';
const SERVICE_URL = process.argv[9];
const STAKE = Number(process.argv[10]);
const TASK_NODE_PORT = Number(process.argv[11]);
const IMAGE_TOKEN = process.env.IMAGE_TOKEN;

console.log('IMAGE_TOKEN -------: ', IMAGE_TOKEN);
console.log('process.env -------: ', process.env);
console.log('process.argv -------: ', process.argv);

const app = express();

console.log('SETTING UP EXPRESS');

app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', false);
  if (req.method === 'OPTIONS')
    // if is preflight(OPTIONS) then response status 204(NO CONTENT)
    return res.send(204);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const _server = app.listen(EXPRESS_PORT, () => {
  console.log(`${TASK_NAME} listening on port ${EXPRESS_PORT}`);
});

module.exports = {
  app, // The initialized express app to be used to register endpoints
  TASK_ID, // This will be the PORT on which the this task is expected to run the express server coming from the task node running this task. As all communication via the task node and this task will be done on this port.
  MAIN_ACCOUNT_PUBKEY, // This will be the secret used to authenticate with task node running this task.
  SECRET_KEY, // This will be the secret used by the task to authenticate with task node running this task.
  K2_NODE_URL, // This will be K2 url being used by the task node, possible values are 'https://k2-testnet.koii.live' | 'https://k2-devnet.koii.live' | 'http://localhost:8899'
  SERVICE_URL, // This will be public task node endpoint (Or local if it doesn't have any) of the task node running this task.
  STAKE, // This will be stake of the task node running this task, can be double checked with the task state and staking public key.
  TASK_NODE_PORT, // This will be the port used by task node as the express server port, so it can be used by the task for the communication with the task node
  _server, // Express server object
  LogLevel,
  IMAGE_TOKEN,
};
