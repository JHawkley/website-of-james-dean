/* global module */

const sizeOf = require("image-size");
const loaderUtils = require("loader-utils");

function imageToModule({src, width, height}) {
  return (`
    import { importWrapper } from "components/AsyncImage";
    export default importWrapper("${src}", ${width}, ${height});
    export const toString = () => "${src}";
  `);
}

function asyncImageLoader() {
  if (this.cacheable) this.cacheable();
  this.addDependency(this.resourcePath);

  const image = sizeOf(this.resourcePath);
  image.src = loaderUtils.interpolateName(this, "[path][name].[ext]", {
    context: this.rootContext || this.context
  });

  return imageToModule(image);
}

module.exports = asyncImageLoader;
module.exports.raw = true;