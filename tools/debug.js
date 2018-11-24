/**
 * Logs this value, and returns this value.
 *
 * @template T
 * @this {T} This value, to be logged.
 * @param {string} label A string to label the value with.
 * @returns {T} This value.
 */
function logAndPass(label) {
  console.log(`${label}: ${this}`);
  return this;
}

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({ logAndPass });