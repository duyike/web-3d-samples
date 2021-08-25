const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { config } = require("process");

const pages = ["index", "three-js-starting"];

module.exports = {
  entry: pages.reduce((config, page) => {
    config[page] = path.resolve(__dirname, `../src/js/${page}.js`);
    return config;
  }, {}),
  //   entry: path.resolve(__dirname, "../src/js/index.js"),
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "../dist"),
  },
  devtool: "source-map",
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "../static") }],
    }),
    // new HtmlWebpackPlugin({
    //   template: path.resolve(__dirname, "../src/html/index.html"),
    //   minify: true,
    // }),
    new MiniCSSExtractPlugin(),
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

      // CSS
      {
        test: /\.css$/,
        use: [MiniCSSExtractPlugin.loader, "css-loader"],
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
