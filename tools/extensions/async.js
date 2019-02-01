import { is } from "tools/common";
import { abortable } from "tools/async";

const abortSignal = abortable.signal;

const alwaysTrue = () => true;
const alwaysFalse = () => false;
const alwaysUndefined = () => void 0;
const checkAborted = (v) => v === abortSignal;

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
 * @returns {Promise<T|undefined>} A promise that cannot reject, but may produce `undefined`.
 */
export function orUndefined() {
  return this.catch(alwaysUndefined);
}

/**
 * Creates a promise that will resolve with a boolean value, indicating if this promise or value is the abortion
 * signal.  This is handy if you don't otherwise care about the value the promise resolved to but do care if
 * the promise aborted.
 *
 * @export
 * @template T
 * @this {T|Promise<T>} This value or promise.
 * @returns {Promise<boolean>}
 */
export function didAbort() {
  if (this.then::is.func())
    return this.then(checkAborted);
  return Promise.resolve(this === abortSignal);
}

/**
 * Creates a promise that will either complete when this promise completes, or will resolve to a special symbol
 * that represents an abort.  Use the `isAborted` extension-method on the result to determine if and abortion
 * occurred.
 *
 * @export
 * @template T
 * @this {Promise<T>} This promise.
 * @param {Promise} signalPromise The promise to use as a signal to abort when it completes.
 * @returns {Promise<T|Symbol>} An abortable promise.
 */
export function abortOn(signalPromise) {
  return abortable(this, signalPromise);
}

/**
 * Determines if this object is the "abort" signal.
 *
 * @export
 * @this {*} This object.
 * @returns {boolean}
 */
export function isAborted() {
  return this === abortSignal;
}

/**
 * Creates a promise that will try to resolve with `onComplete` after this promise completes.  If `onComplete`
 * is a function, it will be called and its return value provided instead.
 * 
 * It is basically the same as calling `promise.then(onComplete, onComplete)`.  No value is provided to
 * `onComplete` when it is called as it is not possible to determine the outcome of this promise.
 *
 * @export
 * @template T
 * @this {Promise} This promise.
 * @param {T | function(): T} onComplete A function-to-call or value-to-produce when the promise completes.
 * @returns {Promise<T>} A promise that will resolve to the value produced by `onComplete`.
 */
export function finishWith(onComplete) {
  const fn = () => onComplete::is.func() ? onComplete() : onComplete;
  return this.then(fn, fn);
}