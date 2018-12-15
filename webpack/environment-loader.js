const loaderUtils = require("loader-utils");

function environmentLoader() {
  const options = loaderUtils.getOptions(this);
  return `export default ${JSON.stringify(options || {})};`;
}

module.exports = function () {};
module.exports.pitch = environmentLoader;