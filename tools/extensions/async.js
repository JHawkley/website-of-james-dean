const alwaysTrue = () => true;
const alwaysFalse = () => false;
const alwaysUndefined = () => void 0;

/**
 * Creates a promise that will resolve with a boolean value, indicating whether this promise resolved or rejected.
 *
 * @export
 * @this {Promise<any>} This promise.
 * @returns {Promise<boolean>} A new promise that will resolve with `true` if the promise resolved successfully.
 */
export function didComplete() {
  return this.then(alwaysTrue, alwaysFalse);
}

/**
 * Creates a promise that will resolve with `undefined` if this promise rejects.
 *
 * @export
 * @template T
 * @this {Promise<T>} This promise.
 * @returns {Promise<T|undefined} A promise that cannot reject, but may produce `undefined`.
 */
export function orUndefined() {
  return this.catch(alwaysUndefined);
}