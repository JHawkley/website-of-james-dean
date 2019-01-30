/* global module */

const mime = require("mime-types");
const loaderUtils = require("loader-utils");

const quote = (str) => `"${str}"`;

function soundToModule(src, type, codec) {
  const args = [quote(src)];
  if (typeof type === "string") {
    args.push(quote(type));
    if (typeof codec === "string") {
      args.push(quote(codec));
    }
  }

  return (`
    var importWrapper = require("components/SoundMedia").importWrapper;
    module.exports.__esModule = true;
    module.exports.default = importWrapper(${args.join(", ")});
    module.exports.src = "${src}";
    module.exports.toString = function toString() { return "${src}"; };
  `);
}

function soundMediaLoader() {
  if (this.cacheable) this.cacheable();
  this.addDependency(this.resourcePath);

  const query
    = this.resourceQuery
    ? loaderUtils.parseQuery(this.resourceQuery)
    : { codec: null };

  const type = mime.lookup(this.resourcePath);
  const src = loaderUtils.interpolateName(
    this, "/[path][name].[ext]",
    { context: this.rootContext || this.context }
  );

  return soundToModule(src, type, query.codec);
}

const supportedTypes = (() => {
  const extensions = new Set();
  for (const mimeType of Object.keys(mime.extensions))
    if (mimeType.startsWith("audio/"))
      for (const ext of mime.extensions[mimeType])
        extensions.add(ext.toLowerCase());
  return [...extensions];
})();

module.exports = soundMediaLoader;
module.exports.raw = true;
module.exports.supportedTypes = supportedTypes;