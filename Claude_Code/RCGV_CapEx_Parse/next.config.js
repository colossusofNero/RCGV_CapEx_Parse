/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Externalize pdf-parse, pdfjs-dist, and @napi-rs/canvas to use them directly from node_modules
      config.externals = config.externals || [];
      config.externals.push('pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', 'canvas');

      // Ignore the test directory from pdf-parse to prevent bundling test files
      if (webpack && webpack.IgnorePlugin) {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/test\//,
            contextRegExp: /pdf-parse/,
          })
        );
      }
    }

    // Alias 'canvas' to '@napi-rs/canvas' for pdfjs-dist compatibility
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['canvas'] = '@napi-rs/canvas';

    return config;
  },
}

module.exports = nextConfig
