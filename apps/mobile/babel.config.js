module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Support dynamic imports in dependencies
      '@babel/plugin-syntax-dynamic-import',
      // Must remain last for Reanimated
      'react-native-reanimated/plugin',
    ],
  };
};
