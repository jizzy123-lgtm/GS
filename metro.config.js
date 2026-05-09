const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude the backend folder to prevent EACCES errors with symlinks
config.resolver.blacklistRE = /docker-gsobackend\/.*/;
config.resolver.blockList = [/docker-gsobackend\/.*/];

module.exports = config;
