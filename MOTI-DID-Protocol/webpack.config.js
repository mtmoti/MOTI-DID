const path = require('path');
module.exports={
    entry:"./index.js",
    target: 'node',
    // When uploading to arweave use the production mode
    // mode:"production",
    mode: "development",
    devtool: 'source-map',
    optimization: {
        usedExports: false, // <- no remove unused function
    },
    stats:{
      moduleTrace:false
    },
    node:{
      __dirname: true
    },
    output: {
      filename: 'bafybeifejfrvw64tr3eqkxz36g63gniuz54tsycknlurtpqeg5wavn6lsm.js',
      path: path.resolve(__dirname, 'dist'),
    },
}