const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude docker-gsobackend folder from Metro file watching
// This prevents the EACCES permission denied error on docker storage folders
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /docker-gsobackend\/.*/,
];

module.exports = config;
