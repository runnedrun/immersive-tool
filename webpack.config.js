const path = require("path");
const nodeExternals = require("webpack-node-externals");

console.log("mode", process.env.WEBPACK_MODE);
module.exports = {
  mode: process.env.WEBPACK_MODE || "development",
  entry: "./functions/src/index",
  target: "node",
  context: path.resolve(__dirname),
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: [
            ["@babel/preset-env"],
            ["@babel/preset-react"],
            ["@babel/preset-typescript"],
          ],
          plugins: [
            "@babel/plugin-proposal-class-properties",
            "babel-plugin-css-modules-transform",
          ],
        },
      },
      // {
      //   test: /\.css$/,
      //   use: [
      //     {
      //       loader: "css-loader",
      //       options: {
      //         modules: {
      //           localIdentName: "[local]--[hash:base64:5]",
      //         },
      //       },
      //     },
      //   ],
      // },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "node-sass"],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },

      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
      },
      // {
      //   test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      //   loader: "url-loader",
      //   options: {
      //     limit: 100000,
      //   },
      // },

      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[sha512:hash:base64:7].[ext]",
            },
          },
        ],
      },
      // {
      //   test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
      //   loader: "file-loader",
      //   options: {
      //     name: "[name].[ext]",
      //     outputPath: "assets",
      //   },
      // },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  externals: [nodeExternals()],
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "this", // <-- Important
  },
};
