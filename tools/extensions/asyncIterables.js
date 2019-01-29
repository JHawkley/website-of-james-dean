import { dew, is } from "tools/common";
import { abortable } from "tools/async";

/**
 * Iterates over this async-iterable, applying `iteratorFn` for each element yielded.  Iteration can be canceled
 * early by providing a promise to serve as an `abortSignal`.
 *
 * @export
 * @template T
 * @this {AsyncIterable<T>}
 * @param {function(T): void} iteratorFn The iterator function.
 * @param {Promise} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<void>} A promise that will resolve when iteration is complete.
 */
export function forEach(iteratorFn, abortSignal) {
  const getIterator = this[Symbol.asyncIterator] ?? this[Symbol.iterator];
  if (!getIterator::is.func()) throw new TypeError("bound object is not iterable");

  if (abortSignal)
    return iterateWithAbort(getIterator(), abortSignal, iteratorFn);
  else
    return iterateWithoutAbort(getIterator(), iteratorFn);
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

async function iterateWithAbort(iterator, abortSignal, iteratorFn) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await abortable(iterator.next(), abortSignal);
    if (result === abortable.signal) return;
    if (result.done) return;
    iteratorFn(result.value);
  }
}

async function iterateWithoutAbort(iterator, iteratorFn) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await iterator.next();
    if (result.done) return;
    iteratorFn(result.value);
  }
}