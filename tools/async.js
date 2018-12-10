import { dew, identityFn } from "tools/common";

const alwaysTrue = () => true;
const alwaysFalse = () => false;
const alwaysUndefined = () => void 0;

/**
 * Creates a promise that will resolve with a boolean value, indicating whether this promise resolved or rejected.
 *
 * @this {Promise<any>} This promise.
 * @returns {Promise<boolean>} A new promise that will resolve with `true` if the promise resolved successfully.
 */
function didComplete() {
  return this.then(alwaysTrue, alwaysFalse);
}

/**
 * Creates a promise that will resolve with `undefined` if this promise rejects.
 *
 * @template T
 * @this {Promise<T>} This promise.
 * @returns {Promise<T|undefined} A promise that cannot reject, but may produce `undefined`.
 */
function orUndefined() {
  return this.catch(alwaysUndefined);
}

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
 * Creates a promise that will resolve when the next `requestAnimationFrame` event fires.
 * Resolves to the time, according to the rules of `requestAnimationFrame`.
 *
 * @export
 * @returns {Promise<number>} A promise, to resolve at the next animation frame.
 */
export function frameSync() {
  return new Promise(window.requestAnimationFrame);
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
 * Creates a function that creates a promise that will resolve with the given `value` on the next frame.
 * Use this function in a `Promise..then` call to delay its resolution.
 *
 * @export
 * @template T
 * @param {function(number)} [handleSetter] A function that will be provided the RAF handle for cancellation.
 * @returns {function(?T): Promise<?T>} A function that will produce a promise which will resolve on the next frame.
 */
export function delayToNextFrame(handleSetter) {
  return (value) => {
    return new Promise(resolve => {
      const handle = window.requestAnimationFrame(() => resolve(value));
      handleSetter?.(handle);
    });
  };
}

/**
 * Creates a object that can be used to synchronize various asynchronous tasks to a single function call.
 * If `promiseDecorator` is not provided, it will default to the identity function.
 *
 * @export
 * @template T,U
 * @param {function(Promise<T>):Promise<U>} [promiseDecorator]
 *   A function that can transform the synchronization promise into a new promise.
 * @returns {CallSync<U>} An object that can be used to synchronize with.
 */
export function callSync(promiseDecorator = identityFn) {
  let nextSync = null;
  
  return {
    sync() {
      if (nextSync == null)
        nextSync = new Future(promiseDecorator);
      return nextSync.promise;
    },
    resolve(value) {
      if (nextSync == null) return;
      nextSync.resolve(value);
      nextSync = null;
    },
    reject(reason) {
      if (nextSync == null) return;
      nextSync.reject(reason);
      nextSync = null;
    }
  };
}

/**
 * Creates a promise that will resolve once a timer has elapsed.
 *
 * @export
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {function(number)} [timeoutIdSetter] A function that will be provided the `setTimeout` ID for cancellation.
 * @returns {Promise<void>} A promise that will resolve when the timeout is complete.
 */
export function wait(delay = 0, timeoutIdSetter = null) {
  return new Promise(resolve => {
    const timeoutId = setTimeout(resolve, delay);
    timeoutIdSetter?.(timeoutId);
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` after some `delay`.
 * Use this function in a `Promise..then` call to delay its resolution.
 *
 * @export
 * @template T
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {function(number)} [timeoutIdSetter] A function that will be provided the `setTimeout` ID for cancellation.
 * @returns {function(?T): Promise<?T>} A function that will produce a promise which will resolve after a delay.
 */
export function delayFor(delay = 0, timeoutIdSetter) {
  return (value) => wait(delay, timeoutIdSetter).finally(value);
}

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = { didComplete, orUndefined };

/**
 * An object that provides synchronization services.
 * @template T
 * @typedef {Object} CallSync<T>
 * @property {function():Promise<T>} sync A function to call to obtain the promise to synchronize on.
 * @property {function(?T):void} resolve A function to call when the promise needs to be resolved.
 * @property {function(?any):void} reject A function to call when the promise needs to be rejected.
 */