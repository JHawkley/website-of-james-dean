
/**
 * Creates a promise that will resolve when the next `requestAnimationFrame` event fires.
 * The promise will resolve with the given value, if provided.
 *
 * @export
 * @template T
 * @param {?T} [value] A value to be resolved to.
 * @returns {Promise<T|number>} A promise, to resolve at the next animation frame.
 */
export function frameSync(value) {
  return new Promise(resolve => {
    window.requestAnimationFrame(() => {
      resolve(value);
    });
  });
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