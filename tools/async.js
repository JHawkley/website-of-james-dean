/** @module tools/propTypes */

import { identityFn, is } from "tools/common";
import { orUndefined, whenAborted } from "tools/extensions/async";

// Re-export extension methods.
export * as extensions from "tools/extensions/async";
export * as iterExtensions from "tools/extensions/asyncIterables";

// Re-export classes.
export Task from "tools/async/Task";

/**
 * A class that represents a promise that is resolved or rejected elsewhere.
 *
 * @export
 * @template T,U
 * @class Future
 */
export class Future {

  /**
   * Creates an instance of Future.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof Future
   */
  constructor(promiseDecorator = identityFn) {
    let didComplete = false;
    let error = void 0;
    // These are set when the promise instantiated.
    let resolveFn = null;
    let rejectFn = null;

    /**
     * The future's promise.
     * 
     * @property {Promise<U>} Future#promise
     * @readonly
    */
    Object.defineProperty(this, "promise", {
      value: promiseDecorator(new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      }))
    });

    /**
     * Whether the future has been resolved or rejected already.
     * 
     * @property {boolean} Future#isCompleted
     * @readonly
    */
    Object.defineProperty(this, "isCompleted", {
      get: () => didComplete
    });

    /**
     * Whether the future has been resolved.  If the future has not yet completed or was rejected,
     * it will be `false`.
     * 
     * @property {boolean} Future#didResolve
     * @readonly
    */
    Object.defineProperty(this, "didResolve", {
      get: () => didComplete && !error
    });

    /**
     * Whether the future has been rejected.  If the future has not yet completed or was resolved,
     * it will be `false`.
     * 
     * @property {boolean} Future#didError
     * @readonly
    */
    Object.defineProperty(this, "didError", {
      get: () => Boolean(error)
    });

    /**
     * Gets the error of this future.
     * 
     * @property {*} Future#error
     * @readonly
    */
    Object.defineProperty(this, "error", {
      get: () => error
    });

    /**
     * Resolves the future's promise.
     * 
     * @function Future#resolve
     * @param {T} value The value to resolve the future's promise with.
     */
    Object.defineProperty(this, "resolve", {
      value: (value) => {
        if (didComplete)
          throw new Error("this future has already completed");

        didComplete = true;
        resolveFn(value);
        return this;
      }
    });

    /**
     * Rejects the future's promise.
     * 
     * @function Future#reject
     * @param {*} reason The reason for the rejection.
     */
    Object.defineProperty(this, "reject", {
      value: (reason) => {
        if (didComplete)
          throw new Error("this future has already completed");
        
        didComplete = true;
        error = reason;
        rejectFn(reason);
        return this;
      }
    });
  }

}

/**
 * A class that provides synchronization services based on a later method call.
 *
 * @export
 * @template T,U
 * @class CallSync
 */
export class CallSync {

  /**
   * Creates an instance of CallSync.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof CallSync
   */
  constructor(promiseDecorator = identityFn) {
    let nextSync = null;

    /**
     * Indicates `true` when nothing has accessed `sync` since the last `resolve`.
     * 
     * @property {boolean} CallSync#awaitingSync
     * @readonly
     */
    Object.defineProperty(this, "awaitingSync", {
      get: () => nextSync == null
    });

    /**
     * Gets a promise that will be completed with the next call to `resolve` or `reject`.
     * 
     * @property {Promise<U>} CallSync#sync
     * @readonly
     */
    Object.defineProperty(this, "sync", {
      get: () => {
        if (nextSync == null)
          nextSync = new Future(promiseDecorator);
        return nextSync.promise;
      }
    });

    /**
     * Resolves the promise created from the last `sync`, if any.
     * 
     * @function CallSync#resolve
     * @param {T} value The value to resolve the future's promise with.
     * @returns {this}
     */
    Object.defineProperty(this, "resolve", {
      value: (value) => {
        if (nextSync == null) return this;
        nextSync.resolve(value);
        nextSync = null;
        return this;
      }
    });

    /**
     * Rejects the promise created from the last `sync`, if any.
     * 
     * @function CallSync#reject
     * @param {*} reason The reason for the rejection.
     * @returns {this}
     */
    Object.defineProperty(this, "reject", {
      value: (reason) => {
        if (nextSync == null) return this;
        nextSync.reject(reason);
        nextSync = null;
        return this;
      }
    });
  }

  /**
   * Creates an async-iterator for this `CallSync`.  It will yield values until a rejection occurs.
   * 
   * @memberof CallSync
   * @returns {AsyncIterator<T>} An `AsyncIterator` for this object.
   */
  async *[Symbol.asyncIterator]() {
    while (true) yield await this.sync;
  }

}

