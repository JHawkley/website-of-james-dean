const loaderUtils = require("loader-utils");

/**
 * Creates a module that is just the serialized JSON of its own options.  Any build-time information you would like
 * to pass in, use a custom rule to set them in the options of `environment-loader`.
 * 
 * @example <caption>Example webpack rule.</caption>
 * config.module.rules.push({
 *   enforce: 'post',
 *   resourceQuery: /^\?env$/,
 *   use: () => {
 *     return {
 *       loader: 'environment-loader',
 *       // Place your special environment variables here.
 *       options: { isServer: false, isProduction: true }
 *     };
 *   }
 * });
 * @example <caption>Importing the module with the above example rule.</caption>
 * import environment from "?env";
 * @returns {string} A module that exports the options.
 * @throws When the loader is invoked with a resource attached.
 */
function environmentLoader() {
  if (this.resourcePath) {
    throw new Error([
      "the `environment-loader` is intended to be used without a resource",
      "import this loader without a resource",
      "assuming the default configuration, importing `?env` is all that is required"
    ].join("; "));
  }

  const options = validateObject(loaderUtils.getOptions(this));

  // Same export method as `json-loader`.
  const optionsJson = JSON.stringify(options || {})
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `module.exports = ${optionsJson}`;
}

function validateObject(obj) {
  if (obj === null) return obj;
  if (typeof obj === "undefined") return obj;

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === "object") return validateObject(value);
    if (typeof value === "function")
      throw new Error(`property \`${key}\` of the options object was a function; this cannot be serialized`);
    if (typeof value === "symbol")
      throw new Error(`property \`${key}\` of the options object was a symbol; this cannot be serialized`);
  });

  return obj;
}

module.exports = function () {};
module.exports.pitch = environmentLoader;