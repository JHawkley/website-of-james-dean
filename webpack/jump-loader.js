/* global module */

const path = require('path');
const glob = require('glob');
const startsWith = require('lodash/startsWith');
const fromPairs = require('lodash/fromPairs');
const loaderUtils = require("loader-utils");

const isNotFalse = (v) => v !== false;
const quote = (str) => `"${str.replace('"', '\\"')}"`;

function routeToModule(routeObj) {
  const route = quote(routeObj.route);
  const asPath = quote(routeObj.asPath);

  return `
    import { importWrapper } from "components/Jump";
    export default importWrapper(${route}, ${asPath});
    export const route = ${route};
    export const asPath = ${asPath};
  `;
}

function routingLoader() {
  if (this.cacheable) this.cacheable();

  const options = loaderUtils.getOptions(this);
  const dir = (options && options.dir) || this.rootContext || ".";
  const extensions = (options && options.extensions) || ["js", "jsx"];
  const pagesDir = path.resolve(dir, "pages");
  let resource = this.resourcePath;

  if (!resource) {
    throw new Error([
      "could not derive a resource path",
      `resource=\`${String(resource)}\``
    ].join('; '));
  }

  if (!Array.isArray(extensions)) {
    throw new Error([
      "the `extensions` option was not an array",
      `extensions=\`${String(extensions)}\``
    ].join('; '));
  }

  const extExp = new RegExp(`^\\.(${extensions.join("|")})$`, "i");
  const ext = path.extname(resource);

  if (!extExp.test(ext)) {
    throw new Error([
      "the module's resource path did not have the expected extension for a page",
      `resource=\`${String(resource)}\``
    ].join('; '));
  }

  const routeObj = toRouteObject(pagesDir, resource);

  this.addDependency(this.resourcePath);

  return routeToModule(routeObj)
}

function toRouteObject(pagesDir, resource) {
  const { dir, name } = path.parse(path.relative(pagesDir, resource));
  
  if (startsWith(dir, ".")) {
    throw new Error([
      "the module's resource path did not appear to be in the `pages` directory",
      `resource=\`${String(resource)}\``,
      `pagesDir=\`${String(pagesDir)}\``
    ].join('; '));
  }

  if (startsWith(name, "_")) {
    throw new Error([
      "the module's name starts with an underscore",
      "these pages are explicitly excluded from routing",
      `resource=\`${String(resource)}\``
    ].join('; '));
  }

  const maybeDir = dir || false;
  const maybeName = name !== 'index' ? name : false;
  const route = ['', maybeDir, maybeName].filter(isNotFalse).join('/') || '/';
  const exportPath = ['', maybeDir, `${name}.html`].filter(isNotFalse).join('/');
  const asPath = name === 'index' ? route : exportPath;

  return { route, exportPath, asPath };
}

function derivePathMap(dir, pageExtensions) {
  const exts = pageExtensions.join("|");
  const pagesDir = path.resolve(dir, "pages");
  const pagesGlob = `${pagesDir}/**/*.@(${exts})`;

  const kvps =
    glob.sync(pagesGlob)
    .map((page) => {
      // Do not export pages with a leading underscore.
      if (startsWith(path.basename(page), "_")) return null;

      const { route, exportPath } = toRouteObject(pagesDir, page);
      return [exportPath, { page: route }];
    })
    .filter(Boolean);
  
  return fromPairs(kvps);
}

module.exports = function () {};
module.exports.pitch = routingLoader;
module.exports.derivePathMap = derivePathMap;