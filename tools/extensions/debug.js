/**
 * Logs this value, and returns this value.
 *
 * @export
 * @template T
 * @this {T}
 * @param {string} label A string to label the value with.
 * @returns {T} This value.
 */
export function logAndPass(label) {
  console.log(`${label}: ${this}`);
  return this;
}

/**
 * Logs the resolved and rejection values of this promise.
 *
 * @export
 * @this {Promise}
 * @param {string} label A string to label the value with.
 * @returns {Promise} This promise instance.
 */
export function logPromise(label) {
  Promise.resolve(this).then(
    (result) => console.log(`resolved ${label}: ${result.toString()}`),
    (error) => console.error(`rejected ${label}: ${error.message}`)
  );
  return this;
}