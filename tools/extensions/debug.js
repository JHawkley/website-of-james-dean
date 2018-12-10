/**
 * Logs this value, and returns this value.
 *
 * @export
 * @template T
 * @this {T} This value, to be logged.
 * @param {string} label A string to label the value with.
 * @returns {T} This value.
 */
export function logAndPass(label) {
  console.log(`${label}: ${this}`);
  return this;
}