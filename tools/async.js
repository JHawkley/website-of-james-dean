/** @module tools/propTypes */

import { identityFn, is } from "tools/common";
import { orUndefined, whenAborted } from "tools/extensions/async";
import Future from "tools/async/Future";
import CallSync from "tools/async/CallSync";
import Stream from "tools/async/Stream";

// Re-export extension methods.
export * as extensions from "tools/extensions/async";
export * as iterExtensions from "tools/extensions/asyncIterables";

// Re-export classes.
export Task from "tools/async/Task";
export Future from "tools/async/Future";
export CallSync from "tools/async/CallSync";
export Stream from "tools/async/Stream";

/**
 * A class that provides values as a stream through an async-iterator.  If another operation has not yet
 * started awaiting the async-iterator, the values will be placed into a buffer until the next await.
 * Iteration will end once `done` or `error` is called.
 *
 * @export
 * @template T
 * @class BufferedStream
 */
export class BufferedStream {

  static doneMessage = Stream.doneMessage;

  static mixin(state) {
    const { callSync } = state;
    return Object.assign(Stream.mixin(state), {
      emit: {
        value: (value) => {
          if (state.done) return this;
          if (callSync.awaitingSync) state.buffer.push(value);
          else callSync.resolve(value);
          return this;
        }
      },
      [Symbol.asyncIterator]: {
        value: async function*() {
          while (!state.done) {
            if (state.buffer.length > 0) {
              yield* state.buffer;
              state.buffer = [];
            }
            const emitted = await callSync.sync;
            if (emitted === BufferedStream.doneMessage) break;
            yield emitted;
          }
          if (state.error) throw state.error;
        }
      }
    });
  }

  /**
   * Creates an instance of BufferedStream.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof BufferedStream
   */
  constructor(promiseDecorator = identityFn) {
    Object.defineProperties(this, BufferedStream.mixin({
      callSync: new CallSync(promiseDecorator),
      buffer: [],
      error: void 0,
      done: false
    }));
  }

  /**
   * Whether the stream is completed, either via calling `done` or `error`.
   * 
   * @property {boolean} BufferedStream#isCompleted
   */

  /**
   * Whether the stream completed with an error.
   * 
   * @property {boolean} BufferedStream#didError
   */

  /**
   * Completes the stream.
   * 
   * @function BufferedStream#done
   * @returns {this}
   */

  /**
   * Emits a value to anything iterating on it and awaiting a value.  If nothing is awaiting a value,
   * the given value will be added to a buffer and will be emitted when the next await occurs.
   * 
   * @function BufferedStream#emit
   * @param {T} value The value to emit.
   * @returns {this}
   */

  /**
   * Ends the stream with an error.
   * 
   * @function BufferedStream#error
   * @param {*} reason The reason behind the stream ending with an error.
   * @returns {this}
   */

  /**
   * Creates an async-iterator for this `BufferedStream`.  It will yield values until `done` or `error`
   * has been called.
   * 
   * @function BufferedStream#{@link Symbol.asyncIterator}
   * @returns {AsyncIterator<T>} An `AsyncIterator` for this object.
   */

}

/**
 * Awaits for all promises to complete.  Unlike `Promise.all`, this will actually wait for all promises to resolve
 * or reject before producing a result array.  The array will contain the results of the promises in the same order
 * that they were provided.  All promises that were rejected will be `undefined`.
 *
 * @export
 * @template T
 * @param {Promise<T>[]} promises The promises to await.
 * @returns {Promise<Array<T|undefined>>} A promise that will resolve to an array of resolved values.
 */
export async function awaitAll(promises) {
  const len = promises.length;
  const result = new Array(len);

  for (let i = 0; i < len; i++)
    result[i] = await promises[i]::orUndefined();
  
  return result;
}

/**
 * Awaits all unique promises that the `promiseGetterFn` produces when called, resolving to only the value
 * resolved by the final promise.  If the `promiseGetterFn` produces the same promise instance twice, the
 * promise will resolve.  If the `promiseGetterFn` produces a nullish value immediately and no `defaultResult`
 * was provided, the promise will reject.
 *
 * @export
 * @template T
 * @param {function(): ?Promise<T>} promiseGetterFn
 *   A function that produces either promises or a nullish value when called.
 * @param {Object} [options]
 *   An optional options object.
 * @param {function(T): boolean} [options.condition]
 *   A predicate function to determine whether the next promise should be awaited.
 * @param {T|(function(): T)} [options.defaultResult]
 *   A value or function to call to obtain a default value, in case no promise could be awaited.
 * @returns {Promise<T>} A promise that will resolve once `promiseGetterFn` stops materializing new promises.
 * @throws When no promise could be awaited and no `defaultResult` was provided.
 */
