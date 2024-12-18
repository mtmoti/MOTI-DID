const path = require('path');
module.exports = {
  entry: './index.js',
  target: 'node',
  // When uploading to arweave use the production mode
  // mode:"production",
  mode: 'development',
  devtool: 'source-map',
  optimization: {
    usedExports: false, // <- no remove unused function
  },
  stats: {
    moduleTrace: false,
  },
  node: {
    __dirname: true,
  },
  output: {
    filename: 'bafybeieixx4qcqu2fmdgppq6qhbske5wdakkwic6h7omhyxbsd24uh3dve.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
