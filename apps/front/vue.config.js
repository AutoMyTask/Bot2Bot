const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    entry: './src/main.ts',
    devServer: {
      hot: true,
      port: 8080,
      host: '0.0.0.0',
    },
    watchOptions: {
      ignored: /node_modules/,
      poll: 1000,
    },
  },
});