export async function awaitWhile(promiseGetterFn, options) {
  const defaultResult = options?.defaultResult ?? awaitWhile_noDefault;
  const condition = options?.condition ?? awaitWhile_alwaysContinue;
  let promise = promiseGetterFn();

  if (promise == null) {
    if (defaultResult::is.func()) return defaultResult();
    return defaultResult;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await promise;
    const nextPromise = promiseGetterFn();
    if (nextPromise === promise) return result;
    if (nextPromise == null) return result;
    if (!condition(result)) return result;
    promise = nextPromise;
  }
}
const awaitWhile_alwaysContinue = () => true;
const awaitWhile_noDefault = () =>
  throw new Error("the `promiseGetterFn` materialized nothing that could be awaited");

/**
 * Creates a promise that can be aborted.  The promise will resolve normally if `mainPromise` resolves
 * before the `signalPromise` completes.  However, if the `signalPromise` completes first, the resulting
 * promise will reject with an `AbortedError`.  Any rejection from `signalPromise` will be ignored, and
 * will still cause the abortion signal to fire.
 * 
 * Note: if `mainPromise` is a nullish value, a promise that can only end via abortion will be returned
 * instead.
 *
 * @export
 * @function
 * @template T
 * @param {Promise<T>|null|undefined} promise The promise to make abortable or a nullish value.
 * @param {AbortionSignal} signal An object to use as an abortion signal.
 * @returns {Promise<T>} An abortable promise.
 */
export function abortable(promise, signal) {
  if (!signal::is.object())
    throw new TypeError("invalid arguments for `signal`; must be a valid object");

  const abortionPromise = createAbortionPromise(promise, signal);
  if (promise == null) return abortionPromise;
  return Promise.race([promise, abortionPromise]);
}

const createAbortionPromise = (promise, signal) => {
  const { givesReason, reason: defaultReason } = signal;
  const aborter
    = signal.then::is.func() ? signal
    : signal.promise?.then::is.func() ? signal.promise
    : throw new TypeError("no promise was provided to abort on");
  
  return new Promise((resolve, reject) => {
    aborter.then(
      (value) => {
        const reason = givesReason && value::is.string() ? value : defaultReason;
        reject(new AbortedError(promise, aborter, reason));
      },
      () => reject(new AbortedError(promise, aborter, defaultReason))
    );
  });
};

/**
 * An error that represents an aborted promise.
 *
 * @export
 * @class AbortedError
 * @extends {Error}
 */
export class AbortedError extends Error {

  /**
   * Creates an instance of AbortedError.
   * 
   * @param {Promise} mainPromise The promise that was aborted.
   * @param {Promise} signalPromise The promise that was used as the abortion signal.
   * @param {string} [message] A message describing the reason why the abortion occurred.
   * @memberof AbortedError
   */
  constructor(mainPromise, signalPromise, message) {
    super(message::is.string() ? message : "the promise was aborted");
    Error.captureStackTrace?.(this, AbortedError);

    /**
     * The promise that was aborted.  May be null if `abortable` was called without providing a `mainPromise`.
     * 
     * @property {Promise|null} AbortedError#promise
     */
    this.promise = mainPromise ?? null;

    /**
     * The promise that caused the abortion.
     * 
     * @property {Promise} AbortedError#signal
     */
    this.signal = signalPromise;
  }

}

/**
 * Wraps an image in a promise.
 *
 * @export
 * @param {string} src The source for the image.
 * @param {number} [width] The height of the image.
 * @param {number} [height] The width of the image.
 * @param {Promise} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<Image>} A promise that may resolve to an image element.
 */
