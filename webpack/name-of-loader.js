const path = require("path");
const loaderUtils = require("loader-utils");

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

  return `export default "${name}";`;
}

module.exports = function () {};
module.exports.pitch = nameOfLoader;