/* global module */

const mime = require("mime-types");
const loaderUtils = require("loader-utils");

const quote = (str) => `"${str.replace('"', '\\"')}"`;

function soundToModule(src, mimeType, codec) {
  const qSrc = quote(src);
  const qType
    = mimeType && codec ? quote(`${mimeType}; codecs=${codec}`)
    : mimeType ? quote(mimeType)
    : null;
  const args = [qSrc, qType];

  return `
    import { importWrapper } from "components/SoundMedia";
    export default importWrapper(${args.join(", ")});
    export const src = ${qSrc};
    export const type = ${qType};
    export const toString = () => ${qSrc};
  `;
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