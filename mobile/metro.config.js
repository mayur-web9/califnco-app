const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

const firebaseAppPath = path.resolve(__dirname, 'node_modules/@firebase/app/dist/index.cjs.js');
const firebaseAuthPath = path.resolve(__dirname, 'node_modules/@firebase/auth/dist/rn/index.js');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@firebase/app': firebaseAppPath,
  '@firebase/auth': firebaseAuthPath,
  'firebase/app': firebaseAppPath,
  'firebase/auth': firebaseAuthPath,
};

module.exports = config;
