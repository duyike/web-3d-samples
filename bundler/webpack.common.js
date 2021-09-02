const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const pages = ["index", "flag", "aframe-starter", "ball-control"];

module.exports = {
  entry: pages.reduce((config, page) => {
    config[page] = path.resolve(__dirname, `../src/js/${page}.js`);
    return config;
  }, {}),
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "../dist"),
  },
  devtool: "source-map",
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "../static") }],
    }),
  ].concat(
    pages.map(
      (page) =>
        new HtmlWebpackPlugin({
          inject: true,
          template: path.resolve(__dirname, `../src/html/${page}.html`),
          filename: `${page}.html`,
          chunks: [page],
          minify: true,
        })
    )
  ),
  module: {
    rules: [
      // HTML
      {
        test: /\.(html)$/,
        use: ["html-loader"],
      },

      // JS
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      // Images
      {
        test: /\.(jpg|png|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "assets/images/",
            },
          },
        ],
      },

      // Fonts
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "assets/fonts/",
            },
          },
        ],
      },
    ],
  },
};
