import { dew, identityFn } from "tools/common";

/**
 * Creates a promise that will resolve when the next `requestAnimationFrame` event fires.
 * The promise will resolve with the given value, if provided.
 *
 * @export
 * @template T
 * @param {?T} [value] A value to be resolved to.
 * @returns {Promise<T>} A promise, to resolve at the next animation frame.
 */
export function frameSync(value) {
  return new Promise(resolve => {
    window.requestAnimationFrame(() => {
      resolve(value);
    });
  });
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
  let promise = null;
  let resolveFn = null;
  let rejectFn = null;

  function acquireCallbacks(resolve, reject) {
    resolveFn = resolve;
    rejectFn = reject;
  }
  
  return {
    sync() {
      if (promise == null)
        promise = promiseDecorator(new Promise(acquireCallbacks));
      return promise;
    },
    resolve(value) {
      if (promise == null) return;
      dew(async () => {
        while (resolveFn == null) await frameSync();
        resolveFn(value);
        promise = resolveFn = rejectFn = null;
      });
    },
    reject(reason) {
      if (promise == null) return;
      dew(async () => {
        while (rejectFn == null) await frameSync();
        rejectFn(reason);
        promise = resolveFn = rejectFn = null;
      });
    }
  };
}

/**
 * Creates a promise that will resolve once a timer has elapsed.
 *
 * @export
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {function(number)} [timeoutSetter] A function that will be provided the timeout ID for cancellation.
 * @returns {Promise<void>} A promise that will resolve when the timeout is complete.
 */
export function wait(delay = 0, timeoutSetter = null) {
  return new Promise(resolve => {
    const timeoutId = setTimeout(resolve, delay);
    timeoutSetter?.(timeoutId);
  });
}

/**
 * Creates a function that creates a promise that will resolve with the given `value` after some `delay`.
 * Use this function in a `Promise..then` call to delay its resolution.
 *
 * @export
 * @template T
 * @param {number} [delay=0] The number of milliseconds to wait.
 * @param {function(number)} [timeoutSetter] A function that will be provided the timeout ID for cancellation.
 * @returns {function(?T): Promise<?T>} A function that will produce a promise which will resolve after a delay.
 */
export function delayFor(delay = 0, timeoutSetter) {
  return async (value) => {
    await wait(delay, timeoutSetter);
    return value;
  };
}

/**
 * An object that provides synchronization services.
 * @template T
 * @typedef {Object} CallSync<T>
 * @property {function():Promise<T>} sync A function to call to obtain the promise to synchronize on.
 * @property {function(?T):void} resolve A function to call when the promise needs to be resolved.
 * @property {function(?any):void} reject A function to call when the promise needs to be rejected.
 */