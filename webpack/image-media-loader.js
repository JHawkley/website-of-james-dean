/* global module */

const sizeOf = require("image-size");
const mime = require("mime-types");
const loaderUtils = require("loader-utils");

const quote = (str) => `"${str}"`;

function imageToModule(src, width, height, type) {
  const args = [quote(src), width, height];
  if (typeof type === "string") args.push(quote(type));

  return (`
    var importWrapper = require("components/ImageMedia").importWrapper;
    module.exports.__esModule = true;
    module.exports.default = importWrapper(${args.join(", ")});
    module.exports.src = "${src}";
    module.exports.toString = () => "${src}";
  `);
}

function imageMediaLoader(contentBuffer) {
  if (this.cacheable) this.cacheable();
  this.addDependency(this.resourcePath);

  const { width, height } = sizeOf(contentBuffer);
  const type = mime.lookup(this.resourcePath);
  const src = loaderUtils.interpolateName(
    this, "/[path][name].[ext]",
    { context: this.rootContext || this.context }
  );

  return imageToModule(src, width, height, type);
}

module.exports = imageMediaLoader;
module.exports.raw = true;
module.exports.supportedTypes = sizeOf.types;