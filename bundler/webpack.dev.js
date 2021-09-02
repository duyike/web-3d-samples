const { merge } = require("webpack-merge");
const commonConfiguration = require("./webpack.common.js");
// const ip = require("internal-ip");
const portFinderSync = require("portfinder-sync");

const infoColor = (_message) => {
  return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`;
};

const host = "0.0.0.0";
// const host = "localhost";

module.exports = merge(commonConfiguration, {
  mode: "development",
  devServer: {
    host: host,
    port: portFinderSync.getPort(8080),
    contentBase: "./dist",
    watchContentBase: true,
    open: true,
    https: false,
    disableHostCheck: true,
    overlay: true,
    noInfo: true,
    after: function (app, server) {
      const port = server.options.port;
      const https = server.options.https ? "s" : "";
      const domain = `http${https}://${host}:${port}`;

      console.log(`Project running at:\n - ${infoColor(domain)}`);
    },
  },
});
