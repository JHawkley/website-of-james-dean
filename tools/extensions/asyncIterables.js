import { dew, is } from "tools/common";
import { Future, abortable } from "tools/async";
import { abortionReason } from "tools/extensions/async";

/**
 * Iterates over this async-iterable, applying `iteratorFn` for each element yielded.  Iteration can be canceled
 * early by providing a promise to serve as an `abortSignal`.  The iterator function can, itself, be an
 * async-function; the function will be awaited before the next iteration will proceed.
 *
 * @export
 * @template T
 * @this {AsyncIterable<T>}
 * @param {function(T): void | Promise<void>} iteratorFn The iterator function.
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
 * Creates a promise that will resolve with the first value from this async-iterable that matches the given
 * `valueOrPredicate`.  If no match is found before this async-iterable completes, the promise will reject.
 *
 * @export
 * @template T
 * @param {T | function(T): boolean} valueOrPredicate A value or predicate function to find.
 * @param {Promise} [abortSignal] The promise to use as a signal to abort when it completes.
 * @returns {Promise<T>}
 */
export function first(valueOrPredicate, abortSignal) {
  const future = new Future();
  const promise = future.promise;
  const predicate = valueOrPredicate::is.func() ? valueOrPredicate : (v) => Object.is(v, valueOrPredicate);
  const properAbortSignal
    = abortSignal ? abortable(promise, abortSignal)
    : Promise.resolve(promise);

  const iteratorFn = (v) => predicate(v) && future.resolve(v);

  dew(async () => {
    try {
      await this::forEach(iteratorFn, properAbortSignal::abortionReason("the predicate found a match"));
      if (!future.isCompleted)
        future.reject(new Error("no value matched the given predicate"));
    }
    catch (error) {
      if (!future.isCompleted)
        future.reject(error);
    }
  });

  return promise;
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
    get error() { return state.error; },
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
  let aborted = null;
  let result = await iterator.next();
  abortable(null, abortSignal).catch(error => aborted = error);

  while (!aborted && !result.done) {
    await iteratorFn(result.value);
    result = await iterator.next();
  }
  if (aborted) throw aborted;
}

async function iterateWithoutAbort(iterator, iteratorFn) {
  let result = await iterator.next();

  while (!result.done) {
    await iteratorFn(result.value);
    result = await iterator.next();
  }
}