/**
 * A class that provides values as a stream through an async-iterator.  Iteration will end once `done`
 * or `error` is called.
 *
 * @export
 * @template T,U
 * @class Stream
 */
export class Stream {

  static doneMessage = Symbol("stream:done");

  static mixin(state) {
    const { callSync } = state;
    return {
      isCompleted: { get: () => state.done },
      didError: { get: () => state.error != null },
      error: { get: () => state.error },
      done: {
        value: () => {
          if (state.done) return this;
          state.done = true;
          callSync.resolve(Stream.doneMessage);
          return this;
        }
      },
      emit: {
        value: (value) => {
          if (!state.done) callSync.resolve(value);
          return this;
        }
      },
      fail: {
        value: (reason) => {
          if (state.done) return this;
          state.error = reason;
          state.done = true;
          callSync.reject(reason);
          return this;
        }
      },
      [Symbol.asyncIterator]: {
        value: async function*() {
          while (!state.done) {
            const emitted = await callSync.sync;
            if (emitted === Stream.doneMessage) break;
            yield emitted;
          }
          if (state.error) throw state.error;
        }
      }
    };
  }

  /**
   * Creates an instance of Stream.
   * 
   * @param {function(Promise<T>): Promise<U>} [promiseDecorator=identityFn]
   * @memberof Stream
   */
  constructor(promiseDecorator = identityFn) {
    Object.defineProperties(this, Stream.mixin({
      callSync: new CallSync(promiseDecorator),
      error: void 0,
      done: false
    }));
  }

  /**
   * Whether the stream is completed, either via calling `done` or `error`.
   * 
   * @property {boolean} Stream#isCompleted
   */

  /**
   * Whether the stream completed with an error.
   * 
   * @property {boolean} Stream#didError
   */

  /**
   * Completes the stream.
   * 
   * @function Stream#done
   * @returns {this}
   */

  /**
   * Emits a value to anything iterating on it and awaiting a value.
   * 
   * @function Stream#emit
   * @param {T} value The value to emit.
   * @returns {this}
   */

  /**
   * Ends the stream with an error.
   * 
   * @function Stream#error
   * @param {*} reason The reason behind the stream ending with an error.
   * @returns {this}
   */

  /**
   * Creates an async-iterator for this `Stream`.  It will yield values until `done` or `error` has
   * been called.
   * 
   * @function Stream#{@link Symbol.asyncIterator}
   * @returns {AsyncIterator<T>} An `AsyncIterator` for this object.
   */

}

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

  return abortable(framePromise, abortSignal).catch((error) => {
    window.cancelAnimationFrame(handle);
    throw error;
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` on the next frame.
 * Use this function in a `Promise..then` call to delay its resolution.  If `abortSignal` is provided,
 * the function can return a promise that can reject with an `AbortedError`.
 *
 * @export
 * @template T
 * @param {Promise|function(): Promise} [abortSignal]
 *  The promise to use as a signal to abort when it completes or a function that returns such when called.
 * @returns {function(T): Promise<T>}
 *   A function that will produce a promise which will resolve on the next frame.
 */
export function delayToNextFrame(abortSignal) {
  return (value) => {
    const abortSignalPromise = abortSignal::is.func() ? abortSignal() : abortSignal;
    return frameSync(abortSignalPromise).then(() => value);
  };
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
        handle = window.requestAnimationFrame(runnerFn);
      else
        whenStoppedFuture.resolve();
    }
    catch (error) {
      whenStoppedFuture.reject(error);
    }
  }

  handle = window.requestAnimationFrame(runnerFn);

  if (abortSignal) {
    abortable(null, abortSignal).catch((error) => {
      if (whenStoppedFuture.isCompleted) return;
      window.cancelAnimationFrame(handle);
      whenStoppedFuture.reject(error);
    });
  }

  return whenStoppedFuture.promise;
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

  return abortable(waitPromise, abortSignal).catch((error) => {
    clearTimeout(timeoutId);
    throw error;
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` after some `delay`.
 * Use this function in a `Promise..then` call to delay its resolution.  If `abortSignal` is provided,
 * the function can return a promise that can reject with an `AbortedError`.
 *
 * @export
 * @template T
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {Promise|function(): Promise} [abortSignal]
 *  The promise to use as a signal to abort when it completes or a function that returns such when called.
 * @returns {function(T): Promise<T|Symbol>}
 *   A function that will produce a promise which will resolve after a delay.
 */
export function delayFor(delay = 0, abortSignal) {
  return (value) => {
    const abortSignalPromise = abortSignal::is.func() ? abortSignal() : abortSignal;
    return wait(delay, abortSignalPromise).then(() => value);
  }
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