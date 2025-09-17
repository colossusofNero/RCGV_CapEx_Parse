const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      '@': './src',
    },
  },
  transformer: {
    minifierConfig: {
      mangle: {
        keep_fnames: true,
      },
      output: {
        ascii_only: true,
        quote_keys: true,
        wrap_iife: true,
      },
      sourceMap: {
        includeSources: false,
      },
      toplevel: false,
      compress: {
        reduce_funcs: false,
      },
    },
  },
  serializer: {
    createModuleIdFactory: function () {
      return function (path) {
        let name = path.substr(1);
        name = name.substr(name.lastIndexOf('/') + 1);
        name = name.replace(/\.[^/.]+$/, '');
        return name;
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);