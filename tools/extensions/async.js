import { dew } from "tools/common";
import { abortable } from "tools/async";

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

/**
 * Creates a promise that will either complete when this promise completes, or will resolve to a special symbol
 * that represents an abort.  Use the `isAborted` extension-method on the result to determine if and abortion
 * occurred.
 *
 * @export
 * @template T
 * @this {Promise<T>} This promise.
 * @param {Promise<*>} signalPromise The promise to use as a signal to abort when it completes.
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
  return this === abortable.signal;
}

/**
 * Creates a promise that will try to resolve to the result of `onComplete` after this promise completes.
 * It is basically the same as calling `promise.then(onComplete, onComplete)`.  No value is provided to
 * `onComplete` as it is not possible to determine the outcome of this promise.
 *
 * @export
 * @template T
 * @this {Promise<*>} This promise.
 * @param {function(): T} onComplete A function to be run after this promise completes.
 * @returns {Promise<T>} A promise that will resolve to the value produced by `onComplete`.
 */
export function finishWith(onComplete) {
  const fn = () => onComplete();
  return this.then(fn, fn);
}

/**
 * Creates an async-iterable that stores the last value yielded by this async-iterable and yields it as its
 * first value, followed by any values yet to be yielded by this async-iterable.
 *
 * @export
 * @template T
 * @this {AsyncIterable<T>} An object that can be async-iterated.
 * @returns {AsyncIterable<T>} An async-iterable that will store and repeat the last value yielded by this.
 */
export function fromLatest() {
  const self = this;
  const state = { value: void 0, error: void 0, done: false, started: false };

  dew(async () => {
    try {
      for await (const value of self) {
        state.started = true;
        state.value = value;
      }
    }
    catch (error) {
      state.started = true;
      state.error = error ?? new Error("async-iterable threw an undefined error");
    }
    state.done = true;
  });

  return {
    get isCompleted() { return state.done; },
    get didError() { return state.error != null; },
    async *[Symbol.asyncIterator]() {
      if (state.started) {
        if (typeof state.error !== undefined)
          throw state.error;
        yield state.value;
      }
      if (state.done) return;
      yield* self;
    }
  }
}