export function preloadImage(src, width, height, abortSignal) {
  const img = new Image(width, height);

  const imagePromise = new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed to load: ${src}`));
    img.src = src;
  });

  if (!abortSignal) return imagePromise;

  return abortable(imagePromise, abortSignal)::whenAborted(() => img.src = null);
}

/**
 * Creates a promise that will resolve the moment the JavaScript runtime becomes free.  This ensures the
 * current JavaScript stack-frame has cleared.
 *
 * @export
 * @returns {Promise<void>} A promise, to resolve at the JavaScript runtime's earliest convenience.
 */
export function whenFree() {
  return new Promise(setImmediate);
}

/**
 * Creates a promise that will resolve when the next `requestAnimationFrame` event fires.
 * Resolves to the time, according to the rules of `requestAnimationFrame`.
 *
 * @export
 * @param {Promise} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<number>} A promise, to resolve at the next animation frame.
 */
export function frameSync(abortSignal) {
  let handle;
  const framePromise = new Promise((resolve) => {
    handle = window.requestAnimationFrame(resolve);
  });

  if (!abortSignal) return framePromise;

  const abortableFramePromise = abortable(framePromise, abortSignal);
  abortableFramePromise.catch(() => window.cancelAnimationFrame(handle));

  return abortableFramePromise;
}

/**
 * Begins an asynchronous process, calling `fn` once a frame until it does not return `true`.
 * The function will receive the current timestamp, according to rules of `requestAnimationFrame`.
 *
 * @export
 * @param {function(number): boolean} fn The function that will run each frame.
 * @returns {Promise<void>} A promise that will complete when the process is aborted.
 */
/**
 * Begins an asynchronous process, calling `fn` once a frame until it does not return `true` or the
 * `abortSignal` completes.  The function will receive the current timestamp, according to rules of
 * `requestAnimationFrame`.
 * 
 * @export
 * @param {function(number): boolean} fn The function that will run each frame.
 * @param {Promise} abortSignal The promise to use as a signal to abort when it completes.
 * @returns {Promise<void>} A promise that will complete when the process is aborted.
 */
export function eachFrame(...args) {
  const [abortSignal, fn]
    = args.length === 1 ? [void 0, args[0]]
    : args.length === 2 ? args
    : throw new TypeError("too many arguments");
  
  if (!fn::is.func()) throw new TypeError("last argument must be a function");
  
  let handle;
  const whenStoppedFuture = new Future();

  const runnerFn = (timestamp) => {
    if (whenStoppedFuture.isCompleted) return;
    try {
      if (fn(timestamp) === true)
        handle = requestAnimationFrame(runnerFn);
      else
        whenStoppedFuture.resolve();
    }
    catch (error) {
      whenStoppedFuture.reject(error);
    }
  }

  // Start the runner.
  handle = requestAnimationFrame(runnerFn);

  if (!abortSignal) return whenStoppedFuture.promise;

  const abortableWhenStopped = abortable(whenStoppedFuture.promise, abortSignal);
  abortableWhenStopped.catch(() => cancelAnimationFrame(handle));

  return abortableWhenStopped;
}

/**
 * Creates a promise that will resolve once a timer has elapsed.
 *
 * @export
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {Promise} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<void>} A promise that will resolve when the timeout is complete.
 */
export function wait(delay = 0, abortSignal) {
  let timeoutId;
  const waitPromise = new Promise(resolve => {
    timeoutId = setTimeout(resolve, delay);
  });

  if (!abortSignal) return waitPromise;

  const abortableWaitPromise = abortable(waitPromise, abortSignal);
  abortableWaitPromise.catch(() => clearTimeout(timeoutId));

  return abortableWaitPromise;
}

/**
 * Creates a function that will ensure that `action`, is only called once, after the current JavaScript
 * stack frame has cleared.
 *
 * @export
 * @param {function(): void} action The action to be debounced.
 * @returns {Promise<void>} A promise that will resolve after `action` has been called.
 */
export function debounce(action) {
  let promise = null;
  const reset = () => promise = null;
  return () => promise || (promise = whenFree().then(reset).then(action), promise);
}

/**
 * @typedef {Object} AbortionSignal
 * @property {Promise} [promise]
 *   The promise to use as a signal to abort when it completes.
 * @property {function(function, function): Promise} [then]
 *   A promise-compatible `then` method.
 * @property {boolean} [givesReason]
 *   If `true` and `promise` resolves to a `string`, that string will be used as the abortion reason.
 * @property {string} [reason]
 *   A string to use as a reason if no other reason is provided.
 */