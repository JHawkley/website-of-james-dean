const loaderUtils = require("loader-utils");

function environmentLoader() {
  if (this.cacheable) this.cacheable();
  const options = loaderUtils.getOptions(this);
  return `export default ${JSON.stringify(options || {})};`;
}

module.exports = function () {};
module.exports.pitch = environmentLoader;