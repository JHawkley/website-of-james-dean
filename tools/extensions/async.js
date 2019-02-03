import { identityFn, is } from "tools/common";
import { abortable, AbortedError } from "tools/async";

const alwaysTrue = () => true;
const alwaysFalse = () => false;
const alwaysUndefined = () => void 0;
const abortToTrue = (error) => error instanceof AbortedError ? true : throw error;
const abortToVoid = (error) => error instanceof AbortedError ? void 0 : throw error;

const asPromise = (value) => {
  if (this.then::is.func()) return value;
  if (value::is.error()) return Promise.reject(value);
  return Promise.resolve(value);
}

/**
 * Creates a promise that will resolve with a boolean value, indicating whether this promise resolved or rejected.
 *
 * @export
 * @this {Promise<any>} This promise.
 * @returns {Promise<boolean>} A new promise that will resolve with `true` if the promise resolved successfully.
 */
export function didComplete() {
  switch (true) {
    case this?.then::is.func(): return this.then(alwaysTrue, alwaysFalse);
    case this::is.error(): return Promise.resolve(false);
    default: return Promise.resolve(true);
  }
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
  switch (true) {
    case this?.then::is.func(): return this.then(identityFn, alwaysUndefined);
    case this::is.error(): return Promise.resolve(void 0);
    default: return Promise.resolve(this);
  }
}

/**
 * Creates a promise that will resolve with a boolean value, indicating if this promise had been aborted.
 * This is handy if you don't otherwise care about the value the promise resolved to but do care if the promise
 * aborted.
 *
 * @export
 * @template T
 * @this {T|Promise<T>} This value or promise.
 * @returns {Promise<boolean>}
 */
export function didAbort() {
  switch (true) {
    case this?.then::is.func(): return this.then(alwaysFalse, abortToTrue);
    case this instanceof AbortedError: return Promise.resolve(true);
    case this::is.error(): return  Promise.reject(this);
    default: return Promise.resolve(false);
  }
}

/**
 * Creates a promise that resolves to `undefined` in the case of an abortion.
 *
 * @export
 * @template T
 * @this {T|Promise<T>} This value or promise.
 * @returns {Promise<T>}
 */
export function voidOnAbort() {
  return asPromise(this).then(identityFn, abortToVoid);
}

/**
 * Creates a promise that will call the given function if this promise aborts.
 *
 * @export
 * @template T
 * @this {T|Promise<T>} This value or promise.
 * @param {function(): void} onAborted The function to call if the promise aborts.
 * @returns {Promise<T>}
 */
export function whenAborted(onAborted) {
  return asPromise(this).then(
    identityFn,
    (error) => {
      if (error instanceof AbortedError) onAborted();
      throw error;
    }
  );
}

/**
 * Determines if this object is an `AbortedError`.
 *
 * @export
 * @this {*} This value.
 * @returns {boolean}
 */
export function isAborted() {
  return this instanceof AbortedError;
}

/**
 * Creates a promise that will either complete when this promise completes, or will resolve to a special symbol
 * that represents an abort.  Use the `isAborted` extension-method on the result to determine if and abortion
 * occurred.
 *
 * @export
 * @template T
 * @this {Promise<T>} This promise.
 * @param {module:tools/async.AbortionSignal} signal An object to use as an abortion signal.
 * @returns {Promise<T|Symbol>} An abortable promise.
 */
export function abortOn(signal) {
  return abortable(this, signal);
}

/**
 * Associates abortion reasoning information with this promise.  Calling this extension-method with no arguments
 * is the same as calling it as `promise::abortionReason(null, true)`.
 *
 * @export
 * @this {Promise} This promise.
 * @param {string} [givenReason] The reason behind the abortion.
 * @param {boolean} [providesReason] Whether to try to use the resolution result as a reason.
 * @returns {this}
 */
export function abortionReason(givenReason, providesReason) {
  if (givenReason != null || providesReason != null) {
    if (givenReason != null)
      this.reason = givenReason.toString();
    this.givesReason = providesReason === true;
  }
  else {
    this.givesReason = true;
  }
  return this;
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