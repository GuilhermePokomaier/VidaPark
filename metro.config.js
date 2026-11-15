
const { getDefaultConfig } = require("expo/metro-config");
 
const config = getDefaultConfig(__dirname);
 

const defaultResolveRequest = config.resolver.resolveRequest;
 
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== "web" && moduleName.startsWith("firebase/")) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }
 
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
 
  return context.resolveRequest(context, moduleName, platform);
};
 
module.exports = config;