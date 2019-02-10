/* global module */

const loaderUtils = require("loader-utils");

const pageExp = /^\/pages\//;
const indexExp = /\/index$/;

function routeLoader() {
  if (this.cacheable) this.cacheable();
  let resource = this.resourcePath;

  if (!resource) {
    throw new Error([
      "could not derive a resource path",
      `resource=\`${String(resource)}\``
    ].join('; '));
  }

  resource = loaderUtils.interpolateName(
    this, "/[path][name]",
    { context: this.rootContext || this.context }
  );

  if (!pageExp.test(resource)) {
    throw new Error([
      "resource path was not in the `pages` directory",
      `resource=\`${String(this.resourcePath)}\``
    ].join('; '));
  }

  resource = resource.replace(pageExp, "/");
  resource = resource.replace(indexExp, "") || "/";

  this.addDependency(this.resourcePath);

  return `module.exports = "${resource}";`;
}

module.exports = function () {};
module.exports.pitch = routeLoader;