const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

const firebaseAppCjs = path.resolve(__dirname, 'node_modules/@firebase/app/dist/index.cjs.js');
const firebaseComponentCjs = path.resolve(__dirname, 'node_modules/@firebase/component/dist/index.cjs.js');
const topicStub = path.resolve(__dirname, 'node_modules/expo-notifications/build/TopicSubscriptionModule.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/app' || moduleName === 'firebase/app') {
    return {
      filePath: firebaseAppCjs,
      type: 'sourceFile',
    };
  }
  if (moduleName === '@firebase/component') {
    return {
      filePath: firebaseComponentCjs,
      type: 'sourceFile',
    };
  }
  if (moduleName.includes('TopicSubscriptionModule')) {
    return {
      filePath: topicStub,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
