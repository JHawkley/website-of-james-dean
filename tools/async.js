import { dew, identityFn, is } from "tools/common";
import { orUndefined, finishWith } from "tools/extensions/async";

// Re-export extension methods.
export * as extensions from "tools/extensions/async";

/**
 * A class that represents a promise that is resolved or rejected elsewhere.
 *
 * @export
 * @template T
 * @class Future
 */
export class Future {
  constructor(promiseDecorator = identityFn) {
    let resolveFn = null;
    let rejectFn = null;
    let didComplete = false;
    let didResolve = false;

    function acquireCallbacks(resolve, reject) {
      resolveFn = resolve;
      rejectFn = reject;
    }

    /**
     * Whether the future has been resolved or rejected already.
     * 
     * @property {boolean}
    */
    Object.defineProperty(this, "isCompleted", {
      get: () => didComplete
    });

    /**
     * Whether the future has been resolved.  If the future has not yet completed or was rejected,
     * it will be `false`.
     * 
     * @property {boolean}
    */
    Object.defineProperty(this, "didResolve", {
      get: () => didResolve
    });

    /**
     * The future's promise.
     * 
     * @property {Promise<T>}
    */
    Object.defineProperty(this, "promise", {
      value: promiseDecorator(new Promise(acquireCallbacks))
    });

    /**
     * Resolves the future's promise.
     * 
     * @function
     * @param {T} value The value to resolve the future's promise with.
     */
    Object.defineProperty(this, "resolve", {
      value: (value) => {
        if (didComplete)
          throw new Error("this future has already completed");

        didComplete = true;
        didResolve = true;
        dew(async () => {
          while (resolveFn == null) await frameSync();
          resolveFn(value);
        });
      }
    });

    /**
     * Rejects the future's promise.
     * 
     * @function
     * @param {*} reason The reason for the rejection.
     */
    Object.defineProperty(this, "reject", {
      value: (reason) => {
        if (didComplete)
          throw new Error("this future has already completed");
        
        didComplete = true;
        dew(async () => {
          while (rejectFn == null) await frameSync();
          rejectFn(reason);
        });
      }
    });
  }
}

/**
 * A class that provides synchronization services based on a later method call.
 *
 * @export
 * @template T
 * @class CallSync
 */
export class CallSync {
  constructor(promiseDecorator = identityFn) {
    let nextSync = null;

    /**
     * Indicates `true` when nothing has accessed `sync` since the last `resolve`.
     * 
     * @property {boolean}
     */
    Object.defineProperty(this, "awaitingSync", {
      get: () => nextSync == null
    });

    /**
     * Gets a promise that will be completed with the next call to `resolve` or `reject`.
     * 
     * @property {Promise<T>}
     */
    Object.defineProperty(this, "sync", {
      get: () => {
        if (nextSync == null)
          nextSync = new Future(promiseDecorator);
        return nextSync.promise;
      }
    });

    /**
     * Resolves the promise created from the last `sync`.
     * 
     * @function
     * @param {T} value The value to resolve the future's promise with.
     * @return {this}
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
     * Rejects the promise created from the last `sync`.
     * 
     * @function
     * @param {*} reason The reason for the rejection.
     * @return {this}
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
   * @function
   * @return {AsyncIterator<T>} An `AsyncIterator` for this object.
   */
  async *[Symbol.asyncIterator]() {
    while (true) yield await this.sync;
  }
}

/**
 * A class that provides values as a stream through an async-iterator.  If another operation has not yet
 * started awaiting the async-iterator, the values will be placed into a buffer until the next await.
 * Iteration will end once `error` is called.
 *
 * @export
 * @template T
 * @class BufferedStream
 */
export class BufferedStream {

  static doneMessage = Symbol("buffered-stream:done");

