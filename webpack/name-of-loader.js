const path = require("path");
const loaderUtils = require("loader-utils");

/**
 * Creates a module that exposes the name of the resource.  If no resource is provided, it will try to
 * provide the name of the issuer instead.  This is handy for creating more portable code where the
 * names of modules are often used as identifiers for their resources.
 * 
 * @example <caption>Example webpack rule.</caption>
 * config.module.rules.push({
 *   enforce: 'post',
 *   resourceQuery: /^\?name(-of|Of)?$/,
 *   use: ({ issuer }) => {
 *     return {
 *       loader: 'name-of-loader',
 *       options: { issuer }
 *     };
 *   }
 * });
 * @example <caption>Importing the name of a module (using the sample configuration).</caption>
 * // nameOfSampleModule === "sample-name".
 * import nameOfSampleModule from "path/to/sample-module?name";
 * @example <caption>Importing the name of the current module (using the sample configuration).</caption>
 * import myOwnName from "?name";
 * @returns {string} A string representing an ES6 module that default-exports the name.
 * @throws When no resource to name could be found.
 */
function nameOfLoader() {
  if (this.cacheable) this.cacheable();
  const callback = this.async();
  doLoading(this, this.resourcePath, loaderUtils.getOptions(this)).then(
    (value) => callback(null, value),
    (err) => callback(err)
  );
  return;
}

async function doLoading(loader, resource, { issuer }) {
  if (loader.cacheable) loader.cacheable();

  const ident = !resource;

  const resolved = ident ? issuer : resource;

  if (!resolved) throw new Error([
    "could not derive a resource path",
    `resource=\`${String(resource)}\` issuer=\`${String(issuer)}\``
  ].join('; '));

  loader.addDependency(resolved);

  const ext = path.extname(resolved);
  const name = path.basename(resolved, ext);

  return `module.exports = "${name}";`;
}

module.exports = function () {};
module.exports.pitch = nameOfLoader;