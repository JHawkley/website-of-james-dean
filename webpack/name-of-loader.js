const path = require("path");

/**
 * Creates a module that exposes the name of the resource.  This is handy for creating more portable code
 * where the names of modules are often used as identifiers for their resources.
 * 
 * @example <caption>Example webpack rule.</caption>
 * config.module.rules.push({
 *   enforce: 'post',
 *   resourceQuery: /^\?name(-of|Of)?$/,
 *   loader: 'name-of-loader'
 * });
 * @example <caption>Importing the name of a module (using the sample configuration).</caption>
 * // nameOfSampleModule === "sample-module".
 * import nameOfSampleModule from "path/to/sample-module?name";
 * @returns {string} A string representing an ES6 module that default-exports the name.
 * @throws When no resource to name could be found.
 */
function nameOfLoader() {
  if (this.cacheable) this.cacheable();
  const resource = this.resourcePath;

  if (!resource) {
    throw new Error([
      "could not derive a resource path",
      `resource=\`${String(resource)}\``
    ].join('; '));
  }

  this.addDependency(resource);

  const ext = path.extname(resource);
  const name = path.basename(resource, ext);

  return `module.exports = "${name}";`;
}

module.exports = function () {};
module.exports.pitch = nameOfLoader;