  constructor(promiseDecorator = identityFn) {
    const callSync = new CallSync(promiseDecorator);
    let buffer = [];
    let error = null;
    let done = false;

    /**
     * Whether this instance has completed, and no more values will be emitted.
     * 
     * @property {boolean}
     */
    Object.defineProperty(this, "isCompleted", {
      get: () => done
    });

    /**
     * Whether this instance reported an error.
     * 
     * @property {boolean}
     */
    Object.defineProperty(this, "didError", {
      get: () => error != null
    });

    /**
     * Emits a value, buffering if nothing is awaiting.
     * 
     * @function
     * @param {T} value The value to resolve the future's promise with.
     * @return {this}
     */
    Object.defineProperty(this, "done", {
      value: () => {
        if (done) return this;
        done = true;
        if (callSync.awaitingSync)
          callSync.resolve(BufferedStream.doneMessage);
        return this;
      }
    });

    /**
     * Emits a value, buffering if nothing is awaiting.
     * 
     * @function
     * @param {T} value The value to resolve the future's promise with.
     * @return {this}
     */
    Object.defineProperty(this, "emit", {
      value: (value) => {
        if (done) return this;
        if (callSync.awaitingSync) buffer.push(value);
        else callSync.resolve(value);
        return this;
      }
    });

    /**
     * Causes this instance to enter an error state.  No further values can be emitted after the call.
     * 
     * @function
     * @param {*} reason The reason behind the error.
     * @return {this}
     */
    Object.defineProperty(this, "error", {
      value: (reason) => {
        if (done) return this;
        error = reason;
        done = true;
        callSync.reject(reason);
        return this;
      }
    });

    /**
     * Creates an async-iterator for this `BufferedStream`.  It will yield emitted values until `error` is called.
     * 
     * @function
     * @return {AsyncIterator<T>} An `AsyncIterator` for this object.
     */
    Object.defineProperty(this, Symbol.asyncIterator, {
      value: async function*() {
        while (!done) {
          if (buffer.length > 0) {
            yield* buffer;
            buffer = [];
          }
          const emitted = await callSync.sync;
          if (emitted === BufferedStream.doneMessage) break;
          yield emitted;
        }
        if (error) throw error;
      }
    });
  }
}

/**
 * Awaits for all promises to complete.  Unlike `Promise.all`, this will actually wait for all promises to resolve
 * or reject before producing a result array.  The array will contain the results of the promises in the same order
 * that they were provided.  All promises that were rejected will be `undefined`.
 *
 * @export
 * @template T
 * @param {Promise<T>[]} promises The promises to await.
 * @returns {Promise<Array.<T|undefined>>} A promise that will resolve to an array of resolved values.
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
 * @param {T} [defaultResult]
 *  A value to use as a default, if `promiseGetterFn` immediately returns a nullish value.
 * @returns {Promise<T>} A promise that will resolve once `promiseGetterFn` stops materializing new promises.
 * @throws When no promise could be awaited and no `defaultResult` was provided.
 */
export async function awaitWhile(promiseGetterFn, defaultResult) {
  let promise = promiseGetterFn();

  if (promise == null) {
    if (typeof defaultResult !== "undefined") return defaultResult;
    throw new Error("the `promiseGetterFn` materialized no promise that could be awaited");
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await promise;
    const nextPromise = promiseGetterFn();
    if (nextPromise == null || nextPromise === promise) return result;
    promise = nextPromise;
  }
  
}

/**
 * Wraps an image in a promise.
 *
 * @export
 * @param {string} src The source for the image.
 * @param {number} [width] The height of the image.
 * @param {number} [height] The width of the image.
 * @returns {Promise<Image>} A promise that may resolve to an image element.
 */
export function preloadImage(src, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image(width, height);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` after some `delay`.
 * Use this function in a `Promise..then` call to delay its resolution.
 *
 * @export
 * @function
 * @template T
 * @param {Promise<T>} mainPromise The promise to make abortable.
 * @param {Promise<*>} signalPromise The promise to use as a signal to abort when it completes.
 * @returns {Promise<T|Symbol>} An abortable promise.
 */
export const abortable = dew(() => {
  const signal = Symbol("abortable:signal");
  function abortable(mainPromise, signalPromise) {
    return Promise.race([mainPromise, signalPromise::finishWith(() => signal)]);
  }
  abortable.signal = signal;
  return abortable;
});

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
 * @param {Promise<*>} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<number|Symbol>} A promise, to resolve at the next animation frame.
 */
export function frameSync(abortSignal) {
  let handle;
  const framePromise = new Promise((resolve) => {
    handle = window.requestAnimationFrame(resolve);
  });
  if (!abortSignal) return framePromise;
  return abortable(framePromise, abortSignal).then((result) => {
    if (result === abortable.signal) cancelAnimationFrame(handle);
    return result;
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` on the next frame.
 * Use this function in a `Promise..then` call to delay its resolution.
 *
 * @export
 * @template T
 * @param {Promise<*>|function(): Promise<*>} [abortSignal]
 *  The promise to use as a signal to abort when it completes or a function that returns such when called.
 * @returns {function(T): Promise<T|Symbol>}
 *   A function that will produce a promise which will resolve on the next frame.
 */
export function delayToNextFrame(abortSignal) {
  return (value) => {
    const abortSignalPromise = abortSignal::is.function() ? abortSignal() : abortSignal;
    return frameSync(abortSignalPromise).then((result) => {
      return result === abortable.signal ? result : value;
    });
  };
}

/**
 * Creates a promise that will resolve once a timer has elapsed.
 *
 * @export
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {Promise<*>} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<void|Symbol>} A promise that will resolve when the timeout is complete.
 */
export function wait(delay = 0, abortSignal) {
  let timeoutId;
  const waitPromise = new Promise(resolve => {
    timeoutId = setTimeout(resolve, delay);
  });
  if (!abortSignal) return waitPromise;
  return abortable(waitPromise, abortSignal).then((result) => {
    if (result === abortable.signal) clearTimeout(timeoutId);
    return result;
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` after some `delay`.
 * Use this function in a `Promise..then` call to delay its resolution.  If `abortSignal` is provided,
 * the function can return `abortable.signal` instead of `value`, so be sure to check!
 *
 * @export
 * @template T
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {Promise<*>|function(): Promise<*>} [abortSignal]
 *  The promise to use as a signal to abort when it completes or a function that returns such when called.
 * @returns {function(T): Promise<T|Symbol>}
 *   A function that will produce a promise which will resolve after a delay.
 */
export function delayFor(delay = 0, abortSignal) {
  return (value) => {
    const abortSignalPromise = abortSignal::is.function() ? abortSignal() : abortSignal;
    return wait(delay, abortSignalPromise).then((result) => {
      return result === abortable.signal ? result : value;
    });
  }
}