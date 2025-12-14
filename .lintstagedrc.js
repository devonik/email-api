const baseConfig = require("../../.lintstagedrc");

module.exports = {
  ...baseConfig,
  "*.js": "eslint --fix",
};
